"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";
import { Schedule } from "@/types/schedule";

interface ScheduleContextType {
  selectedSchedule: Schedule | null;
  setSelectedSchedule: (schedule: Schedule | null) => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(
  undefined
);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );

  return (
    <ScheduleContext.Provider value={{ selectedSchedule, setSelectedSchedule }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error("useSchedule must be used within a ScheduleProvider");
  }
  return context;
}
