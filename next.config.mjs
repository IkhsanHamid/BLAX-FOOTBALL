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

  // REMOVE CONSOLE IN PRODUCTION
  webpack(config, { dev }) {
    if (!dev) {
      config.optimization.minimizer = config.optimization.minimizer.map(
        (plugin) => {
          if (plugin.constructor.name === "TerserPlugin") {
            return new plugin.constructor({
              ...plugin.options,
              terserOptions: {
                ...plugin.options.terserOptions,
                compress: {
                  ...plugin.options.terserOptions?.compress,
                  drop_console: true, // 🔥 Hapus semua console.*
                },
              },
            });
          }
          return plugin;
        }
      );
    }
    return config;
  },
};

export default nextConfig;
