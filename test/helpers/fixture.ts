import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  CATVault,
  MockAsset,
  MockBusinessIdentifier,
  MockBusinessPermissionRegistry,
  MockIndividualIdentifier,
  MockIndividualPermissionRegistry,
} from "../typechain-types";

export interface VaultFixture {
  admin: HardhatEthersSigner;
  usBusinessDepositor: HardhatEthersSigner;
  sgBusinessDepositor: HardhatEthersSigner;
  usIndividualDepositor: HardhatEthersSigner;
  asset: MockAsset;
  businessRegistry: MockBusinessPermissionRegistry;
  individualRegistry: MockIndividualPermissionRegistry;
  vault: CATVault;
}

export async function deployVaultFixture(): Promise<VaultFixture> {
  const [admin, usBusinessDepositor, sgBusinessDepositor, usIndividualDepositor] =
    await ethers.getSigners();

  const Asset = await ethers.getContractFactory("MockAsset");
  const asset = await Asset.deploy("Mock RWA Asset", "mRWA", 6);

  const BusinessRegistry = await ethers.getContractFactory("MockBusinessPermissionRegistry");
  const businessRegistry = await BusinessRegistry.deploy();

  const IndividualRegistry = await ethers.getContractFactory("MockIndividualPermissionRegistry");
  const individualRegistry = await IndividualRegistry.deploy();

  const Business = await ethers.getContractFactory("MockBusinessIdentifier");
  const usBusiness = await Business.deploy();
  await usBusiness.initialize(
    "US Corp LLC",
    "US Corp LLC",
    "ISO3166-1",
    "US",
    "350 Fifth Avenue, New York NY 10118, United States",
    false
  );

  const sgBusiness = await Business.deploy();
  await sgBusiness.initialize(
    "SG Holdings Pte Ltd",
    "SG Holdings Pte Ltd",
    "ISO3166-1",
    "SG",
    "1 Raffles Place, Singapore",
    true
  );

  await businessRegistry.linkBusiness(usBusinessDepositor.address, await usBusiness.getAddress());
  await businessRegistry.linkBusiness(sgBusinessDepositor.address, await sgBusiness.getAddress());

  const Individual = await ethers.getContractFactory("MockIndividualIdentifier");
  const usIndividual = await Individual.deploy();
  await usIndividual.initialize(
    "Retail US Investor",
    "ISO3166-1",
    "US",
    "100 Main St, Boston MA 02108, United States"
  );
  await individualRegistry.linkIndividual(
    usIndividualDepositor.address,
    await usIndividual.getAddress()
  );

  const Vault = await ethers.getContractFactory("CATVault");
  const vault = await Vault.deploy(
    await asset.getAddress(),
    await businessRegistry.getAddress(),
    await individualRegistry.getAddress(),
    "CAT Vault Shares",
    "catRWA"
  );

  await asset.mint(usBusinessDepositor.address, ethers.parseUnits("10000", 6));
  await asset.mint(sgBusinessDepositor.address, ethers.parseUnits("10000", 6));
  await asset.mint(usIndividualDepositor.address, ethers.parseUnits("10000", 6));

  return {
    admin,
    usBusinessDepositor,
    sgBusinessDepositor,
    usIndividualDepositor,
    asset,
    businessRegistry,
    individualRegistry,
    vault,
  };
}

export async function linkBusinessFor(
  registry: MockBusinessPermissionRegistry,
  wallet: string,
  identifierType: string,
  identifier: string,
  businessAddress: string
) {
  const Business = await ethers.getContractFactory("MockBusinessIdentifier");
  const business = await Business.deploy();
  await business.initialize(
    "Test Co",
    "Test Co",
    identifierType,
    identifier,
    businessAddress,
    true
  );
  await registry.linkBusiness(wallet, await business.getAddress());
  return business;
}

export async function linkIndividualFor(
  registry: MockIndividualPermissionRegistry,
  wallet: string,
  identifierType: string,
  identifier: string,
  residentialAddress: string
) {
  const Individual = await ethers.getContractFactory("MockIndividualIdentifier");
  const individual = await Individual.deploy();
  await individual.initialize("Test Individual", identifierType, identifier, residentialAddress);
  await registry.linkIndividual(wallet, await individual.getAddress());
  return individual;
}

/** Benchmark allowlist: only US permitted (reviewer revision scenario). */
export async function allowUsOnly(vault: CATVault, admin: HardhatEthersSigner) {
  await vault.connect(admin).setJurisdictionAllowed("0x5553", true);
}
