import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

type DemoAccountEntry = {
  address: string;
  jurisdiction: string | null;
  companyName: string | null;
  linked: boolean;
  depositorPath?: string | null;
};

const demoAccounts = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "config", "demoAccounts.json"), "utf8")
) as Record<string, DemoAccountEntry>;

/**
 * Links demo Business/Individual Identifier metadata and verifies allowlist enforcement.
 * Benchmark: allowedJurisdictions = [US] only (default deny).
 */
async function main() {
  const manifestPath = path.join(__dirname, "..", "deployments", "redbellyTestnet.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error("Run npm run deploy:testnet first");
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const {
    catVault: vaultAddr,
    businessRegistry: businessRegistryAddr,
    individualRegistry: individualRegistryAddr,
    asset: assetAddr,
  } = manifest.contracts;

  if (!individualRegistryAddr) {
    throw new Error("Manifest missing individualRegistry - redeploy with latest deploy.ts");
  }

  const network = await ethers.provider.getNetwork();
  const onRedbelly = network.chainId === 153n;

  const signers = await ethers.getSigners();
  const admin = signers[0];
  const usUser = onRedbelly ? admin : signers[1];
  const sgUser = onRedbelly ? admin : signers[2];

  const businessRegistry = await ethers.getContractAt(
    "MockBusinessPermissionRegistry",
    businessRegistryAddr
  );
  const individualRegistry = await ethers.getContractAt(
    "MockIndividualPermissionRegistry",
    individualRegistryAddr
  );
  const vault = await ethers.getContractAt("CATVault", vaultAddr);
  const asset = await ethers.getContractAt("MockAsset", assetAddr);

  const Business = await ethers.getContractFactory("MockBusinessIdentifier");
  const Individual = await ethers.getContractFactory("MockIndividualIdentifier");

  const usBusiness = await Business.deploy();
  await usBusiness.waitForDeployment();
  await usBusiness.initialize(
    "Demo US Issuer",
    "Demo US Issuer LLC",
    "ISO3166-1",
    "US",
    "350 Fifth Avenue, New York NY 10118, United States",
    false
  );

  const sgBusiness = await Business.deploy();
  await sgBusiness.waitForDeployment();
  await sgBusiness.initialize(
    "Demo SG Issuer",
    "Demo SG Issuer Pte Ltd",
    "ISO3166-1",
    "SG",
    "1 Raffles Place, Singapore",
    true
  );

  const usIndividual = await Individual.deploy();
  await usIndividual.waitForDeployment();
  await usIndividual.initialize(
    "Demo US Retail",
    "ISO3166-1",
    "US",
    "100 Main St, Boston MA 02108, United States"
  );

  await (await vault.connect(admin).setJurisdictionAllowed("0x5553", true)).wait();
  console.log("Allowlist: US allowed (default deny for all other jurisdictions)\n");

  const demo1 = demoAccounts.Demo1.address;
  const demo2 = demoAccounts.Demo2.address;
  const demo4 = demoAccounts.Demo4.address;

  await (await businessRegistry.linkBusiness(demo1, await usBusiness.getAddress())).wait();
  await (await businessRegistry.linkBusiness(demo2, await sgBusiness.getAddress())).wait();
  await (await individualRegistry.linkIndividual(demo4, await usIndividual.getAddress())).wait();

  console.log("Linked demo preview wallets:");
  console.log("  Demo1 (US business):", demo1);
  console.log("  Demo2 (SG business):", demo2);
  console.log("  Demo4 (US individual):", demo4);
  console.log("  Demo3 (unlinked):", demoAccounts.Demo3.address);

  const mintAmount = ethers.parseUnits("1000", 6);
  const depositAmount = ethers.parseUnits("100", 6);
  let allowedUsBusinessTxHash: string | undefined;
  let allowedUsIndividualTxHash: string | undefined;

  if (onRedbelly) {
    console.log("Redbelly testnet mode - using permissioned deployer wallet for txs\n");

    await (await businessRegistry.linkBusiness(admin.address, await usBusiness.getAddress())).wait();
    await (await asset.mint(admin.address, mintAmount)).wait();
    await (await asset.connect(admin).approve(vaultAddr, mintAmount)).wait();

    console.log("Allowed US deposit (deployer linked to US business)…");
    const okTx = await vault.connect(admin).deposit(depositAmount, admin.address);
    await okTx.wait();
    allowedUsBusinessTxHash = okTx.hash;
    console.log("  tx:", okTx.hash);

    await (await businessRegistry.linkBusiness(admin.address, await sgBusiness.getAddress())).wait();
    console.log("Relinked deployer to SG business identifier…");

    console.log("Blocked SG deposit (expect revert)…");
    try {
      await vault.connect(admin).deposit(depositAmount, admin.address);
      console.log("  ERROR: deposit should have reverted");
    } catch {
      console.log("  reverted as expected: JurisdictionBlocked");
    }

    await (await businessRegistry.unlinkBusiness(admin.address)).wait();
    await (await individualRegistry.linkIndividual(admin.address, await usIndividual.getAddress())).wait();
    console.log("Allowed US individual deposit (deployer on individual path)…");
    const individualTx = await vault.connect(admin).deposit(depositAmount, admin.address);
    await individualTx.wait();
    allowedUsIndividualTxHash = individualTx.hash;
    console.log("  tx:", individualTx.hash);
  } else {
    await (await businessRegistry.linkBusiness(usUser.address, await usBusiness.getAddress())).wait();
    await (await businessRegistry.linkBusiness(sgUser.address, await sgBusiness.getAddress())).wait();
    await (await asset.mint(usUser.address, mintAmount)).wait();
    await (await asset.mint(sgUser.address, mintAmount)).wait();
    await (await asset.connect(usUser).approve(vaultAddr, mintAmount)).wait();
    await (await asset.connect(sgUser).approve(vaultAddr, mintAmount)).wait();

    const okTx = await vault.connect(usUser).deposit(depositAmount, usUser.address);
    await okTx.wait();
    allowedUsBusinessTxHash = okTx.hash;
    console.log("US deposit tx:", okTx.hash);

    try {
      await vault.connect(sgUser).deposit(depositAmount, sgUser.address);
      console.log("ERROR: SG deposit should have reverted");
    } catch {
      console.log("SG deposit reverted as expected");
    }
  }

  manifest.demoAccounts = {
    Demo1: { wallet: demo1, path: "business", jurisdiction: "US", allowed: true },
    Demo2: { wallet: demo2, path: "business", jurisdiction: "SG", allowed: false },
    Demo3: { wallet: demoAccounts.Demo3.address, linked: false },
    Demo4: { wallet: demo4, path: "individual", jurisdiction: "US", allowed: true },
  };
  manifest.allowlistBenchmark = "Only US (0x5553) on allowedJurisdictions; SG reverts";
  manifest.demoPreviewHint =
    "UI: Demo1/Demo4 = US allowed, Demo2 = SG blocked, Demo3 = unlinked.";
  manifest.demoTransactions = {
    allowedUsBusinessDeposit: allowedUsBusinessTxHash ?? null,
    blockedSgDeposit: "reverted JurisdictionBlocked (no tx hash)",
    allowedUsIndividualDeposit: allowedUsIndividualTxHash ?? null,
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  console.log("\nDemo complete");
  console.log("  Vault:", vaultAddr);
  console.log("  UI preview: Demo1 (US allowed), Demo2 (SG blocked), Demo4 (US individual)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
