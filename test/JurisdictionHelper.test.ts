import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployVaultFixture, linkBusinessFor, linkIndividualFor } from "./helpers/fixture";

describe("JurisdictionHelper", function () {
  it("extracts ISO code from parenthesized business address", async function () {
    const { vault, businessRegistry } = await loadFixture(deployVaultFixture);
    const signers = await ethers.getSigners();
    const user = signers[6];
    await linkBusinessFor(
      businessRegistry,
      user.address,
      "ABN",
      "51824753556",
      "Level 12, 1 O'Connell St, Sydney NSW 2000 (AU)"
    );
    const [jurisdiction] = await vault.checkJurisdiction(user.address);
    expect(jurisdiction).to.equal("0x4155");
  });

  it("normalizes lowercase ISO codes", async function () {
    const { vault, businessRegistry } = await loadFixture(deployVaultFixture);
    const signers = await ethers.getSigners();
    const user = signers[7];
    await linkBusinessFor(businessRegistry, user.address, "ISO3166-1", "de", "Berlin, Germany");
    const [jurisdiction] = await vault.checkJurisdiction(user.address);
    expect(jurisdiction).to.equal("0x4445");
  });

  it("reverts when ISO3166-1 identifier is too short (line 63 branch)", async function () {
    const { vault, businessRegistry } = await loadFixture(deployVaultFixture);
    const signers = await ethers.getSigners();
    const user = signers[9];
    await linkBusinessFor(businessRegistry, user.address, "ISO3166-1", "U", "Somewhere");
    await expect(vault.checkJurisdiction(user.address)).to.be.revertedWithCustomError(
      vault,
      "JurisdictionParseFailed"
    );
  });

  it("parses two-letter country tail in address (line 131 branch)", async function () {
    const { vault, individualRegistry } = await loadFixture(deployVaultFixture);
    const signers = await ethers.getSigners();
    const user = signers[10];
    await linkIndividualFor(
      individualRegistry,
      user.address,
      "PASSPORT",
      "X123",
      "Marina Bay, SG"
    );
    const [jurisdiction, , path] = await vault.checkJurisdiction(user.address);
    expect(jurisdiction).to.equal("0x5347");
    expect(path).to.equal("individual");
  });

  it("uses two-letter identifier fallback", async function () {
    const { vault, businessRegistry } = await loadFixture(deployVaultFixture);
    const signers = await ethers.getSigners();
    const user = signers[11];
    await linkBusinessFor(businessRegistry, user.address, "LEI", "FR", "Paris");
    const [jurisdiction] = await vault.checkJurisdiction(user.address);
    expect(jurisdiction).to.equal("0x4652");
  });

  it("maps additional country names from business address tail", async function () {
    const { vault, businessRegistry } = await loadFixture(deployVaultFixture);
    const signers = await ethers.getSigners();
    const user = signers[12];
    await linkBusinessFor(
      businessRegistry,
      user.address,
      "ABN",
      "123",
      "1 Queen St, Melbourne VIC 3000, Australia"
    );
    const [jurisdiction] = await vault.checkJurisdiction(user.address);
    expect(jurisdiction).to.equal("0x4155");
  });

  it("covers the full country-name lookup table (branch coverage)", async function () {
    const { vault, businessRegistry } = await loadFixture(deployVaultFixture);
    const signers = await ethers.getSigners();
    const cases: Array<[string, string]> = [
      ["Germany", "0x4445"],
      ["France", "0x4652"],
      ["Japan", "0x4a50"],
      ["Canada", "0x4341"],
      ["New Zealand", "0x4e5a"],
      ["Switzerland", "0x4348"],
      ["Netherlands", "0x4e4c"],
      ["Hong Kong", "0x484b"],
      ["Ireland", "0x4945"],
      ["Italy", "0x4954"],
      ["Spain", "0x4553"],
      ["Brazil", "0x4252"],
      ["India", "0x494e"],
      ["China", "0x434e"],
    ];
    for (let i = 0; i < cases.length; i++) {
      const [country, expected] = cases[i];
      const user = signers[4 + i];
      await linkBusinessFor(businessRegistry, user.address, "REG", "12345", `1 Main St, ${country}`);
      const [jurisdiction] = await vault.checkJurisdiction(user.address);
      expect(jurisdiction, country).to.equal(expected);
    }
  });

  it("resolves country-name aliases (USA/UK/UAE/Korea)", async function () {
    const { vault, businessRegistry } = await loadFixture(deployVaultFixture);
    const signers = await ethers.getSigners();
    const cases: Array<[string, string]> = [
      ["USA", "0x5553"],
      ["UK", "0x4742"],
      ["UAE", "0x4145"],
      ["Korea", "0x4b52"],
    ];
    for (let i = 0; i < cases.length; i++) {
      const [country, expected] = cases[i];
      const user = signers[4 + i];
      await linkBusinessFor(businessRegistry, user.address, "REG", "12345", `Office, ${country}`);
      const [jurisdiction] = await vault.checkJurisdiction(user.address);
      expect(jurisdiction, country).to.equal(expected);
    }
  });

  it("reverts when address tail is an unknown country", async function () {
    const { vault, businessRegistry } = await loadFixture(deployVaultFixture);
    const signers = await ethers.getSigners();
    const user = signers[13];
    await linkBusinessFor(businessRegistry, user.address, "REG", "12345", "1 Main St, Atlantis");
    await expect(vault.checkJurisdiction(user.address)).to.be.revertedWithCustomError(
      vault,
      "JurisdictionParseFailed"
    );
  });

  it("parses country name when address has no comma separator", async function () {
    const { vault, businessRegistry } = await loadFixture(deployVaultFixture);
    const signers = await ethers.getSigners();
    const user = signers[14];
    await linkBusinessFor(businessRegistry, user.address, "REG", "12345", "Singapore");
    const [jurisdiction] = await vault.checkJurisdiction(user.address);
    expect(jurisdiction).to.equal("0x5347");
  });

  it("accepts ISO3166 and COUNTRY identifier types (not only ISO3166-1)", async function () {
    const { vault, businessRegistry } = await loadFixture(deployVaultFixture);
    const signers = await ethers.getSigners();
    const iso3166User = signers[15];
    const countryUser = signers[16];
    await linkBusinessFor(businessRegistry, iso3166User.address, "ISO3166", "jp", "Tokyo");
    await linkBusinessFor(businessRegistry, countryUser.address, "country", "nz", "Wellington");
    const [jp] = await vault.checkJurisdiction(iso3166User.address);
    const [nz] = await vault.checkJurisdiction(countryUser.address);
    expect(jp).to.equal("0x4a50");
    expect(nz).to.equal("0x4e5a");
  });

  it("resolves full country names on the || alias branches", async function () {
    const { vault, businessRegistry } = await loadFixture(deployVaultFixture);
    const signers = await ethers.getSigners();
    const cases: Array<[string, string]> = [
      ["United States", "0x5553"],
      ["United Kingdom", "0x4742"],
      ["South Korea", "0x4b52"],
      ["United Arab Emirates", "0x4145"],
    ];
    for (let i = 0; i < cases.length; i++) {
      const [country, expected] = cases[i];
      const user = signers[4 + i];
      await linkBusinessFor(businessRegistry, user.address, "REG", "12345", `Office, ${country}`);
      const [jurisdiction] = await vault.checkJurisdiction(user.address);
      expect(jurisdiction, country).to.equal(expected);
    }
  });

  it("parses a two-letter country tail and skips empty addresses", async function () {
    const { vault, businessRegistry } = await loadFixture(deployVaultFixture);
    const signers = await ethers.getSigners();
    const tailUser = signers[17];
    const emptyAddrUser = signers[18];
    await linkBusinessFor(businessRegistry, tailUser.address, "REG", "12345", "1 Main St, AU");
    await linkBusinessFor(businessRegistry, emptyAddrUser.address, "REG", "12345", "");
    const [au] = await vault.checkJurisdiction(tailUser.address);
    expect(au).to.equal("0x4155");
    await expect(vault.checkJurisdiction(emptyAddrUser.address)).to.be.revertedWithCustomError(
      vault,
      "JurisdictionParseFailed"
    );
  });

  it("falls through non-ISO identifier types to address parsing", async function () {
    const { vault, businessRegistry } = await loadFixture(deployVaultFixture);
    const signers = await ethers.getSigners();
    const user = signers[19];
    await linkBusinessFor(
      businessRegistry,
      user.address,
      "ABN",
      "51824753556",
      "Level 3, Sydney (AU)"
    );
    const [jurisdiction] = await vault.checkJurisdiction(user.address);
    expect(jurisdiction).to.equal("0x4155");
  });

  it("ignores parenthesized tails with non-alpha characters", async function () {
    const { vault, businessRegistry } = await loadFixture(deployVaultFixture);
    const signers = await ethers.getSigners();
    const user = signers[4];
    await linkBusinessFor(
      businessRegistry,
      user.address,
      "REG",
      "12345",
      "Office (1A), Australia"
    );
    const [jurisdiction] = await vault.checkJurisdiction(user.address);
    expect(jurisdiction).to.equal("0x4155");
  });

  it("rejects two-character non-alpha address tails", async function () {
    const { vault, businessRegistry } = await loadFixture(deployVaultFixture);
    const signers = await ethers.getSigners();
    const user = signers[5];
    await linkBusinessFor(businessRegistry, user.address, "REG", "99999", "Street, 1A");
    await expect(vault.checkJurisdiction(user.address)).to.be.revertedWithCustomError(
      vault,
      "JurisdictionParseFailed"
    );
  });
});

