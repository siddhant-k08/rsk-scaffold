import { expect } from "chai";
import { ethers } from "hardhat";
import { Forwarder, ExampleTarget } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ExampleTarget", function () {
  let forwarder: Forwarder;
  let exampleTarget: ExampleTarget;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const ForwarderFactory = await ethers.getContractFactory("Forwarder");
    forwarder = await ForwarderFactory.deploy();
    await forwarder.waitForDeployment();

    const ExampleTargetFactory = await ethers.getContractFactory("ExampleTarget");
    exampleTarget = await ExampleTargetFactory.deploy(await forwarder.getAddress());
    await exampleTarget.waitForDeployment();
  });

  describe("Direct calls", function () {
    it("Should add points via direct call", async function () {
      await exampleTarget.connect(user).addPoints(10n);

      const points = await exampleTarget.getPoints(user.address);
      expect(points).to.equal(10n);
    });

    it("Should accumulate points", async function () {
      await exampleTarget.connect(user).addPoints(10n);
      await exampleTarget.connect(user).addPoints(20n);

      const points = await exampleTarget.getPoints(user.address);
      expect(points).to.equal(30n);
    });

    it("Should emit PointsAdded event", async function () {
      await expect(exampleTarget.connect(user).addPoints(10n))
        .to.emit(exampleTarget, "PointsAdded")
        .withArgs(user.address, 10n, 10n);
    });
  });

  describe("Meta-transaction calls", function () {
    it("Should add points via meta-transaction", async function () {
      const nonce = await forwarder.getNonce(user.address);

      const data = exampleTarget.interface.encodeFunctionData("addPoints", [10n]);

      const request = {
        from: user.address,
        to: await exampleTarget.getAddress(),
        value: 0n,
        gas: 100000n,
        nonce: nonce,
        data: data,
      };

      const domain = {
        name: "RSKForwarder",
        version: "0.0.1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await forwarder.getAddress(),
      };

      const types = {
        ForwardRequest: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "gas", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "data", type: "bytes" },
        ],
      };

      const signature = await user.signTypedData(domain, types, request);

      await forwarder.connect(owner).execute(request, signature);

      const points = await exampleTarget.getPoints(user.address);
      expect(points).to.equal(10n);
    });

    it("Should correctly identify sender in meta-transaction", async function () {
      const nonce = await forwarder.getNonce(user.address);

      const data = exampleTarget.interface.encodeFunctionData("addPoints", [10n]);

      const request = {
        from: user.address,
        to: await exampleTarget.getAddress(),
        value: 0n,
        gas: 100000n,
        nonce: nonce,
        data: data,
      };

      const domain = {
        name: "RSKForwarder",
        version: "0.0.1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await forwarder.getAddress(),
      };

      const types = {
        ForwardRequest: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "gas", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "data", type: "bytes" },
        ],
      };

      const signature = await user.signTypedData(domain, types, request);

      await expect(forwarder.connect(owner).execute(request, signature))
        .to.emit(exampleTarget, "PointsAdded")
        .withArgs(user.address, 10n, 10n);

      const points = await exampleTarget.getPoints(user.address);
      expect(points).to.equal(10n);

      const ownerPoints = await exampleTarget.getPoints(owner.address);
      expect(ownerPoints).to.equal(0n);
    });
  });
});
