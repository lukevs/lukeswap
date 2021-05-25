import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import { TestToken } from "../typechain/TestToken";
import { Signers } from "../types";

import { shouldBehaveLikeUniswapPool } from "./UniswapPool";
import { shouldBehaveLikeUniswapLPToken } from "./UniswapLPToken";

const { deployContract } = hre.waffle;

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await hre.ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.alice = signers[1];
    this.signers.bob = signers[2];

    const testTokenArtifact: Artifact = await hre.artifacts.readArtifact("TestToken");
    this.tokenA = <TestToken>await deployContract(this.signers.admin, testTokenArtifact, ["TokenA", "TA"]);
    this.tokenB = <TestToken>await deployContract(this.signers.admin, testTokenArtifact, ["TokenB", "TB"]);
  });

  shouldBehaveLikeUniswapLPToken();
  shouldBehaveLikeUniswapPool();
});
