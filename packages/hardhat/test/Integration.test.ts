import { expect } from "chai";
import { ethers } from "hardhat";
import { Forwarder, ExampleTarget } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Integration: Full Meta-Transaction Flow", function () {
  let forwarder: Forwarder;
  let exampleTarget: ExampleTarget;
  let user: SignerWithAddress;
  let relayer: SignerWithAddress;

  beforeEach(async function () {
    [, user, relayer] = await ethers.getSigners();

    const ForwarderFactory = await ethers.getContractFactory("Forwarder");
    forwarder = await ForwarderFactory.deploy();
    await forwarder.waitForDeployment();

    const ExampleTargetFactory = await ethers.getContractFactory("ExampleTarget");
    exampleTarget = await ExampleTargetFactory.deploy(await forwarder.getAddress());
    await exampleTarget.waitForDeployment();
  });

  it("Should complete full gasless transaction flow", async function () {
    const initialPoints = await exampleTarget.getPoints(user.address);
    expect(initialPoints).to.equal(0n);

    const nonce = await forwarder.getNonce(user.address);
    expect(nonce).to.equal(0n);

    const data = exampleTarget.interface.encodeFunctionData("addPoints", [25n]);

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

    const isValid = await forwarder.verify(request, signature);
    void expect(isValid).to.be.true;

    const tx = await forwarder.connect(relayer).execute(request, signature);
    const receipt = await tx.wait();

    expect(receipt?.status).to.equal(1);

    const finalPoints = await exampleTarget.getPoints(user.address);
    expect(finalPoints).to.equal(25n);

    const newNonce = await forwarder.getNonce(user.address);
    expect(newNonce).to.equal(1n);

    const relayerPoints = await exampleTarget.getPoints(relayer.address);
    expect(relayerPoints).to.equal(0n);
  });

  it("Should handle multiple sequential meta-transactions", async function () {
    for (let i = 0; i < 5; i++) {
      const nonce = await forwarder.getNonce(user.address);
      const data = exampleTarget.interface.encodeFunctionData("addPoints", [5n]);

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
      await forwarder.connect(relayer).execute(request, signature);
    }

    const finalPoints = await exampleTarget.getPoints(user.address);
    expect(finalPoints).to.equal(25n);

    const finalNonce = await forwarder.getNonce(user.address);
    expect(finalNonce).to.equal(5n);
  });

  it("Should differentiate between direct and meta-transaction calls", async function () {
    await exampleTarget.connect(user).addPoints(10n);

    const directPoints = await exampleTarget.getPoints(user.address);
    expect(directPoints).to.equal(10n);

    const nonce = await forwarder.getNonce(user.address);
    const data = exampleTarget.interface.encodeFunctionData("addPoints", [15n]);

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
    await forwarder.connect(relayer).execute(request, signature);

    const finalPoints = await exampleTarget.getPoints(user.address);
    expect(finalPoints).to.equal(25n);

    const relayerPoints = await exampleTarget.getPoints(relayer.address);
    expect(relayerPoints).to.equal(0n);
  });
});
