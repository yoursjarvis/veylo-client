/** @type {import('next').NextConfig} */
const backendOrigin = process.env.API_BACKEND_URL ?? "http://localhost:4000"

const nextConfig = {
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
