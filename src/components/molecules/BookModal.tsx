"use client";
import React, { useState, useEffect } from "react";
import { X, Calendar, MapPin, Users, Clock } from "lucide-react";
import Button from "../atoms/Button";
import ConfirmationModal from "../molecules/ConfirmationModal";
import { Schedule } from "@/types/schedule";
import { formatCurrency } from "@/lib/helper";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService } from "@/utils/booking";
import { useNotifications } from "../organisms/NotificationContainer";

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule | null;
  scheduleId: string | null;
}

export default function BookModal({
  isOpen,
  onClose,
  schedule,
  scheduleId,
}: BookModalProps) {
  const [bookingType, setBookingType] = useState("individual");
  const [playerCount, setPlayerCount] = useState(1);
  const [selectedFeeType, setSelectedFeeType] = useState("player");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    teamName: "",
    teamSize:
      schedule?.typeMatch === "MINI-SOCCER"
        ? 7
        : schedule?.typeMatch === "FUTSAL"
        ? 5
        : 11,
  });

  const { user, loading } = useAuth();
  const { showSuccess, showError } = useNotifications();

  // Auto-fill form data when user is available
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePlayerCountChange = (value: number) => {
    if (value >= 1 && value <= 8) {
      setPlayerCount(value);
    }
  };

  const handleBookingTypeChange = (type: string) => {
    setBookingType(type);
    if (type === "team") {
      setPlayerCount(11);
    } else {
      setPlayerCount(1);
    }
  };

  const handleFeeTypeChange = (feeType: "player" | "gk") => {
    setSelectedFeeType(feeType);
  };

  const calculateTotal = () => {
    if (!schedule) return 0;

    if (bookingType === "team") {
      return (
        (formData.teamSize - 1) * Number(schedule.feePlayer) +
        Number(schedule.feeGk)
      );
    } else {
      const selectedFee =
        selectedFeeType === "player" ? schedule.feePlayer : schedule.feeGk;
      return 1 * Number(selectedFee); // Individual is always 1 person
    }
  };

  // Function to create the booking payload
  const createBookingPayload = () => {
    const payload = {
      scheduleId: String(scheduleId),
      bookingType: bookingType.toUpperCase(),
      isGuest: user ? false : true,
      name: user ? user.name : formData.name,
      email: user ? user.email : formData.email,
      phoneNumber: user ? user.phone : formData.phone,
      isPlayer: selectedFeeType === "player" || bookingType === "team",
      isGk: selectedFeeType === "gk" || bookingType === "team",
    };

    return payload;
  };

  // Validate form before showing confirmation
  const validateForm = () => {
    const nameToValidate = user ? user.name : formData.name;
    const phoneToValidate = user ? user.phone : formData.phone;

    if (!nameToValidate?.trim()) {
      showError("Nama harus diisi");
      return false;
    }

    if (!phoneToValidate?.trim()) {
      showError("Nomor HP harus diisi");
      return false;
    }

    if (!scheduleId) {
      showError("Schedule ID tidak tersedia");
      return false;
    }

    return true;
  };

  // Handle showing confirmation modal
  const handleShowConfirmation = () => {
    if (validateForm()) {
      setShowConfirmation(true);
    }
  };

  // Handle actual booking confirmation
  const handleBookingConfirmation = async () => {
    setIsBookingLoading(true);

    try {
      const payload = createBookingPayload();
      console.log("payload", payload);

      const response = await bookingService.bookSlot(payload);

      // Extract payment ID from response
      if (response) {
        setPaymentId(response);
        // Close confirmation modal first
        setShowConfirmation(false);
        // Redirect to payment page instead of showing modal
        setTimeout(() => {
          window.location.href = `/payment/${response}`;
        }, 100);
        showSuccess("Booking berhasil! Silakan lakukan pembayaran.");
      } else {
        // Fallback jika tidak ada paymentId
        setShowConfirmation(false);
        onClose();
        showSuccess("Booking berhasil dikonfirmasi!");
      }
    } catch (error) {
      console.error("Booking error:", error);
      setError("Terjadi kesalahan saat booking. Silakan coba lagi.");
      showError(
        "Booking Error",
        "Terjadi kesalahan saat booking. Silakan coba lagi."
      );
    } finally {
      setIsBookingLoading(false);
    }
  };

  // Handle closing payment review
  const handleClosePayment = () => {
    // This function is no longer needed since we redirect to payment page
    onClose();
  };

  // Generate confirmation message
  const getConfirmationMessage = () => {
    if (!schedule) return "";

    const total = formatCurrency(calculateTotal());
    const bookingTypeText = bookingType === "individual" ? "Individual" : "Tim";
    const playerText =
      bookingType === "individual"
        ? `1 ${selectedFeeType === "player" ? "Pemain" : "GK"}`
        : `${formData.teamName} (${formData.teamSize} pemain)`;

    return (
      `Anda akan melakukan booking ${bookingTypeText} untuk:\n\n` +
      `📅 ${schedule.name}\n` +
      `📍 ${schedule.venue}\n` +
      `🕒 ${formatDate(schedule.date)} • ${schedule.time} WIB\n` +
      `👥 ${playerText}\n` +
      `💰 Total: ${total}\n\n` +
      `Apakah Anda yakin ingin melanjutkan?`
    );
  };

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !showConfirmation && !showPayment) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, showConfirmation, showPayment]);

  if (!isOpen || !schedule) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl transform transition-all">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Booking Pertandingan
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Schedule Info */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {schedule.name}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-green-500" />
                    {schedule.venue}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2 text-green-500" />
                    {formatDate(schedule.date)} • {schedule.time} WIB
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2 text-green-500" />
                    {schedule.openSlots}/{schedule.totalSlots} slots tersedia
                  </div>
                </div>

                {/* Fee Selection - Hanya tampil untuk individual booking */}
                {bookingType === "individual" ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Pilih Jenis Pemain:
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFeeTypeChange("player")}
                        className={`flex-1 text-center p-3 rounded-lg border transition-all ${
                          selectedFeeType === "player"
                            ? "bg-green-100 border-green-500 ring-2 ring-green-200"
                            : "bg-white border-green-200 hover:bg-green-50"
                        }`}
                      >
                        <p
                          className={`text-lg font-bold ${
                            selectedFeeType === "player"
                              ? "text-green-700"
                              : "text-green-600"
                          }`}
                        >
                          {formatCurrency(Number(schedule.feePlayer))}
                        </p>
                        <p className="text-xs text-gray-500">Player Fee</p>
                      </button>
                      <button
                        onClick={() => handleFeeTypeChange("gk")}
                        className={`flex-1 text-center p-3 rounded-lg border transition-all ${
                          selectedFeeType === "gk"
                            ? "bg-blue-100 border-blue-500 ring-2 ring-blue-200"
                            : "bg-white border-blue-200 hover:bg-blue-50"
                        }`}
                      >
                        <p
                          className={`text-lg font-bold ${
                            selectedFeeType === "gk"
                              ? "text-blue-700"
                              : "text-blue-600"
                          }`}
                        >
                          {formatCurrency(Number(schedule.feeGk))}
                        </p>
                        <p className="text-xs text-gray-500">GK Fee</p>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <div className="flex-1 text-center bg-white p-3 rounded-lg border border-green-200">
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(Number(schedule.feePlayer))}
                      </p>
                      <p className="text-xs text-gray-500">Player Fee</p>
                    </div>
                    <div className="flex-1 text-center bg-white p-3 rounded-lg border border-blue-200">
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(Number(schedule.feeGk))}
                      </p>
                      <p className="text-xs text-gray-500">GK Fee</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Booking Type Tabs */}
              <div>
                <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                  <button
                    onClick={() => handleBookingTypeChange("individual")}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                      bookingType === "individual"
                        ? "bg-white text-green-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Individual
                  </button>
                  <button
                    onClick={() => handleBookingTypeChange("team")}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                      bookingType === "team"
                        ? "bg-white text-green-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Tim
                  </button>
                </div>

                {/* Individual Form */}
                {bookingType === "individual" && (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="playerName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Nama Pemain
                      </label>
                      <input
                        id="playerName"
                        type="text"
                        placeholder="Masukkan nama pemain"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        disabled={!!user} // Disable if user exists
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          user
                            ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                            : "border-gray-300"
                        }`}
                      />
                      {user && (
                        <p className="text-xs text-gray-500 mt-1">
                          Data diambil dari profil akun Anda
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        placeholder="Masukkan email anda"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        disabled={!!user} // Disable if user exists
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          user
                            ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                            : "border-gray-300"
                        }`}
                      />
                      {user && (
                        <p className="text-xs text-gray-500 mt-1">
                          Data diambil dari profil akun Anda
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Nomor HP
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        placeholder="08xxxxxxxxxx"
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        disabled={!!user} // Disable if user exists
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          user
                            ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                            : "border-gray-300"
                        }`}
                      />
                      {user && (
                        <p className="text-xs text-gray-500 mt-1">
                          Data diambil dari profil akun Anda
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Team Form */}
                {bookingType === "team" && (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        PIC Tim
                      </label>
                      <input
                        id="name"
                        type="text"
                        placeholder="Masukkan nama PIC"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        disabled={!!user} // Disable if user exists
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          user
                            ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                            : "border-gray-300"
                        }`}
                      />
                      {user && (
                        <p className="text-xs text-gray-500 mt-1">
                          Data diambil dari profil akun Anda
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Email PIC Tim
                      </label>
                      <input
                        id="email"
                        type="email"
                        placeholder="Masukkan email PIC"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        disabled={!!user} // Disable if user exists
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          user
                            ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                            : "border-gray-300"
                        }`}
                      />
                      {user && (
                        <p className="text-xs text-gray-500 mt-1">
                          Data diambil dari profil akun Anda
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="captainPhone"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        PIC HP
                      </label>
                      <input
                        id="captainPhone"
                        type="tel"
                        placeholder="08xxxxxxxxxx"
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        disabled={!!user} // Disable if user exists
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          user
                            ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                            : "border-gray-300"
                        }`}
                      />
                      {user && (
                        <p className="text-xs text-gray-500 mt-1">
                          Data diambil dari profil akun Anda
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Total Payment */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <h4 className="font-semibold mb-3 text-gray-900">
                  Total Pembayaran
                </h4>
                <div className="space-y-2">
                  {bookingType === "team" ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          {formData.teamSize - 1} Pemain x{" "}
                          {formatCurrency(Number(schedule.feePlayer))}
                        </span>
                        <span className="text-gray-800">
                          {formatCurrency(
                            (formData.teamSize - 1) * Number(schedule.feePlayer)
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          1 GK x {formatCurrency(Number(schedule.feeGk))}
                        </span>
                        <span className="text-gray-800">
                          {formatCurrency(Number(schedule.feeGk))}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        1 {selectedFeeType === "player" ? "Pemain" : "GK"} x{" "}
                        {formatCurrency(
                          Number(
                            selectedFeeType === "player"
                              ? schedule.feePlayer
                              : schedule.feeGk
                          )
                        )}
                      </span>
                      <span className="text-gray-800">
                        {formatCurrency(calculateTotal())}
                      </span>
                    </div>
                  )}

                  <hr className="border-gray-200" />

                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <Button
                variant="outline"
                className="flex-1 py-3"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 py-3"
                onClick={handleShowConfirmation}
              >
                Konfirmasi Booking
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleBookingConfirmation}
        title="Konfirmasi Booking"
        message={getConfirmationMessage()}
        type="info"
        confirmText="Ya, Lanjutkan"
        cancelText="Batal"
        isLoading={isBookingLoading}
      />
    </>
  );
}
