"use client";

import React, { useState, useRef } from "react";
import {
  Settings,
  User,
  Bell,
  Shield,
  Database,
  Mail,
  Globe,
  Palette,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Upload,
  Download,
} from "lucide-react";
import Button from "../atoms/Button";
import Input from "../atoms/Input";
import { Card, CardContent, CardHeader, CardTitle } from "../atoms/Card";
import { useNotifications } from "./NotificationContainer";

interface SettingsData {
  general: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    supportPhone: string;
    timezone: string;
    language: string;
  };
  booking: {
    maxAdvanceBookingDays: number;
    cancellationDeadlineHours: number;
    autoConfirmBookings: boolean;
    requirePaymentUpfront: boolean;
    defaultPlayerFee: number;
    defaultGkFee: number;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    bookingReminders: boolean;
    paymentReminders: boolean;
    promotionalEmails: boolean;
    systemAlerts: boolean;
  };
  security: {
    requireEmailVerification: boolean;
    enableTwoFactorAuth: boolean;
    sessionTimeoutMinutes: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireStrongPasswords: boolean;
  };
  appearance: {
    primaryColor: string;
    secondaryColor: string;
    darkMode: boolean;
    compactMode: boolean;
    showAnimations: boolean;
  };
}

export default function SettingsTab() {
  const [activeSection, setActiveSection] = useState("general");
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { showSuccess, showError } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<SettingsData>({
    general: {
      siteName: "Blax Football",
      siteDescription:
        "Platform booking futsal dan mini soccer terpercaya di Jakarta",
      contactEmail: "info@blaxfootball.com",
      supportPhone: "+62 21 1234 5678",
      timezone: "Asia/Jakarta",
      language: "id-ID",
    },
    booking: {
      maxAdvanceBookingDays: 30,
      cancellationDeadlineHours: 24,
      autoConfirmBookings: true,
      requirePaymentUpfront: true,
      defaultPlayerFee: 75000,
      defaultGkFee: 50000,
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: true,
      bookingReminders: true,
      paymentReminders: true,
      promotionalEmails: false,
      systemAlerts: true,
    },
    security: {
      requireEmailVerification: false,
      enableTwoFactorAuth: false,
      sessionTimeoutMinutes: 120,
      maxLoginAttempts: 5,
      passwordMinLength: 6,
      requireStrongPasswords: true,
    },
    appearance: {
      primaryColor: "#3b82f6",
      secondaryColor: "#14b8a6",
      darkMode: false,
      compactMode: false,
      showAnimations: true,
    },
  });

  const sections = [
    { id: "general", label: "General", icon: Settings },
    { id: "booking", label: "Booking", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  const handleInputChange = (
    section: keyof SettingsData,
    field: string,
    value: any
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      showSuccess(
        "Settings Saved",
        "All settings have been updated successfully"
      );
      setHasChanges(false);
    } catch (error) {
      showError("Save Failed", "Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    // Reset to default values
    setSettings({
      general: {
        siteName: "Blax Football",
        siteDescription:
          "Platform booking futsal dan mini soccer terpercaya di Jakarta",
        contactEmail: "info@blaxfootball.com",
        supportPhone: "+62 21 1234 5678",
        timezone: "Asia/Jakarta",
        language: "id-ID",
      },
      booking: {
        maxAdvanceBookingDays: 30,
        cancellationDeadlineHours: 24,
        autoConfirmBookings: true,
        requirePaymentUpfront: true,
        defaultPlayerFee: 75000,
        defaultGkFee: 50000,
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: true,
        bookingReminders: true,
        paymentReminders: true,
        promotionalEmails: false,
        systemAlerts: true,
      },
      security: {
        requireEmailVerification: false,
        enableTwoFactorAuth: false,
        sessionTimeoutMinutes: 120,
        maxLoginAttempts: 5,
        passwordMinLength: 6,
        requireStrongPasswords: true,
      },
      appearance: {
        primaryColor: "#3b82f6",
        secondaryColor: "#14b8a6",
        darkMode: false,
        compactMode: false,
        showAnimations: true,
      },
    });
    setHasChanges(true);
    showSuccess("Settings Reset", "All settings have been reset to defaults");
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `blax-football-settings-${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();
    URL.revokeObjectURL(url);
    showSuccess(
      "Settings Exported",
      "Settings configuration has been downloaded"
    );
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings(importedSettings);
        setHasChanges(true);
        showSuccess(
          "Settings Imported",
          "Settings have been imported successfully"
        );
      } catch (error) {
        showError("Import Failed", "Invalid settings file format");
      }
    };
    reader.readAsText(file);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Pengaturan Sistem
          </h2>
          <p className="text-gray-600 mt-1">
            Kelola konfigurasi dan preferensi platform
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {hasChanges && (
            <div className="flex items-center text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
              Unsaved changes
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetSettings}
            className="flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveSettings}
            disabled={loading || !hasChanges}
            className="flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <section.icon className="w-5 h-5" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                ))}
              </nav>

              {/* Import/Export */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Backup & Restore
                </h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportSettings}
                    className="w-full flex items-center justify-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Settings
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={importSettings}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleImportClick}
                    className="w-full flex items-center justify-center"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {sections.find((s) => s.id === activeSection)?.icon && (
                  <div className="mr-3">
                    {React.createElement(
                      sections.find((s) => s.id === activeSection)!.icon,
                      { className: "w-6 h-6" }
                    )}
                  </div>
                )}
                {sections.find((s) => s.id === activeSection)?.label} Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* General Settings */}
              {activeSection === "general" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Site Name
                      </label>
                      <Input
                        type="text"
                        value={settings.general.siteName}
                        onChange={(e) =>
                          handleInputChange(
                            "general",
                            "siteName",
                            e.target.value
                          )
                        }
                        placeholder="Enter site name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Email
                      </label>
                      <Input
                        type="email"
                        value={settings.general.contactEmail}
                        onChange={(e) =>
                          handleInputChange(
                            "general",
                            "contactEmail",
                            e.target.value
                          )
                        }
                        placeholder="Enter contact email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site Description
                    </label>
                    <textarea
                      value={settings.general.siteDescription}
                      onChange={(e) =>
                        handleInputChange(
                          "general",
                          "siteDescription",
                          e.target.value
                        )
                      }
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter site description"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Support Phone
                      </label>
                      <Input
                        type="tel"
                        value={settings.general.supportPhone}
                        onChange={(e) =>
                          handleInputChange(
                            "general",
                            "supportPhone",
                            e.target.value
                          )
                        }
                        placeholder="Enter support phone"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={settings.general.timezone}
                        onChange={(e) =>
                          handleInputChange(
                            "general",
                            "timezone",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                        <option value="Asia/Makassar">
                          Asia/Makassar (WITA)
                        </option>
                        <option value="Asia/Jayapura">
                          Asia/Jayapura (WIT)
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Booking Settings */}
              {activeSection === "booking" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Advance Booking (Days)
                      </label>
                      <Input
                        type="number"
                        value={settings.booking.maxAdvanceBookingDays.toString()}
                        onChange={(e) =>
                          handleInputChange(
                            "booking",
                            "maxAdvanceBookingDays",
                            parseInt(e.target.value)
                          )
                        }
                        min="1"
                        max="365"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cancellation Deadline (Hours)
                      </label>
                      <Input
                        type="number"
                        value={settings.booking.cancellationDeadlineHours.toString()}
                        onChange={(e) =>
                          handleInputChange(
                            "booking",
                            "cancellationDeadlineHours",
                            parseInt(e.target.value)
                          )
                        }
                        min="1"
                        max="168"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Player Fee (Rp)
                      </label>
                      <Input
                        type="number"
                        value={settings.booking.defaultPlayerFee.toString()}
                        onChange={(e) =>
                          handleInputChange(
                            "booking",
                            "defaultPlayerFee",
                            parseInt(e.target.value)
                          )
                        }
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default GK Fee (Rp)
                      </label>
                      <Input
                        type="number"
                        value={settings.booking.defaultGkFee.toString()}
                        onChange={(e) =>
                          handleInputChange(
                            "booking",
                            "defaultGkFee",
                            parseInt(e.target.value)
                          )
                        }
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Auto Confirm Bookings
                        </h4>
                        <p className="text-sm text-gray-600">
                          Automatically confirm bookings without manual review
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.booking.autoConfirmBookings}
                          onChange={(e) =>
                            handleInputChange(
                              "booking",
                              "autoConfirmBookings",
                              e.target.checked
                            )
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Require Payment Upfront
                        </h4>
                        <p className="text-sm text-gray-600">
                          Require payment before confirming bookings
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.booking.requirePaymentUpfront}
                          onChange={(e) =>
                            handleInputChange(
                              "booking",
                              "requirePaymentUpfront",
                              e.target.checked
                            )
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeSection === "notifications" && (
                <div className="space-y-4">
                  {Object.entries(settings.notifications).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium text-gray-900 capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {getNotificationDescription(key)}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) =>
                              handleInputChange(
                                "notifications",
                                key,
                                e.target.checked
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Security Settings */}
              {activeSection === "security" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Session Timeout (Minutes)
                      </label>
                      <Input
                        type="number"
                        value={settings.security.sessionTimeoutMinutes.toString()}
                        onChange={(e) =>
                          handleInputChange(
                            "security",
                            "sessionTimeoutMinutes",
                            parseInt(e.target.value)
                          )
                        }
                        min="15"
                        max="480"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Login Attempts
                      </label>
                      <Input
                        type="number"
                        value={settings.security.maxLoginAttempts.toString()}
                        onChange={(e) =>
                          handleInputChange(
                            "security",
                            "maxLoginAttempts",
                            parseInt(e.target.value)
                          )
                        }
                        min="3"
                        max="10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Password Length
                    </label>
                    <Input
                      type="number"
                      value={settings.security.passwordMinLength.toString()}
                      onChange={(e) =>
                        handleInputChange(
                          "security",
                          "passwordMinLength",
                          parseInt(e.target.value)
                        )
                      }
                      min="6"
                      max="20"
                    />
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        key: "requireEmailVerification",
                        label: "Require Email Verification",
                        description:
                          "Users must verify their email before accessing the platform",
                      },
                      {
                        key: "enableTwoFactorAuth",
                        label: "Enable Two-Factor Authentication",
                        description: "Add an extra layer of security with 2FA",
                      },
                      {
                        key: "requireStrongPasswords",
                        label: "Require Strong Passwords",
                        description: "Enforce complex password requirements",
                      },
                    ].map((setting) => (
                      <div
                        key={setting.key}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {setting.label}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {setting.description}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={
                              settings.security[
                                setting.key as keyof typeof settings.security
                              ] as boolean
                            }
                            onChange={(e) =>
                              handleInputChange(
                                "security",
                                setting.key,
                                e.target.checked
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appearance Settings */}
              {activeSection === "appearance" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Color
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={settings.appearance.primaryColor}
                          onChange={(e) =>
                            handleInputChange(
                              "appearance",
                              "primaryColor",
                              e.target.value
                            )
                          }
                          className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={settings.appearance.primaryColor}
                          onChange={(e) =>
                            handleInputChange(
                              "appearance",
                              "primaryColor",
                              e.target.value
                            )
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secondary Color
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={settings.appearance.secondaryColor}
                          onChange={(e) =>
                            handleInputChange(
                              "appearance",
                              "secondaryColor",
                              e.target.value
                            )
                          }
                          className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={settings.appearance.secondaryColor}
                          onChange={(e) =>
                            handleInputChange(
                              "appearance",
                              "secondaryColor",
                              e.target.value
                            )
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        key: "darkMode",
                        label: "Dark Mode",
                        description: "Enable dark theme for the interface",
                      },
                      {
                        key: "compactMode",
                        label: "Compact Mode",
                        description:
                          "Use a more compact layout to show more content",
                      },
                      {
                        key: "showAnimations",
                        label: "Show Animations",
                        description: "Enable smooth animations and transitions",
                      },
                    ].map((setting) => (
                      <div
                        key={setting.key}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {setting.label}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {setting.description}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={
                              settings.appearance[
                                setting.key as keyof typeof settings.appearance
                              ] as boolean
                            }
                            onChange={(e) =>
                              handleInputChange(
                                "appearance",
                                setting.key,
                                e.target.checked
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Color Preview */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Color Preview
                    </h4>
                    <div className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-8 h-8 rounded-lg border border-gray-300"
                          style={{
                            backgroundColor: settings.appearance.primaryColor,
                          }}
                        ></div>
                        <span className="text-sm text-gray-600">Primary</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-8 h-8 rounded-lg border border-gray-300"
                          style={{
                            backgroundColor: settings.appearance.secondaryColor,
                          }}
                        ></div>
                        <span className="text-sm text-gray-600">Secondary</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper function for notification descriptions
function getNotificationDescription(key: string): string {
  const descriptions: Record<string, string> = {
    emailNotifications: "Send notifications via email",
    smsNotifications: "Send notifications via SMS",
    bookingReminders: "Remind users about upcoming bookings",
    paymentReminders: "Send payment due reminders",
    promotionalEmails: "Send promotional and marketing emails",
    systemAlerts: "Send system maintenance and update alerts",
  };
  return descriptions[key] || "Configure notification preferences";
}
