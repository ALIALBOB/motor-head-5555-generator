const crypto = require("crypto");
const fs = require("fs");
const https = require("https");
const path = require("path");

const root = process.cwd();
require("dotenv").config({ path: path.join(root, ".env") });

function arg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

function required(name, value) {
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function hmac(key, value, encoding) {
  return crypto.createHmac("sha256", key).update(value, "utf8").digest(encoding);
}

function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    fs.createReadStream(filePath)
      .on("data", (chunk) => hash.update(chunk))
      .on("error", reject)
      .on("end", () => resolve(hash.digest("hex")));
  });
}

function hashString(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function awsDateParts(date = new Date()) {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8)
  };
}

function signingKey(secretAccessKey, dateStamp, region, service) {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

function encodeKey(key) {
  return key.split("/").map(encodeURIComponent).join("/");
}

function canonicalHeaders(headers) {
  return Object.entries(headers)
    .map(([key, value]) => [key.toLowerCase(), String(value).trim().replace(/\s+/g, " ")])
    .sort(([a], [b]) => a.localeCompare(b));
}

function signRequest({ method, endpoint, bucket, key, region, accessKeyId, secretAccessKey, headers, payloadHash }) {
  const url = new URL(endpoint);
  const canonicalUri = `/${bucket}/${encodeKey(key)}`;
  const dateParts = awsDateParts();
  const allHeaders = {
    ...headers,
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": dateParts.amzDate
  };
  const canonical = canonicalHeaders(allHeaders);
  const signedHeaders = canonical.map(([name]) => name).join(";");
  const canonicalHeaderText = canonical.map(([name, value]) => `${name}:${value}\n`).join("");
  const canonicalRequest = [
    method,
    canonicalUri,
    "",
    canonicalHeaderText,
    signedHeaders,
    payloadHash
  ].join("\n");
  const credentialScope = `${dateParts.dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    dateParts.amzDate,
    credentialScope,
    hashString(canonicalRequest)
  ].join("\n");
  const signature = hmac(signingKey(secretAccessKey, dateParts.dateStamp, region, "s3"), stringToSign, "hex");
  return {
    url,
    path: canonicalUri,
    headers: {
      ...allHeaders,
      authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
    }
  };
}

function requestSigned({ method, endpoint, bucket, key, region, accessKeyId, secretAccessKey, headers, payloadHash, bodyPath }) {
  return new Promise((resolve, reject) => {
    const signed = signRequest({ method, endpoint, bucket, key, region, accessKeyId, secretAccessKey, headers, payloadHash });
    const req = https.request({
      method,
      hostname: signed.url.hostname,
      port: signed.url.port || 443,
      path: signed.path,
      headers: signed.headers
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`${method} failed with ${res.statusCode}: ${body}`));
          return;
        }
        resolve({ statusCode: res.statusCode, headers: res.headers, body });
      });
    });
    req.on("error", reject);
    if (bodyPath) {
      fs.createReadStream(bodyPath).pipe(req);
    } else {
      req.end();
    }
  });
}

async function main() {
  const bucketEnv = arg("bucket-env");
  const bucket = required("bucket", arg("bucket", bucketEnv ? process.env[bucketEnv] : process.env.FILEBASE_BUCKET));
  const source = path.resolve(root, required("path", arg("path")));
  const key = arg("key", path.basename(source));
  const endpoint = process.env.FILEBASE_ENDPOINT || "https://s3.filebase.com";
  const region = process.env.FILEBASE_REGION || "us-east-1";
  const accessKeyId = required("AWS_ACCESS_KEY_ID or FILEBASE_ACCESS_KEY", process.env.AWS_ACCESS_KEY_ID || process.env.FILEBASE_ACCESS_KEY);
  const secretAccessKey = required("AWS_SECRET_ACCESS_KEY or FILEBASE_SECRET_KEY", process.env.AWS_SECRET_ACCESS_KEY || process.env.FILEBASE_SECRET_KEY);
  const stat = fs.statSync(source);

  if (!stat.isFile()) throw new Error(`CAR path is not a file: ${source}`);

  console.log(`Hashing ${path.basename(source)} (${Math.round(stat.size / 1024 / 1024)} MB)...`);
  const payloadHash = await hashFile(source);
  console.log(`Uploading CAR to Filebase bucket ${bucket} as ${key}...`);
  const put = await requestSigned({
    method: "PUT",
    endpoint,
    bucket,
    key,
    region,
    accessKeyId,
    secretAccessKey,
    payloadHash,
    bodyPath: source,
    headers: {
      "content-length": stat.size,
      "content-type": "application/vnd.ipld.car",
      "x-amz-meta-import": "car"
    }
  });

  const cidFromPut = put.headers["x-amz-meta-cid"];
  const head = await requestSigned({
    method: "HEAD",
    endpoint,
    bucket,
    key,
    region,
    accessKeyId,
    secretAccessKey,
    payloadHash: "UNSIGNED-PAYLOAD",
    headers: {
      "x-amz-content-sha256": "UNSIGNED-PAYLOAD"
    }
  });
  const cid = cidFromPut || head.headers["x-amz-meta-cid"];
  if (!cid) {
    console.log("Upload completed, but Filebase did not return x-amz-meta-cid yet.");
    console.log("Check the object metadata in the Filebase console, or retry a HEAD request in a moment.");
    return;
  }
  console.log(`FILEBASE_CID=${cid}`);
  console.log(`IPFS_URI=ipfs://${cid}/`);
  console.log(`GATEWAY_URL=https://ipfs.filebase.io/ipfs/${cid}/`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
