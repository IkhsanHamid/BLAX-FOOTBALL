"use client";
import { motion } from "motion/react";
import {
  MapPin,
  Clock,
  User,
  Mail,
  Phone,
  Shield,
  Users,
  Tag,
  X,
  Shirt,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSchedule } from "@/contexts/ScheduleContext";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/organisms/Navbar";
import { useNotifications } from "@/components/organisms/NotificationContainer";
import { formatMatchDate } from "@/lib/helper";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService } from "@/utils/booking";
import PaymentComponent from "@/components/organisms/Payment";
import { QRISPaymentPage } from "@/components/organisms/QRISPayment";
import { voucherService } from "@/utils/voucher";

// Fungsi validasi input
const noSpace = (value: string) => value.replace(/\s+/g, "");
const onlyNumbers = (value: string) => value.replace(/\D/g, "");
const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone: string) =>
  /^[0-9]+$/.test(phone) && phone.length >= 10;
const validateName = (value: string) => value.trim().length > 0;
const JERSEY_SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"];

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const [bookingType, setBookingType] = useState<"individual" | "team">(
    "individual"
  );
  const [selectedRole, setSelectedRole] = useState<
    "goalkeeper" | "player" | null
  >(null);
  const { showSuccess, showError } = useNotifications();

  // Toggle untuk team roster
  const [includeRoster, setIncludeRoster] = useState(false);

  // Individual Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // Team Form
  const [picName, setPicName] = useState("");
  const [picEmail, setPicEmail] = useState("");

  // Voucher states
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    nominal: number;
    type: "PERCENTAGE" | "FIXED";
  } | null>(null);
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);
  const [jerseySize, setJerseySize] = useState("");
  const [picJerseySize, setPicJerseySize] = useState("");

  const { selectedSchedule } = useSchedule();
  const { user } = useAuth();
  const router = useRouter();
  const [isBookingLoading, setIsBookingLoading] = useState(false);

  // State untuk payment component
  const [showPayment, setShowPayment] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [isMember, setIsMember] = useState<boolean>(false);
  const [emailErrors, setEmailErrors] = useState<{ [key: number]: string }>({});
  const [phoneErrors, setPhoneErrors] = useState<{ [key: number]: string }>({});

  // Dynamic roster size based on match type
  const getRosterSize = () => {
    if (!selectedSchedule) return 10;
    return selectedSchedule.typeMatch === "MINI-SOCCER" ? 6 : 10;
  };

  const [players, setPlayers] = useState(
    Array.from({ length: getRosterSize() }, () => ({
      name: "",
      phone: "",
      email: "",
      jerseySize: "",
    }))
  );

  // Auto-fill form data when user is available
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPicName(user.name || "");
      setPicEmail(user.email || "");
      setEmail(user.email || "");
      setWhatsapp(user.phone || "");
      if (user.isMember) setIsMember(true);
    }
  }, [user]);

  useEffect(() => {
    const paymentIdFromQuery = searchParams.get("paymentId");
    if (paymentIdFromQuery) {
      setPaymentId(paymentIdFromQuery);
      setShowPayment(true);
    }
  }, [searchParams]);

  // Update roster size when schedule changes
  useEffect(() => {
    if (selectedSchedule) {
      const rosterSize = getRosterSize();
      setPlayers(
        Array.from({ length: rosterSize }, () => ({
          name: "",
          phone: "",
          email: "",
          jerseySize: "",
        }))
      );

      // Reset to individual if PADEL
      if (selectedSchedule.typeMatch === "PADEL") {
        setBookingType("individual");
      }
    }
  }, [selectedSchedule]);

  // Check if form is valid and can proceed
  const isFormValid = () => {
    if (bookingType === "individual") {
      return (
        validateName(name) &&
        validateEmail(email) &&
        validatePhone(whatsapp) &&
        selectedRole !== null &&
        jerseySize !== ""
      );
    } else {
      // Team booking
      const isPicValid =
        validateName(picName) &&
        validateEmail(picEmail) &&
        validatePhone(whatsapp) &&
        picJerseySize !== "";

      if (!includeRoster) {
        return isPicValid;
      }

      // Check roster validity
      const hasEmailErrors = Object.keys(emailErrors).length > 0;
      const hasPhoneErrors = Object.keys(phoneErrors).length > 0;

      if (hasEmailErrors || hasPhoneErrors) {
        return false;
      }

      // Check all players have complete data
      const allPlayersComplete = players.every(
        (p) =>
          validateName(p.name) &&
          validatePhone(p.phone) &&
          validateEmail(p.email) &&
          p.jerseySize !== ""
      );

      return isPicValid && allPlayersComplete;
    }
  };

  const handlePlayerChange = (
    index: number,
    field: "name" | "phone" | "email" | "jerseySize",
    value: string
  ) => {
    const updated = [...players];
    if (field === "name") {
      updated[index][field] = noSpace(value);
    } else if (field === "phone") {
      updated[index][field] = onlyNumbers(value);

      // Validasi phone duplikat
      const duplicateIndex = updated.findIndex(
        (p, i) => i !== index && p.phone && p.phone === onlyNumbers(value)
      );

      const newErrors = { ...phoneErrors };

      if (duplicateIndex !== -1 && onlyNumbers(value)) {
        newErrors[index] = `Nomor sama dengan Player ${duplicateIndex + 1}`;
        newErrors[duplicateIndex] = `Nomor sama dengan Player ${index + 1}`;
      } else {
        delete newErrors[index];
        // Clear error dari player lain jika tidak ada duplikat lagi
        Object.keys(newErrors).forEach((key) => {
          const keyIndex = parseInt(key);
          if (keyIndex !== index) {
            const hasDuplicate = updated.some(
              (p, i) =>
                i !== keyIndex && p.phone && p.phone === updated[keyIndex].phone
            );
            if (!hasDuplicate) {
              delete newErrors[keyIndex];
            }
          }
        });
      }

      setPhoneErrors(newErrors);
    } else if (field === "email") {
      updated[index][field] = noSpace(value);

      // Validasi email duplikat
      const duplicateIndex = updated.findIndex(
        (p, i) => i !== index && p.email && p.email === noSpace(value)
      );

      const newErrors = { ...emailErrors };

      if (duplicateIndex !== -1 && noSpace(value)) {
        newErrors[index] = `Email sama dengan Player ${duplicateIndex + 1}`;
        newErrors[duplicateIndex] = `Email sama dengan Player ${index + 1}`;
      } else {
        delete newErrors[index];
        // Clear error dari player lain jika tidak ada duplikat lagi
        Object.keys(newErrors).forEach((key) => {
          const keyIndex = parseInt(key);
          if (keyIndex !== index) {
            const hasDuplicate = updated.some(
              (p, i) =>
                i !== keyIndex && p.email && p.email === updated[keyIndex].email
            );
            if (!hasDuplicate) {
              delete newErrors[keyIndex];
            }
          }
        });
      }

      setEmailErrors(newErrors);
    } else if (field === "jerseySize") {
      updated[index][field] = value;
    }
    setPlayers(updated);
  };

  const getPrice = () => {
    if (!selectedSchedule) return 0;
    if (bookingType === "individual") {
      return selectedRole === "goalkeeper"
        ? selectedSchedule?.feeGk
        : selectedSchedule?.feePlayer;
    }
    return Number(selectedSchedule?.feePlayer) * getRosterSize();
  };

  // Handle apply voucher
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      showError("Masukkan kode voucher");
      return;
    }

    setIsCheckingVoucher(true);
    try {
      const response = await voucherService.validateVoucher(voucherCode);

      if (response.status) {
        setAppliedVoucher({
          code: voucherCode.toUpperCase(),
          ...response.data,
        });
        showSuccess("Voucher berhasil diterapkan!");
      } else {
        showError("Kode voucher tidak valid");
      }
    } catch (error) {
      showError("Gagal memvalidasi voucher");
    } finally {
      setIsCheckingVoucher(false);
    }
  };

  // Handle remove voucher
  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode("");
    showSuccess("Voucher dihapus");
  };

  // Calculate discounts and total
  const calculatePricing = () => {
    const basePrice = getPrice();
    const adminFee = isMember ? 0 : 1000;

    // Member discount 10%
    const memberDiscount = isMember ? Number(basePrice) * 0.1 : 0;

    // Voucher discount
    let voucherDiscount = 0;
    if (appliedVoucher) {
      if (appliedVoucher.type === "PERCENTAGE") {
        voucherDiscount = Number(basePrice) * (appliedVoucher.nominal / 100);
      } else {
        voucherDiscount = appliedVoucher.nominal;
      }
    }

    const subtotal = Number(basePrice) - memberDiscount;
    const total = Math.max(0, subtotal - voucherDiscount + adminFee);

    return {
      basePrice,
      adminFee,
      memberDiscount,
      voucherDiscount,
      subtotal,
      total,
    };
  };

  // Create booking payload
  const createBookingPayload = () => {
    const pricing = calculatePricing();

    const basePayload = {
      scheduleId: String(selectedSchedule?.id),
      bookingType: bookingType.toUpperCase(),
      isGuest: !user,
      name: user ? user.name : bookingType === "team" ? picName : name,
      email: user ? user.email : bookingType === "team" ? picEmail : email,
      phoneNumber: user ? user.phone : whatsapp,
      isPlayer: selectedRole === "player" || bookingType === "team",
      isGk: selectedRole === "goalkeeper" || bookingType === "team",
      isTeam: bookingType === "team" && includeRoster,
      voucherCode: appliedVoucher?.code || undefined,
      jerseySize: jerseySize || picJerseySize,
    };

    // Tambahkan teamRoster jika isTeam true
    if (basePayload.isTeam) {
      return {
        ...basePayload,
        teamRoster: players.map((player) => ({
          name: player.name,
          phone: player.phone,
          email: player.email,
          jerseySize: player.jerseySize,
        })),
      };
    }

    console.log("basePayload", basePayload);

    return basePayload;
  };

  // Handle back from payment component
  const handleBackFromPayment = () => {
    setShowPayment(false);
    setPaymentId(null);
  };

  // Validate and handle booking confirmation
  const handleBookingConfirmation = async () => {
    if (bookingType === "individual") {
      if (!validateName(name)) return showError("Nama wajib diisi");
      if (!validateEmail(email)) return showError("Email tidak valid");
      if (!validatePhone(whatsapp)) return showError("WhatsApp tidak valid");
      if (!selectedRole) return showError("Pilih role");
      if (!jerseySize) return showError("Ukuran jersey wajib dipilih");
    } else {
      if (!validateName(picName)) return showError("PIC name wajib diisi");
      if (!validateEmail(picEmail)) return showError("PIC email tidak valid");
      if (!validatePhone(whatsapp))
        return showError("WhatsApp PIC tidak valid");

      if (includeRoster) {
        // Cek error email duplikat
        if (Object.keys(emailErrors).length > 0) {
          return showError("Terdapat email yang sama di team roster");
        }

        // Cek error phone duplikat
        if (Object.keys(phoneErrors).length > 0) {
          return showError("Terdapat nomor phone yang sama di team roster");
        }

        for (let i = 0; i < players.length; i++) {
          const p = players[i];
          if (!validateName(p.name))
            return showError(`Nama Player ${i + 1} wajib diisi`);
          if (!validatePhone(p.phone))
            return showError(`Phone Player ${i + 1} tidak valid`);
          if (!validateEmail(p.email))
            return showError(`Email Player ${i + 1} tidak valid`);
          if (!p.jerseySize)
            return showError(`Ukuran jersey Player ${i + 1} wajib dipilih`);
        }
      }
    }

    try {
      setIsBookingLoading(true);
      const payload = createBookingPayload();
      console.log("payload", payload);
      const res = await bookingService.bookSlot(payload);
      if (res) {
        setPaymentId(res);
        setShowPayment(true);
        showSuccess("Booking berhasil");
      }
    } catch (err) {
      console.error(err);
      showError("Gagal melakukan booking");
    } finally {
      setIsBookingLoading(false);
    }
  };

  console.log("selectedschedule", selectedSchedule);

  // Jika showPayment true, tampilkan PaymentComponent
  if (showPayment && paymentId) {
    return <QRISPaymentPage paymentId={paymentId} paymentType={"booking"} />;
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

  const pricing = calculatePricing();

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
            {/* Booking Type Toggle - Hide for PADEL */}
            {selectedSchedule?.typeMatch !== "PADEL" && (
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
                  whileHover={{
                    scale: !selectedSchedule?.canRegistTeam ? 1 : 1.02,
                  }}
                  whileTap={{
                    scale: !selectedSchedule?.canRegistTeam ? 1 : 0.98,
                  }}
                  onClick={() =>
                    selectedSchedule?.canRegistTeam && setBookingType("team")
                  }
                  disabled={!selectedSchedule?.canRegistTeam}
                  className={`flex-1 px-6 py-4 rounded-2xl transition-all relative ${
                    !selectedSchedule?.canRegistTeam
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : bookingType === "team"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:text-blue-600"
                  }`}
                >
                  Team
                  {!selectedSchedule?.canRegistTeam && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      FULL
                    </span>
                  )}
                </motion.button>
              </motion.div>
            )}

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
                    Nama lengkap
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      disabled={!!user}
                      onChange={(e) => setName(noSpace(e.target.value))}
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
                      type="text"
                      value={email}
                      disabled={!!user}
                      onChange={(e) => setEmail(noSpace(e.target.value))}
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
                      onChange={(e) => setWhatsapp(onlyNumbers(e.target.value))}
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
                  <label className="block text-gray-600 mb-2">
                    Ukuran Jersey <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Shirt className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={jerseySize}
                      onChange={(e) => setJerseySize(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900 appearance-none cursor-pointer"
                    >
                      <option value="">Pilih ukuran</option>
                      {JERSEY_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-blue-600">Select Your Role</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div
                      whileHover={{
                        scale:
                          selectedSchedule?.availableGkSlots === 0 ? 1 : 1.02,
                      }}
                      onClick={() =>
                        selectedSchedule?.availableGkSlots !== 0 &&
                        setSelectedRole("goalkeeper")
                      }
                      className={`p-6 border-2 rounded-2xl transition-all relative ${
                        selectedSchedule?.availableGkSlots === 0
                          ? "border-gray-300 bg-gray-100 cursor-not-allowed opacity-60"
                          : selectedRole === "goalkeeper"
                          ? "border-blue-600 bg-blue-50 shadow-lg cursor-pointer"
                          : "border-blue-200 hover:border-blue-300 cursor-pointer"
                      }`}
                    >
                      <Shield
                        className={`w-8 h-8 mb-3 ${
                          selectedSchedule?.availableGkSlots === 0
                            ? "text-gray-400"
                            : "text-blue-600"
                        }`}
                      />
                      <h4
                        className={`mb-2 ${
                          selectedSchedule?.availableGkSlots === 0
                            ? "text-gray-500"
                            : "text-blue-600"
                        }`}
                      >
                        Goalkeeper
                      </h4>
                      <div
                        className={
                          selectedSchedule?.availableGkSlots === 0
                            ? "text-gray-500"
                            : "text-gray-600"
                        }
                      >
                        IDR {selectedSchedule?.feeGk}
                      </div>
                      {selectedSchedule?.availableGkSlots === 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                          FULL
                        </span>
                      )}
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
                      disabled={!!user}
                      onChange={(e) => setPicName(noSpace(e.target.value))}
                      placeholder="Enter PIC name"
                      className={`w-full pl-12 pr-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900 ${
                        user
                          ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                          : "border-gray-300"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 mb-2">PIC Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={picEmail}
                      disabled={!!user}
                      onChange={(e) => setPicEmail(noSpace(e.target.value))}
                      placeholder="pic@email.com"
                      className={`w-full pl-12 pr-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900 ${
                        user
                          ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                          : "border-gray-300"
                      }`}
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
                      disabled={!!user}
                      onChange={(e) => setWhatsapp(onlyNumbers(e.target.value))}
                      placeholder="0812 3456 7890"
                      className={`w-full pl-12 pr-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900 ${
                        user
                          ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                          : "border-gray-300"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 mb-2">
                    Ukuran Jersey PIC <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Shirt className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={picJerseySize}
                      onChange={(e) => setPicJerseySize(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900 appearance-none cursor-pointer"
                    >
                      <option value="">Pilih ukuran</option>
                      {JERSEY_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Toggle untuk Team Roster */}
                <div className="pt-4 border-t border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-blue-600" />
                      <div>
                        <h4 className="text-blue-600 font-medium">
                          Include Team Roster
                        </h4>
                        <p className="text-sm text-gray-500">
                          Add {getRosterSize()} player details (optional)
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIncludeRoster(!includeRoster)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        includeRoster ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          includeRoster ? "translate-x-7" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Team Roster - Muncul jika toggle aktif */}
                {includeRoster && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3"
                  >
                    <h3 className="text-blue-600">
                      Team Roster ({getRosterSize()} Players)
                    </h3>
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
                                handlePlayerChange(
                                  index,
                                  "name",
                                  e.target.value
                                )
                              }
                              placeholder="Name"
                              className="px-4 py-2 bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900"
                            />
                            <input
                              type="tel"
                              value={player.phone}
                              onChange={(e) =>
                                handlePlayerChange(
                                  index,
                                  "phone",
                                  e.target.value
                                )
                              }
                              placeholder="Phone Number"
                              className={`px-4 py-2 bg-white border rounded-xl focus:outline-none transition-colors text-gray-900 ${
                                phoneErrors[index]
                                  ? "border-red-500 focus:border-red-500"
                                  : "border-blue-200 focus:border-blue-400"
                              }`}
                            />
                            {phoneErrors[index] && (
                              <p className="text-xs text-red-500 mt-1">
                                {phoneErrors[index]}
                              </p>
                            )}
                            <input
                              type="text"
                              value={player.email}
                              onChange={(e) =>
                                handlePlayerChange(
                                  index,
                                  "email",
                                  e.target.value
                                )
                              }
                              placeholder="Email"
                              className={`px-4 py-2 bg-white border rounded-xl focus:outline-none transition-colors text-gray-900 ${
                                emailErrors[index]
                                  ? "border-red-500 focus:border-red-500"
                                  : "border-blue-200 focus:border-blue-400"
                              }`}
                            />
                            {emailErrors[index] && (
                              <p className="text-xs text-red-500 mt-1 col-span-2">
                                {emailErrors[index]}
                              </p>
                            )}
                            <select
                              value={player.jerseySize}
                              onChange={(e) =>
                                handlePlayerChange(
                                  index,
                                  "jerseySize",
                                  e.target.value
                                )
                              }
                              className="px-4 py-2 bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900 appearance-none cursor-pointer"
                            >
                              <option value="">Jersey Size</option>
                              {JERSEY_SIZES.map((size) => (
                                <option key={size} value={size}>
                                  {size}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
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
            <div className="p-8 bg-white border border-blue-200 rounded-3xl space-y-6 shadow-xl overflow-hidden">
              <h3 className="text-blue-600">Order Summary</h3>

              {/* MATCH INFO */}
              <div className="space-y-4 pb-6 border-b border-blue-200">
                <div className="text-gray-600">Match Details</div>

                <div className="flex items-start gap-3 text-gray-600">
                  <MapPin className="w-4 h-4 mt-1 text-blue-600 flex-shrink-0" />
                  <span>{selectedSchedule?.venue}</span>
                </div>

                <div className="flex items-start gap-3 text-gray-600">
                  <Clock className="w-4 h-4 mt-1 text-blue-600 flex-shrink-0" />
                  <span>
                    {formatMatchDate(selectedSchedule?.date)} • PKL{" "}
                    {selectedSchedule?.time}
                  </span>
                </div>
              </div>

              {/* VOUCHER */}
              <div className="space-y-3 pb-6 border-b border-blue-200">
                <div className="flex items-center gap-2 text-gray-600">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Punya Kode Voucher?</span>
                </div>

                {!user ? (
                  <div className="space-y-3 opacity-50 pointer-events-none">
                    <input
                      disabled
                      placeholder="Masukkan kode"
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-sm"
                    />

                    <button
                      disabled
                      className="w-full px-6 py-3 bg-gray-400 text-white rounded-xl text-sm font-medium"
                    >
                      Terapkan
                    </button>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 pointer-events-auto opacity-100">
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">
                        !
                      </div>
                      <div>
                        <p className="text-amber-800 text-sm font-medium">
                          Login diperlukan
                        </p>
                        <p className="text-amber-700 text-xs">
                          Silakan login untuk menggunakan voucher
                        </p>
                      </div>
                    </div>
                  </div>
                ) : !appliedVoucher ? (
                  <div className="flex flex-col gap-2 w-full box-border">
                    <input
                      value={voucherCode}
                      onChange={(e) =>
                        setVoucherCode(e.target.value.toUpperCase())
                      }
                      placeholder="Masukkan kode"
                      className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
                    />

                    <motion.button
                      whileHover={{
                        boxShadow: "0 10px 25px rgba(37, 99, 235, 0.25)",
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleApplyVoucher}
                      disabled={isCheckingVoucher}
                      className="w-full box-border px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCheckingVoucher ? "Memvalidasi..." : "Apply"}
                    </motion.button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-green-600" />
                      <span className="text-green-700 font-medium text-sm">
                        {appliedVoucher.code}
                      </span>
                    </div>

                    <button
                      onClick={handleRemoveVoucher}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* PRICE */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking Type</span>
                  <span className="capitalize">{bookingType}</span>
                </div>

                <div className="flex justify-between">
                  <span>Harga Booking</span>
                  <span>
                    {selectedRole || bookingType === "team"
                      ? `IDR ${pricing.basePrice.toLocaleString("id-ID")}`
                      : "-"}
                  </span>
                </div>

                {/* Member Discount */}
                {isMember && pricing.memberDiscount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-green-600">
                      Member Discount (10%)
                    </span>
                    <span className="text-green-600">
                      - IDR {pricing.memberDiscount.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}

                {pricing.voucherDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Voucher Discount</span>
                    <span>
                      - IDR {pricing.voucherDiscount.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-blue-200 font-bold text-lg">
                  <span>Total</span>
                  <span>IDR {pricing.total.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* PAY BUTTON */}
              <motion.button
                whileHover={{
                  boxShadow:
                    isFormValid() && !isBookingLoading
                      ? "0 12px 30px rgba(37, 99, 235, 0.35)"
                      : undefined,
                }}
                whileTap={{
                  scale: isFormValid() && !isBookingLoading ? 0.98 : 1,
                }}
                onClick={handleBookingConfirmation}
                disabled={isBookingLoading || !isFormValid()}
                className={`w-full px-6 py-4 rounded-full transition-all shadow-md ${
                  isFormValid() && !isBookingLoading
                    ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isBookingLoading ? "Processing..." : "Proceed to Pay"}
              </motion.button>

              {!isFormValid() && !isBookingLoading && (
                <p className="text-center text-sm text-red-500">
                  {bookingType === "individual"
                    ? "Lengkapi semua data untuk melanjutkan"
                    : includeRoster
                    ? Object.keys(emailErrors).length > 0 ||
                      Object.keys(phoneErrors).length > 0
                      ? "Perbaiki data yang duplikat"
                      : "Lengkapi data PIC dan semua roster untuk melanjutkan"
                    : "Lengkapi data PIC untuk melanjutkan"}
                </p>
              )}

              <p className="text-center text-sm text-gray-500">
                Secure payment via QRIS
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
