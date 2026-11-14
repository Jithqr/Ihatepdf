import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ihatepdf.app",
  appName: "iHatePDF",
  // Output folder of `vite build` (see vite.config.ts)
  webDir: "dist/public",
  server: {
    androidScheme: "https",
  },
};

export default config;
