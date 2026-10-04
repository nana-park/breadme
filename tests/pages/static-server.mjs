import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

// WHAT: Mount the exact dist artifact at its Pages base, never rewriting missing files.
const output = fileURLToPath(new URL("../../dist/", import.meta.url));
const base = "/breadme/";
const port = Number(process.env.PAGES_PORT || 4180);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
};
await stat(path.join(output, "index.html"));

const server = createServer(async (request, response) => {
  const notFound = () => {
    response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    response.end(
      "<!doctype html><title>404 Not Found</title><h1>404 Not Found</h1>",
    );
  };
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
  } catch {
    notFound();
    return;
  }
  if (pathname === base.slice(0, -1)) {
    response.writeHead(301, { Location: base });
    response.end();
    return;
  }
  if (!pathname.startsWith(base) || pathname.includes("\0")) {
    notFound();
    return;
  }
  const relative = pathname.slice(base.length);
  const filename = path.resolve(output, relative || "index.html");
  if (!filename.startsWith(`${output.replace(/\/$/, "")}${path.sep}`)) {
    notFound();
    return;
  }
  try {
    const file = await stat(filename);
    if (!file.isFile()) {
      notFound();
      return;
    }
    response.writeHead(200, {
      "Content-Type":
        types[path.extname(filename)] || "application/octet-stream",
      "Content-Length": file.size,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    if (request.method === "HEAD") response.end();
    else {
      const stream = createReadStream(filename);
      stream.on("error", () => response.destroy());
      response.on("close", () => stream.destroy());
      stream.pipe(response);
    }
  } catch {
    notFound();
  }
});
server.listen(port, "127.0.0.1", () => {
  console.log(`Strict static Pages artifact: http://127.0.0.1:${port}${base}`);
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
