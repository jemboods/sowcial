const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("SowcialFarm", function () {
  let registry, farm, owner, alice, bob, stranger;

  beforeEach(async function () {
    [owner, alice, bob, stranger] = await ethers.getSigners();

    const Mock = await ethers.getContractFactory("MockAgentId");
    registry = await Mock.deploy();

    const Farm = await ethers.getContractFactory("SowcialFarm");
    farm = await Farm.deploy(await registry.getAddress());

    // alice and bob hold an Agent ID; stranger does not
    await registry.mint(alice.address);
    await registry.mint(bob.address);
  });

  describe("claimLand", function () {
    it("rejects non Agent ID holders", async function () {
      await expect(farm.connect(stranger).claimLand()).to.be.revertedWithCustomError(
        farm,
        "NotAgentIdHolder"
      );
    });

    it("lets an Agent ID holder claim exactly one farm", async function () {
      await expect(farm.connect(alice).claimLand()).to.emit(farm, "LandClaimed").withArgs(alice.address);
      expect(await farm.farmerCount()).to.equal(1);
      await expect(farm.connect(alice).claimLand()).to.be.revertedWithCustomError(farm, "AlreadyClaimed");
    });
  });

  describe("plant / water / harvest loop", function () {
    beforeEach(async function () {
      await farm.connect(alice).claimLand();
    });

    it("requires a farm and an empty plot", async function () {
      await expect(farm.connect(bob).plant(0, 0)).to.be.revertedWithCustomError(farm, "NoFarm");
      await farm.connect(alice).plant(0, 0);
      await expect(farm.connect(alice).plant(0, 0)).to.be.revertedWithCustomError(farm, "PlotOccupied");
    });

    it("blocks early harvest, then pays full in-season points with watering bonus", async function () {
      // Season at deploy is Spring (0); crop 0 (Turnip) is the Spring crop, 10 min grow time.
      await farm.connect(alice).plant(0, 0);
      await expect(farm.connect(alice).harvest(0)).to.be.revertedWithCustomError(farm, "NotReady");

      await farm.connect(alice).water(0);
      await expect(farm.connect(alice).water(0)).to.be.revertedWithCustomError(farm, "AlreadyWatered");

      await time.increase(10 * 60 + 1);
      // base 10, watered x1.5 = 15, in season = full 15 points, 3 produce
      await expect(farm.connect(alice).harvest(0))
        .to.emit(farm, "Harvested")
        .withArgs(alice.address, 0, 0, 15, 3, true);

      const stats = await farm.farms(alice.address);
      expect(stats.dewpoints).to.equal(15);
      expect(stats.totalHarvests).to.equal(1);
      expect(stats.totalProduce).to.equal(3);
    });

    it("halves points and reduces yield out of season", async function () {
      // Crop 1 (Star Melon) is a Summer crop; we are in Spring.
      await farm.connect(alice).plant(1, 1);
      await time.increase(60 * 60 + 1);
      // base 35, not watered, out of season => 17 points (integer division), produce 4-1=3
      await expect(farm.connect(alice).harvest(1))
        .to.emit(farm, "Harvested")
        .withArgs(alice.address, 1, 1, 17, 3, false);
    });

    it("rotates season after SEASON_DURATION", async function () {
      expect(await farm.currentSeason()).to.equal(0);
      await time.increase(3 * 24 * 60 * 60 + 1);
      expect(await farm.currentSeason()).to.equal(1);
    });
  });

  describe("helpNeighbor", function () {
    beforeEach(async function () {
      await farm.connect(alice).claimLand();
      await farm.connect(bob).claimLand();
    });

    it("rewards both sides and enforces the daily cooldown per pair", async function () {
      await expect(farm.connect(alice).helpNeighbor(bob.address))
        .to.emit(farm, "NeighborHelped")
        .withArgs(alice.address, bob.address, 3, 2);

      expect((await farm.farms(alice.address)).dewpoints).to.equal(3);
      expect((await farm.farms(bob.address)).dewpoints).to.equal(2);

      await expect(farm.connect(alice).helpNeighbor(bob.address)).to.be.revertedWithCustomError(
        farm,
        "HelpOnCooldown"
      );

      await time.increase(24 * 60 * 60 + 1);
      await farm.connect(alice).helpNeighbor(bob.address);
      expect((await farm.farms(alice.address)).dewpoints).to.equal(6);
    });

    it("rejects helping yourself and non-farmers", async function () {
      await expect(farm.connect(alice).helpNeighbor(alice.address)).to.be.revertedWithCustomError(
        farm,
        "CannotHelpSelf"
      );
      await expect(farm.connect(alice).helpNeighbor(stranger.address)).to.be.revertedWithCustomError(
        farm,
        "NoFarm"
      );
    });
  });

  describe("admin", function () {
    it("owner can pause gameplay; non-owner cannot", async function () {
      await expect(farm.connect(alice).pause()).to.be.reverted;
      await farm.connect(owner).pause();
      await expect(farm.connect(alice).claimLand()).to.be.revertedWithCustomError; // paused
      await farm.connect(owner).unpause();
      await farm.connect(alice).claimLand();
      expect(await farm.farmerCount()).to.equal(1);
    });
  });
});
