import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  deployVaultFixture,
  linkBusinessFor,
  linkIndividualFor,
  allowUsOnly,
} from "./helpers/fixture";

describe("CATVault", function () {
  describe("jurisdiction allowlist (default deny)", function () {
    it("allows admin to allow and revoke jurisdictions", async function () {
      const { vault, admin } = await loadFixture(deployVaultFixture);

      await expect(vault.connect(admin).setJurisdictionAllowed("0x5553", true))
        .to.emit(vault, "JurisdictionAllowlistUpdated")
        .withArgs("0x5553", true);

      expect(await vault.allowedJurisdictions("0x5553")).to.equal(true);

      await vault.connect(admin).setJurisdictionAllowed("0x5553", false);
      expect(await vault.allowedJurisdictions("0x5553")).to.equal(false);
    });

    it("rejects zero jurisdiction code", async function () {
      const { vault, admin } = await loadFixture(deployVaultFixture);
      await expect(
        vault.connect(admin).setJurisdictionAllowed("0x0000", true)
      ).to.be.revertedWithCustomError(vault, "InvalidJurisdictionCode");
    });

    it("supports batch allowlist updates", async function () {
      const { vault, admin } = await loadFixture(deployVaultFixture);
      await vault.connect(admin).setJurisdictionAllowedBatch(["0x5553", "0x5347"], true);
      expect(await vault.allowedJurisdictions("0x5553")).to.equal(true);
      expect(await vault.allowedJurisdictions("0x5347")).to.equal(true);
    });

    it("accepts an empty batch allowlist update as a no-op", async function () {
      const { vault, admin } = await loadFixture(deployVaultFixture);
      await expect(vault.connect(admin).setJurisdictionAllowedBatch([], true)).to.not.be.reverted;
      expect(await vault.allowedJurisdictions("0x5553")).to.equal(false);
    });

    it("restricts allowlist changes to owner", async function () {
      const { vault, usBusinessDepositor } = await loadFixture(deployVaultFixture);
      await expect(
        vault.connect(usBusinessDepositor).setJurisdictionAllowed("0x5553", true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      await expect(
        vault.connect(usBusinessDepositor).setJurisdictionAllowedBatch(["0x5553"], true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("benchmark: US allowed, SG blocked when only US is on allowlist", async function () {
      const { vault, admin, usBusinessDepositor, sgBusinessDepositor } =
        await loadFixture(deployVaultFixture);

      await allowUsOnly(vault, admin);

      const [, usAllowed] = await vault.checkJurisdiction(usBusinessDepositor.address);
      const [, sgAllowed] = await vault.checkJurisdiction(sgBusinessDepositor.address);
      expect(usAllowed).to.equal(true);
      expect(sgAllowed).to.equal(false);
    });
  });

  describe("dual-path verification (Business vs Individual)", function () {
    it("resolves business depositor path", async function () {
      const { vault, admin, usBusinessDepositor } = await loadFixture(deployVaultFixture);
      await allowUsOnly(vault, admin);

      const [jurisdiction, allowed, path] = await vault.checkJurisdiction(usBusinessDepositor.address);
      expect(jurisdiction).to.equal("0x5553");
      expect(allowed).to.equal(true);
      expect(path).to.equal("business");
    });

    it("resolves individual depositor path", async function () {
      const { vault, admin, usIndividualDepositor } = await loadFixture(deployVaultFixture);
      await allowUsOnly(vault, admin);

      const [jurisdiction, allowed, path] = await vault.checkJurisdiction(
        usIndividualDepositor.address
      );
      expect(jurisdiction).to.equal("0x5553");
      expect(allowed).to.equal(true);
      expect(path).to.equal("individual");
    });

    it("prefers business registry when both paths could apply", async function () {
      const { vault, admin, businessRegistry, individualRegistry } =
        await loadFixture(deployVaultFixture);
      const signers = await ethers.getSigners();
      const dual = signers[8];

      await linkBusinessFor(
        businessRegistry,
        dual.address,
        "ISO3166-1",
        "US",
        "New York, United States"
      );
      await linkIndividualFor(
        individualRegistry,
        dual.address,
        "ISO3166-1",
        "SG",
        "Singapore"
      );
      await allowUsOnly(vault, admin);

      const [, , path] = await vault.checkJurisdiction(dual.address);
      expect(path).to.equal("business");
    });
  });

  describe("checkJurisdiction", function () {
    it("parses jurisdiction from business address when identifier type is absent", async function () {
      const { vault, businessRegistry } = await loadFixture(deployVaultFixture);
      const signers = await ethers.getSigners();
      const user = signers[6];
      await linkBusinessFor(
        businessRegistry,
        user.address,
        "ABN",
        "12345678901",
        "10 Market St, Singapore"
      );
      const [jurisdiction] = await vault.checkJurisdiction(user.address);
      expect(jurisdiction).to.equal("0x5347");
    });

    it("reverts when wallet has no linked business or individual", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      const [, , , , unlinked] = await ethers.getSigners();
      await expect(vault.checkJurisdiction(unlinked.address)).to.be.revertedWithCustomError(
        vault,
        "JurisdictionParseFailed"
      );
    });
  });

  describe("deposits", function () {
    it("succeeds for US business when US is allowed and emits JurisdictionChecked", async function () {
      const { vault, asset, admin, usBusinessDepositor } = await loadFixture(deployVaultFixture);
      await allowUsOnly(vault, admin);
      const amount = ethers.parseUnits("100", 6);
      await asset.connect(usBusinessDepositor).approve(await vault.getAddress(), amount);

      await expect(vault.connect(usBusinessDepositor).deposit(amount, usBusinessDepositor.address))
        .to.emit(vault, "JurisdictionChecked")
        .withArgs(usBusinessDepositor.address, "0x5553", true, "deposit", "business");

      expect(await vault.balanceOf(usBusinessDepositor.address)).to.equal(amount);
    });

    it("succeeds for US individual retail depositor when US is allowed", async function () {
      const { vault, asset, admin, usIndividualDepositor } = await loadFixture(deployVaultFixture);
      await allowUsOnly(vault, admin);
      const amount = ethers.parseUnits("50", 6);
      await asset.connect(usIndividualDepositor).approve(await vault.getAddress(), amount);

      await expect(
        vault.connect(usIndividualDepositor).deposit(amount, usIndividualDepositor.address)
      )
        .to.emit(vault, "JurisdictionChecked")
        .withArgs(usIndividualDepositor.address, "0x5553", true, "deposit", "individual");
    });

    it("reverts for SG business when only US is allowed", async function () {
      const { vault, asset, admin, sgBusinessDepositor } = await loadFixture(deployVaultFixture);
      await allowUsOnly(vault, admin);

      const amount = ethers.parseUnits("50", 6);
      await asset.connect(sgBusinessDepositor).approve(await vault.getAddress(), amount);

      await expect(
        vault.connect(sgBusinessDepositor).deposit(amount, sgBusinessDepositor.address)
      )
        .to.be.revertedWithCustomError(vault, "JurisdictionBlocked")
        .withArgs(sgBusinessDepositor.address, "0x5347");
    });

    it("reverts when jurisdiction metadata cannot be parsed", async function () {
      const { vault, asset, businessRegistry, admin } = await loadFixture(deployVaultFixture);
      const signers = await ethers.getSigners();
      const badUser = signers[5];
      await linkBusinessFor(businessRegistry, badUser.address, "ABN", "999", "Unknown Territory XYZ");
      await asset.mint(badUser.address, ethers.parseUnits("100", 6));
      await asset.connect(badUser).approve(await vault.getAddress(), ethers.parseUnits("100", 6));

      await expect(
        vault.connect(badUser).deposit(ethers.parseUnits("10", 6), badUser.address)
      ).to.be.revertedWithCustomError(vault, "JurisdictionParseFailed");
    });

    it("reverts for allowed jurisdiction not on allowlist (default deny)", async function () {
      const { vault, asset, usBusinessDepositor } = await loadFixture(deployVaultFixture);
      const amount = ethers.parseUnits("10", 6);
      await asset.connect(usBusinessDepositor).approve(await vault.getAddress(), amount);

      await expect(
        vault.connect(usBusinessDepositor).deposit(amount, usBusinessDepositor.address)
      )
        .to.be.revertedWithCustomError(vault, "JurisdictionBlocked")
        .withArgs(usBusinessDepositor.address, "0x5553");
    });
  });

  describe("withdrawals", function () {
    it("succeeds for allowed jurisdiction and emits JurisdictionChecked", async function () {
      const { vault, asset, admin, usBusinessDepositor } = await loadFixture(deployVaultFixture);
      await allowUsOnly(vault, admin);
      const amount = ethers.parseUnits("200", 6);
      await asset.connect(usBusinessDepositor).approve(await vault.getAddress(), amount);
      await vault.connect(usBusinessDepositor).deposit(amount, usBusinessDepositor.address);

      await expect(
        vault.connect(usBusinessDepositor).withdraw(
          amount,
          usBusinessDepositor.address,
          usBusinessDepositor.address
        )
      )
        .to.emit(vault, "JurisdictionChecked")
        .withArgs(usBusinessDepositor.address, "0x5553", true, "withdraw", "business");
    });

    it("reverts withdrawal when jurisdiction is removed from allowlist", async function () {
      const { vault, asset, admin, usBusinessDepositor } = await loadFixture(deployVaultFixture);
      await allowUsOnly(vault, admin);
      const amount = ethers.parseUnits("100", 6);

      await asset.connect(usBusinessDepositor).approve(await vault.getAddress(), amount);
      await vault.connect(usBusinessDepositor).deposit(amount, usBusinessDepositor.address);

      await vault.connect(admin).setJurisdictionAllowed("0x5553", false);

      await expect(
        vault.connect(usBusinessDepositor).withdraw(
          amount,
          usBusinessDepositor.address,
          usBusinessDepositor.address
        )
      )
        .to.be.revertedWithCustomError(vault, "JurisdictionBlocked")
        .withArgs(usBusinessDepositor.address, "0x5553");
    });
  });

  describe("ERC-4626 compliance", function () {
    it("exposes underlying asset and converts shares 1:1 at genesis", async function () {
      const { vault, asset } = await loadFixture(deployVaultFixture);
      expect(await vault.asset()).to.equal(await asset.getAddress());
      expect(await vault.convertToShares(ethers.parseUnits("1", 6))).to.equal(
        ethers.parseUnits("1", 6)
      );
    });

    it("supports mint and redeem flows with jurisdiction checks", async function () {
      const { vault, asset, admin, usBusinessDepositor } = await loadFixture(deployVaultFixture);
      await allowUsOnly(vault, admin);
      const shares = ethers.parseUnits("75", 6);
      const assets = await vault.previewMint(shares);
      await asset.connect(usBusinessDepositor).approve(await vault.getAddress(), assets);

      await expect(vault.connect(usBusinessDepositor).mint(shares, usBusinessDepositor.address))
        .to.emit(vault, "JurisdictionChecked");

      await expect(
        vault.connect(usBusinessDepositor).redeem(
          shares,
          usBusinessDepositor.address,
          usBusinessDepositor.address
        )
      ).to.emit(vault, "JurisdictionChecked");
    });
  });
});
