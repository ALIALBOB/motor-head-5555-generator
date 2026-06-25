const fs = require("fs");
const path = require("path");

fs.mkdirSync(path.join(process.cwd(), "build", "ipfs"), { recursive: true });
