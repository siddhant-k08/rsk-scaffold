import { useRef, useState } from "react";
import { AddressQRCodeModal } from "./AddressQRCodeModal";
import { NetworkOptions } from "./NetworkOptions";
import CopyToClipboard from "react-copy-to-clipboard";
import { getAddress } from "viem";
import { Address } from "viem";
import { useDisconnect } from "wagmi";
import {
  ArrowLeftOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import { BlockieAvatar, isENS } from "~~/components/scaffold-eth";
import { useOutsideClick } from "~~/hooks/scaffold-eth";
import { getTargetNetworks } from "~~/utils/scaffold-eth";

const allowedNetworks = getTargetNetworks();

type AddressInfoDropdownProps = {
  address: Address;
  blockExplorerAddressLink: string | undefined;
  displayName: string;
  ensAvatar?: string;
};

export const AddressInfoDropdown = ({
  address,
  ensAvatar,
  displayName,
  blockExplorerAddressLink,
}: AddressInfoDropdownProps) => {
  const { disconnect } = useDisconnect();
  const checkSumAddress = getAddress(address);

  const [addressCopied, setAddressCopied] = useState(false);
  const [openQrDialog, setOpenQrDialog] = useState(false);
  const [selectingNetwork, setSelectingNetwork] = useState(false);
  const dropdownRef = useRef<HTMLDetailsElement>(null);
  const closeDropdown = () => {
    setSelectingNetwork(false);
    dropdownRef.current?.removeAttribute("open");
  };
  useOutsideClick(dropdownRef, closeDropdown);

  return (
    <>
      <details ref={dropdownRef} className="leading-3 relative">
        <summary tabIndex={0} className="flex items-center gap-1 border border-white rounded-full cursor-pointer p-2">
          <BlockieAvatar address={checkSumAddress} size={20} ensImage={ensAvatar} />
          <span className="">
            {isENS(displayName) ? displayName : checkSumAddress?.slice(0, 6) + "..." + checkSumAddress?.slice(-4)}
          </span>
          <ChevronDownIcon className="h-5 w-5 text-white text-xl font-normal" />
        </summary>
        <ul
          tabIndex={0}
          className="absolute mt-1 right-0 rounded-xl p-4 shadow-lg bg-secondary z-10 border border-border"
        >
          <NetworkOptions hidden={!selectingNetwork} />
          <li className={selectingNetwork ? "hidden" : ""}>
            {addressCopied ? (
              <div className="btn-sm !rounded-xl flex gap-3 py-3 items-center">
                <CheckCircleIcon className="text-xl font-normal h-5 w-5 cursor-pointer" aria-hidden="true" />
                <span className="">Copy address</span>
              </div>
            ) : (
              <CopyToClipboard
                text={checkSumAddress}
                onCopy={() => {
                  setAddressCopied(true);
                  setTimeout(() => {
                    setAddressCopied(false);
                  }, 800);
                }}
              >
                <div className="btn-sm !rounded-xl flex gap-3 py-3 items-center">
                  <DocumentDuplicateIcon
                    className="text-xl font-normal h-5 w-5 cursor-pointer ml-2 sm:ml-0"
                    aria-hidden="true"
                  />
                  <span className="">Copy address</span>
                </div>
              </CopyToClipboard>
            )}
          </li>
          <li className={selectingNetwork ? "hidden" : ""}>
            <label
              htmlFor="qrcode-modal"
              className="btn-sm !rounded-xl flex gap-3 py-3 items-center"
              onClick={() => setOpenQrDialog(true)}
            >
              <QrCodeIcon className="h-5 w-5" />
              <span className="">View QR Code</span>
            </label>
          </li>
          <li className={selectingNetwork ? "hidden" : ""}>
            <button className="flex gap-3 py-3 items-center" type="button">
              <ArrowTopRightOnSquareIcon className="h-5 w-5" />
              <a
                target="_blank"
                href={blockExplorerAddressLink}
                rel="noopener noreferrer"
                className="whitespace-nowrap"
              >
                View on Block Explorer
              </a>
            </button>
          </li>
          {allowedNetworks.length > 1 ? (
            <li className={selectingNetwork ? "hidden" : ""}>
              <button
                className="btn-sm !rounded-xl flex gap-3 py-3"
                type="button"
                onClick={() => {
                  setSelectingNetwork(true);
                }}
              >
                <ArrowsRightLeftIcon className="h-5 w-5" /> <span>Switch Network</span>
              </button>
            </li>
          ) : null}
          <li className={selectingNetwork ? "hidden" : ""}>
            <button className="text-red-300 flex gap-3 py-3 items-center" type="button" onClick={() => disconnect()}>
              <ArrowLeftOnRectangleIcon className="h-5 w-5" /> <span>Disconnect</span>
            </button>
          </li>
        </ul>
      </details>
      <AddressQRCodeModal address={address} open={openQrDialog} closeDialog={() => setOpenQrDialog(false)} />
    </>
  );
};
