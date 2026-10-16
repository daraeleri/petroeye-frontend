import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `npm run build` writes to its own folder so it can never overwrite the
  // `.next` folder a running `npm run dev` is serving (that strips the CSS
  // from the dev site). Vercel ignores NEXT_DIST_DIR unless you set it.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    // Tree-shake big icon/chart libraries so pages compile and load faster.
    optimizePackageImports: ["lucide-react", "recharts", "@react-three/drei"],
  },
};

export default nextConfig;
