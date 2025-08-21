import { useCallback, useEffect, useState } from "react";
import { parseEther } from "viem";
import { CommonInputProps, InputBase, IntegerVariant, isValidInteger } from "~~/components/scaffold-eth";

type IntegerInputProps = CommonInputProps<string> & {
  variant?: IntegerVariant;
  disableMultiplyBy1e18?: boolean;
};

export const IntegerInput = ({
  value,
  onChange,
  name,
  placeholder,
  disabled,
  variant = IntegerVariant.UINT256,
  disableMultiplyBy1e18 = false,
}: IntegerInputProps) => {
  const [inputError, setInputError] = useState(false);
  const multiplyBy1e18 = useCallback(() => {
    if (!value) {
      return;
    }
    return onChange(parseEther(value).toString());
  }, [onChange, value]);

  useEffect(() => {
    if (isValidInteger(variant, value)) {
      setInputError(false);
    } else {
      setInputError(true);
    }
  }, [value, variant]);

  return (
    <InputBase
      name={name}
      value={value}
      placeholder={placeholder}
      error={inputError}
      onChange={onChange}
      disabled={disabled}
      suffix={
        !inputError &&
        !disableMultiplyBy1e18 && (
          <div className="relative group ml-2">
            <button
              className={`${disabled ? "cursor-not-allowed" : "cursor-pointer"} font-semibold px-2 text-accent`}
              onClick={multiplyBy1e18}
              disabled={disabled}
            >
              *
            </button>
            <span className="absolute -top-10 w-[100px] border border-border left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition rounded bg-black px-2 py-1 text-xs text-white">
              Multiply by 1e18 (wei)
            </span>
          </div>
        )
      }
    />
  );
};
