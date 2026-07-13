/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://large-winona-grapholyze-c817024a.koyeb.app/api/:path*",
      },
    ];
  },
};

export default nextConfig;
