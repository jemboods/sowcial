"use strict";
/* Sowcial — frontend for the SowcialFarm contract (BNB Chain mainnet).
   Plain ethers.js v6 (UMD) + window.ethereum. No build step. */

// ---------- Config & ABIs ----------
const CFG = window.SOWCIAL_CONFIG;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const DEPLOYED = CFG.contractAddress && CFG.contractAddress.toLowerCase() !== ZERO_ADDRESS;

// Full ABI of SowcialFarm, copied verbatim from the compiled artifact
// (artifacts/contracts/SowcialFarm.sol/SowcialFarm.json).
const FARM_ABI = [{"inputs":[{"internalType":"address","name":"registry","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"AlreadyClaimed","type":"error"},{"inputs":[],"name":"AlreadyWatered","type":"error"},{"inputs":[],"name":"CannotHelpSelf","type":"error"},{"inputs":[],"name":"EnforcedPause","type":"error"},{"inputs":[],"name":"ExpectedPause","type":"error"},{"inputs":[{"internalType":"uint256","name":"availableAt","type":"uint256"}],"name":"HelpOnCooldown","type":"error"},{"inputs":[],"name":"InvalidCrop","type":"error"},{"inputs":[],"name":"InvalidPlot","type":"error"},{"inputs":[],"name":"NoFarm","type":"error"},{"inputs":[],"name":"NotAgentIdHolder","type":"error"},{"inputs":[{"internalType":"uint64","name":"readyAt","type":"uint64"}],"name":"NotReady","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"inputs":[],"name":"PlotEmpty","type":"error"},{"inputs":[],"name":"PlotOccupied","type":"error"},{"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"farmer","type":"address"},{"indexed":true,"internalType":"uint8","name":"plot","type":"uint8"},{"indexed":false,"internalType":"uint8","name":"cropId","type":"uint8"},{"indexed":false,"internalType":"uint256","name":"pointsEarned","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"produceUnits","type":"uint256"},{"indexed":false,"internalType":"bool","name":"inSeason","type":"bool"}],"name":"Harvested","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"farmer","type":"address"}],"name":"LandClaimed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"helper","type":"address"},{"indexed":true,"internalType":"address","name":"farmer","type":"address"},{"indexed":false,"internalType":"uint256","name":"helperPoints","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"farmerPoints","type":"uint256"}],"name":"NeighborHelped","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Paused","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"farmer","type":"address"},{"indexed":true,"internalType":"uint8","name":"plot","type":"uint8"},{"indexed":false,"internalType":"uint8","name":"cropId","type":"uint8"},{"indexed":false,"internalType":"uint64","name":"readyAt","type":"uint64"}],"name":"Planted","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Unpaused","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"farmer","type":"address"},{"indexed":true,"internalType":"uint8","name":"plot","type":"uint8"}],"name":"Watered","type":"event"},{"inputs":[],"name":"CROP_COUNT","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"HELP_COOLDOWN","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"HELP_POINTS_FARMER","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"HELP_POINTS_HELPER","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"PLOT_COUNT","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"SEASON_DURATION","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"agentIdRegistry","outputs":[{"internalType":"contract IAgentIdRegistry","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"claimLand","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"crops","outputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256","name":"growTime","type":"uint256"},{"internalType":"uint256","name":"basePoints","type":"uint256"},{"internalType":"uint8","name":"season","type":"uint8"},{"internalType":"uint256","name":"yieldUnits","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"currentSeason","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"farmerCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"farmerList","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"farms","outputs":[{"internalType":"bool","name":"claimed","type":"bool"},{"internalType":"uint256","name":"dewpoints","type":"uint256"},{"internalType":"uint256","name":"totalHarvests","type":"uint256"},{"internalType":"uint256","name":"totalProduce","type":"uint256"},{"internalType":"uint256","name":"timesHelped","type":"uint256"},{"internalType":"uint256","name":"timesHelpedBy","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint8","name":"cropId","type":"uint8"}],"name":"getCrop","outputs":[{"components":[{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256","name":"growTime","type":"uint256"},{"internalType":"uint256","name":"basePoints","type":"uint256"},{"internalType":"uint8","name":"season","type":"uint8"},{"internalType":"uint256","name":"yieldUnits","type":"uint256"}],"internalType":"struct SowcialFarm.Crop","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"offset","type":"uint256"},{"internalType":"uint256","name":"limit","type":"uint256"}],"name":"getFarmers","outputs":[{"internalType":"address[]","name":"page","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"farmer","type":"address"}],"name":"getPlots","outputs":[{"components":[{"internalType":"bool","name":"active","type":"bool"},{"internalType":"uint8","name":"cropId","type":"uint8"},{"internalType":"uint64","name":"plantedAt","type":"uint64"},{"internalType":"uint64","name":"readyAt","type":"uint64"},{"internalType":"bool","name":"watered","type":"bool"}],"internalType":"struct SowcialFarm.Plot[9]","name":"","type":"tuple[9]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint8","name":"plot","type":"uint8"}],"name":"harvest","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"farmer","type":"address"}],"name":"helpNeighbor","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"isAgentIdHolder","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"lastHelpAt","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint8","name":"plot","type":"uint8"},{"internalType":"uint8","name":"cropId","type":"uint8"}],"name":"plant","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"seasonStart","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"unpause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint8","name":"plot","type":"uint8"}],"name":"water","outputs":[],"stateMutability":"nonpayable","type":"function"}];

