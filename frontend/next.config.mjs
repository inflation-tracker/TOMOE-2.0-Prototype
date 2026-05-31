/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppress "Critical dependency: the request of a dependency is an expression" from Leaflet
  webpack: (config) => {
    config.module.unknownContextCritical = false
    return config
  },
}

export default nextConfig
