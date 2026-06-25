/*
  Layout data remains the full off-chain creative state. The chain stores only
  compact references such as layoutURI, layoutHash, and partCount.
*/

export const LIQUID_TYPES = [
  "Deep Teal Oil",
  "Blue Coolant",
  "Red Pressure",
  "Green Biofluid",
  "Gold Resin",
  "Silver Mercury",
  "Purple Ether",
  "Rust Sludge",
  "Cosmic Aurora",
  "Nebula Ink",
  "Deep Core Magma",
  "Geode Brine",
  "Abyssal Glow",
  "Starlight Mercury",
  "Root Amber",
  "Void Bloom"
];

export const LIQUID_TEXTURES = [
  "Smooth",
  "Bubbly",
  "Molten",
  "Metallic",
  "Slimy",
  "Electric",
  "Smoky",
  "Crystal",
  "Starfield",
  "Mineral Vein",
  "Luminous",
  "Ancient Sediment"
];

export const MATERIAL_OPTIONS = [
  { id: "graphiteInk", label: "Graphite Ink" },
  { id: "blueprintSteel", label: "Blueprint Steel" },
  { id: "brass", label: "Brass" },
  { id: "copper", label: "Copper" },
  { id: "rustedIron", label: "Rusted Iron" },
  { id: "blackChrome", label: "Black Chrome" },
  { id: "boneWhite", label: "Bone White" },
  { id: "goldRelic", label: "Gold Relic" },
  { id: "glass", label: "Glass" },
  { id: "dirtyGlass", label: "Dirty Glass" },
  { id: "archiveTeal", label: "Archive Teal" },
  { id: "pfpBlack", label: "PFP Black" },
  { id: "pfpGold", label: "PFP Gold" },
  { id: "fullGold", label: "Full Gold Edition" },
  { id: "darkGold", label: "Dark Gold Shadow" },
  { id: "goldenGlow", label: "Golden Glow" },
  { id: "pfpSteel", label: "PFP Steel" },
  { id: "pfpGlow", label: "PFP Glow" },
  { id: "pfpFace", label: "PFP Face" }
];

export const SHADE_STYLES = [
  { id: "cleanLine", label: "Clean Line" },
  { id: "pencilSketch", label: "Pencil Sketch" },
  { id: "crosshatch", label: "Crosshatch" },
  { id: "stippleDots", label: "Stipple Dots" },
  { id: "blueprintFade", label: "Blueprint Fade" },
  { id: "heavyInk", label: "Heavy Ink" },
  { id: "rustWash", label: "Rust Wash" },
  { id: "terminalGlow", label: "Terminal Glow" }
];

export const CANVAS_MODES = [
  { id: "tealPfp", label: "Teal PFP" },
  { id: "whiteBlueprint", label: "White Blueprint" },
  { id: "darkTerminal", label: "Deep Teal Terminal" },
  { id: "rustArchive", label: "Rust Archive" },
  { id: "labGlass", label: "Lab Glass" },
  { id: "relic", label: "Relic" }
];

