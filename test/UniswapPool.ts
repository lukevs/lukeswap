import hre, { ethers } from "hardhat";
import { Artifact } from "hardhat/types";
import { expect } from "chai";

import { UniswapPool } from "../typechain/UniswapPool";

const { deployContract } = hre.waffle;

export function shouldBehaveLikeUniswapPool(): void {
  describe("UniswapPool", function () {
    beforeEach(async function () {
      const lpTokenArtifact: Artifact = await hre.artifacts.readArtifact("UniswapLPToken");
      const poolArtifact: Artifact = await hre.artifacts.readArtifact("UniswapPool");
      this.pool = <UniswapPool>await deployContract(
        this.signers.admin,
        poolArtifact,
        [this.tokenA.address, this.tokenB.address]
      );

      const UniswapLPToken = await ethers.getContractFactory("UniswapLPToken");
      this.lpToken = await UniswapLPToken.attach(
        await this.pool.lpToken()
      );
    });

    it("should assign the contract address as the LP token owner", async function () {
      expect(await this.lpToken.owner()).to.equal(this.pool.address);
    });
  });
};