/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // Enables instrumentation.ts (register() on server boot) — seeds demo orgs.
  experimental: {
    instrumentationHook: true,
  },
  eslint: {
    // Type-checking + tests are the quality gate; don't block builds on lint.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
