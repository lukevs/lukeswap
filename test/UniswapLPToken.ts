import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { expect } from "chai";

import { UniswapLPToken } from "../typechain/UniswapLPToken";

const { deployContract } = hre.waffle;

export function shouldBehaveLikeUniswapLPToken(): void {
  describe("UniswapLPToken", function () {
    beforeEach(async function () {
      const lpTokenArtifact: Artifact = await hre.artifacts.readArtifact("UniswapLPToken");
      this.lpToken = <UniswapLPToken>await deployContract(
        this.signers.admin,
        lpTokenArtifact,
        ["lpToken", "LPT", this.tokenA.address, this.tokenB.address]
      );
    });

    it("should allow owner to mint", async function () {
      const aliceMintSupply: number = 100;
      const bobMintSupply: number = 50;

      expect(await this.lpToken.totalSupply()).to.equal(0);

      await this.lpToken.connect(this.signers.admin).mint(this.signers.alice.address, aliceMintSupply);
      await this.lpToken.connect(this.signers.admin).mint(this.signers.bob.address, bobMintSupply);

      expect(await this.lpToken.connect(this.signers.admin).totalSupply()).to.equal(aliceMintSupply + bobMintSupply);
      expect(await this.lpToken.connect(this.signers.admin).balanceOf(this.signers.alice.address)).to.equal(aliceMintSupply);
      expect(await this.lpToken.connect(this.signers.admin).balanceOf(this.signers.bob.address)).to.equal(bobMintSupply);
    });

    it("should allow owner to burn", async function () {
      const aliceMintSupply: number = 100;
      const aliceBurnSupply: number = 60;

      await this.lpToken.connect(this.signers.admin).mint(this.signers.alice.address, aliceMintSupply);
      expect(await this.lpToken.connect(this.signers.admin).balanceOf(this.signers.alice.address)).to.equal(aliceMintSupply);

      await this.lpToken.connect(this.signers.admin).burn(this.signers.alice.address, aliceBurnSupply);
      expect(await this.lpToken.connect(this.signers.admin).balanceOf(this.signers.alice.address)).to.equal(aliceMintSupply - aliceBurnSupply);
    });
  });
};