// Minimal Agent ID registry ABI (SPACE ID Agent ID, ERC-721).
const REGISTRY_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function handleOf(address owner) view returns (string)"
];

const SEASONS = [
  { name: "Spring", emoji: "🌸" },
  { name: "Summer", emoji: "☀️" },
  { name: "Autumn", emoji: "🍂" },
  { name: "Winter", emoji: "❄️" }
];

// Static fallback crop data (contract constructor values); refreshed from getCrop() when possible.
const FALLBACK_CROPS = [
  { name: "Turnip",     emoji: "🥬", growTime: 600,   basePoints: 10,  season: 0, yieldUnits: 3 },
  { name: "Star Melon", emoji: "🍈", growTime: 3600,  basePoints: 35,  season: 1, yieldUnits: 4 },
  { name: "Pumpkin",    emoji: "🎃", growTime: 21600, basePoints: 120, season: 2, yieldUnits: 6 }
];
const CROP_EMOJIS = ["🥬", "🍈", "🎃"];
const HELP_COOLDOWN_SECONDS = 86400;

// ---------- State ----------
const state = {
  account: null,          // connected wallet address
  handle: null,           // Agent ID handle (without .ai) for the connected wallet
  isHolder: false,
  myFarm: null,           // normalized farms(account) or null
  viewAddress: null,      // farm currently shown in the grid
  viewFarm: null,         // normalized farms(viewAddress)
  crops: FALLBACK_CROPS.slice(),
  season: null,           // current season index or null if unknown
  busy: false,            // a transaction is in flight
  pickerPlot: null
};
const handleCache = new Map();

// ---------- Providers & contracts ----------
const readProvider = new ethers.JsonRpcProvider(CFG.rpcUrl);
const readFarm = DEPLOYED ? new ethers.Contract(CFG.contractAddress, FARM_ABI, readProvider) : null;
const readRegistry = new ethers.Contract(CFG.registryAddress, REGISTRY_ABI, readProvider);
let walletProvider = null;
let signer = null;
let writeFarm = null;

