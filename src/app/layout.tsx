import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/components/organisms/NotificationContainer";
import LoadingScreen from "@/components/atoms/LoadingScreen";
import GlobalLoadingScreen from "@/components/molecules/GlobalLoadingScreen";
import { Suspense } from "react";
import { ScheduleProvider } from "@/contexts/ScheduleContext";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Football Book",
  description:
    "Football book made simple and trustworthy through community football in Jakarta",
  keywords: [
    "football",
    "minisoccer",
    "community",
    "jakarta",
    "bola",
    "main bola",
    "mabol",
    "komunitas",
    "mabar",
    "main bareng",
    "sepakbola",
  ],
  authors: [{ name: "DamnSans Team" }],
  openGraph: {
    title: "FootballBook",
    description: "Football Book made simple and trustworthy",
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
                <GlobalLoadingScreen />
                {children}
              </ScheduleProvider>
            </NotificationProvider>
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
