import { expect } from "chai";
import { ethers } from "hardhat";

describe("RedbellyBusinessRegistry (configured)", function () {
  it("delegates lookups to BusinessPermission when configured", async function () {
    const Bootstrap = await ethers.getContractFactory("MockBootstrap");
    const bootstrap = await Bootstrap.deploy();

    const BusinessPerm = await ethers.getContractFactory("MockBusinessPermission");
    const businessPerm = await BusinessPerm.deploy();
    await bootstrap.setContractAddress("businessPermission", await businessPerm.getAddress());

    const Business = await ethers.getContractFactory("MockBusinessIdentifier");
    const business = await Business.deploy();
    await business.initialize("Co", "Co", "ISO3166-1", "GB", "London, United Kingdom", true);

    const [, user] = await ethers.getSigners();
    await businessPerm.link(user.address, await business.getAddress());

    const Registry = await ethers.getContractFactory("RedbellyBusinessRegistry");
    const registry = await Registry.deploy(await bootstrap.getAddress());

    expect(await registry.getBusinessContractAddress(user.address)).to.equal(
      await business.getAddress()
    );
    expect(await registry.hasBusinessPermission(user.address)).to.equal(true);
  });
});
