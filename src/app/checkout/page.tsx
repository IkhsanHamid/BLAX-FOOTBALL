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
  Plus,
  Minus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSchedule } from "@/contexts/ScheduleContext";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/organisms/Navbar";
import { useNotifications } from "@/components/organisms/NotificationContainer";
import { formatMatchDate } from "@/lib/helper";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService } from "@/utils/booking";
import { QRISPaymentPage } from "@/components/organisms/QRISPayment";
import { voucherService } from "@/utils/voucher";
import PaymentSuccessModal from "@/components/molecules/SuccessPaymentModal";

// Fungsi validasi input
const noSpace = (value: string) => {
  return value.replace(/\s{2,}/g, " ").slice(0, 100);
};
const onlyNumbers = (value: string) => value.replace(/\D/g, "").slice(0, 100);
const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone: string) =>
  /^[0-9]+$/.test(phone) && phone.length >= 10;
const validateName = (value: string) => value.trim().length > 0;
const JERSEY_SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"];

// Tipe slot individual: setiap slot punya role, nama, jersey, dan phone (untuk slot 2+)
type SlotRole = "goalkeeper" | "player" | null;
interface IndividualSlot {
  role: SlotRole;
  name: string;
  jerseySize: string;
  phone: string; // hanya untuk slot 2+
  email?: string; // opsional, hanya untuk slot 2+
}

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const [bookingType, setBookingType] = useState<"individual" | "team">(
    "individual",
  );

  // === PERUBAHAN: Ganti selectedRole + bookingQuantity dengan slots array ===
  const [slots, setSlots] = useState<IndividualSlot[]>([
    { role: null, name: "", jerseySize: "", phone: "", email: "" },
  ]);

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
  const [picJerseySize, setPicJerseySize] = useState("");

  // Voucher states
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    nominal: number;
    type: "PERCENTAGE" | "FIXED";
  } | null>(null);
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);

  const { selectedSchedule } = useSchedule();
  const { user } = useAuth();
  const router = useRouter();
  const [isBookingLoading, setIsBookingLoading] = useState(false);

  const [showPayment, setShowPayment] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [isMember, setIsMember] = useState<boolean>(false);
  const [emailErrors, setEmailErrors] = useState<{ [key: number]: string }>({});
  const [phoneErrors, setPhoneErrors] = useState<{ [key: number]: string }>({});

  // Dynamic roster size based on match type
  const getRosterSize = () => {
    if (!selectedSchedule) return 10;
    return selectedSchedule.typeMatch === "MINI-SOCCER"
      ? 6
      : selectedSchedule.typeMatch === "MINI-SOCCER-BEKASI"
        ? 7
        : 10;
  };

  const [players, setPlayers] = useState(
    Array.from({ length: getRosterSize() }, () => ({
      name: "",
      phone: "",
      email: "",
      jerseySize: "",
    })),
  );

  const [successPayment, setSuccessPayment] = useState(false);
  const [amount, setAmount] = useState(0);
  const [paymentType] = useState("booking");

  const [hasExistingBooking, setHasExistingBooking] = useState(false);
  const [isCheckingExistingBooking, setIsCheckingExistingBooking] =
    useState(false);

  const handleCloseSuccessModal = () => {
    setSuccessPayment(false);
    router.push("/schedule");
  };

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPicName(user.name || "");
      setPicEmail(user.email || "");
      setEmail(user.email || "");
      setWhatsapp(user.phone || "");
      if (user.isMember) setIsMember(true);
      // Pre-fill slot pertama dengan nama user
      setSlots((prev) =>
        prev.map((s, i) => (i === 0 ? { ...s, name: user.name || "" } : s)),
      );
    }
  }, [user]);

  useEffect(() => {
    checkExistingBooking();
  }, [user, selectedSchedule]);

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
        })),
      );

      // Reset to individual if PADEL
      if (selectedSchedule.typeMatch === "PADEL") {
        setBookingType("individual");
      }
    }
  }, [selectedSchedule]);

  const checkExistingBooking = async () => {
    if (!user || !selectedSchedule) {
      setHasExistingBooking(false);
      return;
    }

    setIsCheckingExistingBooking(true);
    try {
      const response = await bookingService.checkExistingBooking(
        selectedSchedule.id,
      );
      setHasExistingBooking(response);
    } catch (error) {
      console.error("Error checking existing booking:", error);
      setHasExistingBooking(false);
    } finally {
      setIsCheckingExistingBooking(false);
    }
  };

  // ===== SLOT MANAGEMENT =====
  const getMaxQuantity = () => {
    if (!selectedSchedule) return 1;
    const maxByMatchType =
      selectedSchedule.typeMatch === "MINI-SOCCER"
        ? 6
        : selectedSchedule.typeMatch === "MINI-SOCCER-BEKASI"
          ? 7
          : 10;
    // Max total slot = min dari available slots (gabungan GK + Player), dibatasi match type
    const totalAvailable =
      selectedSchedule.availableGkSlots + selectedSchedule.availablePlayerSlots;
    return Math.min(totalAvailable, maxByMatchType);
  };

  const addSlot = () => {
    if (slots.length < getMaxQuantity()) {
      setSlots([
        ...slots,
        { role: null, name: "", jerseySize: "", phone: "", email: "" },
      ]);
    }
  };

  const removeSlot = (index: number) => {
    if (slots.length <= 1) return;
    const updated = slots.filter((_, i) => i !== index);
    setSlots(updated);
  };

  const setSlotRole = (index: number, role: SlotRole) => {
    const updated = [...slots];
    // Cek apakah masih ada slot tersedia untuk role ini
    const currentCount = updated.filter((s) => s.role === role).length;
    const available =
      role === "goalkeeper"
        ? (selectedSchedule?.availableGkSlots ?? 0)
        : (selectedSchedule?.availablePlayerSlots ?? 0);

    // Jika role yang dipilih sama dengan sekarang, toggle off (null)
    if (updated[index].role === role) {
      updated[index].role = null;
      setSlots(updated);
      return;
    }

    // Cek apakah masih ada slot untuk role ini
    if (currentCount >= available) {
      showError(
        `Slot ${role === "goalkeeper" ? "Goalkeeper" : "Player"} sudah penuh`,
      );
      return;
    }

    updated[index].role = role;
    setSlots(updated);
  };

  // Hitung jumlah GK dan Player dari slots
  const countGk = () => slots.filter((s) => s.role === "goalkeeper").length;
  const countPlayer = () => slots.filter((s) => s.role === "player").length;
  const bookingQuantity = slots.length;

  // ===== VALIDASI =====
  const isFormValid = () => {
    if (bookingType === "individual") {
      const allRoleSelected = slots.every((s) => s.role !== null);
      const allJerseySizes = slots.every((s) => s.jerseySize !== "");
      // Slot 2+ wajib isi nama dan phone
      const allFriendsValid = slots.every(
        (s, i) => i === 0 || (validateName(s.name) && validatePhone(s.phone)),
      );
      return (
        validateName(name) &&
        validateEmail(email) &&
        validatePhone(whatsapp) &&
        slots.length > 0 &&
        allRoleSelected &&
        allJerseySizes &&
        allFriendsValid
      );
    } else {
      // Team booking
      const isPicValid =
        validateName(picName) &&
        validateEmail(picEmail) &&
        validatePhone(whatsapp) &&
        picJerseySize !== "";

      if (!includeRoster) return isPicValid;

      const hasEmailErrors = Object.keys(emailErrors).length > 0;
      const hasPhoneErrors = Object.keys(phoneErrors).length > 0;
      if (hasEmailErrors || hasPhoneErrors) return false;

      const allPlayersComplete = players.every(
        (p) =>
          validateName(p.name) &&
          validatePhone(p.phone) &&
          validateEmail(p.email) &&
          p.jerseySize !== "",
      );

      return isPicValid && allPlayersComplete;
    }
  };

  const handlePlayerChange = (
    index: number,
    field: "name" | "phone" | "email" | "jerseySize",
    value: string,
  ) => {
    const updated = [...players];
    if (field === "name") {
      updated[index][field] = noSpace(value);
    } else if (field === "phone") {
      updated[index][field] = onlyNumbers(value);

      const duplicateIndex = updated.findIndex(
        (p, i) => i !== index && p.phone && p.phone === onlyNumbers(value),
      );

      const newErrors = { ...phoneErrors };

      if (duplicateIndex !== -1 && onlyNumbers(value)) {
        newErrors[index] = `Nomor sama dengan Player ${duplicateIndex + 1}`;
        newErrors[duplicateIndex] = `Nomor sama dengan Player ${index + 1}`;
      } else {
        delete newErrors[index];
        Object.keys(newErrors).forEach((key) => {
          const keyIndex = parseInt(key);
          if (keyIndex !== index) {
            const hasDuplicate = updated.some(
              (p, i) =>
                i !== keyIndex &&
                p.phone &&
                p.phone === updated[keyIndex].phone,
            );
            if (!hasDuplicate) delete newErrors[keyIndex];
          }
        });
      }

      setPhoneErrors(newErrors);
    } else if (field === "email") {
      updated[index][field] = noSpace(value);

      const duplicateIndex = updated.findIndex(
        (p, i) => i !== index && p.email && p.email === noSpace(value),
      );

      const newErrors = { ...emailErrors };

      if (duplicateIndex !== -1 && noSpace(value)) {
        newErrors[index] = `Email sama dengan Player ${duplicateIndex + 1}`;
        newErrors[duplicateIndex] = `Email sama dengan Player ${index + 1}`;
      } else {
        delete newErrors[index];
        Object.keys(newErrors).forEach((key) => {
          const keyIndex = parseInt(key);
          if (keyIndex !== index) {
            const hasDuplicate = updated.some(
              (p, i) =>
                i !== keyIndex &&
                p.email &&
                p.email === updated[keyIndex].email,
            );
            if (!hasDuplicate) delete newErrors[keyIndex];
          }
        });
      }

      setEmailErrors(newErrors);
    } else if (field === "jerseySize") {
      updated[index][field] = value;
    }
    setPlayers(updated);
  };

  // ===== HARGA =====
  const getPrice = () => {
    if (!selectedSchedule) return 0;
    if (bookingType === "individual") {
      const gkTotal = countGk() * Number(selectedSchedule.feeGk);
      const playerTotal = countPlayer() * Number(selectedSchedule.feePlayer);
      return gkTotal + playerTotal;
    }
    return Number(selectedSchedule?.feePlayer) * getRosterSize();
  };

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

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode("");
    showSuccess("Voucher dihapus");
  };

  const calculatePricing = () => {
    const gkCount = countGk();
    const playerCount = countPlayer();

    let basePrice = 0;
    let memberDiscount = 0;
    let tourDisc = 0;

    if (bookingType === "team") {
      const rosterSize = getRosterSize();
      const isTournament = selectedSchedule?.typeEvent === "TOURNAMENT";

      if (isTournament) {
        const playerPrice = Number(selectedSchedule?.feePlayer);
        const gkPrice = Number(selectedSchedule?.feeGk);
        const totalBeforeDiscount = rosterSize * playerPrice + 1 * gkPrice;
        tourDisc = Math.round(totalBeforeDiscount * 0.05);
        basePrice = totalBeforeDiscount - tourDisc;
      } else {
        basePrice = getPrice();
        memberDiscount = 0;
      }
    } else {
      // INDIVIDUAL booking
      const canGetDiscount = isMember && !hasExistingBooking;
      basePrice = getPrice();

      if (canGetDiscount && bookingQuantity > 0) {
        // Member discount 10% hanya untuk 1 booking pertama (gunakan harga terendah / player)
        const firstBookingPrice =
          gkCount > 0
            ? Number(selectedSchedule?.feeGk)
            : Number(selectedSchedule?.feePlayer);
        memberDiscount = Math.round(firstBookingPrice * 0.1);
      } else {
        memberDiscount = 0;
      }
    }

    const adminFee = isMember ? 0 : 1000;
    const priceAfterMemberDiscount = basePrice - memberDiscount + adminFee;

    let voucherDiscount = 0;
    if (appliedVoucher) {
      if (appliedVoucher.type === "PERCENTAGE") {
        voucherDiscount = Math.round(
          priceAfterMemberDiscount * (appliedVoucher.nominal / 100),
        );
      } else {
        voucherDiscount = appliedVoucher.nominal;
      }
    }

    const subtotal = priceAfterMemberDiscount;
    const total = Math.max(0, priceAfterMemberDiscount - voucherDiscount);
    const totalDiscount = memberDiscount + voucherDiscount;

    return {
      basePrice,
      adminFee,
      memberDiscount,
      tourDisc,
      voucherDiscount,
      totalDiscount,
      subtotal,
      total,
    };
  };

  // ===== PAYLOAD =====
  const createBookingPayload = () => {
    const gkCount = countGk();
    const playerCount = countPlayer();

    const bookerRole = slots[0]?.role;

    const basePayload = {
      scheduleId: String(selectedSchedule?.id),
      bookingType: bookingType.toUpperCase(),
      isGuest: !user,
      name: user ? user.name : bookingType === "team" ? picName : name,
      email: user ? user.email : bookingType === "team" ? picEmail : email,
      phoneNumber: user ? user.phone : whatsapp,
      isPlayer: bookingType === "team" ? true : bookerRole === "player",
      isGk: bookingType === "team" ? true : bookerRole === "goalkeeper",
      isTeam: bookingType === "team" && includeRoster,
      voucherCode: appliedVoucher?.code || undefined,
      // jerseySize untuk slot pertama (backward compat)
      jerseySize:
        bookingType === "individual" ? slots[0]?.jerseySize : picJerseySize,
      gkQuantity: bookingType === "individual" ? gkCount : undefined,
      playerQuantity: bookingType === "individual" ? playerCount : undefined,
      quantity: bookingType === "individual" ? bookingQuantity : 1,
      // Detail per slot (nama + jersey size + phone + email per orang)
      slotDetails:
        bookingType === "individual"
          ? slots.map((s, i) => ({
              name: i === 0 ? (user?.name ?? name) : s.name,
              jerseySize: s.jerseySize,
              role: s.role,
              phone: i === 0 ? (user?.phone ?? whatsapp) : s.phone,
              email: i === 0 ? (user?.email ?? email) : s.email || undefined,
            }))
          : undefined,
    };

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

    return basePayload;
  };

  const handleBackFromPayment = () => {
    setShowPayment(false);
    setPaymentId(null);
  };

  const handleBookingConfirmation = async () => {
    if (bookingType === "individual") {
      if (!validateName(name)) return showError("Nama wajib diisi");
      if (!validateEmail(email)) return showError("Email tidak valid");
      if (!validatePhone(whatsapp)) return showError("WhatsApp tidak valid");

      for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        if (!s.role) return showError(`Pilih role untuk Slot ${i + 1}`);
        if (!s.jerseySize)
          return showError(`Ukuran jersey untuk Slot ${i + 1} wajib dipilih`);
        if (i > 0) {
          if (!validateName(s.name))
            return showError(`Nama teman ${i} wajib diisi`);
          if (!validatePhone(s.phone))
            return showError(`No HP teman ${i} tidak valid`);
        }
      }
    } else {
      if (!validateName(picName)) return showError("PIC name wajib diisi");
      if (!validateEmail(picEmail)) return showError("PIC email tidak valid");
      if (!validatePhone(whatsapp))
        return showError("WhatsApp PIC tidak valid");

      if (includeRoster) {
        if (Object.keys(emailErrors).length > 0)
          return showError("Terdapat email yang sama di team roster");
        if (Object.keys(phoneErrors).length > 0)
          return showError("Terdapat nomor phone yang sama di team roster");

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
      if (res !== "ok") {
        setPaymentId(res);
        setShowPayment(true);
        showSuccess("Booking berhasil");
      } else {
        const pricing = calculatePricing();
        setAmount(pricing.total);
        setSuccessPayment(true);
        showSuccess("Booking berhasil dibuat!");
      }
    } catch (err) {
      console.error(err);
      showError("Gagal melakukan booking");
    } finally {
      setIsBookingLoading(false);
    }
  };

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
  const gkCount = countGk();
  const playerCount = countPlayer();

  // Helper: apakah masih bisa tambah role tertentu di slot ini
  const canSelectRole = (slotIndex: number, role: SlotRole) => {
    if (!role) return true;
    const currentForRole = slots.filter(
      (s, i) => i !== slotIndex && s.role === role,
    ).length;
    const available =
      role === "goalkeeper"
        ? selectedSchedule.availableGkSlots
        : selectedSchedule.availablePlayerSlots;
    return currentForRole < available;
  };

  return (
    <>
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
              Hanya beberapa langkah lagi untuk menyelesaikan proses booking
              Anda.
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

                  {/* Name */}
                  <div>
                    <label className="block text-gray-600 mb-2">
                      Nama lengkap
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={name}
                        disabled={
                          !!user &&
                          user.email !== "ardiantosandi@gmail.com" &&
                          user.email !== "ikhsanhamid352@gmail.com"
                        }
                        onChange={(e) => setName(noSpace(e.target.value))}
                        placeholder="Enter your name"
                        className={`w-full pl-12 pr-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900 ${
                          user &&
                          user.email !== "ardiantosandi@gmail.com" &&
                          user.email !== "ikhsanhamid352@gmail.com"
                            ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                            : "border-gray-300"
                        }`}
                      />
                      {user &&
                        user.email !== "ardiantosandi@gmail.com" &&
                        user.email !== "ikhsanhamid352@gmail.com" && (
                          <p className="text-xs text-gray-500 mt-1">
                            Data diambil dari profil akun Anda
                          </p>
                        )}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-gray-600 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={email}
                        disabled={
                          !!user &&
                          user.email !== "ardiantosandi@gmail.com" &&
                          user.email !== "ikhsanhamid352@gmail.com"
                        }
                        onChange={(e) => setEmail(noSpace(e.target.value))}
                        placeholder="your@email.com"
                        className={`w-full pl-12 pr-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900 ${
                          user &&
                          user.email !== "ardiantosandi@gmail.com" &&
                          user.email !== "ikhsanhamid352@gmail.com"
                            ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                            : "border-gray-300"
                        }`}
                      />
                      {user &&
                        user.email !== "ardiantosandi@gmail.com" &&
                        user.email !== "ikhsanhamid352@gmail.com" && (
                          <p className="text-xs text-gray-500 mt-1">
                            Data diambil dari profil akun Anda
                          </p>
                        )}
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label className="block text-gray-600 mb-2">
                      WhatsApp Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={whatsapp}
                        disabled={
                          !!user &&
                          user.email !== "ardiantosandi@gmail.com" &&
                          user.email !== "ikhsanhamid352@gmail.com"
                        }
                        onChange={(e) =>
                          setWhatsapp(onlyNumbers(e.target.value))
                        }
                        placeholder="0812 3456 7890"
                        className={`w-full pl-12 pr-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900 ${
                          user &&
                          user.email !== "ardiantosandi@gmail.com" &&
                          user.email !== "ikhsanhamid352@gmail.com"
                            ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                            : "border-gray-300"
                        }`}
                      />
                      {user &&
                        user.email !== "ardiantosandi@gmail.com" &&
                        user.email !== "ikhsanhamid352@gmail.com" && (
                          <p className="text-xs text-gray-500 mt-1">
                            Data diambil dari profil akun Anda
                          </p>
                        )}
                    </div>
                  </div>

                  {/* ===== SLOT SELECTION ===== */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-blue-600">
                        Pilih Slot & Posisi
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          ({slots.length} slot)
                        </span>
                      </h3>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: slots.length <= 1 ? 1 : 1.05 }}
                          whileTap={{ scale: slots.length <= 1 ? 1 : 0.95 }}
                          onClick={() => removeSlot(slots.length - 1)}
                          disabled={slots.length <= 1}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                            slots.length <= 1
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                          }`}
                        >
                          <Minus className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{
                            scale: slots.length >= getMaxQuantity() ? 1 : 1.05,
                          }}
                          whileTap={{
                            scale: slots.length >= getMaxQuantity() ? 1 : 0.95,
                          }}
                          onClick={addSlot}
                          disabled={slots.length >= getMaxQuantity()}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                            slots.length >= getMaxQuantity()
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mb-4">
                      Slot pertama otomatis untuk Anda. Tambah slot jika membawa
                      teman — isi nama, no HP, dan jersey mereka.
                    </p>

                    {/* Slot availability info */}
                    <div className="flex gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 rounded-xl px-3 py-2">
                        <Shield className="w-4 h-4 text-blue-500" />
                        <span>
                          GK tersedia:{" "}
                          <strong className="text-blue-600">
                            {selectedSchedule.availableGkSlots - gkCount}
                          </strong>{" "}
                          / {selectedSchedule.availableGkSlots}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 rounded-xl px-3 py-2">
                        <User className="w-4 h-4 text-blue-500" />
                        <span>
                          Player tersedia:{" "}
                          <strong className="text-blue-600">
                            {selectedSchedule.availablePlayerSlots -
                              playerCount}
                          </strong>{" "}
                          / {selectedSchedule.availablePlayerSlots}
                        </span>
                      </div>
                    </div>

                    {/* Slot cards */}
                    <div className="space-y-3">
                      {slots.map((slot, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                          className="p-4 bg-blue-50 rounded-2xl border border-blue-100"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="text-gray-700 font-semibold text-sm">
                                {index === 0 ? "Slot Anda" : `Teman ${index}`}
                              </span>
                              {index === 0 ? (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                                  Akun Anda
                                </span>
                              ) : (
                                <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                                  Teman
                                </span>
                              )}
                            </div>
                            {slots.length > 1 && index > 0 && (
                              <button
                                onClick={() => removeSlot(index)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Data teman — hanya untuk slot 2+ */}
                          {index > 0 && (
                            <>
                              {/* Nama teman */}
                              <div className="mb-3">
                                <label className="block text-xs text-gray-500 mb-1">
                                  Nama Teman{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <input
                                    type="text"
                                    value={slot.name}
                                    onChange={(e) => {
                                      const updated = [...slots];
                                      updated[index].name = noSpace(
                                        e.target.value,
                                      );
                                      setSlots(updated);
                                    }}
                                    placeholder={`Nama teman ${index}`}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900 text-sm"
                                  />
                                </div>
                              </div>

                              {/* No HP teman */}
                              <div className="mb-3">
                                <label className="block text-xs text-gray-500 mb-1">
                                  No HP Teman{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <input
                                    type="tel"
                                    value={slot.phone}
                                    onChange={(e) => {
                                      const updated = [...slots];
                                      updated[index].phone = onlyNumbers(
                                        e.target.value,
                                      );
                                      setSlots(updated);
                                    }}
                                    placeholder="0812 3456 7890"
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900 text-sm"
                                  />
                                </div>
                              </div>

                              {/* Email teman */}
                              <div className="mb-3">
                                <label className="block text-xs text-gray-500 mb-1">
                                  Email Teman
                                </label>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <input
                                    type="email"
                                    value={slot.email ?? ""}
                                    onChange={(e) => {
                                      const updated = [...slots];
                                      updated[index].email = noSpace(
                                        e.target.value,
                                      );
                                      setSlots(updated);
                                    }}
                                    placeholder="email@teman.com"
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900 text-sm"
                                  />
                                </div>
                                <p className="text-xs text-blue-400 mt-1 italic">
                                  Data email sangat berguna buat kami untuk
                                  share informasi mengenai booking ini
                                </p>
                              </div>
                            </>
                          )}

                          {/* Jersey size per slot */}
                          <div className="mb-3">
                            <label className="block text-xs text-gray-500 mb-1">
                              Ukuran Jersey{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <Shirt className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <select
                                value={slot.jerseySize}
                                onChange={(e) => {
                                  const updated = [...slots];
                                  updated[index].jerseySize = e.target.value;
                                  setSlots(updated);
                                }}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900 appearance-none cursor-pointer text-sm"
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

                          {/* Role selection */}
                          <div>
                            <label className="block text-xs text-gray-500 mb-2">
                              Posisi <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              {/* Goalkeeper option - hidden for PADEL */}
                              {selectedSchedule.typeMatch !== "PADEL" && (
                                <motion.button
                                  whileHover={{
                                    scale:
                                      !canSelectRole(index, "goalkeeper") &&
                                      slot.role !== "goalkeeper"
                                        ? 1
                                        : 1.02,
                                  }}
                                  onClick={() =>
                                    setSlotRole(index, "goalkeeper")
                                  }
                                  disabled={
                                    !canSelectRole(index, "goalkeeper") &&
                                    slot.role !== "goalkeeper"
                                  }
                                  className={`p-3 border-2 rounded-xl transition-all text-left relative ${
                                    !canSelectRole(index, "goalkeeper") &&
                                    slot.role !== "goalkeeper"
                                      ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-50"
                                      : slot.role === "goalkeeper"
                                        ? "border-blue-600 bg-blue-100 shadow-md"
                                        : "border-blue-200 bg-white hover:border-blue-400 cursor-pointer"
                                  }`}
                                >
                                  <Shield
                                    className={`w-5 h-5 mb-1 ${
                                      slot.role === "goalkeeper"
                                        ? "text-blue-600"
                                        : "text-gray-400"
                                    }`}
                                  />
                                  <div
                                    className={`text-xs font-medium ${
                                      slot.role === "goalkeeper"
                                        ? "text-blue-600"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    Goalkeeper
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    IDR{" "}
                                    {Number(
                                      selectedSchedule.feeGk,
                                    ).toLocaleString("id-ID")}
                                  </div>
                                  {slot.role === "goalkeeper" && (
                                    <div className="absolute top-2 right-2 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs">
                                        ✓
                                      </span>
                                    </div>
                                  )}
                                </motion.button>
                              )}

                              {/* Player option */}
                              <motion.button
                                whileHover={{
                                  scale:
                                    !canSelectRole(index, "player") &&
                                    slot.role !== "player"
                                      ? 1
                                      : 1.02,
                                }}
                                onClick={() => setSlotRole(index, "player")}
                                disabled={
                                  !canSelectRole(index, "player") &&
                                  slot.role !== "player"
                                }
                                className={`p-3 border-2 rounded-xl transition-all text-left relative ${
                                  !canSelectRole(index, "player") &&
                                  slot.role !== "player"
                                    ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-50"
                                    : slot.role === "player"
                                      ? "border-blue-600 bg-blue-100 shadow-md"
                                      : "border-blue-200 bg-white hover:border-blue-400 cursor-pointer"
                                }`}
                              >
                                <User
                                  className={`w-5 h-5 mb-1 ${
                                    slot.role === "player"
                                      ? "text-blue-600"
                                      : "text-gray-400"
                                  }`}
                                />
                                <div
                                  className={`text-xs font-medium ${
                                    slot.role === "player"
                                      ? "text-blue-600"
                                      : "text-gray-600"
                                  }`}
                                >
                                  Player
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  IDR{" "}
                                  {Number(
                                    selectedSchedule.feePlayer,
                                  ).toLocaleString("id-ID")}
                                </div>
                                {slot.role === "player" && (
                                  <div className="absolute top-2 right-2 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">
                                      ✓
                                    </span>
                                  </div>
                                )}
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Slot summary */}
                    {slots.some((s) => s.role !== null) && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl space-y-1.5">
                        {slots.map(
                          (s, i) =>
                            s.role && (
                              <div
                                key={i}
                                className="flex flex-wrap items-center gap-1.5 text-sm text-green-700"
                              >
                                {s.role === "goalkeeper" ? (
                                  <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                                ) : (
                                  <User className="w-3.5 h-3.5 flex-shrink-0" />
                                )}
                                <span className="font-medium">
                                  {i === 0
                                    ? user?.name || name || "Anda"
                                    : s.name || `Teman ${i}`}
                                </span>
                                {i > 0 && s.phone && (
                                  <>
                                    <span className="text-green-400">·</span>
                                    <span className="text-green-600 text-xs">
                                      {s.phone}
                                    </span>
                                  </>
                                )}
                                <span className="text-green-400">·</span>
                                <span className="capitalize">{s.role}</span>
                                {s.jerseySize && (
                                  <>
                                    <span className="text-green-400">·</span>
                                    <span>Jersey {s.jerseySize}</span>
                                  </>
                                )}
                              </div>
                            ),
                        )}
                      </div>
                    )}
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
                        disabled={
                          !!user &&
                          user.email !== "ardiantosandi@gmail.com" &&
                          user.email !== "ikhsanhamid352@gmail.com"
                        }
                        onChange={(e) => setPicName(noSpace(e.target.value))}
                        placeholder="Enter PIC name"
                        className={`w-full pl-12 pr-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900 ${
                          user &&
                          user.email !== "ardiantosandi@gmail.com" &&
                          user.email !== "ikhsanhamid352@gmail.com"
                            ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                            : "border-gray-300"
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-2">
                      PIC Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={picEmail}
                        disabled={
                          !!user &&
                          user.email !== "ardiantosandi@gmail.com" &&
                          user.email !== "ikhsanhamid352@gmail.com"
                        }
                        onChange={(e) => setPicEmail(noSpace(e.target.value))}
                        placeholder="pic@email.com"
                        className={`w-full pl-12 pr-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900 ${
                          user &&
                          user.email !== "ardiantosandi@gmail.com" &&
                          user.email !== "ikhsanhamid352@gmail.com"
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
                        disabled={
                          !!user &&
                          user.email !== "ardiantosandi@gmail.com" &&
                          user.email !== "ikhsanhamid352@gmail.com"
                        }
                        onChange={(e) =>
                          setWhatsapp(onlyNumbers(e.target.value))
                        }
                        placeholder="0812 3456 7890"
                        className={`w-full pl-12 pr-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl focus:outline-none focus:border-blue-400 transition-colors text-gray-900 ${
                          user &&
                          user.email !== "ardiantosandi@gmail.com" &&
                          user.email !== "ikhsanhamid352@gmail.com"
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

                  {/* Team Roster */}
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
                          <div
                            key={index}
                            className="p-4 bg-blue-50 rounded-2xl"
                          >
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
                                    e.target.value,
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
                                    e.target.value,
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
                                    e.target.value,
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
                                    e.target.value,
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
                {selectedSchedule.typeEvent === "FUN GAME" && (
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
                )}

                {/* PRICE */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-black">Booking Type</span>
                    <span className="capitalize">
                      {bookingType}
                      {bookingType === "individual" &&
                        ` (${bookingQuantity}x slot)`}
                    </span>
                  </div>

                  {/* Breakdown per role */}
                  {bookingType === "individual" &&
                    (gkCount > 0 || playerCount > 0) && (
                      <div className="space-y-1.5 pl-2 border-l-2 border-blue-100">
                        {gkCount > 0 && (
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>{gkCount}x Goalkeeper</span>
                            <span>
                              IDR{" "}
                              {(
                                gkCount * Number(selectedSchedule.feeGk)
                              ).toLocaleString("id-ID")}
                            </span>
                          </div>
                        )}
                        {playerCount > 0 && (
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>{playerCount}x Player</span>
                            <span>
                              IDR{" "}
                              {(
                                playerCount * Number(selectedSchedule.feePlayer)
                              ).toLocaleString("id-ID")}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                  <div className="flex justify-between">
                    <span>Harga Booking</span>
                    <span>
                      {bookingType === "individual" &&
                      (gkCount > 0 || playerCount > 0)
                        ? `IDR ${pricing.basePrice.toLocaleString("id-ID")}`
                        : bookingType === "team"
                          ? `IDR ${pricing.basePrice.toLocaleString("id-ID")}`
                          : "-"}
                    </span>
                  </div>

                  {/* Member Discount */}
                  {isMember &&
                    bookingType !== "team" &&
                    !hasExistingBooking &&
                    pricing.total > 0 &&
                    pricing.memberDiscount > 0 && (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-green-600 font-medium">
                            Member Discount (10%)
                          </span>
                          <span className="text-green-600">
                            - IDR{" "}
                            {pricing.memberDiscount.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 italic">
                          *Jika sudah pernah booking di jadwal yang sama,
                          discount tidak berlaku
                        </span>
                        <span className="text-xs text-gray-500 italic">
                          *Hanya slot pertama yang mendapat diskon 10%
                        </span>
                      </div>
                    )}

                  {/* Tournament Team Discount */}
                  {bookingType === "team" &&
                    selectedSchedule?.typeEvent === "TOURNAMENT" &&
                    pricing.tourDisc > 0 && (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-green-600 font-medium">
                            Team Tournament Discount (5%)
                          </span>
                          <span className="text-green-600">
                            - IDR {pricing.tourDisc.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 italic">
                          *Diskon 5% untuk team booking tournament
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

                  {pricing.adminFee > 0 && (
                    <div className="flex justify-between text-black">
                      <span>Biaya Admin</span>
                      <span>
                        IDR {pricing.adminFee.toLocaleString("id-ID")}
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
                      ? slots.some((s) => s.role === null)
                        ? "Pilih role untuk semua slot"
                        : slots.some((s) => !s.jerseySize)
                          ? "Pilih ukuran jersey untuk semua slot"
                          : slots.some((s, i) => i > 0 && !validateName(s.name))
                            ? "Isi nama teman dengan benar"
                            : slots.some(
                                  (s, i) => i > 0 && !validatePhone(s.phone),
                                )
                              ? "Isi no HP teman dengan benar"
                              : "Lengkapi semua data untuk melanjutkan"
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
      <PaymentSuccessModal
        isOpen={successPayment}
        onClose={handleCloseSuccessModal}
        amount={amount}
        productName={paymentType === "booking" ? "Booking" : "Membership"}
      />
    </>
  );
}
