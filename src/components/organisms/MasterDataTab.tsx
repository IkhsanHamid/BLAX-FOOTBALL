"use client";

import React, { useState } from "react";
import { MapPin, FileText, Gift, Settings } from "lucide-react";
import VenueManagement from "./VenueManagement";
import RuleManagement from "./RuleManagement";
import VoucherManagement from "./VoucherManagement";
import FacilityManagement from "./FacilityManagement";

// Tab configuration
const TABS = [
  { id: "venues", label: "Venue", icon: MapPin, component: VenueManagement },
  { id: "rules", label: "Rules", icon: FileText, component: RuleManagement },
  {
    id: "vouchers",
    label: "Vouchers",
    icon: Gift,
    component: VoucherManagement,
  },
  {
    id: "facilities",
    label: "Facilities",
    icon: Settings,
    component: FacilityManagement,
  },
];

// Types
interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
}

interface TabButtonProps {
  tab: Tab;
  isActive: boolean;
  onClick: (id: string) => void;
}

// Reusable Tab Button Component
function TabButton({ tab, isActive, onClick }: TabButtonProps) {
  const Icon = tab.icon;

  return (
    <button
      onClick={() => onClick(tab.id)}
      className={`
        flex items-center justify-center gap-2 flex-1 px-3 py-2.5 sm:py-3 
        rounded-md text-xs sm:text-sm font-medium transition-all duration-200
        ${
          isActive
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        }
      `}
      aria-label={tab.label}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="hidden sm:inline">{tab.label}</span>
    </button>
  );
}

// Main Component
export default function MasterDataTab() {
  const [activeTab, setActiveTab] = useState("venues");

  const ActiveComponent = TABS.find((tab) => tab.id === activeTab)?.component;

  return (
    <div className="w-full min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="text-center px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Master Data Management
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Kelola data master venue, aturan, voucher, dan fasilitas
          </p>
        </header>

        {/* Tab Navigation */}
        <nav
          className="bg-gray-100 rounded-lg p-1 max-w-2xl mx-auto"
          role="tablist"
          aria-label="Master data sections"
        >
          <div className="grid grid-cols-4 gap-1">
            {TABS.map((tab) => (
              <TabButton
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                onClick={setActiveTab}
              />
            ))}
          </div>
        </nav>

        {/* Tab Content with Animation */}
        <main
          className="animate-fadeIn"
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
        >
          {ActiveComponent && <ActiveComponent />}
        </main>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
