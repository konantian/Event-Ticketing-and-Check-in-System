/** @type {import('next').NextConfig} */

const nextConfig = {
  /* config options here */
  // Server external packages configuration
  serverExternalPackages: [],
  
  // Webpack optimization for better performance
  webpack: (config, { isServer }) => {
    // Optimize for production builds
    if (!isServer) {
      config.optimization.splitChunks = {
        cacheGroups: {
          default: false,
          vendors: false,
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
