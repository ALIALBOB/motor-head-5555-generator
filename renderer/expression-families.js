// The 93 MotorHead expressions grouped into 10 readable face families.
// Used by (a) the renderer — the "Expression" trait is served as the family, so the OpenSea filter
// is 10 clean values instead of 93; and (b) addScreenExpression — which face to draw.
// Balanced so no family is a catch-all. familyOf(name) falls back to "Neutral" for anything new.

const FAMILY_NAMES = {
  Happy: ["Happy", "Charge Smile", "Dial Smile", "Field Smile", "Moon Smile", "Bullish Blink", "Warm Glow", "Jackpot", "Wild Spin", "Market Flash"],
  Smirk: ["Smirk"],
  Angry: ["Angry Hands", "Boiling Core", "Overheated", "Overcharged", "Overload", "Redline", "High Voltage", "Storm Charge", "Suit Warning", "Warning Slash", "Ink Warning"],
  Sad: ["Bored Signal", "Bored Lens", "Low Pressure", "Rust Breath", "Dim Signal", "Overexposed"],
  Sleepy: ["Sleep Mode", "Sleep Shutter", "Sleepy Hands", "Cold Storage", "Low Battery", "Low Cell", "Deep Fluid", "Deep Cycle"],
  Surprised: ["Signal Found", "Warning", "Warning Flash", "Awake Signal", "BTC Awake", "ETH Awake", "Blue Spark", "South Spark", "Signal Ping", "Needle Tick", "Pressure Watch"],
  Focus: ["Focus Idle", "Focus Lock", "Loading", "Busy Signal", "Broadcasting", "Archive Screening", "Archive Guard", "Gas Oracle", "Vault Sync", "Merge Blink", "Locked Flow", "Storm Focus", "Typing"],
  Glitch: ["Glitch", "Static", "Noise Burst", "Flicker", "Broken Bolt", "Broken Time", "Cracked Glass", "Paper Jam", "Polarity Flip", "Seed Glitch"],
  Dead: ["Dead Air", "Dead Signal", "Disconnected", "No Answer", "Lost Signal", "Lost Orbit", "Lost Coordinates"],
  Neutral: ["Calm Bubbles", "Calm Diver", "Calm Ronin", "Idle Reels", "Idle Stitch", "Midnight Mode", "Orbital Calm", "Arc Idle", "Reel Blink", "Steam Ready", "Pressure Twist", "Archive Note", "Archive Light", "Deep Archive", "Deep Orbit", "North Pull"],
};

const NAME_TO_FAMILY = {};
for (const [fam, names] of Object.entries(FAMILY_NAMES)) for (const n of names) NAME_TO_FAMILY[n] = fam;

function familyOf(expression) {
  return NAME_TO_FAMILY[String(expression || "").trim()] || "Neutral";
}

module.exports = { FAMILY_NAMES, familyOf };
