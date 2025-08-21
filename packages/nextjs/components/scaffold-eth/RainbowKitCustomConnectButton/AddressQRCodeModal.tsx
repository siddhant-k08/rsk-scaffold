import { QRCodeSVG } from "qrcode.react";
import { Address as AddressType } from "viem";
import { Address } from "~~/components/scaffold-eth";
import BaseDialog from "~~/components/ui/BaseDialog";

type AddressQRCodeModalProps = {
  address: AddressType;
  modalId?: string;
  open: boolean;
  closeDialog: () => void;
};

export const AddressQRCodeModal = ({ address, open, closeDialog }: AddressQRCodeModalProps) => {
  return (
    <BaseDialog open={open} closeDialog={closeDialog} className="border border-border">
      <div className="flex flex-col items-center md:gap-8 gap-4 p-4">
        <QRCodeSVG value={address} size={256} />
        <Address address={address} format="long" disableAddressLink onlyEnsOrAddress />
      </div>
    </BaseDialog>
  );
};