// ---------- DOM helpers ----------
const $ = (id) => document.getElementById(id);
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function shortAddr(a) { return a ? a.slice(0, 6) + "…" + a.slice(-4) : ""; }
function fmtDuration(totalSeconds) {
  let s = Math.max(0, Math.floor(totalSeconds));
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); const sec = s - m * 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, "0")}s`;
  return `${sec}s`;
}
function fmtClock(ts) { return new Date(ts * 1000).toLocaleString(); }

let toastTimer = null;
function toast(msg, kind) {
  const t = $("toast");
  t.textContent = msg;
  t.className = "toast" + (kind ? " " + kind : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add("hidden"), 6000);
}
function setStatus(msg, isError) {
  const bar = $("statusBar");
  if (!msg) { bar.classList.add("hidden"); bar.textContent = ""; return; }
  bar.textContent = msg;
  bar.className = "status-bar" + (isError ? " error" : "");
}

// ---------- Error handling ----------
const FRIENDLY_ERRORS = {
  NotAgentIdHolder: "This action needs a Binance Agent ID. Claim yours in the Binance App (Wallet → Agent ID banner) — it's free!",
  AlreadyClaimed: "You already claimed your farm — one farm per Agent ID. 🏡",
  NoFarm: "No farm found for that address. Claim a farm first!",
  InvalidPlot: "That plot doesn't exist on a 3×3 farm.",
  InvalidCrop: "That crop doesn't exist.",
  PlotOccupied: "That plot already has a crop growing in it.",
  PlotEmpty: "That plot is empty — plant something first!",
  AlreadyWatered: "That crop has already been watered. 💧",
  CannotHelpSelf: "You can't help your own farm — go visit a neighbor! 🏡",
  EnforcedPause: "The game is currently paused by the team. Please try again soon.",
  OwnableUnauthorizedAccount: "Only the contract owner can do that."
};
function extractRevertData(e) {
  const candidates = [
    e && e.data,
    e && e.error && e.error.data,
    e && e.info && e.info.error && e.info.error.data,
    e && e.info && e.info.error && e.info.error.message,
    e && e.error && e.error.message
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.startsWith("0x")) return c;
  }
  return null;
}
function friendlyError(e) {
  if (!e) return "Something went wrong.";
  if (e.code === 4001 || e.code === "ACTION_REJECTED") return "Transaction rejected in your wallet.";
  const data = extractRevertData(e);
  if (data && readFarm) {
    try {
      const parsed = readFarm.interface.parseError(data);
      if (parsed) {
        if (parsed.name === "NotReady") {
          return `Not ready yet — harvestable at ${fmtClock(Number(parsed.args[0]))}. ⏳`;
        }
        if (parsed.name === "HelpOnCooldown") {
          return `You already helped this neighbor recently — you can help again at ${fmtClock(Number(parsed.args[0]))}. 💧`;
        }
        if (FRIENDLY_ERRORS[parsed.name]) return FRIENDLY_ERRORS[parsed.name];
        return `The farm contract said no: ${parsed.name}.`;
      }
    } catch (_) { /* fall through */ }
  }
  const msg = (e.shortMessage || e.message || "").toString();
  if (/user rejected|denied/i.test(msg)) return "Transaction rejected in your wallet.";
  if (/insufficient funds/i.test(msg)) return "Not enough BNB for gas in this wallet.";
  return msg.length > 180 ? msg.slice(0, 180) + "…" : (msg || "Something went wrong.");
}

// ---------- Normalizers (ethers Results support named + indexed access) ----------
function normFarm(f) {
  if (!f) return null;
  return {
    claimed: f.claimed !== undefined ? f.claimed : f[0],
    dewpoints: Number(f.dewpoints !== undefined ? f.dewpoints : f[1]),
    totalHarvests: Number(f.totalHarvests !== undefined ? f.totalHarvests : f[2]),
    totalProduce: Number(f.totalProduce !== undefined ? f.totalProduce : f[3]),
    timesHelped: Number(f.timesHelped !== undefined ? f.timesHelped : f[4]),
    timesHelpedBy: Number(f.timesHelpedBy !== undefined ? f.timesHelpedBy : f[5])
  };
}
function normPlot(p) {
  return {
    active: p.active !== undefined ? p.active : p[0],
    cropId: Number(p.cropId !== undefined ? p.cropId : p[1]),
    plantedAt: Number(p.plantedAt !== undefined ? p.plantedAt : p[2]),
    readyAt: Number(p.readyAt !== undefined ? p.readyAt : p[3]),
    watered: p.watered !== undefined ? p.watered : p[4]
  };
}
function normCrop(c, i) {
  const fb = FALLBACK_CROPS[i];
  return {
    name: c.name !== undefined ? c.name : c[0],
    growTime: Number(c.growTime !== undefined ? c.growTime : c[1]),
    basePoints: Number(c.basePoints !== undefined ? c.basePoints : c[2]),
    season: Number(c.season !== undefined ? c.season : c[3]),
    yieldUnits: Number(c.yieldUnits !== undefined ? c.yieldUnits : c[4]),
    emoji: (fb && fb.emoji) || CROP_EMOJIS[i] || "🌱"
  };
}

// ---------- Registry helpers ----------
async function fetchHandle(address) {
  if (!address) return null;
  const key = address.toLowerCase();
  if (handleCache.has(key)) return handleCache.get(key);
  let handle = null;
  try {
    const h = await readRegistry.handleOf(address);
    if (h) handle = h;
  } catch (_) { handle = null; }
  handleCache.set(key, handle);
  return handle;
}
async function displayName(address) {
  const h = await fetchHandle(address);
  return h ? `${h}.ai` : shortAddr(address);
}
async function checkHolder(address) {
  if (DEPLOYED && readFarm) {
    try { return await readFarm.isAgentIdHolder(address); } catch (_) { /* fall back to registry */ }
  }
  try { return (await readRegistry.balanceOf(address)) > 0n; } catch (_) { return false; }
}

// ---------- On-chain reads ----------
async function refreshSeasonAndCrops() {
  if (!DEPLOYED) {
    $("seasonBanner").textContent = "🌱 Season starts at launch";
    return;
  }
  try {
    state.season = Number(await readFarm.currentSeason());
    const s = SEASONS[state.season];
    $("seasonBanner").textContent = `${s.emoji} ${s.name} season`;
  } catch (_) {
    $("seasonBanner").textContent = "🌱 Season unavailable";
  }
  try {
    const crops = [];
    for (let i = 0; i < 3; i++) crops.push(normCrop(await readFarm.getCrop(i), i));
    state.crops = crops;
  } catch (_) { /* keep fallback crop data */ }
}

async function refreshMyFarm() {
  const body = $("myFarmBody");
  if (!state.account) {
    body.innerHTML = `<p class="muted">Connect your wallet to claim your farm and start growing.</p>`;
    state.myFarm = null;
    return;
  }
  if (!DEPLOYED) {
    body.innerHTML = `<p class="muted">The farm contract launches soon — your Agent ID <strong>${esc(state.handle ? state.handle + ".ai" : shortAddr(state.account))}</strong> will be ready to claim its farm on day one. 🌾</p>`;
    state.myFarm = null;
    return;
  }
  try {
    state.myFarm = normFarm(await readFarm.farms(state.account));
  } catch (_) {
    state.myFarm = null;
  }
  const f = state.myFarm;
  if (!f || !f.claimed) {
    if (state.isHolder) {
      body.innerHTML = `
        <p>Your Agent ID <strong>${esc(state.handle ? state.handle + ".ai" : shortAddr(state.account))}</strong> doesn’t have a farm yet.</p>
        <button id="claimBtn" class="btn btn-primary btn-big" ${state.busy ? "disabled" : ""}>🏡 Claim your farm — free</button>
        <p class="hint">One farm per Agent ID. Claiming costs only a little BNB gas.</p>`;
      $("claimBtn").addEventListener("click", onClaim);
    } else {
      body.innerHTML = `<p class="muted">This wallet doesn’t hold an Agent ID yet, so it can’t claim a farm. See the note above for how to get one — browsing farms still works!</p>`;
    }
    return;
  }
  body.innerHTML = `
    <div class="stats-grid">
      <div class="stat"><div class="stat-value">💧 ${f.dewpoints}</div><div class="stat-label">Dewpoints</div></div>
      <div class="stat"><div class="stat-value">${f.totalHarvests}</div><div class="stat-label">Harvests</div></div>
      <div class="stat"><div class="stat-value">${f.totalProduce}</div><div class="stat-label">Produce</div></div>
      <div class="stat"><div class="stat-value">${f.timesHelped}</div><div class="stat-label">Neighbors helped</div></div>
      <div class="stat"><div class="stat-value">${f.timesHelpedBy}</div><div class="stat-label">Helped by neighbors</div></div>
    </div>`;
}

function isOwnView() {
  return state.account && state.viewAddress &&
    state.viewAddress.toLowerCase() === state.account.toLowerCase();
}

async function refreshViewFarm() {
  const grid = $("farmGrid");
  const title = $("farmTitle");
  const ownerLine = $("farmOwnerLine");
  const backBtn = $("backToMineBtn");
  if (!state.viewAddress) {
    title.textContent = "🌻 Farm";
    ownerLine.textContent = "";
    backBtn.classList.add("hidden");
    grid.innerHTML = `<p class="muted grid-placeholder">Connect a wallet or visit a neighbor’s farm below to see its plots.</p>`;
    return;
  }
  const name = await displayName(state.viewAddress);
  title.textContent = isOwnView() ? "🌻 My Farm" : `🌻 ${name}’s Farm`;
  ownerLine.textContent = state.viewAddress;
  backBtn.classList.toggle("hidden", isOwnView() || !state.account);
  if (!DEPLOYED) {
    grid.innerHTML = `<p class="muted grid-placeholder">Farms appear here once the contract is live on BNB Chain mainnet. 🚜</p>`;
    return;
  }
  let plots;
  try {
    const raw = await readFarm.getPlots(state.viewAddress);
    plots = Array.from(raw, normPlot);
    state.viewFarm = normFarm(await readFarm.farms(state.viewAddress));
  } catch (e) {
    grid.innerHTML = `<p class="muted grid-placeholder">Couldn’t load this farm: ${esc(friendlyError(e))}</p>`;
    return;
  }
  if (!state.viewFarm || !state.viewFarm.claimed) {
    grid.innerHTML = `<p class="muted grid-placeholder">${esc(name)} hasn’t claimed a farm yet.</p>`;
    return;
  }
  renderGrid(plots);
}

function growthEmoji(plot, progress) {
  if (progress >= 1) return state.crops[plot.cropId].emoji;
  if (progress < 0.34) return "🫘";
  if (progress < 0.67) return "🌱";
  return "🌿";
}

function renderGrid(plots) {
  const grid = $("farmGrid");
  const now = Math.floor(Date.now() / 1000);
  const own = isOwnView();
  const canAct = own && state.isHolder && !state.busy;
  grid.innerHTML = "";
  plots.forEach((plot, i) => {
    const tile = document.createElement("div");
    tile.className = "plot";
    if (!plot.active) {
      tile.classList.add("plot-empty");
      tile.innerHTML = `
        <div class="crop-emoji">🟫</div>
        <div class="plot-label">Empty plot</div>
        ${own ? `<button class="btn btn-primary btn-small" data-plant="${i}" ${canAct ? "" : "disabled"}>🫘 Plant</button>` : ""}`;
    } else {
      const crop = state.crops[plot.cropId] || FALLBACK_CROPS[plot.cropId];
      const total = Math.max(1, plot.readyAt - plot.plantedAt);
      const progress = Math.min(1, Math.max(0, (now - plot.plantedAt) / total));
      const ready = now >= plot.readyAt;
      if (ready) tile.classList.add("plot-ready");
      tile.innerHTML = `
        ${plot.watered ? `<span class="watered-tag" title="Watered — ×1.5 Dewpoints">💧</span>` : ""}
        <div class="crop-emoji">${growthEmoji(plot, progress)}</div>
        <div class="plot-label">${esc(crop.name)}${plot.watered ? " · watered" : ""}</div>
        <div class="progress"><div data-progress data-planted="${plot.plantedAt}" data-ready="${plot.readyAt}" style="width:${Math.round(progress * 100)}%"></div></div>
        ${ready
          ? `<div class="plot-label">✨ Ready to harvest!</div>
             ${own ? `<button class="btn btn-primary btn-small" data-harvest="${i}" ${canAct ? "" : "disabled"}>🧺 Harvest</button>` : ""}`
          : `<div class="countdown" data-countdown data-ready="${plot.readyAt}">⏳ ${fmtDuration(plot.readyAt - now)}</div>
             ${own && !plot.watered ? `<button class="btn btn-secondary btn-small" data-water="${i}" ${canAct ? "" : "disabled"}>💧 Water</button>` : ""}`}`;
    }
    grid.appendChild(tile);
  });
  grid.querySelectorAll("[data-plant]").forEach((b) =>
    b.addEventListener("click", () => openCropPicker(Number(b.dataset.plant))));
  grid.querySelectorAll("[data-water]").forEach((b) =>
    b.addEventListener("click", () => onWater(Number(b.dataset.water))));
  grid.querySelectorAll("[data-harvest]").forEach((b) =>
    b.addEventListener("click", () => onHarvest(Number(b.dataset.harvest))));
}

async function refreshLeaderboard() {
  const box = $("leaderboard");
  if (!DEPLOYED) {
    box.innerHTML = `<p class="muted">The leaderboard sprouts 🌱 once the contract is live and the first farmers claim their land.</p>`;
    return;
  }
  try {
    const count = Number(await readFarm.farmerCount());
    if (count === 0) {
      box.innerHTML = `<p class="muted">No farmers yet — be the first to claim a farm! 🏡</p>`;
      return;
    }
    const addrs = await readFarm.getFarmers(0, 50);
    const now = Math.floor(Date.now() / 1000);
    const rows = await Promise.all(addrs.map(async (addr) => {
      const farm = normFarm(await readFarm.farms(addr));
      const name = await displayName(addr);
      let cooldownLeft = 0;
      if (state.account && addr.toLowerCase() !== state.account.toLowerCase()) {
        try {
          const last = Number(await readFarm.lastHelpAt(state.account, addr));
          if (last > 0) cooldownLeft = Math.max(0, last + HELP_COOLDOWN_SECONDS - now);
        } catch (_) { /* ignore */ }
      }
      return { addr, farm, name, cooldownLeft };
    }));
    rows.sort((a, b) => b.farm.dewpoints - a.farm.dewpoints);
    const canHelp = state.account && state.isHolder && state.myFarm && state.myFarm.claimed && !state.busy;
    let html = `<table class="leaderboard"><thead><tr>
      <th>#</th><th>Farmer</th><th>💧 Dewpoints</th><th>Harvests</th><th></th></tr></thead><tbody>`;
    rows.forEach((r, idx) => {
      const me = state.account && r.addr.toLowerCase() === state.account.toLowerCase();
      let action = "";
      if (!me) {
        if (r.cooldownLeft > 0) {
          action = `<button class="btn btn-ghost btn-small" disabled>💧 Helped · ${fmtDuration(r.cooldownLeft)}</button>`;
        } else {
          action = `<button class="btn btn-secondary btn-small" data-help="${esc(r.addr)}" ${canHelp ? "" : "disabled"} title="${canHelp ? "Help this neighbor (+3 Dewpoints for you, +2 for them)" : "Connect an Agent ID wallet with a farm to help"}">💧 Help</button>`;
        }
        action += ` <button class="btn btn-ghost btn-small" data-visit="${esc(r.addr)}">Visit</button>`;
      }
      html += `<tr class="${me ? "me" : ""}">
        <td>${idx + 1}</td>
        <td><span class="farmer-name">${esc(r.name)}</span><br><span class="farmer-addr">${esc(r.addr)}</span></td>
        <td><strong>${r.farm.dewpoints}</strong></td>
        <td>${r.farm.totalHarvests}</td>
        <td>${action}</td></tr>`;
    });
    html += `</tbody></table>`;
    if (count > 50) html += `<p class="hint">Showing the first 50 farmers of ${count}.</p>`;
    if (!state.account) html += `<p class="hint">Connect your wallet to visit and help neighbors.</p>`;
    else if (!canHelp && !state.busy) html += `<p class="hint">To help neighbors, connect a wallet that holds an Agent ID and claim your farm first.</p>`;
    box.innerHTML = html;
    box.querySelectorAll("[data-help]").forEach((b) =>
      b.addEventListener("click", () => onHelp(b.dataset.help)));
    box.querySelectorAll("[data-visit]").forEach((b) =>
      b.addEventListener("click", () => visitFarm(b.dataset.visit)));
  } catch (e) {
    box.innerHTML = `<p class="muted">Couldn’t load the leaderboard: ${esc(friendlyError(e))}</p>`;
  }
}

