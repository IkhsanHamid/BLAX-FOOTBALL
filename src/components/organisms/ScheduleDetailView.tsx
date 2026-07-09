"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  MapPin,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Image as ImageIcon,
  Receipt,
  RefreshCw,
} from "lucide-react";
import Button from "../atoms/Button";
import Badge from "../atoms/Badge";
import { useNotifications } from "./NotificationContainer";
import { adminService } from "@/utils/admin";
import { formatCurrency, formatDate } from "@/lib/helper";
import type { ScheduleDetailItem } from "@/types/schedule";

interface ScheduleDetailViewProps {
  scheduleId: string;
  onClose?: () => void;
}

export default function ScheduleDetailView({
  scheduleId,
  onClose,
}: ScheduleDetailViewProps) {
  const { showError } = useNotifications();
  const [data, setData] = useState<ScheduleDetailItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const response = await adminService.getScheduleDetail(scheduleId);
        setData(response.data);
      } catch (error: any) {
        console.error("Error fetching schedule detail:", error);
        showError("Error", error?.message || "Gagal memuat detail jadwal");
        if (onClose) onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [scheduleId, showError, onClose]);

  if (loading) {
    return (
      <div className="py-16 text-center">
        <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-3 animate-spin" />
        <p className="text-gray-500 text-sm">Memuat detail jadwal...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-700">Data jadwal tidak ditemukan</p>
        {onClose && (
          <Button variant="outline" onClick={onClose} className="mt-4">
            Tutup
          </Button>
        )}
      </div>
    );
  }

  const slotsPercentage =
    data.slots.totalSlots > 0
      ? Math.round((data.slots.bookedSlots / data.slots.totalSlots) * 100)
      : 0;

  return (
    <div className="space-y-5">
      {/* Status Badges */}
      <div className="flex flex-wrap items-center gap-2">
        {data.isActive ? (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        ) : (
          <Badge className="bg-gray-100 text-gray-800">
            <XCircle className="w-3 h-3 mr-1" />
            Inactive
          </Badge>
        )}
        {data.isOpen ? (
          <Badge className="bg-blue-100 text-blue-800">Open for Booking</Badge>
        ) : (
          <Badge className="bg-amber-100 text-amber-800">Closed</Badge>
        )}
        {data.isVerified ? (
          <Badge className="bg-green-100 text-green-800">Verified</Badge>
        ) : data.isRejected ? (
          <Badge
            className="bg-red-100 text-red-700"
            title={data.rejectReason || ""}
          >
            Rejected
          </Badge>
        ) : (
          <Badge className="bg-yellow-100 text-yellow-800">
            Pending Verification
          </Badge>
        )}
      </div>

      {/* Reject Reason */}
      {data.isRejected && data.rejectReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-red-800 mb-1">
              Alasan Penolakan
            </div>
            <div className="text-sm text-red-700">{data.rejectReason}</div>
          </div>
        </div>
      )}

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 divide-y divide-gray-200">
          <div className="flex justify-between px-4 py-2.5 text-sm">
            <span className="text-gray-500">Nama Jadwal</span>
            <span className="font-medium text-gray-900 text-right">
              {data.name}
            </span>
          </div>
          <div className="flex justify-between px-4 py-2.5 text-sm">
            <span className="text-gray-500">Community</span>
            <span className="font-medium text-gray-900 capitalize">
              {data.community}
            </span>
          </div>
          <div className="flex justify-between px-4 py-2.5 text-sm">
            <span className="text-gray-500">Tipe</span>
            <span className="font-medium text-gray-900">
              {data.typeEvent} • {data.typeMatch}
            </span>
          </div>
          <div className="flex justify-between px-4 py-2.5 text-sm">
            <span className="text-gray-500">Tanggal</span>
            <span className="font-medium text-gray-900">
              {formatDate(data.date)}
            </span>
          </div>
          <div className="flex justify-between px-4 py-2.5 text-sm">
            <span className="text-gray-500">Waktu</span>
            <span className="font-medium text-gray-900">{data.time}</span>
          </div>
          <div className="flex justify-between px-4 py-2.5 text-sm">
            <span className="text-gray-500">Team</span>
            <span className="font-medium text-gray-900">{data.team}</span>
          </div>
          <div className="flex justify-between px-4 py-2.5 text-sm">
            <span className="text-gray-500">Fee Player</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(data.feePlayer)}
            </span>
          </div>
          <div className="flex justify-between px-4 py-2.5 text-sm">
            <span className="text-gray-500">Fee GK</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(data.feeGk)}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Venue */}
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4" />
              Venue
            </div>
            <div className="font-medium text-gray-900">{data.venue.name}</div>
            {data.venue.address && (
              <div className="text-xs text-gray-500 mt-1">
                {data.venue.address}
              </div>
            )}
            {data.venue.gmapLink && (
              <a
                href={data.venue.gmapLink}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-sky-600 hover:underline mt-1 inline-block"
              >
                Buka di Google Maps →
              </a>
            )}
          </div>

          {/* Slots */}
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <Users className="w-4 h-4" />
              Slot Information
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-500">Total Slots</div>
                <div className="font-semibold text-gray-900">
                  {data.slots.totalSlots}
                </div>
              </div>
              <div className="bg-blue-50 rounded p-2">
                <div className="text-xs text-blue-600">Booked</div>
                <div className="font-semibold text-blue-700">
                  {data.slots.bookedSlots}
                </div>
              </div>
              <div className="bg-green-50 rounded p-2">
                <div className="text-xs text-green-600">Open</div>
                <div className="font-semibold text-green-700">
                  {data.slots.openSlots}
                </div>
              </div>
              <div className="bg-purple-50 rounded p-2">
                <div className="text-xs text-purple-600">Filled</div>
                <div className="font-semibold text-purple-700">
                  {slotsPercentage}%
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 flex gap-3">
              <span>GK: {data.slots.gkSlots}</span>
              <span>Player: {data.slots.playerSlots}</span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${slotsPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Facilities & Rules */}
      {(data.facilities.length > 0 || data.rules.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Fasilitas
            </div>
            {data.facilities.length === 0 ? (
              <div className="text-sm text-gray-400">-</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {data.facilities.map((f) => (
                  <Badge key={f.id} variant="outline">
                    {f.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Rules</div>
            {data.rules.length === 0 ? (
              <div className="text-sm text-gray-400">-</div>
            ) : (
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                {data.rules.map((r) => (
                  <li key={r.id}>{r.description}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <ImageIcon className="w-4 h-4" />
            Gambar Jadwal
          </div>
          {data.imageUrl ? (
            <a
              href={data.imageUrl}
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <img
                src={data.imageUrl}
                alt="Schedule"
                className="w-full max-h-64 object-contain rounded-lg border border-gray-200 bg-gray-50"
              />
            </a>
          ) : (
            <div className="text-sm text-gray-400 py-8 text-center bg-gray-50 rounded-lg border border-dashed">
              Tidak ada gambar
            </div>
          )}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <Receipt className="w-4 h-4" />
            Bukti Pembayaran Lapangan
          </div>
          {data.paymentProof ? (
            <a
              href={data.paymentProof}
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <img
                src={data.paymentProof}
                alt="Payment Proof"
                className="w-full max-h-64 object-contain rounded-lg border border-gray-200 bg-gray-50"
              />
            </a>
          ) : (
            <div className="text-sm text-gray-400 py-8 text-center bg-gray-50 rounded-lg border border-dashed">
              Tidak ada bukti pembayaran
            </div>
          )}
        </div>
      </div>

      {/* Timestamps */}
      <div className="rounded-lg border border-gray-200 divide-y divide-gray-200">
        <div className="flex justify-between px-4 py-2.5 text-sm">
          <span className="text-gray-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Dibuat pada
          </span>
          <span className="text-gray-900">
            {new Date(data.createdAt).toLocaleString("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
