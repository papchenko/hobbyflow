
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";

export default defineConfig(({ command }) => {
  const isDev = command === "serve";

  return {
    base: "/",
    plugins: [react()],

    server: isDev
      ? {
          https: {
            key: fs.readFileSync("./certs/key.pem"),
            cert: fs.readFileSync("./certs/cert.pem"),
          },
          host: "0.0.0.0",
          port: 5173,
        }
      : undefined,
  };
});