async function refreshAll() {
  await refreshSeasonAndCrops();
  await refreshMyFarm();
  if (!state.viewAddress && state.account) state.viewAddress = state.account;
  await refreshViewFarm();
  await refreshLeaderboard();
}

// ---------- Transactions ----------
async function runTx(label, txPromiseFactory, successMsg) {
  if (!writeFarm) { toast("Connect your wallet first.", "error"); return; }
  state.busy = true;
  setStatus(`${label} — confirm in your wallet…`);
  try {
    const tx = await txPromiseFactory();
    setStatus(`${label} sent — waiting for confirmation…`);
    await tx.wait();
    setStatus("");
    toast(successMsg, "success");
  } catch (e) {
    setStatus("");
    toast(friendlyError(e), "error");
  } finally {
    state.busy = false;
    await refreshAll();
  }
}
function onClaim() {
  runTx("Claiming your farm", () => writeFarm.claimLand(), "Farm claimed! Welcome to Sowcial 🏡🌾");
}
function onPlant(plot, cropId) {
  closeCropPicker();
  const crop = state.crops[cropId];
  runTx(`Planting ${crop.name}`, () => writeFarm.plant(plot, cropId), `${crop.emoji} ${crop.name} planted!`);
}
function onWater(plot) {
  runTx("Watering", () => writeFarm.water(plot), "Watered! That crop now earns ×1.5 Dewpoints 💧");
}
function onHarvest(plot) {
  runTx("Harvesting", () => writeFarm.harvest(plot), "Harvested! Dewpoints earned 🧺✨");
}
function onHelp(addr) {
  runTx("Helping neighbor", () => writeFarm.helpNeighbor(addr), "Neighbor helped! +3 Dewpoints for you, +2 for them 💧");
}

