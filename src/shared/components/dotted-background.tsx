import { cn } from "@cartridge/ui";

export function DotBackground({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "fixed flex h-full w-full items-center justify-center bg-background-100",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:20px_20px]",
          "[background-image:radial-gradient(#1e221f_1px,transparent_1px)]",
        )}
      />
      <div className="bg-gradient-to-b from-[#0C0E0C] to-transparent w-full h-[100px] fixed top-0 z-10" />
    </div>
  );
}
