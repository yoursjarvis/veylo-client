/** @type {import('next').NextConfig} */
const backendOrigin = process.env.API_BACKEND_URL ?? "https://api.veylo.com:4000"

const nextConfig = {
  allowedDevOrigins: ["veylo.com", "*.veylo.com", "localhost"],
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendOrigin}/api/v1/:path*`,
      },
    ]
  },
}

export default nextConfig
