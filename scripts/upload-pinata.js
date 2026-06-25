const fs = require("fs");
const path = require("path");

async function main() {
  const jwt = process.env.PINATA_JWT;
  const target = process.env.UPLOAD_PATH || path.join(process.cwd(), "build", "metadata");
  if (!jwt) throw new Error("Set PINATA_JWT.");
  if (!fs.existsSync(target)) throw new Error(`Missing upload path: ${target}`);

  const files = fs.statSync(target).isDirectory() ? walk(target) : [target];
  const form = new FormData();
  for (const file of files) {
    const rel = fs.statSync(target).isDirectory() ? path.relative(target, file).replace(/\\/g, "/") : path.basename(file);
    form.append("file", new Blob([fs.readFileSync(file)]), rel);
  }
  form.append("pinataMetadata", JSON.stringify({ name: process.env.PINATA_NAME || path.basename(target) }));

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: form
  });

  if (!response.ok) throw new Error(`Pinata upload failed: ${response.status} ${await response.text()}`);
  console.log(await response.text());
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
