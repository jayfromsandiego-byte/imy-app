/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // sharp is a native module (used for R2 image optimization in lib/r2.ts).
  // Externalize it so the server bundle requires it at runtime instead of
  // webpack trying to bundle its native bindings.
  experimental: { serverComponentsExternalPackages: ["sharp"] },
};
module.exports = nextConfig;
