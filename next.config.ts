import type { NextConfig } from 'next';

// Static export: generation runs in the browser (offline engine or the user's own API key),
// so ./out can be served by any static host. BASE_PATH is only for sub-path hosting.
const basePath = process.env.BASE_PATH || '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
