const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(process.argv[2] || path.join(process.cwd(), "web", "public"));
const port = Number(process.argv[3] || 8799);
const host = "127.0.0.1";
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".png": "image/png"
};

http.createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${host}:${port}`);
  const filePath = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("forbidden");
    return;
  }

  fs.stat(filePath, (error, stat) => {
    if (error || !stat.isFile()) {
      response.writeHead(404);
      response.end("not found");
      return;
    }

    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": types[path.extname(filePath).toLowerCase()] || "application/octet-stream"
    });
    fs.createReadStream(filePath).pipe(response);
  });
}).listen(port, host, () => {
  console.log(`Serving ${root} at http://${host}:${port}`);
});