describe("RedbellyBusinessRegistry", function () {
  it("returns zero when BusinessPermission is not configured", async function () {
    const Bootstrap = await ethers.getContractFactory("MockBootstrap");
    const bootstrap = await Bootstrap.deploy();
    const Registry = await ethers.getContractFactory("RedbellyBusinessRegistry");
    const registry = await Registry.deploy(await bootstrap.getAddress());

    const [, user] = await ethers.getSigners();
    expect(await registry.getBusinessContractAddress(user.address)).to.equal(ethers.ZeroAddress);
    expect(await registry.hasBusinessPermission(user.address)).to.equal(false);
  });
});

describe("Mock registry utilities", function () {
  it("supports unlinking business wallets", async function () {
    const { businessRegistry, usBusinessDepositor } = await loadFixture(deployVaultFixture);
    expect(await businessRegistry.getBusinessContractAddress(usBusinessDepositor.address)).to.not
      .equal(ethers.ZeroAddress);
    await businessRegistry.unlinkBusiness(usBusinessDepositor.address);
    expect(await businessRegistry.getBusinessContractAddress(usBusinessDepositor.address)).to.equal(
      ethers.ZeroAddress
    );
  });

  it("supports unlinking individual wallets", async function () {
    const { individualRegistry, usIndividualDepositor } = await loadFixture(deployVaultFixture);
    expect(
      await individualRegistry.getIndividualContractAddress(usIndividualDepositor.address)
    ).to.not.equal(ethers.ZeroAddress);
    await individualRegistry.unlinkIndividual(usIndividualDepositor.address);
    expect(
      await individualRegistry.getIndividualContractAddress(usIndividualDepositor.address)
    ).to.equal(ethers.ZeroAddress);
  });
});
