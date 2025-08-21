"use client";

// @refresh reset
import { useReducer } from "react";
import { ContractReadMethods } from "./ContractReadMethods";
import { ContractVariables } from "./ContractVariables";
import { ContractWriteMethods } from "./ContractWriteMethods";
import { Address, Balance } from "~~/components/scaffold-eth";
import Badge from "~~/components/ui/Badge";
import { useDeployedContractInfo, useNetworkColor } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { cn } from "~~/utils/classNames";
import { ContractName } from "~~/utils/scaffold-eth/contract";

type ContractUIProps = {
  contractName: ContractName;
  className?: string;
};

/**
 * UI component to interface with deployed contracts.
 **/
export const ContractUI = ({ contractName, className }: ContractUIProps) => {
  const [refreshDisplayVariables, triggerRefreshDisplayVariables] = useReducer(value => !value, false);
  const { targetNetwork } = useTargetNetwork();
  const { data: deployedContractData, isLoading: deployedContractLoading } = useDeployedContractInfo(contractName);
  const networkColor = useNetworkColor();

  if (deployedContractLoading) {
    return (
      <div className="mt-14">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!deployedContractData) {
    return (
      <p className="text-3xl mt-14">
        {`No contract found by the name of "${contractName}" on chain "${targetNetwork.name}"!`}
      </p>
    );
  }

  return (
    <div className={cn("w-full lex gap-7 max-w-screen-lg xl:max-w-screen-xl mx-auto", className)}>
      <div className="flex gap-1">
        <Badge type="number">1</Badge>
        <Badge>Debugging</Badge>
      </div>
      <h2 className="text-4xl font-bold mt-2">Debug your contract</h2>
      <span className="flex gap-1 items-center my-0 font-light">
        You can debug & interact with your deployed contracts here. Check{" "}
        <Badge type="code">packages/nextjs/app/debug/page.tsx</Badge>
      </span>
      <div className="w-full flex gap-7 mt-12">
        <div className="flex flex-col gap-7">
          <div className="bg-secondary p-5 rounded-lg w-80 border border-border">
            <div className="">Contract</div>
            <hr className="my-3 border-1 border-white-400 rounded-full" />
            <div className="flex gap-3 items-center mt-4">
              <div className="text-white-400 flex flex-col gap-2">
                <div>Address:</div>
                <div>Balance:</div>
                <div>Network:</div>
              </div>
              <div className="flex flex-col gap-2">
                <Address address={deployedContractData.address} onlyEnsOrAddress showBlockie={false} />
                <div>
                  <Balance address={deployedContractData.address} />
                </div>
                {targetNetwork && (
                  <p className="my-0 ">
                    <span style={{ color: networkColor }}>{targetNetwork.name}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-secondary p-5 rounded-lg w-80 border border-border">
            <div className="">Contract variables</div>
            <hr className="my-3 border-1 border-white-400 rounded-full" />
            <ContractVariables
              refreshDisplayVariables={refreshDisplayVariables}
              deployedContractData={deployedContractData}
            />
          </div>
        </div>

        <div className="w-full flex flex-col gap-7">
          <div className="bg-secondary p-4 rounded-lg w-full h-min border border-border">
            <div className="">Read methods</div>
            <hr className="my-3 border-1 border-white-400 rounded-full" />
            <div className="flex flex-col gap-2 my-4">
              <ContractReadMethods deployedContractData={deployedContractData} />
            </div>
          </div>

          <div className="bg-secondary p-4 rounded-lg w-full h-min border border-border">
            <div className="">Write methods</div>
            <hr className="my-3 border-1 border-white-400 rounded-full" />
            <div className="flex flex-col gap-2">
              <ContractWriteMethods
                deployedContractData={deployedContractData}
                onChange={triggerRefreshDisplayVariables}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
