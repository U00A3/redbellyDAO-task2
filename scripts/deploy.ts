import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const BOOTSTRAP =
  process.env.BOOTSTRAP_ADDRESS ||
  "0xDAFEA492D9c6733ae3d56b7Ed1ADB60692c98Bc5";

async function businessPermissionConfigured(): Promise<boolean> {
  const bootstrap = await ethers.getContractAt(
    ["function getContractAddress(string) view returns (address)"],
    BOOTSTRAP
  );
  const addr = await bootstrap.getContractAddress("businessPermission");
  return addr !== ethers.ZeroAddress;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const onRedbelly = network.chainId === 153n;

  console.log("Deployer:", deployer.address);
  console.log("Chain ID:", network.chainId.toString());

  const Asset = await ethers.getContractFactory("MockAsset");
  const asset = await Asset.deploy("CAT Underlying Asset", "catUSD", 6);
  await asset.waitForDeployment();

  let businessRegistryAddress: string;
  let registryKind: string;

  if (onRedbelly && (await businessPermissionConfigured())) {
    const Registry = await ethers.getContractFactory("RedbellyBusinessRegistry");
    const registry = await Registry.deploy(BOOTSTRAP);
    await registry.waitForDeployment();
    businessRegistryAddress = await registry.getAddress();
    registryKind = "RedbellyBusinessRegistry";
  } else {
    const Registry = await ethers.getContractFactory("MockBusinessPermissionRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();
    businessRegistryAddress = await registry.getAddress();
    registryKind = onRedbelly
      ? "MockBusinessPermissionRegistry (BusinessPermission not on Bootstrap yet)"
      : "MockBusinessPermissionRegistry";
  }

  const IndividualRegistry = await ethers.getContractFactory("MockIndividualPermissionRegistry");
  const individualRegistry = await IndividualRegistry.deploy();
  await individualRegistry.waitForDeployment();
  const individualRegistryAddress = await individualRegistry.getAddress();

  console.log(registryKind + ":", businessRegistryAddress);
  console.log("MockIndividualPermissionRegistry:", individualRegistryAddress);

  const Vault = await ethers.getContractFactory("CATVault");
  const vault = await Vault.deploy(
    await asset.getAddress(),
    businessRegistryAddress,
    individualRegistryAddress,
    "Compliant Asset Vault",
    "catVault"
  );
  await vault.waitForDeployment();
  console.log("CATVault:", await vault.getAddress());

  const out = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    bootstrap: BOOTSTRAP,
    registryKind,
    contracts: {
      asset: await asset.getAddress(),
      businessRegistry: businessRegistryAddress,
      individualRegistry: individualRegistryAddress,
      catVault: await vault.getAddress(),
    },
  };

  const dir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(
    dir,
    onRedbelly ? "redbellyTestnet.json" : "hardhat.json"
  );
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log("Saved deployment manifest:", file);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
