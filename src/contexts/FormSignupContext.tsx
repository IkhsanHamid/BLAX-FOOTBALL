"use client";
import { FormSignup } from "@/types/auth";
import React, { createContext, useContext, useState, ReactNode } from "react";

interface FormSignupContextType {
  selectedSignup: FormSignup | null;
  setSelectedSignup: (signup: FormSignup | null) => void;
}

const SignupContext = createContext<FormSignupContextType | undefined>(
  undefined
);

export function SignupProvider({ children }: { children: ReactNode }) {
  const [selectedSignup, setSelectedSignup] = useState<FormSignup | null>(null);

  return (
    <SignupContext.Provider value={{ selectedSignup, setSelectedSignup }}>
      {children}
    </SignupContext.Provider>
  );
}

export function useFormSignup() {
  const context = useContext(SignupContext);
  if (context === undefined) {
    throw new Error("useFormSignup must be used within a SignupProvider");
  }
  return context;
}