// ---------- Crop picker ----------
function openCropPicker(plot) {
  state.pickerPlot = plot;
  $("cropModalPlot").textContent = `#${plot + 1}`;
  const list = $("cropList");
  list.innerHTML = "";
  state.crops.forEach((crop, i) => {
    const inSeason = state.season !== null && crop.season === state.season;
    const btn = document.createElement("button");
    btn.className = "crop-option";
    btn.innerHTML = `
      <span class="crop-emoji">${crop.emoji}</span>
      <span>
        <strong>${esc(crop.name)}</strong><br>
        <span class="crop-meta">⏳ ${fmtDuration(crop.growTime)} · 💧 ${crop.basePoints} pts · 🧺 yields ${crop.yieldUnits} · ${SEASONS[crop.season].emoji} ${SEASONS[crop.season].name} crop</span><br>
        <span class="crop-meta">${inSeason ? "In season now — full points!" : "Out of season now — harvest pays half points."}</span>
      </span>
      <span class="season-tag ${inSeason ? "in" : "out"}">${inSeason ? "IN SEASON" : "½ POINTS"}</span>`;
    btn.addEventListener("click", () => onPlant(plot, i));
    list.appendChild(btn);
  });
  $("cropModal").classList.remove("hidden");
}
function closeCropPicker() { $("cropModal").classList.add("hidden"); }

