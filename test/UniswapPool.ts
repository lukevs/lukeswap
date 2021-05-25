import hre, { ethers } from "hardhat";
import { Artifact } from "hardhat/types";
import { expect } from "chai";

import { UniswapPool } from "../typechain/UniswapPool";

const { deployContract } = hre.waffle;

export function shouldBehaveLikeUniswapPool(): void {
  describe("UniswapPool", function () {
    beforeEach(async function () {
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

    it("should exchange liquidity for LP tokens", async function () {
      const aliceASupply = 100;
      const aliceBSupply = 200;

      const aliceADeposit = 10;
      const aliceBDeposit = 40;

      await this.tokenA.connect(this.signers.admin).mint(this.signers.alice.address, aliceASupply);
      await this.tokenB.connect(this.signers.admin).mint(this.signers.alice.address, aliceBSupply);

      await this.tokenA.connect(this.signers.alice).approve(this.pool.address, aliceADeposit);
      await this.tokenB.connect(this.signers.alice).approve(this.pool.address, aliceBDeposit);

      await this.pool.connect(this.signers.alice).addLiquidity(aliceADeposit, aliceBDeposit);

      const expectedLPTokenSupply = Math.sqrt(aliceADeposit * aliceBDeposit);
      expect(await this.lpToken.totalSupply()).to.equal(expectedLPTokenSupply);
      expect(await this.lpToken.balanceOf(this.signers.alice.address)).to.equal(expectedLPTokenSupply);

      expect(await this.tokenA.balanceOf(this.pool.address)).to.equal(aliceADeposit);
      expect(await this.tokenB.balanceOf(this.pool.address)).to.equal(aliceBDeposit);
    });
  });
};