import React from "react";

interface InputProps {
  type?: string;
  placeholder?: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  icon?: React.ReactNode;
  min?: string;
  max?: string;
  disabled?: boolean;
  error?: string;
}

export default function Input({
  type = "text",
  placeholder,
  value,
  onChange,
  className = "",
  icon,
  min,
  max,
  disabled,
  error,
}: InputProps) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {icon}
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full ${
          icon ? "pl-10" : "pl-4"
        } pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          error ? "border-red-500" : "border-gray-300"
        } ${className}`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
