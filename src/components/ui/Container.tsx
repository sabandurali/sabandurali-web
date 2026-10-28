import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

type ContainerProps = Omit<HTMLAttributes<HTMLElement>, "className"> & {
  as?: "div" | "header" | "footer" | "nav" | "section" | "article";
  className?: string;
  children: ReactNode;
};

/** Page column: 1440 px maximum, fluid 16–72 px side gutter. */
export default function Container({
  as: Tag = "div",
  className,
  children,
  ...rest
}: ContainerProps) {
  return (
    <Tag
      className={cx("mx-auto w-full max-w-page px-gutter", className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
