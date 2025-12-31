import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/components/organisms/NotificationContainer";
import LoadingScreen from "@/components/atoms/LoadingScreen";
import GlobalLoadingScreen from "@/components/molecules/GlobalLoadingScreen";
import { Suspense } from "react";
import { ScheduleProvider } from "@/contexts/ScheduleContext";
import { SignupProvider } from "@/contexts/FormSignupContext";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BLAX",
  description: "Komunitas sepakbola, minisoccer terbesar di jakarta",
  keywords: [
    "football",
    "minisoccer",
    "community",
    "jakarta",
    "bogor",
    "bekasi",
    "jabodetabek",
    "bola",
    "main bola",
    "mabol",
    "komunitas",
    "mabar",
    "main bareng",
    "sepakbola",
    "#kitamainlagi",
    "kitamainlagi",
    "kita main lagi",
  ],
  authors: [{ name: "DamnSans Team" }],
  openGraph: {
    title: "BLAX",
    description: "Komunitas sepakbola, minisoccer terbesar di jakarta",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <Suspense fallback={<LoadingScreen message="Loading application..." />}>
          <AuthProvider>
            <NotificationProvider>
              <ScheduleProvider>
                <SignupProvider>
                  <GlobalLoadingScreen />
                  {children}
                </SignupProvider>
              </ScheduleProvider>
            </NotificationProvider>
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
