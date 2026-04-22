import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertIcon, SpinnerIcon, TimesCircleIcon } from "@cartridge/ui";

import { cn } from "@/lib/utils";

export const inputVariants = cva(
  "flex w-full rounded-md border px-4 font-mono ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-inner-spin-button]:appearance-none caret-primary",
  {
    variants: {
      variant: {
        default:
          "border bg-background-200 border-background-300 text-foreground-100 hover:border-background-400 focus-visible:border-primary focus-visible:bg-background-300 placeholder:text-foreground-400",
        username:
          "border bg-background-200 border-background-300 text-foreground-100 placeholder:text-foreground-400 focus-visible:border-primary",
      },
      size: {
        default: "h-10 text-sm/[18px]",
        lg: "h-12 text-[15px]/5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ErrorMessageProps = {
  label?: string;
  className?: string;
};

export function ErrorMessage({ label, className }: ErrorMessageProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-x-1 text-destructive-100 select-none text-sm/[18px]",
        !label && "hidden",
        className,
      )}
    >
      <AlertIcon className="h-5 w-5" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

type ClearButtonProps = { isLoading: boolean; onClear: () => void };

function ClearButton({ isLoading, onClear }: ClearButtonProps) {
  return (
    <div
      className="h-9 w-9 p-1.5 flex items-center justify-center cursor-pointer"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClear}
    >
      {isLoading ? (
        <SpinnerIcon className=" text-foreground-300 animate-spin" />
      ) : (
        <TimesCircleIcon className="text-foreground-300 hover:text-foreground-200" />
      )}
    </div>
  );
}

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  containerClassName?: string;
  error?: Error;
  isLoading?: boolean;
  onClear?: () => void;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      error,
      isLoading,
      onClear,
      variant,
      size,
      containerClassName,
      className,
      type,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    return (
      <div className={cn("flex flex-col gap-y-3", containerClassName)}>
        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        >
          <input
            ref={ref}
            type={type}
            className={cn(
              inputVariants({ variant, size, className }),
              !!props.value && !!onClear && "pr-12",
              !!error &&
                "border-destructive-100 hover:border-destructive-100 focus-visible:border-destructive-100",
            )}
            {...props}
          />
          {(isFocused || isHovered) && !!props.value && !!onClear && (
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
              <ClearButton isLoading={!!isLoading} onClear={onClear} />
            </div>
          )}
        </div>
        {!!error && <ErrorMessage label={error.message} />}
      </div>
    );
  },
);
Input.displayName = "Input";
