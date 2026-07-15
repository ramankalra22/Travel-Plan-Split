/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from common sources for cover photos
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
