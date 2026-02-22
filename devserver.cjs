const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = process.env.PORT ? Number(process.env.PORT) : 5175;
const ROOT = process.cwd();

const routes = new Map([
  ["/", "/index.html"],
  ["/assessment", "/pages/assessment.html"],
  ["/realtors", "/pages/realtors.html"],
  ["/unifi", "/pages/unifi.html"],
  ["/home-types", "/pages/home-types.html"],
  ["/about", "/pages/about.html"],
  ["/contact", "/pages/contact.html"],
  ["/thanks", "/pages/thanks.html"],
]);

const mime = (p) => {
  const ext = path.extname(p).toLowerCase();
  return ({
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".json": "application/json; charset=utf-8",
  })[ext] || "application/octet-stream";
};

const safeJoin = (base, target) => {
  const targetPath = path.normalize(path.join(base, target));
  if (!targetPath.startsWith(base)) return null;
  return targetPath;
};

http.createServer((req, res) => {
  try {
    const u = url.parse(req.url || "/");
    const pathname = u.pathname || "/";

    // Netlify-style rewrites for "pretty" routes
    const requested = routes.get(pathname) || pathname;

    // Serve exact file or fall back to /index.html for root
    let filePath = requested;

    // If someone requests a directory-like path, try .html
    if (!path.extname(filePath) && filePath !== "/") {
      const htmlCandidate = filePath + ".html";
      const absCand = safeJoin(ROOT, htmlCandidate);
      if (absCand && fs.existsSync(absCand) && fs.statSync(absCand).isFile()) {
        filePath = htmlCandidate;
      }
    }

    if (filePath === "/") filePath = "/index.html";

    const abs = safeJoin(ROOT, filePath);
    if (!abs || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 Not Found");
      return;
    }

    res.writeHead(200, { "Content-Type": mime(abs) });
    fs.createReadStream(abs).pipe(res);
  } catch (e) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("500 Server Error");
  }
}).listen(PORT, "0.0.0.0", () => {
  console.log(`RezNet dev server running: http://localhost:${PORT}`);
});