export const MATERIALS = {
  graphiteInk: {
    label: "Graphite Ink",
    stroke: "#171b1d",
    fill: "rgba(18, 22, 25, 0.04)",
    dim: "#5c6468",
    tint: "rgba(20,24,27,0.16)",
    highlight: "rgba(255,255,255,0.34)"
  },
  blueprintSteel: {
    label: "Blueprint Steel",
    stroke: "#17384a",
    fill: "rgba(40, 120, 159, 0.095)",
    dim: "#28789f",
    tint: "rgba(40,120,159,0.22)",
    highlight: "rgba(196,239,255,0.38)"
  },
  brass: {
    label: "Brass",
    stroke: "#3f2a08",
    fill: "rgba(180, 130, 38, 0.24)",
    dim: "#b98528",
    tint: "rgba(210,151,42,0.32)",
    highlight: "rgba(255,232,139,0.48)",
    edge: "rgba(255,211,104,0.52)",
    metal: true,
    grit: "rgba(80,48,12,0.16)"
  },
  copper: {
    label: "Copper",
    stroke: "#55200f",
    fill: "rgba(200, 84, 38, 0.24)",
    dim: "#c95d2f",
    tint: "rgba(221,92,45,0.34)",
    highlight: "rgba(255,190,126,0.42)",
    edge: "rgba(255,132,65,0.46)",
    metal: true,
    grit: "rgba(96,38,14,0.2)"
  },
  pressureRed: {
    label: "Pressure Red",
    stroke: "#4a0907",
    fill: "rgba(205, 36, 28, 0.28)",
    dim: "#d8322b",
    tint: "rgba(235,52,42,0.36)",
    highlight: "rgba(255,176,126,0.5)",
    edge: "rgba(255,94,72,0.56)",
    innerGlow: "rgba(255,56,42,0.2)",
    metal: true,
    grit: "rgba(112,20,12,0.22)"
  },
  signalGreen: {
    label: "Signal Green",
    stroke: "#082b1f",
    fill: "rgba(58, 195, 104, 0.2)",
    dim: "#3ce070",
    tint: "rgba(68,232,126,0.32)",
    highlight: "rgba(198,255,204,0.5)",
    edge: "rgba(108,255,159,0.44)",
    innerGlow: "rgba(84,255,143,0.18)",
    glass: true,
    grit: "rgba(10,70,36,0.14)"
  },
  rustedIron: {
    label: "Rusted Iron",
    stroke: "#32251e",
    fill: "rgba(92, 58, 38, 0.14)",
    dim: "#89522e",
    tint: "rgba(137,82,46,0.25)",
    highlight: "rgba(255,194,129,0.2)",
    grit: "rgba(118,52,23,0.26)"
  },
  blackChrome: {
    label: "Black Chrome",
    stroke: "#030506",
    fill: "rgba(12, 24, 26, 0.16)",
    dim: "#263238",
    tint: "rgba(9,34,34,0.24)",
    highlight: "rgba(218,245,255,0.38)",
    edge: "rgba(145,188,198,0.32)",
    metal: true,
    grit: "rgba(0,0,0,0.1)"
  },
  boneWhite: {
    label: "Bone White",
    stroke: "#36342e",
    fill: "rgba(231, 224, 202, 0.18)",
    dim: "#9b927d",
    tint: "rgba(226,215,186,0.22)",
    highlight: "rgba(255,255,239,0.42)"
  },
  goldRelic: {
    label: "Gold Relic",
    stroke: "#5c4214",
    fill: "rgba(210, 151, 34, 0.26)",
    dim: "#d29c2d",
    tint: "rgba(229,170,42,0.34)",
    highlight: "rgba(255,239,148,0.5)",
    edge: "rgba(255,214,90,0.48)",
    metal: true,
    grit: "rgba(98,59,15,0.2)"
  },
  glass: {
    label: "Glass",
    stroke: "#14596d",
    fill: "rgba(75, 205, 230, 0.12)",
    dim: "#34aac6",
    tint: "rgba(77,220,244,0.22)",
    highlight: "rgba(255,255,255,0.6)",
    edge: "rgba(112,255,238,0.42)",
    innerGlow: "rgba(64,255,225,0.12)",
    glass: true
  },
  dirtyGlass: {
    label: "Dirty Glass",
    stroke: "#34484a",
    fill: "rgba(69, 124, 112, 0.14)",
    dim: "#507f74",
    tint: "rgba(95,142,122,0.24)",
    highlight: "rgba(235,255,238,0.36)",
    edge: "rgba(169,224,198,0.26)",
    innerGlow: "rgba(58,212,183,0.08)",
    grit: "rgba(74,61,42,0.22)",
    glass: true
  },
  cyanGlass: {
    label: "Cyan Glass",
    stroke: "#07535e",
    fill: "rgba(26, 214, 205, 0.17)",
    dim: "#24d7d0",
    tint: "rgba(29,232,217,0.28)",
    highlight: "rgba(224,255,250,0.62)",
    edge: "rgba(94,255,231,0.52)",
    innerGlow: "rgba(34,255,226,0.18)",
    glass: true
  },
  violetGlass: {
    label: "Violet Ether Glass",
    stroke: "#251342",
    fill: "rgba(110, 64, 190, 0.18)",
    dim: "#9c75ff",
    tint: "rgba(126,74,220,0.28)",
    highlight: "rgba(230,214,255,0.5)",
    edge: "rgba(194,142,255,0.5)",
    innerGlow: "rgba(160,92,255,0.2)",
    glass: true
  },
  amberGlass: {
    label: "Amber Resin Glass",
    stroke: "#5b2a0e",
    fill: "rgba(219, 101, 30, 0.2)",
    dim: "#ff8a37",
    tint: "rgba(255,126,44,0.3)",
    highlight: "rgba(255,218,128,0.5)",
    edge: "rgba(255,136,52,0.5)",
    innerGlow: "rgba(255,112,35,0.18)",
    grit: "rgba(110,42,12,0.16)",
    glass: true
  },
  mercuryGlass: {
    label: "Mercury Glass",
    stroke: "#33434a",
    fill: "rgba(196, 218, 226, 0.18)",
    dim: "#d7edf5",
    tint: "rgba(205,230,238,0.3)",
    highlight: "rgba(255,255,255,0.68)",
    edge: "rgba(180,231,246,0.42)",
    innerGlow: "rgba(228,255,255,0.16)",
    glass: true,
    metal: true
  },
  voidGlass: {
    label: "Void Glass",
    stroke: "#09060f",
    fill: "rgba(24, 12, 36, 0.24)",
    dim: "#39244f",
    tint: "rgba(28,15,42,0.38)",
    highlight: "rgba(190,158,255,0.3)",
    edge: "rgba(129,76,210,0.32)",
    innerGlow: "rgba(148,68,255,0.12)",
    glass: true,
    grit: "rgba(0,0,0,0.18)"
  },
  reactorGlass: {
    label: "Reactor Blue Glass",
    stroke: "#063f57",
    fill: "rgba(0, 137, 210, 0.18)",
    dim: "#1db8ff",
    tint: "rgba(0,168,232,0.3)",
    highlight: "rgba(198,246,255,0.56)",
    edge: "rgba(79,225,255,0.52)",
    innerGlow: "rgba(0,210,255,0.2)",
    glass: true
  },
  archiveTeal: {
    label: "Archive Teal",
    stroke: "#0a342f",
    fill: "rgba(33, 122, 111, 0.2)",
    dim: "#2aa996",
    tint: "rgba(41,160,142,0.28)",
    highlight: "rgba(180,255,235,0.4)",
    edge: "rgba(78,232,205,0.32)",
    grit: "rgba(10,48,42,0.18)",
    metal: true
  },
  pfpBlack: {
    label: "PFP Black",
    stroke: "#0c1516",
    fill: "rgba(20, 34, 35, 0.32)",
    dim: "#26383a",
    tint: "rgba(8,42,40,0.24)",
    highlight: "rgba(195,235,228,0.34)",
    edge: "rgba(88,150,150,0.24)",
    grit: "rgba(0,0,0,0.12)",
    metal: true
  },
  pfpGold: {
    label: "PFP Gold",
    stroke: "#3a2608",
    fill: "rgba(226, 157, 26, 0.48)",
    dim: "#d49b2f",
    tint: "rgba(236,174,42,0.48)",
    highlight: "rgba(255,232,120,0.58)",
    edge: "rgba(255,207,82,0.52)",
    metal: true,
    grit: "rgba(88,52,12,0.22)"
  },
  fullGold: {
    label: "Full Gold Edition",
    stroke: "#2f1c05",
    fill: "rgba(231, 166, 31, 0.58)",
    dim: "#c5871e",
    tint: "rgba(246,183,43,0.58)",
    highlight: "rgba(255,244,166,0.72)",
    edge: "rgba(255,204,69,0.68)",
    innerGlow: "rgba(255,198,58,0.16)",
    metal: true,
    grit: "rgba(72,42,10,0.24)"
  },
  darkGold: {
    label: "Dark Gold Shadow",
    stroke: "#1c1205",
    fill: "rgba(83, 56, 15, 0.62)",
    dim: "#8b6420",
    tint: "rgba(101,68,18,0.5)",
    highlight: "rgba(218,166,58,0.36)",
    edge: "rgba(255,190,65,0.3)",
    metal: true,
    grit: "rgba(0,0,0,0.22)"
  },
  goldenGlow: {
    label: "Golden Glow",
    stroke: "#6b4108",
    fill: "rgba(255, 204, 67, 0.26)",
    dim: "#ffd65d",
    tint: "rgba(255,210,68,0.42)",
    highlight: "rgba(255,252,206,0.78)",
    edge: "rgba(255,224,104,0.66)",
    innerGlow: "rgba(255,205,68,0.28)",
    glass: true,
    metal: true
  },
  pfpSteel: {
    label: "PFP Steel",
    stroke: "#16232a",
    fill: "rgba(116, 146, 154, 0.38)",
    dim: "#6f8992",
    tint: "rgba(139,168,176,0.36)",
    highlight: "rgba(235,255,255,0.34)",
    edge: "rgba(184,224,234,0.34)",
    metal: true,
    grit: "rgba(18,26,31,0.18)"
  },
  pfpGlow: {
    label: "PFP Glow",
    stroke: "#0c5660",
    fill: "rgba(70, 255, 207, 0.18)",
    dim: "#46ffcf",
    tint: "rgba(70,255,207,0.34)",
    highlight: "rgba(222,255,245,0.62)",
    glass: true
  },
  pfpScreen: {
    label: "PFP Screen",
    stroke: "#020908",
    fill: "rgba(2, 15, 13, 0.72)",
    dim: "#0f2b28",
    tint: "rgba(0,0,0,0.62)",
    highlight: "rgba(84,255,210,0.18)",
    grit: "rgba(0,0,0,0.24)",
    glass: true
  },
  pfpFace: {
    label: "PFP Face Glow",
    stroke: "#baffdf",
    fill: "rgba(155, 255, 205, 0.72)",
    dim: "#76ffc4",
    tint: "rgba(132,255,197,0.48)",
    highlight: "rgba(245,255,238,0.74)"
  },

  /* Legacy aliases kept for old saved layouts. */
  ink: { stroke: "#171b1d", fill: "rgba(18, 22, 25, 0.04)", dim: "#5c6468", tint: "rgba(20,24,27,0.16)", highlight: "rgba(255,255,255,0.34)" },
  iron: { stroke: "#32251e", fill: "rgba(92, 58, 38, 0.14)", dim: "#89522e", tint: "rgba(137,82,46,0.25)", highlight: "rgba(255,194,129,0.2)", grit: "rgba(118,52,23,0.26)" },
  black: { stroke: "#090b0d", fill: "rgba(0, 0, 0, 0.14)", dim: "#3b4246", tint: "rgba(0,0,0,0.28)", highlight: "rgba(180,210,220,0.34)" },
  gold: { stroke: "#5c4214", fill: "rgba(184, 139, 32, 0.18)", dim: "#b88b20", tint: "rgba(214,161,37,0.27)", highlight: "rgba(255,239,148,0.38)", grit: "rgba(98,59,15,0.18)" },
  blueSteel: { stroke: "#17384a", fill: "rgba(40, 120, 159, 0.095)", dim: "#28789f", tint: "rgba(40,120,159,0.22)", highlight: "rgba(196,239,255,0.38)" },
  bone: { stroke: "#36342e", fill: "rgba(231, 224, 202, 0.18)", dim: "#9b927d", tint: "rgba(226,215,186,0.22)", highlight: "rgba(255,255,239,0.42)" }
};

