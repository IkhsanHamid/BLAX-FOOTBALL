import React from "react";
import {
  Phone,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
} from "lucide-react";
import BlaxLogo from "@/assets/blax-logo.png";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src={BlaxLogo}
                alt="Blax Football"
                width={48}
                height={48}
              />
              <h3 className="text-xl font-bold">Blax Football</h3>
            </div>

            <p className="text-gray-300 leading-relaxed max-w-md">
              Platform booking futsal dan mini soccer terpercaya di Jakarta.
              Bergabunglah dengan komunitas football terbesar dan nikmati
              pengalaman bermain yang tak terlupakan.
            </p>

            <div className="flex space-x-3 pt-2">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="
                    w-10 h-10 rounded-full
                    bg-gray-700 hover:bg-sky-500
                    flex items-center justify-center
                    transition-colors duration-300
                  "
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-sky-400">Kontak</h4>

            <div className="space-y-4 text-gray-300">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-sky-400" />
                <p>
                  +62 21 1234 5678
                  <br />
                  +62 812 3456 7890
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-sky-400" />
                <p>
                  info@blaxfootball.com
                  <br />
                  support@blaxfootball.com
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-700 mt-12 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            © {currentYear} Blax Football. All rights reserved.
          </p>

          <p className="mt-2 text-gray-500 text-sm">
            Made with ❤️ for the football community in Jakarta
          </p>
        </div>
      </div>
    </footer>
  );
}
