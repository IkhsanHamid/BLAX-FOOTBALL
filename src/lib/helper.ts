import crypto from "crypto";
import CryptoJS from "crypto-js";
import { PUBLIC_KEY } from "./publicKey";
import Pako from "pako";

const secret = PUBLIC_KEY;

export function decodeJwt(token: string) {
  const payload = token.split(".")[1];
  return JSON.parse(atob(payload));
}

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export async function encryptWithPublicKey(data: object) {
  // 1️⃣ Generate AES key (256 bit)
  const aesKey = CryptoJS.lib.WordArray.random(32).toString();

  // 2️⃣ Compress data
  const jsonString = JSON.stringify(data);
  const compressed = Pako.deflate(jsonString);

  // 3️⃣ Encrypt data with AES
  const encryptedData = CryptoJS.AES.encrypt(
    CryptoJS.lib.WordArray.create(compressed as any),
    aesKey,
  ).toString();

  // 4️⃣ Import RSA Public Key
  const pemContents = secret
    .replace(/-----BEGIN PUBLIC KEY-----/, "")
    .replace(/-----END PUBLIC KEY-----/, "")
    .replace(/\s/g, "");

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const publicKey = await window.crypto.subtle.importKey(
    "spki",
    binaryDer.buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );

  // 5️⃣ Encrypt AES key with RSA
  const encryptedKey = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    new TextEncoder().encode(aesKey),
  );

  return {
    encryptedKey: btoa(String.fromCharCode(...new Uint8Array(encryptedKey))),
    encryptedData,
  };
}

/**
 * Get date range based on filter type
 * @param filter - Filter type: 'all' | 'today' | 'week' | 'month'
 * @returns Object containing startDate and endDate in ISO format
 */
export const getDateRange = (
  filter: string,
): { startDate: string | undefined; endDate: string | undefined } => {
  const now = new Date();
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  // If filter is 'all' or empty, return undefined for both dates
  if (!filter || filter === "all") {
    return {
      startDate: undefined,
      endDate: undefined,
    };
  }

  switch (filter) {
    case "today":
      // Start of today (00:00:00)
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0,
      );
      // End of today (23:59:59)
      endDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999,
      );
      break;

    case "week":
      // Last 7 days from today
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6); // 6 days ago + today = 7 days
      startDate.setHours(0, 0, 0, 0);
      // End of today
      endDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999,
      );
      break;

    case "month":
      // Last 30 days from today
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 29); // 29 days ago + today = 30 days
      startDate.setHours(0, 0, 0, 0);
      // End of today
      endDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999,
      );
      break;

    case "all":
    default:
      // For 'all', set a very wide range
      // Start from a year ago
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
      // End at end of today
      endDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999,
      );
      break;
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
};

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatMatchDate(dateString: string) {
  const date = new Date(dateString);

  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${day} ${month} ${year}`;
}
