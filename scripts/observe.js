/* Serves the site with the test harness injected; prints observable state.
   Run: node scripts/observe.js  (requires manual Chrome run; see README) */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PORT = 8935;

const MIME = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png"
};

const HARNESS = fs.readFileSync(path.join(__dirname, "test-harness.html"), "utf8")
  .replace(/^[\s\S]*?<script>/, "").replace(/<\/script>[\s\S]*$/, "");

const server = http.createServer(function (req, res) {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  const inject = req.url.indexOf("diag=1") > -1;
  if (urlPath === "/") urlPath = "/index.html";
  const file = path.join(ROOT, urlPath);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end("nf"); return;
  }
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
  if (inject && urlPath === "/index.html") {
    res.end(fs.readFileSync(file, "utf8").replace("</body>", "<script>" + HARNESS + "</script></body>"));
    return;
  }
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, function () {
  console.log("Serving on http://localhost:" + PORT + " — open /index.html?diag=1 to see the diag block in the page DOM (#__diag).");
});
