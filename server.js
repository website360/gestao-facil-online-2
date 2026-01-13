import { readFileSync, existsSync } from "fs";
import { join, extname } from "path";

const PORT = process.env.PORT || 8080;
const DIST_DIR = "./dist";

const mimeTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
};

Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;

    // Try exact file first
    let filePath = join(DIST_DIR, pathname);
    
    // If no extension, try index.html (SPA routing)
    if (!extname(pathname) || !existsSync(filePath)) {
      filePath = join(DIST_DIR, "index.html");
    }

    try {
      if (existsSync(filePath)) {
        const ext = extname(filePath);
        const contentType = mimeTypes[ext] || "application/octet-stream";
        const file = Bun.file(filePath);
        return new Response(file, {
          headers: { "Content-Type": contentType },
        });
      }
    } catch (e) {
      // Fall through to 404
    }

    // Fallback to index.html for SPA
    const indexPath = join(DIST_DIR, "index.html");
    if (existsSync(indexPath)) {
      return new Response(Bun.file(indexPath), {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running on port ${PORT}`);
