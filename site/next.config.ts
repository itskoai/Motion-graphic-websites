import type { NextConfig } from 'next';

// Static export: the finished site is a folder of files that runs on any host (Hostinger, Netlify, S3, a PHP host).
// The contact forms post to site.config.ts → forms.endpoint, so no Node server is needed.
const nextConfig: NextConfig = {
  output: 'export',
  reactStrictMode: true,
  trailingSlash: true,
  images: { unoptimized: true },
  devIndicators: false,
};

export default nextConfig;
