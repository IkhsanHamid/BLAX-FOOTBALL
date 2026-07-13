"use client";

import React, { useEffect, useState } from "react";
import { Save, AlertCircle, X, Image as ImageIcon } from "lucide-react";
import Button from "../atoms/Button";
import { useNotifications } from "./NotificationContainer";
import { adminService } from "@/utils/admin";
import { masterDataService } from "@/utils/masterData";
import type { VerificationDetail } from "@/types/schedule";

const COMMUNITY_OPTIONS = [
  { value: "blax", label: "Blax" },
  { value: "magnifico", label: "Magnifico" },
  { value: "red-alert", label: "Red Alert" },
  { value: "ots", label: "OTS" },
  { value: "ayo-bola", label: "Ayo Bola" },
];

const EVENT_TYPES = ["FUN GAME", "TOURNAMENT", "REGULAR"];
const MATCH_TYPES = ["PADEL", "MINI-SOCCER", "FOOTBALL", "MINI-FOOTBALL"];

interface ScheduleRevisionFormProps {
  scheduleId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ScheduleRevisionForm({
  scheduleId,
  onClose,
  onSuccess,
}: ScheduleRevisionFormProps) {
  const { showSuccess, showError } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [venues, setVenues] = useState<{ id: string; name: string }[]>([]);
  const [facilities, setFacilities] = useState<
    { id: string; name: string }[]
  >([]);
  const [rules, setRules] = useState<{ id: string; description: string }[]>([]);

  const [form, setForm] = useState({
    name: "",
    date: "",
    time: "",
    typeEvent: "",
    typeMatch: "",
    community: "",
    team: "1",
    feePlayer: "",
    feeGk: "",
    venueId: "",
    facilityIds: [] as string[],
    ruleIds: [] as string[],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string>("");
  const [existingPaymentProof, setExistingPaymentProof] =
    useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [detailRes, venuesRes, facilitiesRes, rulesRes] =
          await Promise.all([
            adminService.getVerificationDetail(scheduleId),
            masterDataService.getVenues().catch(() => []),
            masterDataService.getFacilities().catch(() => ({ data: [], total: 0, page: 1, limit: 0 })),
            masterDataService.getRules().catch(() => []),
          ]);

        const detail = detailRes.data;
        setForm({
          name: detail.name,
          date: detail.date ? detail.date.split("T")[0] : "",
          time: detail.time,
          typeEvent: detail.typeEvent,
          typeMatch: detail.typeMatch,
          community: detail.community,
          team: String(detail.team),
          feePlayer: String(detail.feePlayer),
          feeGk: String(detail.feeGk),
          venueId: detail.venue?.id || "",
          facilityIds: detail.facilities.map((f) => f.id),
          ruleIds: detail.rules.map((r) => r.id),
        });
        setExistingImageUrl(detail.imageUrl);
        setExistingPaymentProof(detail.paymentProof);

        const venuesList = Array.isArray(venuesRes)
          ? venuesRes.map((v: any) => ({ id: v.id, name: v.name }))
          : [];
        setVenues(venuesList);

        const facilitiesData = (facilitiesRes as any)?.data ?? facilitiesRes;
        const facilitiesList = Array.isArray(facilitiesData)
          ? facilitiesData.map((f: any) => ({ id: f.id, name: f.name }))
          : [];
        setFacilities(facilitiesList);

        const rulesList = Array.isArray(rulesRes)
          ? rulesRes.map((r: any) => ({ id: r.id, description: r.description || r.name }))
          : [];
        setRules(rulesList);
      } catch (error: any) {
        console.error("Error loading revision form:", error);
        showError(
          "Error",
          error?.message || "Gagal memuat data jadwal",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [scheduleId, showError]);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (
    field: "facilityIds" | "ruleIds",
    id: string,
    checked: boolean,
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: checked
        ? [...prev[field], id]
        : prev[field].filter((x) => x !== id),
    }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.date || !form.time) {
      showError("Validasi gagal", "Nama, tanggal, dan waktu wajib diisi");
      return;
    }
    if (!form.venueId) {
      showError("Validasi gagal", "Venue wajib dipilih");
      return;
    }
    if (form.facilityIds.length === 0) {
      showError("Validasi gagal", "Minimal pilih satu fasilitas");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("date", form.date);
      formData.append("time", form.time);
      formData.append("typeEvent", form.typeEvent);
      formData.append("typeMatch", form.typeMatch);
      formData.append("community", form.community);
      formData.append("team", form.team);
      formData.append("feePlayer", form.feePlayer || "0");
      formData.append("feeGk", form.feeGk || "0");
      formData.append("venueId", form.venueId);
      form.facilityIds.forEach((id) => formData.append("facilityIds[]", id));
      form.ruleIds.forEach((id) => formData.append("ruleIds[]", id));

      if (imageFile) formData.append("imageUrl", imageFile);
      if (paymentProofFile) formData.append("paymentProof", paymentProofFile);

      await adminService.reviseSchedule(scheduleId, formData);
      showSuccess("Jadwal berhasil direvisi", "Menunggu verifikasi ulang");
      onSuccess();
    } catch (error: any) {
      console.error("Error revising schedule:", error);
      showError(
        "Revisi gagal",
        error?.message || "Terjadi kesalahan",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Memuat data jadwal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          Revisi jadwal yang ditolak. Setelah direvisi, jadwal akan kembali ke
          antrian verifikasi. Image dan bukti pembayaran bersifat opsional —
          kosongkan jika tidak ingin mengganti.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nama Jadwal <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tanggal <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => handleChange("date", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Waktu <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            value={form.time}
            onChange={(e) => handleChange("time", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tipe Event
          </label>
          <select
            value={form.typeEvent}
            onChange={(e) => handleChange("typeEvent", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Pilih tipe event</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tipe Match
          </label>
          <select
            value={form.typeMatch}
            onChange={(e) => handleChange("typeMatch", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Pilih tipe match</option>
            {MATCH_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Community
          </label>
          <select
            value={form.community}
            onChange={(e) => handleChange("community", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {COMMUNITY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Team
          </label>
          <input
            type="number"
            value={form.team}
            onChange={(e) => handleChange("team", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Fee Player
          </label>
          <input
            type="number"
            value={form.feePlayer}
            onChange={(e) => handleChange("feePlayer", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Fee GK
          </label>
          <input
            type="number"
            value={form.feeGk}
            onChange={(e) => handleChange("feeGk", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Venue <span className="text-red-500">*</span>
          </label>
          <select
            value={form.venueId}
            onChange={(e) => handleChange("venueId", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Pilih venue</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fasilitas <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {facilities.map((f) => (
              <label
                key={f.id}
                className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={form.facilityIds.includes(f.id)}
                  onChange={(e) =>
                    handleArrayToggle("facilityIds", f.id, e.target.checked)
                  }
                  className="rounded border-gray-300 text-sky-600"
                />
                <span className="text-sm">{f.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rules
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {rules.map((r) => (
              <label
                key={r.id}
                className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={form.ruleIds.includes(r.id)}
                  onChange={(e) =>
                    handleArrayToggle("ruleIds", r.id, e.target.checked)
                  }
                  className="rounded border-gray-300 text-sky-600"
                />
                <span className="text-sm">{r.description}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
            <ImageIcon className="w-4 h-4" />
            Gambar Jadwal (opsional)
          </label>
          {existingImageUrl && !imageFile && (
            <div className="mb-2">
              <img
                src={existingImageUrl}
                alt="Existing"
                className="w-full max-h-32 object-contain rounded-lg border border-gray-200 bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Image saat ini. Upload baru untuk mengganti.
              </p>
            </div>
          )}
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={(e) =>
              setImageFile(e.target.files?.[0] || null)
            }
            className="w-full text-sm"
          />
          {imageFile && (
            <div className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded">
              <span className="text-xs text-gray-700 truncate">
                {imageFile.name}
              </span>
              <button
                type="button"
                onClick={() => setImageFile(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
            <ImageIcon className="w-4 h-4" />
            Bukti Pembayaran (opsional)
          </label>
          {existingPaymentProof && !paymentProofFile && (
            <div className="mb-2">
              <img
                src={existingPaymentProof}
                alt="Existing payment proof"
                className="w-full max-h-32 object-contain rounded-lg border border-gray-200 bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Bukti bayar saat ini. Upload baru untuk mengganti.
              </p>
            </div>
          )}
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={(e) =>
              setPaymentProofFile(e.target.files?.[0] || null)
            }
            className="w-full text-sm"
          />
          {paymentProofFile && (
            <div className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded">
              <span className="text-xs text-gray-700 truncate">
                {paymentProofFile.name}
              </span>
              <button
                type="button"
                onClick={() => setPaymentProofFile(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-3 border-t">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Batal
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-sky-600 hover:bg-sky-700 text-white"
        >
          <Save className="w-4 h-4 mr-1" />
          {submitting ? "Menyimpan..." : "Simpan Revisi"}
        </Button>
      </div>
    </div>
  );
}
