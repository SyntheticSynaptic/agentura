const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      "/*": ["./node_modules/.pnpm/@prisma+client@*/**/*.node"],
    },
  },
};

export default nextConfig;
