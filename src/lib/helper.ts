import crypto from "crypto";
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
  // --- Convert PEM ke CryptoKey ---
  const pemHeader = "-----BEGIN PUBLIC KEY-----";
  const pemFooter = "-----END PUBLIC KEY-----";
  const pemContents = secret
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s/g, "");

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const key = await window.crypto.subtle.importKey(
    "spki",
    binaryDer.buffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"]
  );

  // --- Encrypt ---
  // Step 1: Convert object to string
  const jsonString = JSON.stringify(data);

  // Step 2: Compress
  const compressed = Pako.deflate(jsonString);
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    key,
    compressed
  );

  // Convert ke base64 supaya aman dikirim ke server
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

export const getDateRange = (filter: string) => {
  const now = new Date();
  let startDate = "";
  let endDate = "";

  switch (filter) {
    case "today":
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      startDate = today.toISOString().split("T")[0];
      endDate = new Date().toISOString().split("T")[0];
      break;
    case "week":
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      startDate = weekAgo.toISOString().split("T")[0];
      endDate = new Date().toISOString().split("T")[0];
      break;
    case "month":
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      startDate = monthAgo.toISOString().split("T")[0];
      endDate = new Date().toISOString().split("T")[0];
      break;
    default:
      break;
  }

  return { startDate, endDate };
};

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
