import * as React from "react";
import RightChevron from "@/shared/icons/RightChevron";

function Breadcrumb({
  children,
  ...props
}: React.ComponentPropsWithoutRef<"nav">) {
  return (
    <nav className="text-sm" aria-label="breadcrumb" {...props}>
      <ol className="flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5">
        {children}
      </ol>
    </nav>
  );
}

function BreadcrumbItem({
  href,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"a">) {
  return (
    <li className={"uppercase inline-flex items-center gap-1.5"}>
      {href ? (
        <a className="hover:underline" href={href} {...props}>
          {children}
        </a>
      ) : (
        <span {...props}>{children}</span>
      )}
    </li>
  );
}

function BreadcrumbSeparator({ ...props }: React.ComponentProps<"li">) {
  return (
    <li role="presentation" aria-hidden="true" {...props}>
      <RightChevron />
    </li>
  );
}

export { Breadcrumb, BreadcrumbItem, BreadcrumbSeparator };
