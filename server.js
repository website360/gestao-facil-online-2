import http from "http";
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

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = url.pathname;

  // Try exact file first
  let filePath = join(DIST_DIR, pathname);
  
  // If no extension or file doesn't exist, serve index.html (SPA routing)
  if (!extname(pathname) || !existsSync(filePath)) {
    filePath = join(DIST_DIR, "index.html");
  }

  try {
    if (existsSync(filePath)) {
      const ext = extname(filePath);
      const contentType = mimeTypes[ext] || "application/octet-stream";
      const file = readFileSync(filePath);
      res.writeHead(200, { "Content-Type": contentType });
      res.end(file);
      return;
    }
  } catch (e) {
    // Fall through to 404
  }

  // Fallback to index.html for SPA
  const indexPath = join(DIST_DIR, "index.html");
  if (existsSync(indexPath)) {
    const file = readFileSync(indexPath);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(file);
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
