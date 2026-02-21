const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = process.env.PORT ? Number(process.env.PORT) : 5175;
const ROOT = process.cwd();

const routes = new Map([
  ["/assessment", "/pages/assessment.html"],
  ["/realtors", "/pages/realtors.html"],
  ["/unifi", "/pages/unifi.html"],
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
    const mapped = routes.get(pathname);
    const requested = mapped || pathname;

    let filePath = requested === "/" ? "/index.html" : requested;

    // If someone hits /pages/foo (no extension), try /pages/foo.html
    if (!path.extname(filePath)) {
      const htmlCandidate = filePath + ".html";
      const absCand = safeJoin(ROOT, htmlCandidate);
      if (absCand && fs.existsSync(absCand) && fs.statSync(absCand).isFile()) {
        filePath = htmlCandidate;
      }
    }

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
