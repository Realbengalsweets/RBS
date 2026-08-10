import withPWA from "@ducanh2912/next-pwa";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        // Cache static assets
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      {
        // API calls — network first
        urlPattern: /^https:\/\/api\.yourapp\.com\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          expiration: { maxEntries: 32, maxAgeSeconds: 60 },
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
})({
  reactStrictMode: true,
  // Pin the workspace root (a stray lockfile exists in the home dir) so build
  // tracing stays scoped to this project.
  outputFileTracingRoot: projectRoot,
});

export default nextConfig;
