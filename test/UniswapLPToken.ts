import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";

import { TestToken } from "../typechain/TestToken";
import { UniswapLPToken } from "../typechain/UniswapLPToken";
import { Signers } from "../types";

const { deployContract } = hre.waffle;

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await hre.ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.anne = signers[1];
    this.signers.bob = signers[2];

    const testTokenArtifact: Artifact = await hre.artifacts.readArtifact("TestToken");
    this.tokenA = <TestToken>await deployContract(this.signers.admin, testTokenArtifact, ["TokenA", "TA"]);
    this.tokenB = <TestToken>await deployContract(this.signers.admin, testTokenArtifact, ["TokenB", "TB"]);
  });

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
      const anneMintSupply: number = 100;
      const bobMintSupply: number = 50;

      expect(await this.lpToken.totalSupply()).to.equal(0);

      await this.lpToken.connect(this.signers.admin).mint(this.signers.anne.address, anneMintSupply);
      await this.lpToken.connect(this.signers.admin).mint(this.signers.bob.address, bobMintSupply);

      expect(await this.lpToken.connect(this.signers.admin).totalSupply()).to.equal(anneMintSupply + bobMintSupply);
      expect(await this.lpToken.connect(this.signers.admin).balanceOf(this.signers.anne.address)).to.equal(anneMintSupply);
      expect(await this.lpToken.connect(this.signers.admin).balanceOf(this.signers.bob.address)).to.equal(bobMintSupply);
    });

    it("should allow owner to burn", async function () {
      const anneMintSupply: number = 100;
      const anneBurnSupply: number = 60;

      await this.lpToken.connect(this.signers.admin).mint(this.signers.anne.address, anneMintSupply);
      expect(await this.lpToken.connect(this.signers.admin).balanceOf(this.signers.anne.address)).to.equal(anneMintSupply);

      await this.lpToken.connect(this.signers.admin).burn(this.signers.anne.address, anneBurnSupply);
      expect(await this.lpToken.connect(this.signers.admin).balanceOf(this.signers.anne.address)).to.equal(anneMintSupply - anneBurnSupply);
    });
  });
});
