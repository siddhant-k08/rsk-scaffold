"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address, AddressInput } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const DAOVote: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [userAddress, setUserAddress] = useState("");
  const [votingPower, setVotingPower] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  const [proposalIdToView, setProposalIdToView] = useState("");
  const [proposalIdToVote, setProposalIdToVote] = useState("");
  const [voteSupport, setVoteSupport] = useState(true);

  // Read DAO info
  const { data: owner } = useScaffoldReadContract({
    contractName: "SimpleDAO",
    functionName: "owner",
  });

  const { data: proposalCount } = useScaffoldReadContract({
    contractName: "SimpleDAO",
    functionName: "proposalCount",
  });

  const { data: myVotingPower } = useScaffoldReadContract({
    contractName: "SimpleDAO",
    functionName: "votingPower",
    args: [connectedAddress],
  });

  // Read specific proposal
  const { data: proposalData } = useScaffoldReadContract({
    contractName: "SimpleDAO",
    functionName: "getProposal",
    args: proposalIdToView ? [BigInt(proposalIdToView)] : undefined,
  });

  // Write contract
  const { writeContractAsync: writeSimpleDAOAsync } = useScaffoldWriteContract("SimpleDAO");

  const isOwner = connectedAddress && owner && connectedAddress.toLowerCase() === owner.toLowerCase();

  const handleSetVotingPower = async () => {
    if (!userAddress || !votingPower) {
      alert("Please enter address and voting power");
      return;
    }

    try {
      await writeSimpleDAOAsync({
        functionName: "setVotingPower",
        args: [userAddress, BigInt(votingPower)],
      });
      setUserAddress("");
      setVotingPower("");
    } catch (error) {
      console.error("Setting voting power failed:", error);
    }
  };

  const handleCreateProposal = async () => {
    if (!proposalDescription) {
      alert("Please enter proposal description");
      return;
    }

    try {
      await writeSimpleDAOAsync({
        functionName: "propose",
        args: [proposalDescription],
      });
      setProposalDescription("");
    } catch (error) {
      console.error("Creating proposal failed:", error);
    }
  };

  const handleVote = async () => {
    if (!proposalIdToVote) {
      alert("Please enter proposal ID");
      return;
    }

    try {
      await writeSimpleDAOAsync({
        functionName: "vote",
        args: [BigInt(proposalIdToVote), voteSupport],
      });
    } catch (error) {
      console.error("Voting failed:", error);
    }
  };

  const handleExecute = async () => {
    if (!proposalIdToView) {
      alert("Please enter proposal ID to execute");
      return;
    }

    try {
      await writeSimpleDAOAsync({
        functionName: "execute",
        args: [BigInt(proposalIdToView)],
      });
    } catch (error) {
      console.error("Execution failed:", error);
    }
  };

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 w-full max-w-6xl">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">DAO Voting dApp</span>
          <span className="block text-2xl mt-2">Decentralized Governance</span>
        </h1>

        <div className="flex flex-col gap-6">
          {/* DAO Info Card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">DAO Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm opacity-70">Owner</p>
                  <Address address={owner} />
                </div>
                <div>
                  <p className="text-sm opacity-70">Total Proposals</p>
                  <p className="text-2xl font-bold">{proposalCount?.toString() || "0"}</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Your Voting Power</p>
                  <p className="text-2xl font-bold">{myVotingPower?.toString() || "0"}</p>
                </div>
              </div>
              {isOwner && (
                <div className="alert alert-warning mt-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span>You are the DAO owner</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Owner Controls */}
            {isOwner && (
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">Owner: Set Voting Power</h2>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text">User Address</span>
                    </label>
                    <AddressInput value={userAddress} onChange={setUserAddress} placeholder="Enter user address" />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text">Voting Power</span>
                    </label>
                    <input
                      type="number"
                      placeholder="100"
                      className="input input-bordered w-full"
                      value={votingPower}
                      onChange={e => setVotingPower(e.target.value)}
                      min="0"
                    />
                  </div>

                  <div className="card-actions justify-end mt-4">
                    <button className="btn btn-primary" onClick={handleSetVotingPower}>
                      Set Voting Power
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Create Proposal */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Create Proposal</h2>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Proposal Description</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    placeholder="Describe your proposal..."
                    value={proposalDescription}
                    onChange={e => setProposalDescription(e.target.value)}
                  ></textarea>
                </div>

                <div className="card-actions justify-end mt-4">
                  <button className="btn btn-primary" onClick={handleCreateProposal} disabled={!connectedAddress}>
                    Create Proposal
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Vote on Proposal */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Vote on Proposal</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Proposal ID</span>
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    className="input input-bordered w-full"
                    value={proposalIdToVote}
                    onChange={e => setProposalIdToVote(e.target.value)}
                    min="0"
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Your Vote</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={voteSupport ? "for" : "against"}
                    onChange={e => setVoteSupport(e.target.value === "for")}
                  >
                    <option value="for">Vote For</option>
                    <option value="against">Vote Against</option>
                  </select>
                </div>
              </div>

              <div className="card-actions justify-end mt-4">
                <button
                  className="btn btn-primary"
                  onClick={handleVote}
                  disabled={!connectedAddress || !myVotingPower || myVotingPower === 0n}
                >
                  Cast Vote
                </button>
              </div>

              {myVotingPower === 0n && connectedAddress && (
                <div className="alert alert-warning mt-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span>You have no voting power. Contact the DAO owner to receive voting power.</span>
                </div>
              )}
            </div>
          </div>

          {/* View Proposal */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">View Proposal</h2>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Proposal ID</span>
                </label>
                <input
                  type="number"
                  placeholder="0"
                  className="input input-bordered w-full"
                  value={proposalIdToView}
                  onChange={e => setProposalIdToView(e.target.value)}
                  min="0"
                />
              </div>

              {proposalData && (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm opacity-70">Description</p>
                    <p className="text-lg font-semibold">{proposalData[0]}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm opacity-70">Votes For</p>
                      <p className="text-2xl font-bold text-success">{proposalData[1]?.toString()}</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-70">Votes Against</p>
                      <p className="text-2xl font-bold text-error">{proposalData[2]?.toString()}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm opacity-70">Status</p>
                    <div className="badge badge-lg mt-1">{proposalData[3] ? "Executed ✓" : "Pending"}</div>
                  </div>

                  {!proposalData[3] && proposalData[1] > proposalData[2] && (
                    <div className="card-actions justify-end">
                      <button className="btn btn-success" onClick={handleExecute}>
                        Execute Proposal
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tutorial Card */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">How to Use</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  <strong>Owner:</strong> Set voting power for users (only the DAO owner can do this)
                </li>
                <li>
                  <strong>Anyone:</strong> Create proposals by entering a description
                </li>
                <li>
                  <strong>Voters:</strong> Vote on proposals using your voting power (you can only vote once per
                  proposal)
                </li>
                <li>
                  <strong>View:</strong> Check proposal details by entering the proposal ID
                </li>
                <li>
                  <strong>Execute:</strong> Execute proposals that have more votes for than against
                </li>
              </ol>
              <div className="alert alert-info mt-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="stroke-current shrink-0 w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span>
                  This is a minimal DAO contract demonstrating basic governance. In production, you would add time
                  locks, quorum requirements, and more sophisticated voting mechanisms.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DAOVote;
