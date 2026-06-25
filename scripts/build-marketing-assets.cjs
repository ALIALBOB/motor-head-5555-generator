const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = process.cwd();
const imagesDir = path.join(root, "build", "images");
const outDir = path.join(root, "marketing", "assets");

fs.mkdirSync(outDir, { recursive: true });

const tokenIds = [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 58, 111, 222, 333, 444, 555, 888, 1337, 2026, 3333, 4444, 5555];

function img(tokenId) {
  return path.join(imagesDir, `${tokenId}.jpg`);
}

function svgText({ width, height, title, kicker = "", body = "", align = "left", dark = true }) {
  const fg = dark ? "#f7efe0" : "#161510";
  const muted = dark ? "#d7b869" : "#66512c";
  const x = align === "center" ? width / 2 : 72;
  const anchor = align === "center" ? "middle" : "start";
  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .k { font: 700 28px Arial, sans-serif; letter-spacing: 3px; fill: ${muted}; }
        .t { font: 900 86px Arial, sans-serif; fill: ${fg}; }
        .b { font: 600 30px Arial, sans-serif; fill: ${fg}; opacity: .86; }
      </style>
      ${kicker ? `<text class="k" x="${x}" y="${height - 178}" text-anchor="${anchor}">${kicker}</text>` : ""}
      <text class="t" x="${x}" y="${height - 104}" text-anchor="${anchor}">${title}</text>
      ${body ? `<text class="b" x="${x}" y="${height - 56}" text-anchor="${anchor}">${body}</text>` : ""}
    </svg>`);
}

async function squareIcon() {
  await sharp(img(1))
    .resize(1000, 1000, { fit: "cover", position: "center" })
    .modulate({ saturation: 1.08, brightness: 1.03 })
    .composite([
      {
        input: Buffer.from(`<svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg">
          <rect x="28" y="28" width="944" height="944" rx="26" fill="none" stroke="#f3c243" stroke-width="18"/>
          <rect x="52" y="52" width="896" height="896" rx="18" fill="none" stroke="#111" stroke-opacity=".5" stroke-width="4"/>
        </svg>`)
      }
    ])
    .png()
    .toFile(path.join(outDir, "opensea-collection-icon.png"));
}

async function launchCard() {
  const canvas = sharp({
    create: {
      width: 1600,
      height: 900,
      channels: 4,
      background: "#11100d"
    }
  });
  const composites = [
    { input: await sharp(img(1)).resize(650, 650, { fit: "cover" }).png().toBuffer(), left: 892, top: 118 },
    { input: await sharp(img(58)).resize(370, 370, { fit: "cover" }).modulate({ brightness: 0.82, saturation: 1.15 }).png().toBuffer(), left: 694, top: 406 },
    { input: await sharp(img(2)).resize(290, 290, { fit: "cover" }).modulate({ brightness: 0.78, saturation: 1.12 }).png().toBuffer(), left: 1212, top: 538 },
    {
      input: Buffer.from(`<svg width="1600" height="900" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="g" cx="70%" cy="35%" r="65%">
            <stop offset="0" stop-color="#87591a" stop-opacity=".54"/>
            <stop offset=".5" stop-color="#16110a" stop-opacity=".25"/>
            <stop offset="1" stop-color="#060605" stop-opacity=".96"/>
          </radialGradient>
        </defs>
        <rect width="1600" height="900" fill="url(#g)"/>
        <rect x="888" y="114" width="658" height="658" fill="none" stroke="#f3c243" stroke-opacity=".38" stroke-width="4"/>
        <rect x="690" y="402" width="378" height="378" fill="none" stroke="#f3c243" stroke-opacity=".28" stroke-width="3"/>
        <rect x="1208" y="534" width="298" height="298" fill="none" stroke="#f3c243" stroke-opacity=".28" stroke-width="3"/>
        <path d="M80 724 H760" stroke="#f3c243" stroke-width="3" stroke-opacity=".7"/>
        <text x="78" y="166" font-family="Arial" font-size="34" font-weight="800" fill="#f3c243" letter-spacing="5">5555 INTERACTIVE MACHINE HEADS</text>
        <text x="78" y="282" font-family="Arial" font-size="112" font-weight="900" fill="#fff4d5">MotorHeads</text>
        <text x="82" y="350" font-family="Arial" font-size="34" font-weight="700" fill="#f7efe0">assemble them, wake them, collect the machine</text>
        <text x="82" y="790" font-family="Arial" font-size="31" font-weight="800" fill="#fff4d5">First 10 are treasury gold. 55 full-gold editions total.</text>
      </svg>`)
    }
  ];
  await canvas.composite(composites).jpeg({ quality: 94 }).toFile(path.join(outDir, "x-launch-card.jpg"));
}

async function banner() {
  const bg = sharp({
    create: { width: 2400, height: 800, channels: 4, background: "#0f0d0a" }
  });
  const picks = [1, 2, 3, 4, 5, 6, 7];
  const composites = [];
  for (let i = 0; i < picks.length; i += 1) {
    composites.push({
      input: await sharp(img(picks[i]))
        .resize(420, 420, { fit: "cover" })
        .modulate({ brightness: 0.9, saturation: 1.16 })
        .png()
        .toBuffer(),
      left: 560 + i * 238,
      top: 210 + (i % 2) * 34
    });
  }
  composites.push({
    input: Buffer.from(`<svg width="2400" height="800" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fade" x1="0" x2="1">
          <stop offset="0" stop-color="#090806"/>
          <stop offset=".32" stop-color="#090806" stop-opacity=".82"/>
          <stop offset=".62" stop-color="#090806" stop-opacity=".26"/>
          <stop offset="1" stop-color="#090806" stop-opacity=".7"/>
        </linearGradient>
      </defs>
      <rect width="2400" height="800" fill="url(#fade)"/>
      <text x="82" y="228" font-family="Arial" font-size="58" font-weight="900" fill="#f3c243" letter-spacing="8">MOTORHEADS</text>
      <text x="82" y="326" font-family="Arial" font-size="48" font-weight="800" fill="#fff4d5">living archive machines</text>
      <text x="82" y="390" font-family="Arial" font-size="30" font-weight="700" fill="#d6c191">interactive assembly NFTs on Ethereum</text>
      <path d="M82 446 H720" stroke="#f3c243" stroke-width="5" stroke-opacity=".7"/>
      <text x="82" y="512" font-family="Arial" font-size="26" font-weight="800" fill="#fff4d5">5,555 supply · 55 full-gold editions</text>
    </svg>`)
  });
  await bg.composite(composites).jpeg({ quality: 94 }).toFile(path.join(outDir, "opensea-banner.jpg"));
}

async function holderCard() {
  await sharp({
    create: { width: 1600, height: 900, channels: 4, background: "#0d1412" }
  })
    .composite([
      { input: await sharp(img(333)).resize(530, 530, { fit: "cover" }).png().toBuffer(), left: 930, top: 180 },
      { input: await sharp(img(1)).resize(330, 330, { fit: "cover" }).png().toBuffer(), left: 770, top: 420 },
      { input: svgText({ width: 1600, height: 900, kicker: "OLD COLLECTION HOLDERS", title: "GTD ACCESS", body: "333 archive holders snapshot: 96 wallets" }) }
    ])
    .jpeg({ quality: 94 })
    .toFile(path.join(outDir, "x-gtd-holder-card.jpg"));
}

async function videoStoryboard() {
  const framesDir = path.join(outDir, "video-storyboard-frames");
  fs.mkdirSync(framesDir, { recursive: true });
  const frames = [
    { token: 1, title: "MOTORHEADS", body: "5555 interactive machine heads" },
    { token: 11, title: "DISMANTLE", body: "drag parts into place" },
    { token: 58, title: "55 GOLD", body: "lucky full-gold editions" },
    { token: 333, title: "HOLDER GTD", body: "old collection holders get access" },
    { token: 2026, title: "AWAKEN LATER", body: "website evolution layer after mint" }
  ];
  for (let i = 0; i < frames.length; i += 1) {
    const frame = frames[i];
    await sharp({
      create: { width: 1920, height: 1080, channels: 4, background: "#0f0d0a" }
    })
      .composite([
        { input: await sharp(img(frame.token)).resize(760, 760, { fit: "cover" }).png().toBuffer(), left: 1010, top: 160 },
        { input: svgText({ width: 1920, height: 1080, kicker: `SCENE 0${i + 1}`, title: frame.title, body: frame.body }) }
      ])
      .jpeg({ quality: 94 })
      .toFile(path.join(framesDir, `scene-${String(i + 1).padStart(2, "0")}.jpg`));
  }
}

async function contactSheet() {
  const cell = 300;
  const cols = 6;
  const rows = Math.ceil(tokenIds.length / cols);
  const sheet = sharp({ create: { width: cols * cell, height: rows * cell + 88, channels: 4, background: "#f7f3e8" } });
  const composites = [];
  for (let i = 0; i < tokenIds.length; i += 1) {
    const id = tokenIds[i];
    composites.push({
      input: await sharp(img(id)).resize(cell, cell, { fit: "cover" }).png().toBuffer(),
      left: (i % cols) * cell,
      top: Math.floor(i / cols) * cell
    });
  }
  composites.push({
    input: Buffer.from(`<svg width="${cols * cell}" height="${rows * cell + 88}" xmlns="http://www.w3.org/2000/svg">
      <rect y="${rows * cell}" width="${cols * cell}" height="88" fill="#11100d"/>
      <text x="38" y="${rows * cell + 56}" font-family="Arial" font-size="34" font-weight="900" fill="#f3c243">MotorHeads campaign sample sheet</text>
    </svg>`)
  });
  await sheet.composite(composites).jpeg({ quality: 92 }).toFile(path.join(outDir, "campaign-sample-sheet.jpg"));
}

(async () => {
  await squareIcon();
  await launchCard();
  await banner();
  await holderCard();
  await videoStoryboard();
  await contactSheet();
  console.log(`wrote marketing assets to ${outDir}`);
})();
