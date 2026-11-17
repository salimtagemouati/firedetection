import type { Plugin } from "vite";

// Paid inference is available only to the local browser on the development origin.
export function localInference(): Plugin {
  let busy = false;
  return {
    name: "local-fire-inference",
    configureServer(server) {
      server.middlewares.use("/api/detect", async (req, res) => {
        res.setHeader("Cache-Control", "no-store");
        const end = (status: number, message: string) => {
          res.statusCode = status;
          res.end(message);
        };
        if (req.method !== "POST" || req.headers.host !== "127.0.0.1:8080" ||
            req.headers.origin !== "http://127.0.0.1:8080" ||
            req.socket.remoteAddress !== "127.0.0.1") return end(403, "Local origin required");
        const key = process.env.ROBOFLOW_API_KEY;
        if (!key) return end(503, "Configure ROBOFLOW_API_KEY");
        if (busy) return end(429, "An inference request is active");
        busy = true;
        try {
          const chunks: Buffer[] = [];
          let size = 0;
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 5 * 1024 * 1024) return end(413, "Image exceeds size limit");
            chunks.push(chunk);
          }
          const url = new URL("https://detect.roboflow.com/fire-detection-g9ebb/8");
          url.searchParams.set("api_key", key);
          const result = await fetch(url, { method: "POST", redirect: "error",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: Buffer.concat(chunks).toString("base64"), signal: AbortSignal.timeout(20000) });
          if (!result.ok) return end(502, "Inference provider rejected the image");
          res.setHeader("Content-Type", "application/json");
          end(200, JSON.stringify(await result.json()));
        } catch { end(502, "Inference unavailable"); }
        finally { busy = false; }
      });
    },
  };
}
