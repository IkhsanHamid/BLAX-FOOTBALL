import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "black";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: (e: any) => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  intent?: "delete" | "cancel" | "default";
  href?: string; // <-- tambahin
  target?: "_blank" | "_self" | "_parent" | "_top";
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  disabled = false,
  type = "button",
  intent = "default",
  href,
  target,
}: ButtonProps) {
  const baseClasses = `${
    variant === "ghost"
      ? "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95"
      : "font-semibold rounded-full transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center"
  }`;

  const getDynamicVariant = () => {
    if (intent === "delete" || intent === "cancel") {
      return "danger";
    }
    return variant;
  };

  const effectiveVariant = getDynamicVariant();

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-blue-500 to-blue-500 hover:from-blue-600 hover:to-blue-600 text-white",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700",
    black: "bg-black text-white",
    outline:
      "border-2 border-blue-300 hover:border-blue-400 text-gray-700 hover:bg-gray-50 backdrop-blur-sm",
    danger: "bg-red-500 hover:bg-red-600 text-white",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };

  const sizeClasses = {
    sm: "py-2 px-4 text-sm",
    md: "py-3 px-6",
    lg: "py-4 px-8",
  };

  const disabledClasses = disabled
    ? "opacity-50 cursor-not-allowed hover:scale-100"
    : "";

  const finalClassName = `${baseClasses} ${variantClasses[effectiveVariant]} ${sizeClasses[size]} ${disabledClasses} ${className}`;

  // Kalau ada href → render <a>, kalau nggak → <button>
  if (href) {
    return (
      <a
        href={href}
        target={target}
        className={finalClassName}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={finalClassName}
    >
      {children}
    </button>
  );
}
