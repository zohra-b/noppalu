
import Link from "next/link";
import type { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary";
  href?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  target?: "_blank" | "_self";
};

export default function Button({
  children,
  variant = "primary",
  href,
  type = "button",
  onClick,
  disabled = false,
  className = "",
  target,
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md px-5 py-3 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2";

  const variantClasses = {
    primary: "bg-green text-linen hover:bg-[#244D2B]",
    secondary:
      "border border-green text-green hover:bg-green hover:text-linen",
  };

  const classes =
    `${baseClasses} ${variantClasses[variant]} ${className}`.trim();

  if (href) {
    return (
      <Link
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        className={classes}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${classes} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {children}
    </button>
  );
}