// ---------- Visit ----------
async function visitFarm(addr) {
  if (!ethers.isAddress(addr)) { toast("That doesn't look like a valid address.", "error"); return; }
  state.viewAddress = ethers.getAddress(addr);
  window.scrollTo({ top: $("farmTitle").offsetTop - 90, behavior: "smooth" });
  await refreshViewFarm();
}
$("visitBtn").addEventListener("click", () => visitFarm($("visitInput").value.trim()));
$("visitInput").addEventListener("keydown", (e) => { if (e.key === "Enter") visitFarm($("visitInput").value.trim()); });
$("backToMineBtn").addEventListener("click", async () => {
  if (state.account) { state.viewAddress = state.account; await refreshViewFarm(); }
});

// ---------- Wallet ----------
async function ensureBnbChain() {
  const chainIdHex = "0x" + CFG.chainId.toString(16);
  const current = await window.ethereum.request({ method: "eth_chainId" });
  if (current.toLowerCase() === chainIdHex.toLowerCase()) return;
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainIdHex }] });
  } catch (e) {
    if (e.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: chainIdHex,
          chainName: "BNB Smart Chain",
          nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
          rpcUrls: ["https://bsc-dataseed.binance.org"],
          blockExplorerUrls: ["https://bscscan.com"]
        }]
      });
    } else {
      throw e;
    }
  }
}

