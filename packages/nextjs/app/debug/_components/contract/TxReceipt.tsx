import { useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { TransactionReceipt } from "viem";
import { CheckCircleIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { ObjectFieldDisplay } from "~~/app/debug/_components/contract";
import { replacer } from "~~/utils/scaffold-eth/common";

export const TxReceipt = ({ txResult }: { txResult: TransactionReceipt }) => {
  const [txResultCopied, setTxResultCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="">
      <div className="w-full rounded-md shadow-sm mb-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center hover:text-white-200 justify-between px-4 pt-2 text-left font-extralight text-sm hover:bg-secondary/90"
        >
          {isOpen ? "-" : "+"} Transaction Receipt
        </button>

        {isOpen && (
          <div className="text-sm px-4 flex flex-col">
            {txResultCopied ? (
              <CheckCircleIcon
                className="text-xl font-normal text-sky-600 h-5 w-5 cursor-pointer ml-auto mb-1"
                aria-hidden="true"
              />
            ) : (
              <CopyToClipboard
                text={JSON.stringify(txResult, replacer, 2)}
                onCopy={() => {
                  setTxResultCopied(true);
                  setTimeout(() => {
                    setTxResultCopied(false);
                  }, 800);
                }}
              >
                <DocumentDuplicateIcon
                  className="text-xl font-normal text-sky-600 h-5 w-5 cursor-pointer ml-auto mb-1"
                  aria-hidden="true"
                />
              </CopyToClipboard>
            )}
            <pre className="text-xs break-words whitespace-pre-wrap overflow-auto bg-foreground rounded-lg text-white-100 relative h-56">
              <code className="whitespace-pre-wrap break-words absolute p-6">
                {Object.entries(txResult).map(([k, v]) => (
                  <ObjectFieldDisplay name={k} value={v} size="xs" leftPad={false} key={k} />
                ))}
              </code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
