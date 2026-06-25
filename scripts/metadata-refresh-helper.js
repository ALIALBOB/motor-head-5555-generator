const fs = require("fs");

function main() {
  const contract = process.env.LAM_CONTRACT;
  const chain = process.env.OPENSEA_CHAIN || "ethereum";
  const tokens = process.env.TOKEN_IDS
    ? process.env.TOKEN_IDS.split(",").map((id) => id.trim()).filter(Boolean)
    : [];

  if (!contract || tokens.length === 0) {
    throw new Error("Set LAM_CONTRACT and TOKEN_IDS=1,2,3. This helper prints refresh targets; marketplace support may vary.");
  }

  const urls = tokens.map((tokenId) => `https://api.opensea.io/api/v2/chain/${chain}/contract/${contract}/nfts/${tokenId}/refresh`);
  fs.writeFileSync("build/opensea-refresh-urls.txt", `${urls.join("\n")}\n`);
  for (const url of urls) console.log(url);
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
