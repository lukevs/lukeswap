import hre, { ethers } from "hardhat";
import { Artifact } from "hardhat/types";
import { expect } from "chai";

import { UniswapPool } from "../typechain/UniswapPool";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { TestToken } from "../typechain";

const { deployContract } = hre.waffle;

async function mintTokenTo(admin: SignerWithAddress, token: TestToken, to: SignerWithAddress, amount: number) {
  await token.connect(admin).mint(to.address, amount);
}

async function approveAndDeposit(from: SignerWithAddress, pool: UniswapPool, firstToken: TestToken, firstTokenAmount: number, secondToken: TestToken, secondTokenAmount: number) {
  await firstToken.connect(from).approve(pool.address, firstTokenAmount);
  await secondToken.connect(from).approve(pool.address, secondTokenAmount);
  await pool.connect(from).addLiquidity(firstTokenAmount, secondTokenAmount);
}

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
      this.lpToken = UniswapLPToken.attach(
        await this.pool.lpToken()
      );
    });

    it("should assign the contract address as the LP token owner", async function () {
      expect(await this.lpToken.owner()).to.equal(this.pool.address);
    });

    it("should exchange tokens for all LP tokens if no LP tokens", async function () {
      const aliceASupply = 100;
      const aliceBSupply = 200;

      await mintTokenTo(this.signers.admin, this.tokenA, this.signers.alice, aliceASupply);
      await mintTokenTo(this.signers.admin, this.tokenB, this.signers.alice, aliceBSupply);

      const aliceADeposit = 10;
      const aliceBDeposit = 40;

      await approveAndDeposit(this.signers.alice, this.pool, this.tokenA, aliceADeposit, this.tokenB, aliceBDeposit);

      const expectedLPTokenSupply = Math.sqrt(aliceADeposit * aliceBDeposit);
      expect(await this.lpToken.totalSupply()).to.equal(expectedLPTokenSupply);
      expect(await this.lpToken.balanceOf(this.signers.alice.address)).to.equal(expectedLPTokenSupply);

      expect(await this.tokenA.balanceOf(this.pool.address)).to.equal(aliceADeposit);
      expect(await this.tokenB.balanceOf(this.pool.address)).to.equal(aliceBDeposit);
    });

    it("should exchange tokens for proportional LP tokens if some LP tokens", async function () {
      const tenToTen = 10 ** 10;
      const aliceASupply = 100 * tenToTen;
      const aliceBSupply = 200 * tenToTen;
      const bobASupply = 500 * tenToTen;
      const bobBSupply = 300 * tenToTen;

      await mintTokenTo(this.signers.admin, this.tokenA, this.signers.alice, aliceASupply);
      await mintTokenTo(this.signers.admin, this.tokenB, this.signers.alice, aliceBSupply);
      await mintTokenTo(this.signers.admin, this.tokenA, this.signers.bob, bobASupply);
      await mintTokenTo(this.signers.admin, this.tokenB, this.signers.bob, bobBSupply);

      const aliceADeposit = 10 * tenToTen;
      const aliceBDeposit = 40 * tenToTen;

      await approveAndDeposit(this.signers.alice, this.pool, this.tokenA, aliceADeposit, this.tokenB, aliceBDeposit);

      const initialLPTokenSupply = Math.sqrt(aliceADeposit * aliceBDeposit);
      expect(await this.lpToken.totalSupply()).to.equal(initialLPTokenSupply);

      const bobADeposit = 5 * tenToTen;
      const bobBDeposit = 10 * tenToTen;

      await approveAndDeposit(this.signers.bob, this.pool, this.tokenA, bobADeposit, this.tokenB, bobBDeposit);

      const expectedTotalA = aliceADeposit + bobADeposit;
      const expectedTotalB = aliceBDeposit + bobBDeposit;

      expect(await this.tokenA.balanceOf(this.pool.address)).to.equal(expectedTotalA);
      expect(await this.tokenB.balanceOf(this.pool.address)).to.equal(expectedTotalB);

      const totalBobDepositAsA = bobADeposit + (bobBDeposit * expectedTotalA / expectedTotalB);
      const totalPoolAsA = expectedTotalA * 2;
      const bobLPOwnershipPercent = (totalBobDepositAsA / totalPoolAsA);
      const expectedBobLPTokens = Math.floor(initialLPTokenSupply * ((1 / (1 - bobLPOwnershipPercent)) - 1));
      const expectedLPTokenSupply = Math.floor(initialLPTokenSupply + expectedBobLPTokens);

      expect(await this.lpToken.balanceOf(this.signers.alice.address)).to.equal(initialLPTokenSupply);
      expect(await this.lpToken.balanceOf(this.signers.bob.address)).to.equal(expectedBobLPTokens);
      expect(await this.lpToken.totalSupply()).to.equal(expectedLPTokenSupply);
    });

    it("should withdraw all tokens for LP that owns all tokens", async function () {
      expect(await this.tokenA.totalSupply()).to.equal(0);
      expect(await this.tokenB.totalSupply()).to.equal(0);

      const aliceASupply = 100;
      const aliceBSupply = 200;

      await mintTokenTo(this.signers.admin, this.tokenA, this.signers.alice, aliceASupply);
      await mintTokenTo(this.signers.admin, this.tokenB, this.signers.alice, aliceBSupply);

      const aliceADeposit = 10;
      const aliceBDeposit = 40;

      await approveAndDeposit(this.signers.alice, this.pool, this.tokenA, aliceADeposit, this.tokenB, aliceBDeposit);
      expect(await this.tokenA.balanceOf(this.signers.alice.address)).to.equal(aliceASupply - aliceADeposit);
      expect(await this.tokenB.balanceOf(this.signers.alice.address)).to.equal(aliceBSupply - aliceBDeposit);

      const aliceLPTokenBalance = await this.lpToken.balanceOf(this.signers.alice.address);
      await this.pool.connect(this.signers.alice).removeLiquidity(aliceLPTokenBalance);

      expect(await this.lpToken.totalSupply()).to.equal(0);
      expect(await this.tokenA.balanceOf(this.signers.alice.address)).to.equal(aliceASupply);
      expect(await this.tokenB.balanceOf(this.signers.alice.address)).to.equal(aliceBSupply);
    });
  });
};