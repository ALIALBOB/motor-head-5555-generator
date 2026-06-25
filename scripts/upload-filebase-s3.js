const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function main() {
  const bucket = process.env.FILEBASE_BUCKET;
  const source = process.env.UPLOAD_PATH || path.join(process.cwd(), "build", "metadata");
  const endpoint = process.env.FILEBASE_ENDPOINT || "https://s3.filebase.com";
  if (!bucket) throw new Error("Set FILEBASE_BUCKET. Configure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY for Filebase.");
  if (!fs.existsSync(source)) throw new Error(`Missing upload path: ${source}`);

  const args = ["s3", "sync", source, `s3://${bucket}`, "--endpoint-url", endpoint];
  if (process.env.FILEBASE_DRY_RUN === "1") args.push("--dryrun");

  console.log(`aws ${args.join(" ")}`);
  const result = spawnSync("aws", args, { stdio: "inherit", shell: true });
  if (result.status !== 0) process.exit(result.status || 1);
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
