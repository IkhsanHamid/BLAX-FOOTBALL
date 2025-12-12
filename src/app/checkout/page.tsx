"use client";
import { motion } from "motion/react";
import { MapPin, Clock, User, Mail, Phone, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useSchedule } from "@/contexts/ScheduleContext";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/organisms/Navbar";
import { useNotifications } from "@/components/organisms/NotificationContainer";
import { formatMatchDate } from "@/lib/helper";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService } from "@/utils/booking";
import PaymentComponent from "@/components/organisms/Payment";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const [bookingType, setBookingType] = useState<"individual" | "team">(
    "individual"
  );
  const [selectedRole, setSelectedRole] = useState<
    "goalkeeper" | "player" | null
  >(null);
  const { showSuccess, showError } = useNotifications();

  // Individual Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // Team Form
  const [picName, setPicName] = useState("");
  const [picEmail, setPicEmail] = useState("");
  const [players, setPlayers] = useState(
    Array.from({ length: 11 }, () => ({ name: "", phone: "" }))
  );

  const { selectedSchedule } = useSchedule();
  const { user } = useAuth();
  const router = useRouter();
  const [isBookingLoading, setIsBookingLoading] = useState(false);

  // State untuk payment component
  const [showPayment, setShowPayment] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  // Auto-fill form data when user is available
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setWhatsapp(user.phone || "");
    }
  }, [user]);

  useEffect(() => {
    const paymentIdFromQuery = searchParams.get("paymentId");
    if (paymentIdFromQuery) {
      setPaymentId(paymentIdFromQuery);
      setShowPayment(true);
    }
  }, [searchParams]);

  const handlePlayerChange = (
    index: number,
    field: "name" | "phone",
    value: string
  ) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], [field]: value };
    setPlayers(newPlayers);
  };

  const getPrice = () => {
    if (!selectedSchedule) return 0;
    if (bookingType === "individual") {
      return selectedRole === "goalkeeper"
        ? selectedSchedule?.feeGk
        : selectedSchedule?.feePlayer;
    }
    return Number(selectedSchedule?.feePlayer) * 10;
  };

  // Create booking payload
  const createBookingPayload = () => {
    return {
      scheduleId: String(selectedSchedule?.id),
      bookingType: bookingType.toUpperCase(),
      isGuest: !user,
      name: user ? user.name : name,
      email: user ? user.email : email,
      phoneNumber: user ? user.phone : whatsapp,
      isPlayer: selectedRole === "player" || bookingType === "team",
      isGk: selectedRole === "goalkeeper" || bookingType === "team",
    };
  };

  // Handle back from payment component
  const handleBackFromPayment = () => {
    setShowPayment(false);
    setPaymentId(null);
  };

  // Validate and handle booking confirmation
  const handleBookingConfirmation = async () => {
    // Validation
    if (bookingType === "individual") {
      if (!name.trim() || !email.trim() || !whatsapp.trim()) {
        showError("Please fill all fields");
        return;
      }
      if (!selectedRole) {
        showError("Please select a role");
        return;
      }
    } else {
      if (!picName.trim() || !picEmail.trim() || !whatsapp.trim()) {
        showError("Please fill PIC details");
        return;
      }
      const hasEmptyFields = players.some(
        (player) => !player.name.trim() || !player.phone.trim()
      );
      if (hasEmptyFields) {
        showError("Please fill all player details");
        return;
      }
    }

    setIsBookingLoading(true);

    try {
      const payload = createBookingPayload();
      const response = await bookingService.bookSlot(payload);

      if (response) {
        showSuccess("Booking berhasil! Silakan lakukan pembayaran.");
        // Set payment ID and show payment component
        setPaymentId(response);
        setShowPayment(true);
      } else {
        showSuccess("Booking berhasil dikonfirmasi!");
        setTimeout(() => {
          router.push("/gallery");
        }, 1500);
      }
    } catch (error) {
      console.error("Booking error:", error);
      showError("Terjadi kesalahan saat booking. Silakan coba lagi.");
    } finally {
      setIsBookingLoading(false);
    }
  };

  // Jika showPayment true, tampilkan PaymentComponent
  if (showPayment && paymentId) {
    return (
      <PaymentComponent paymentId={paymentId} onBack={handleBackFromPayment} />
    );
  }

  if (!selectedSchedule) {
    return (
      <div className="min-h-screen flex items-center justify-center py-24 px-4 bg-gradient-to-br from-blue-50 to-white">
        <Navbar
          currentPage={""}
          navigateTo={function (page: string): void {
            throw new Error("Function not implemented.");
          }}
        />
        <div className="text-center">
          <h2 className="mb-4 text-blue-600">No found payment</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/schedule")}
            className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md"
          >
            Browse Matches
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-24 px-4 bg-gradient-to-br from-blue-50 to-white">
      <Navbar
        currentPage={""}
        navigateTo={function (page: string): void {
          throw new Error("Function not implemented.");
        }}
      />
      <div className="max-w-6xl mx-auto mt-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-blue-600 mb-4">
            Selesaikan Booking Anda
          </h1>
          <p className="text-gray-700 text-sm md:text-base">
            Hanya beberapa langkah lagi untuk menyelesaikan proses booking Anda.
          </p>
          <p className="text-gray-700 text-sm md:text-base mt-1">
            Data yang Anda masukkan akan kami jaga kerahasiaannya.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Type Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-2 bg-white border border-blue-200 rounded-3xl flex gap-2 shadow-lg"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setBookingType("individual")}
                className={`flex-1 px-6 py-4 rounded-2xl transition-all ${
                  bookingType === "individual"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                Individual
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setBookingType("team")}
                className={`flex-1 px-6 py-4 rounded-2xl transition-all ${
                  bookingType === "team"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                Team
              </motion.button>
            </motion.div>

            {/* Individual Form */}
            {bookingType === "individual" && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="p-8 bg-white border border-blue-200 rounded-3xl space-y-6 shadow-xl"
              >
                <h3 className="text-blue-600">Personal Information</h3>

                <div>
                  <label className="block text-gray-600 mb-2">
                    Name lengkap
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      disabled={!!user}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className={`w-full pl-12 pr-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900 ${
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

                <div>
                  <label className="block text-gray-600 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      disabled={!!user}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className={`w-full pl-12 pr-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900 ${
                        user
                          ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                          : "border-gray-300"
                      } `}
                    />
                    {user && (
                      <p className="text-xs text-gray-500 mt-1">
                        Data diambil dari profil akun Anda
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 mb-2">
                    WhatsApp Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={whatsapp}
                      disabled={!!user}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="0812 3456 7890"
                      className={`w-full pl-12 pr-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900 ${
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

                <div>
                  <h3 className="mb-4 text-blue-600">Select Your Role</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedRole("goalkeeper")}
                      className={`p-6 border-2 rounded-2xl cursor-pointer transition-all ${
                        selectedRole === "goalkeeper"
                          ? "border-blue-600 bg-blue-50 shadow-lg"
                          : "border-blue-200 hover:border-blue-300"
                      }`}
                    >
                      <Shield className="w-8 h-8 mb-3 text-blue-600" />
                      <h4 className="mb-2 text-blue-600">Goalkeeper</h4>
                      <div className="text-gray-600">
                        IDR {selectedSchedule?.feeGk}
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedRole("player")}
                      className={`p-6 border-2 rounded-2xl cursor-pointer transition-all ${
                        selectedRole === "player"
                          ? "border-blue-600 bg-blue-50 shadow-lg"
                          : "border-blue-200 hover:border-blue-300"
                      }`}
                    >
                      <User className="w-8 h-8 mb-3 text-blue-600" />
                      <h4 className="mb-2 text-blue-600">Player</h4>
                      <div className="text-gray-600">
                        IDR {selectedSchedule?.feePlayer}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Team Form */}
            {bookingType === "team" && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="p-8 bg-white border border-blue-200 rounded-3xl space-y-6 shadow-xl"
              >
                <h3 className="text-blue-600">Person in Charge (PIC)</h3>

                <div>
                  <label className="block text-gray-600 mb-2">PIC Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={picName}
                      onChange={(e) => setPicName(e.target.value)}
                      placeholder="Enter PIC name"
                      className="w-full pl-12 pr-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 mb-2">PIC Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={picEmail}
                      onChange={(e) => setPicEmail(e.target.value)}
                      placeholder="pic@email.com"
                      className="w-full pl-12 pr-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 mb-2">
                    PIC WhatsApp Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="0812 3456 7890"
                      className="w-full pl-12 pr-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900"
                    />
                  </div>
                </div>

                <h3 className="text-blue-600">Team Roster (11 Players)</h3>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {players.map((player, index) => (
                    <div key={index} className="p-4 bg-blue-50 rounded-2xl">
                      <div className="text-gray-600 mb-3">
                        Player {index + 1}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={player.name}
                          onChange={(e) =>
                            handlePlayerChange(index, "name", e.target.value)
                          }
                          placeholder="Name"
                          className="px-4 py-2 bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900"
                        />
                        <input
                          type="tel"
                          value={player.phone}
                          onChange={(e) =>
                            handlePlayerChange(index, "phone", e.target.value)
                          }
                          placeholder="Phone Number"
                          className="px-4 py-2 bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:sticky lg:top-24 h-fit"
          >
            <div className="p-8 bg-white border border-blue-200 rounded-3xl space-y-6 shadow-xl">
              <h3 className="text-blue-600">Order Summary</h3>

              <div className="space-y-4 pb-6 border-b border-blue-200">
                <div>
                  <div className="text-gray-600 mb-1">Match Details</div>
                </div>

                <div className="flex items-start gap-3 text-gray-600">
                  <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-blue-600" />
                  <span>{selectedSchedule?.venue}</span>
                </div>

                <div className="flex items-start gap-3 text-gray-600">
                  <Clock className="w-4 h-4 mt-1 flex-shrink-0 text-blue-600" />
                  <span>
                    {formatMatchDate(selectedSchedule?.date)} • PKL{" "}
                    {selectedSchedule?.time}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Booking Type</span>
                  <span className="capitalize text-gray-900">
                    {bookingType}
                  </span>
                </div>

                {bookingType === "individual" && selectedRole && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Role</span>
                    <span className="capitalize text-gray-900">
                      {selectedRole}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-blue-200">
                  <span className="text-gray-900">Total</span>
                  <div className="text-gray-900">
                    IDR{" "}
                    {selectedRole || bookingType === "team"
                      ? getPrice().toLocaleString("id-ID")
                      : "-"}
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBookingConfirmation}
                disabled={isBookingLoading}
                className={`w-full px-6 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md ${
                  isBookingLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isBookingLoading ? "Processing..." : "Proceed to Pay"}
              </motion.button>

              <p className="text-gray-500 text-center">
                Secure payment via QRIS
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
