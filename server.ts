import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import app from "./api/index.js";

const PORT = 3000;

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting local dev server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running locally behind proxy on http://localhost:${PORT}`);
  });
}

startServer();