async function connectWallet() {
  if (!window.ethereum) {
    toast("No wallet found. Open this page in the Binance App or a browser with a Web3 wallet (e.g. MetaMask / Binance Wallet).", "error");
    return;
  }
  try {
    setStatus("Connecting wallet…");
    await ensureBnbChain();
    walletProvider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await walletProvider.send("eth_requestAccounts", []);
    signer = await walletProvider.getSigner();
    state.account = ethers.getAddress(accounts[0]);
    if (DEPLOYED) writeFarm = new ethers.Contract(CFG.contractAddress, FARM_ABI, signer);
    state.handle = await fetchHandle(state.account);
    state.isHolder = await checkHolder(state.account);
    state.viewAddress = state.account;
    renderWalletBox();
    setStatus("");
    toast(state.isHolder ? `Welcome, ${state.handle ? state.handle + ".ai" : shortAddr(state.account)}! 🌾` : "Wallet connected (no Agent ID found).", state.isHolder ? "success" : "");
    await refreshAll();
  } catch (e) {
    setStatus("");
    toast(friendlyError(e), "error");
  }
}

function renderWalletBox() {
  const btn = $("connectBtn");
  const info = $("walletInfo");
  if (!state.account) {
    btn.textContent = "Connect Wallet";
    info.classList.add("hidden");
    $("holderNotice").classList.add("hidden");
    return;
  }
  btn.textContent = "Connected ✓";
  info.classList.remove("hidden");
  $("walletName").textContent = state.handle ? `${state.handle}.ai` : shortAddr(state.account);
  const badge = $("walletBadge");
  badge.textContent = state.isHolder ? "🪪 Agent ID holder" : "No Agent ID";
  badge.className = "badge " + (state.isHolder ? "badge-yes" : "badge-no");
  $("holderNotice").classList.toggle("hidden", state.isHolder);
}