export const LIQUID_PALETTE = [
  "#0a5d58", "#249bd4", "#ff553f", "#45d87a", "#ffb833", "#d9edf7",
  "#9b68ff", "#9b5729", "#63e7ff", "#7d42db", "#ff6d24", "#4ef2c3",
  "#009fe3", "#ecf8ff", "#d48435", "#2b123f"
];

export const LIQUID_ACCENTS = [
  "#9ff8e7", "#b9f2ff", "#ffb27a", "#b4ffc8", "#fff07b", "#ffffff",
  "#dac2ff", "#e59a52", "#f5ff9f", "#e9a2ff", "#ffd87a", "#c9ffef",
  "#71ffff", "#ffffff", "#ffd39a", "#ff69d8"
];

export const LIQUID_GLOWS = [
  "rgba(24,198,181,0.34)",
  "rgba(36,155,212,0.48)",
  "rgba(255,85,63,0.48)",
  "rgba(69,216,122,0.42)",
  "rgba(255,184,51,0.44)",
  "rgba(217,237,247,0.48)",
  "rgba(155,104,255,0.48)",
  "rgba(155,87,41,0.36)",
  "rgba(99,231,255,0.58)",
  "rgba(125,66,219,0.5)",
  "rgba(255,109,36,0.58)",
  "rgba(78,242,195,0.5)",
  "rgba(0,190,230,0.52)",
  "rgba(236,248,255,0.52)",
  "rgba(212,132,53,0.46)",
  "rgba(255,74,210,0.5)"
];
