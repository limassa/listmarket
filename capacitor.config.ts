import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import type { CapacitorConfig } from "@capacitor/cli";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

const serverUrl = (process.env.CAPACITOR_SERVER_URL ?? "").replace(/\/$/, "");

const config: CapacitorConfig = {
  appId: "com.listmarket.app",
  appName: "Lista Mercado",
  webDir: "www-cap",
  android: {
    allowMixedContent: true,
  },
};

if (serverUrl) {
  config.server = {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http:"),
  };
}

export default config;