$("connectBtn").addEventListener("click", connectWallet);
if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => window.location.reload());
  window.ethereum.on("chainChanged", () => window.location.reload());
}

// ---------- Tickers ----------
setInterval(() => {
  // Live countdowns + progress bars between chain refreshes.
  const now = Math.floor(Date.now() / 1000);
  document.querySelectorAll("[data-countdown]").forEach((el) => {
    const ready = Number(el.dataset.ready);
    el.textContent = ready - now > 0 ? `⏳ ${fmtDuration(ready - now)}` : "✨ Ready!";
  });
  document.querySelectorAll("[data-progress]").forEach((el) => {
    const planted = Number(el.dataset.planted);
    const ready = Number(el.dataset.ready);
    const pct = Math.min(100, Math.max(0, ((now - planted) / Math.max(1, ready - planted)) * 100));
    el.style.width = pct + "%";
  });
}, 1000);
setInterval(() => { refreshAll().catch(() => {}); }, 15000);

// ---------- Init ----------
(function init() {
  $("bscscanLink").href = `https://bscscan.com/address/${CFG.contractAddress}`;
  if (!DEPLOYED) $("deployNotice").classList.remove("hidden");
  $("cropModalClose").addEventListener("click", closeCropPicker);
  $("cropModal").addEventListener("click", (e) => { if (e.target === $("cropModal")) closeCropPicker(); });
  refreshAll().catch(() => {});
})();
