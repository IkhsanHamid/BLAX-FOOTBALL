/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
  },
  devIndicators: false,
  // compiler: {
  //   // Remove all console logs
  //   removeConsole: true,
  // },
};

export default nextConfig;
