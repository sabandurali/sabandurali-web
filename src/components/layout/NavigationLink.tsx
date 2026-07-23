import Link from "next/link";
import type { AriaAttributes, ReactNode } from "react";
import type { PublicNavigationLink } from "@/content/navigation/public-types";

type NavigationLinkProps = {
  link: PublicNavigationLink;
  className: string;
  children?: ReactNode;
  onClick?: () => void;
  ariaCurrent?: AriaAttributes["aria-current"];
};

export default function NavigationLink({
  link,
  className,
  children,
  onClick,
  ariaCurrent,
}: NavigationLinkProps) {
  if (link.href === null) return null;

  if (link.external) {
    return (
      <a
        href={link.href}
        target={link.newTab ? "_blank" : undefined}
        rel={link.newTab ? "noopener noreferrer" : undefined}
        className={className}
        onClick={onClick}
        aria-current={ariaCurrent}
      >
        {children ?? link.label}
      </a>
    );
  }

  return (
    <Link
      href={link.href}
      className={className}
      onClick={onClick}
      aria-current={ariaCurrent}
    >
      {children ?? link.label}
    </Link>
  );
}
