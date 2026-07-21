import { CRITTERS, CAT_TYPES, PROPS, EMOTION_SPRITES, INTERACTIONS } from "./critter-sprites.js";

// Global frame-rate damper — cats were spazzing; everything animates calmer.
const CALM = 0.55;
const TARGET_POPULATION = 8; // 25% fewer than the old 10
// Respawn after a random delay (not a fixed beat) so cats don't reappear in
// waves. Lifespans are wide and per-cat for the same reason.
const RESPAWN_MIN = 2500;
const RESPAWN_MAX = 12000;
const LIFESPAN_MIN = 18000;
const LIFESPAN_MAX = 52000;
const EDGE_X = 3.5; // % clear buffer from left/right screen edges before a cat stops
const EDGE_Y = 5; // % clear buffer from top/bottom screen edges
const ZONE_PAD = 1.2; // % padding around the white boxes for stop-target rejection
// NOTE: emote / relocate / sun / interact odds are now PER CAT (rolled in
// spawnCat), so the corral never acts in lock-step.

// Per-color "activity" — some breeds are lazy, some hyper. Modulates idle
// dwell time, relocate frequency, and travel speed.
const COLOR_ENERGY = {
  catWhite: 1.0,
  catBlack: 1.1,
  catCalico: 1.0,
  catCalicoTrue: 0.95,
  catGreyTabby: 0.88,
  catOrange: 1.28,
  catSiamese: 0.72,
  catSolidGrey: 0.82,
  catTortoiseshell: 1.18,
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Sleep in short chunks so a cat reacts quickly to a laser, its own death, etc.
async function waitInterruptible(ms, record, laserState) {
  const step = 200;
  let elapsed = 0;
  while (elapsed < ms) {
    if (!record.alive) return "dead";
    if (laserState.active) return "laser";
    const chunk = Math.min(step, ms - elapsed);
    await sleep(chunk);
    elapsed += chunk;
  }
  return "done";
}

function makeSpriteEl(config, sizeMult) {
  const displayH = config.displayH * sizeMult;
  const scale = displayH / config.cellH;
  const displayW = config.cellW * scale;
  const el = document.createElement("div");
  el.style.width = `${displayW}px`;
  el.style.height = `${displayH}px`;
  el.style.backgroundImage = `url(${config.sheet})`;
  el.style.backgroundRepeat = "no-repeat";
  el.style.backgroundSize = `${config.sheetW * scale}px ${config.sheetH * scale}px`;
  el.style.imageRendering = "pixelated";
  return { el, scale, displayW, displayH };
}

function setFrame(record, actionName, frameIndex) {
  const action = record.config.actions[actionName];
  const x = -(frameIndex % action.frames) * record.config.cellW * record.scale;
  const y = -action.row * record.config.cellH * record.scale;
  record.spriteEl.style.backgroundPosition = `${x}px ${y}px`;
}

function stopFrames(record) {
  if (record.frameTimer) {
    clearInterval(record.frameTimer);
    record.frameTimer = null;
  }
}

function playAction(record, actionName) {
  stopFrames(record);
  const action = record.config.actions[actionName];
  const fps = Math.max(0.8, action.fps * CALM * record.fpsMult);
  let frame = 0;
  record.currentAction = actionName;
  setFrame(record, actionName, frame);
  record.frameTimer = setInterval(() => {
    frame = (frame + 1) % action.frames;
    setFrame(record, actionName, frame);
  }, 1000 / fps);
}

function moveTo(record, toX, toY, duration) {
  return new Promise((resolve) => {
    const fromX = record.x;
    if (toX !== fromX) {
      // Sprites are drawn facing RIGHT by default, so face-right = no flip.
      record.facing = toX < fromX ? "left" : "right";
      record.spriteEl.style.transform = record.facing === "left" ? "scaleX(-1)" : "scaleX(1)";
    }
    const parts = [`left ${duration}s linear`];
    if (toY != null) parts.push(`top ${duration}s linear`);
    record.wrapper.style.transition = parts.join(", ");
    // Force a style flush so the transition registers, then set the target
    // synchronously — no requestAnimationFrame (it's throttled on hidden tabs).
    void record.wrapper.offsetWidth;
    record.wrapper.style.left = `${toX}%`;
    if (toY != null) record.wrapper.style.top = `${toY}%`;
    record.x = toX;
    if (toY != null) record.y = toY;
    setTimeout(resolve, duration * 1000 + 30);
  });
}

// Duration for a move, scaled by distance, the cat's move personality, and the
// breed energy (energetic cats travel a bit quicker).
function travelDuration(record, toX, toY) {
  const dx = toX - record.x;
  const dy = (toY == null ? 0 : toY - record.y);
  const dist = Math.sqrt(dx * dx + dy * dy);
  const base = dist / 22; // ~22% of screen per second at baseline
  return Math.max(1.2, (base * record.moveMult) / record.energy);
}

function showEmotion(record) {
  const sprite = pick(EMOTION_SPRITES);
  // Bubbles render at a fixed, readable height; the little icons a touch smaller.
  const targetH = sprite.h < 90 ? 34 : 50;
  const displayH = targetH * record.sizeMult;
  const scale = displayH / sprite.h;
  const displayW = sprite.w * scale;
  const facingRight = record.facing === "right";

  // Place the bubble just ABOVE the cat's head (measured per breed) so it never
  // covers the cat. The wrapper is the sprite box; head top/center are fractions
  // of it. A small nudge toward the facing side reads as the cat "speaking".
  const head = record.config.head || { topFrac: 0.32, centerFrac: 0.5 };
  const catW = record.config.cellW * record.scale; // == sprite display width
  const catH = record.config.displayH * record.sizeMult; // == sprite display height
  const headTopPx = head.topFrac * catH;
  const headCenterPx = head.centerFrac * catW;
  const gap = 5 * record.sizeMult;
  const sideNudge = (facingRight ? 1 : -1) * catW * 0.16;

  const bubble = document.createElement("div");
  bubble.className = "critter-emotion";
  bubble.style.width = `${displayW}px`;
  bubble.style.height = `${displayH}px`;
  bubble.style.backgroundImage = `url(${sprite.sheet})`;
  bubble.style.backgroundRepeat = "no-repeat";
  bubble.style.backgroundSize = `${sprite.sheetW * scale}px ${sprite.sheetH * scale}px`;
  bubble.style.backgroundPosition = `-${sprite.x * scale}px -${sprite.y * scale}px`;
  bubble.style.left = `${headCenterPx + sideNudge}px`;
  // Bubble's bottom rests `gap` px above the head top; it grows upward.
  bubble.style.top = `${headTopPx - gap - displayH}px`;
  const flip = facingRight ? -1 : 1;
  bubble.style.transform = `translate(-50%, 6px) scaleX(${flip})`;
  record.wrapper.appendChild(bubble);
  void bubble.offsetWidth;
  bubble.style.opacity = "1";
  bubble.style.transform = `translate(-50%, 0) scaleX(${flip})`;
  setTimeout(() => {
    bubble.style.opacity = "0";
    setTimeout(() => bubble.remove(), 300);
  }, 1500);
}

function inZone(x, y, zones) {
  for (const z of zones) {
    if (x > z.leftPct - ZONE_PAD && x < z.rightPct + ZONE_PAD && y > z.topPct - ZONE_PAD && y < z.bottomPct + ZONE_PAD) {
      return true;
    }
  }
  return false;
}

// The white boxes as percentages of the stage. Computed fresh from live rects
// (dodges the window.innerWidth==0-at-load quirk and auto-tracks resize).
function computeZones(container, selectors) {
  const cr = container.getBoundingClientRect();
  if (cr.width < 10 || cr.height < 10) return [];
  return selectors
    .map((s) => document.querySelector(s))
    .filter(Boolean)
    .map((el) => {
      const r = el.getBoundingClientRect();
      return {
        leftPct: ((r.left - cr.left) / cr.width) * 100,
        rightPct: ((r.right - cr.left) / cr.width) * 100,
        topPct: ((r.top - cr.top) / cr.height) * 100,
        bottomPct: ((r.bottom - cr.top) / cr.height) * 100,
      };
    });
}

// A valid *stop* point: inside the edge buffer, not under a white box, and not
// crowding another cat.
function pickStopTarget(zones, activeCats, self) {
  let best = null;
  let bestCrowd = Infinity;
  for (let attempt = 0; attempt < 24; attempt++) {
    const x = randRange(EDGE_X, 100 - EDGE_X);
    const y = randRange(EDGE_Y, 100 - EDGE_Y);
    if (inZone(x, y, zones)) continue;
    // Count how many other cats already sit within a cat's-width of here.
    const crowd = activeCats.reduce(
      (n, o) => n + (o !== self && o.alive && Math.abs(o.x - x) < 8 && Math.abs(o.y - y) < 8 ? 1 : 0),
      0
    );
    if (crowd === 0) return { x, y };
    // Keep the emptiest spot we've seen as the fallback — never a fixed corner
    // (that's what made cats pile up when the stage got busy).
    if (crowd < bestCrowd) {
      bestCrowd = crowd;
      best = { x, y };
    }
  }
  return best || { x: randRange(EDGE_X, 100 - EDGE_X), y: 100 - EDGE_Y - 4 };
}

// Nudge a desired settle point off any spot already taken by another cat (or a
// box), spiralling outward until a clear slot is found. This is what keeps cats
// from piling onto the same pixel at an attractor (the sun, a bowl, the laser).
function avoidCats(x, y, record, activeCats, zones, minGap = 7) {
  const clampX = (v) => Math.max(EDGE_X, Math.min(100 - EDGE_X, v));
  const clampY = (v) => Math.max(EDGE_Y, Math.min(100 - EDGE_Y, v));
  const cx = clampX(x);
  const cy = clampY(y);
  const taken = (px, py) =>
    activeCats.some((o) => o !== record && o.alive && Math.hypot(o.x - px, o.y - py) < minGap);
  if (!taken(cx, cy) && !inZone(cx, cy, zones)) return { x: cx, y: cy };
  for (let ring = 1; ring <= 4; ring++) {
    const r = minGap * ring * 0.9;
    const start = Math.random() * Math.PI * 2;
    for (let k = 0; k < 8; k++) {
      const a = start + (k / 8) * Math.PI * 2;
      const px = clampX(cx + Math.cos(a) * r);
      const py = clampY(cy + Math.sin(a) * r);
      if (!taken(px, py) && !inZone(px, py, zones)) return { x: px, y: py };
    }
  }
  return { x: cx, y: cy };
}

function segmentCrossesZones(x0, y0, x1, y1, zones) {
  if (!zones.length) return false;
  const N = 24;
  for (let i = 1; i < N; i++) {
    const t = i / N;
    if (inZone(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, zones)) return true;
  }
  return false;
}

// A random point inside the edge buffer that isn't under a white box.
function pickClearPoint(zones) {
  for (let i = 0; i < 20; i++) {
    const x = randRange(EDGE_X, 100 - EDGE_X);
    const y = randRange(EDGE_Y, 100 - EDGE_Y);
    if (!inZone(x, y, zones)) return { x, y };
  }
  return { x: EDGE_X + 3, y: 100 - EDGE_Y - 3 };
}

// --- Obstacle boxes: keep toys, the cat tree, and prop vignettes from ever
// spawning on top of each other. Every box is a %-of-stage rect {l,t,r,b};
// props anchor top-left, vignettes anchor bottom-center. ---
function rectsOverlap(a, b, gap = 1.5) {
  return !(a.r + gap < b.l || b.r + gap < a.l || a.b + gap < b.t || b.b + gap < a.t);
}

function propRect(container, prop, x, y) {
  const scale = prop.displayH / prop.h;
  const cr = container.getBoundingClientRect();
  const wpct = cr.width ? ((prop.w * scale) / cr.width) * 100 : 8;
  const hpct = cr.height ? ((prop.h * scale) / cr.height) * 100 : 8;
  return { l: x, t: y, r: x + wpct, b: y + hpct };
}

function vignetteRect(container, def, gx, gy) {
  const maxW = Math.max(...def.run.map((f) => f[2]));
  const maxH = Math.max(...def.run.map((f) => f[3]));
  const cr = container.getBoundingClientRect();
  const wpct = cr.width ? ((maxW * def.scale) / cr.width) * 100 : 10;
  const hpct = cr.height ? ((maxH * def.scale) / cr.height) * 100 : 10;
  return { l: gx - wpct / 2, t: gy - hpct, r: gx + wpct / 2, b: gy };
}

// All live obstacle rects: persistent props + any vignette currently playing.
function obstacleRects(propList, vignetteList) {
  const out = [];
  for (const p of propList) if (p.rect) out.push(p.rect);
  for (const v of vignetteList) out.push(v);
  return out;
}

function corridorY(zones) {
  const maxBottom = zones.length ? Math.max(...zones.map((z) => z.bottomPct)) : 72;
  return Math.min(100 - EDGE_Y, maxBottom + 4);
}

// Move, but do our best not to cut under the white boxes. If the straight path
// would cross a box, detour down through the clear corridor below them.
async function moveAvoiding(record, toX, toY, zones, speedMult = 1) {
  const ty = toY == null ? record.y : toY;
  if (!segmentCrossesZones(record.x, record.y, toX, ty, zones)) {
    await moveTo(record, toX, toY, travelDuration(record, toX, ty) * speedMult);
    return;
  }
  const cy = corridorY(zones);
  await moveTo(record, record.x, cy, travelDuration(record, record.x, cy) * speedMult);
  if (record.alive) await moveTo(record, toX, cy, travelDuration(record, toX, cy) * speedMult);
  if (record.alive && Math.abs(ty - cy) > 1) {
    await moveTo(record, toX, ty, travelDuration(record, toX, ty) * speedMult);
  }
}

async function chaseLaser(record, laserState, getZones, activeCats) {
  playAction(record, pick(record.config.walkActions));
  // Each cat takes an evenly-spaced slot in a ring around the dot (by its index
  // in the pack), with avoidCats as a safety net, so the cats SURROUND the laser
  // instead of stacking on the exact pixel — the funny fast pounce, no pile-up.
  const n = Math.max(1, activeCats.length);
  const idx = Math.max(0, activeCats.indexOf(record));
  const ang = (idx / n) * Math.PI * 2 + randRange(-0.25, 0.25);
  const rad = randRange(7, 12);
  while (laserState.active && record.alive) {
    const zones = getZones();
    let { x: tx, y: ty } = avoidCats(
      laserState.x + Math.cos(ang) * rad,
      laserState.y + Math.sin(ang) * rad,
      record, activeCats, zones, 6
    );
    if (inZone(tx, ty, zones)) {
      tx = laserState.x;
      ty = corridorY(zones);
    }
    // Fast fixed pounce toward the ring spot; detour only if the direct path
    // would cut under a menu.
    if (segmentCrossesZones(record.x, record.y, tx, ty, zones)) {
      await moveAvoiding(record, tx, ty, zones, 0.6);
    } else {
      await moveTo(record, tx, ty, randRange(0.5, 0.9));
    }
  }
}

// The pose a cat holds while sunbathing — curl/sleep if the sheet has it, else
// a loaf sit, else whatever idle it has.
function baskAction(config) {
  if (config.actions.sleep) return "sleep";
  if (config.actions.sit) return "sit";
  return config.idleActions[0];
}

// A sun-seeker ambles into the sunspot, curls up, and slowly follows the light
// as it drifts around the boxes.
async function baskInSun(record, sunState, laserState, zones, activeCats) {
  // Park at a clear spot within the warm pool — avoidCats fans the sun-seekers
  // out around the sunspot instead of stacking them on the exact same pixel.
  let target = avoidCats(sunState.x, sunState.y, record, activeCats, zones, 7);
  playAction(record, pick(record.config.walkActions));
  await moveAvoiding(record, target.x, target.y, zones, 1.7);

  // Settle in and mostly STAY curled up — only shuffle if the sun drifts well
  // away from where this cat parked, so it clearly parks rather than chasing it.
  const baskUntil = Date.now() + randRange(14000, 26000);
  const pose = baskAction(record.config);
  playAction(record, pose);
  while (record.alive && !laserState.active && Date.now() < baskUntil) {
    if (Math.random() < record.emoteChance) showEmotion(record);
    const signal = await waitInterruptible(randRange(3200, 5500), record, laserState);
    if (signal !== "done") break;
    if (Math.hypot(sunState.x - target.x, sunState.y - target.y) > 14) {
      target = avoidCats(sunState.x, sunState.y, record, activeCats, zones, 7);
      playAction(record, pick(record.config.walkActions));
      await moveAvoiding(record, target.x, target.y, zones, 2.2);
      playAction(record, pose);
    }
  }
}

// Plays an explicit-frame vignette (each frame anchored bottom-center at the
// ground point) — getOn → run (looped) → slowDown → getOff. Returns when done.
async function playVignette(container, def, gxPct, gyPct, record, laserState) {
  const wrap = document.createElement("div");
  wrap.className = "critter-vignette";
  wrap.style.left = `${gxPct}%`;
  wrap.style.top = `${gyPct}%`;
  const frameEl = document.createElement("div");
  frameEl.style.position = "absolute";
  frameEl.style.backgroundImage = `url(${def.sheet})`;
  frameEl.style.backgroundRepeat = "no-repeat";
  frameEl.style.imageRendering = "pixelated";
  frameEl.style.backgroundSize = `${def.sheetW * def.scale}px ${def.sheetH * def.scale}px`;
  wrap.appendChild(frameEl);
  container.appendChild(wrap);

  const S = def.scale;
  function show(fr) {
    frameEl.style.width = `${fr[2] * S}px`;
    frameEl.style.height = `${fr[3] * S}px`;
    frameEl.style.left = `${-(fr[2] * S) / 2}px`;
    frameEl.style.top = `${-fr[3] * S}px`;
    frameEl.style.backgroundPosition = `${-fr[0] * S}px ${-fr[1] * S}px`;
  }

  const getOn = def.getOn || [];
  const getOff = def.getOff || [];
  const slowDown = def.slowDown || [];
  // Loop-only vignettes (no scripted entry/exit) fade in and out instead.
  const fade = !getOn.length && !getOff.length;
  frameEl.style.transition = "opacity 0.35s ease";
  frameEl.style.opacity = fade ? "0" : "1";

  const runLoops = 2 + Math.floor(Math.random() * 3);
  const sequence = [...getOn];
  for (let i = 0; i < runLoops; i++) sequence.push(...def.run);
  sequence.push(...slowDown, ...getOff);

  const frameMs = 1000 / (def.fps * record.fpsMult);
  if (fade) {
    show(sequence[0]);
    void frameEl.offsetWidth;
    frameEl.style.opacity = "1";
  }
  for (const fr of sequence) {
    if (!record.alive || laserState.active) break;
    show(fr);
    await sleep(frameMs);
  }
  if (fade) {
    frameEl.style.opacity = "0";
    await sleep(360);
  }
  wrap.remove();
}

// A sheeted cat ambles to a clear spot, hides its roaming sprite, and plays a
// prop vignette (e.g. running on the treadmill wheel) in its place.
async function useInteraction(record, kind, getZones, laserState, propList, vignetteList) {
  const def = INTERACTIONS[kind] && INTERACTIONS[kind][record.typeKey];
  if (!def) return;
  const zones = getZones();
  const container = record.wrapper.parentElement;
  const obstacles = obstacleRects(propList, vignetteList);
  let gx = record.x;
  let gy = Math.min(100 - EDGE_Y, Math.max(EDGE_Y + 10, record.y));
  // Find a spot that's clear of the menus AND of any toy/tree/other vignette.
  for (let i = 0; i < 16; i++) {
    const cx = randRange(EDGE_X + 6, 100 - EDGE_X - 6);
    const cy = randRange(EDGE_Y + 12, 100 - EDGE_Y);
    if (inZone(cx, cy, zones)) continue;
    const r = vignetteRect(container, def, cx, cy);
    if (obstacles.some((o) => rectsOverlap(o, r))) continue;
    gx = cx;
    gy = cy;
    break;
  }
  playAction(record, pick(record.config.walkActions));
  await moveAvoiding(record, gx, gy, zones);
  if (!record.alive) return;
  // Reserve the footprint so nothing else lands on the wheel/post/tunnel while
  // it plays; release it when the vignette ends (even if interrupted).
  const rect = vignetteRect(container, def, gx, gy);
  vignetteList.push(rect);
  record.wrapper.style.visibility = "hidden";
  stopFrames(record);
  try {
    await playVignette(container, def, gx, gy, record, laserState);
  } finally {
    const idx = vignetteList.indexOf(rect);
    if (idx !== -1) vignetteList.splice(idx, 1);
    record.wrapper.style.visibility = "";
  }
}

async function runCatLife(record, getZones, laserState, activeCats, sunState, propList, vignetteList, onExit) {
  const deadline = Date.now() + randRange(LIFESPAN_MIN, LIFESPAN_MAX);
  const canInteract = record.interactChance > 0;

  // Walk in from off-screen to a first resting spot. A random head-start before
  // the loop begins puts each cat's action cycle out of phase with the others.
  const first = pickStopTarget(getZones(), activeCats, record);
  playAction(record, pick(record.config.walkActions));
  await moveAvoiding(record, first.x, first.y, getZones());
  playAction(record, pick(record.config.idleActions));
  await waitInterruptible(randRange(0, 4500), record, laserState);

  while (record.alive) {
    if (laserState.active) {
      await chaseLaser(record, laserState, getZones, activeCats);
      continue;
    }

    // Idle a good while — most cats should be sitting around, not marching. Sit
    // length is this cat's own baseline + spread, so no two share a beat.
    playAction(record, pick(record.config.idleActions));
    if (Math.random() < record.emoteChance) showEmotion(record);
    const dwell = ((record.dwellBase + Math.random() * record.dwellVar) * record.reactionMult) / record.energy;
    const signal = await waitInterruptible(dwell, record, laserState);
    if (signal === "dead") break;
    if (signal === "laser") continue;

    // A second chirp partway through a long sit is common.
    if (Math.random() < record.emoteChance * 0.7) showEmotion(record);

    if (Date.now() > deadline) break;

    // Signature toy FIRST and OFTEN — a cat that owns a wheel/post/tunnel/yarn
    // reaches for it much more than it does anything else, so it's clearly
    // "their thing".
    if (canInteract && Math.random() < record.interactChance) {
      await useInteraction(record, pick(record.config.interactions), getZones, laserState, propList, vignetteList);
      continue;
    }

    // Sun-lovers make a beeline for the warm spot and curl up in it.
    if (record.sunLove && Math.random() < record.sunLove) {
      await baskInSun(record, sunState, laserState, getZones(), activeCats);
      continue;
    }

    // Wander over to a bowl / cat tree that's out and hang around it.
    if (propList.length && Math.random() < record.propChance) {
      await visitProp(record, propList, getZones, laserState, activeCats);
      continue;
    }

    // Mostly stay put and idle again; occasionally wander somewhere new.
    if (Math.random() < record.relocateChance * record.energy) {
      const target = pickStopTarget(getZones(), activeCats, record);
      playAction(record, pick(record.config.walkActions));
      await moveAvoiding(record, target.x, target.y, getZones());
    }
  }

  // Exit: stroll to the nearest horizontal edge and despawn.
  if (record.alive) {
    record.alive = false;
    const exitX = record.x < 50 ? -12 : 112;
    playAction(record, pick(record.config.walkActions));
    await moveTo(record, exitX, record.y, travelDuration(record, exitX, record.y));
  }
  stopFrames(record);
  record.wrapper.remove();
  onExit(record);
}

function runLaserEvents(container, laserState, getZones) {
  async function fireLaser() {
    const dot = document.createElement("div");
    dot.className = "laser-dot";
    container.appendChild(dot);

    // Keep the dot out of the boxes so it never lures cats under the menus.
    const zones = getZones();
    const waypoints = Array.from({ length: 5 + Math.floor(Math.random() * 3) }, () => pickClearPoint(zones));

    laserState.active = true;
    laserState.x = waypoints[0].x;
    laserState.y = waypoints[0].y;
    dot.style.left = `${laserState.x}%`;
    dot.style.top = `${laserState.y}%`;
    dot.style.opacity = "1";

    for (const p of waypoints) {
      dot.style.transition = "left 0.35s ease, top 0.35s ease";
      void dot.offsetWidth;
      dot.style.left = `${p.x}%`;
      dot.style.top = `${p.y}%`;
      laserState.x = p.x;
      laserState.y = p.y;
      await sleep(randRange(950, 1300));
    }

    dot.style.opacity = "0";
    laserState.active = false;
    setTimeout(() => dot.remove(), 400);
  }

  (async function loop() {
    for (;;) {
      await sleep(randRange(18000, 34000));
      await fireLaser();
    }
  })();
}

// A warm sun-spot drifts slowly on a U-shaped path hugging around the boxes.
// It ping-pongs (never teleports) so the motion stays gentle.
function runSun(container, sunState) {
  const el = document.createElement("div");
  el.className = "sunspot";
  // A slowly-spinning circular wordmark inside the glow. Cats render on a higher
  // layer and pass right over the text — intentional.
  const label = "QRitty SunSpot™ · ";
  el.innerHTML =
    `<svg class="sunspot-mark" viewBox="0 0 100 100" aria-hidden="true">` +
    `<defs><path id="sunspot-ring" d="M 50,50 m -33,0 a 33,33 0 1,1 66,0 a 33,33 0 1,1 -66,0"/></defs>` +
    `<text><textPath href="#sunspot-ring" startOffset="0">${label.repeat(4)}</textPath></text>` +
    `</svg>`;
  container.appendChild(el); // appended before cats → renders behind them
  const HALF_PERIOD = 82000; // ms for one pass down-and-around

  function uPath(t) {
    if (t < 1 / 3) return { x: 5, y: 12 + (t / (1 / 3)) * (90 - 12) };
    if (t < 2 / 3) return { x: 5 + ((t - 1 / 3) / (1 / 3)) * (95 - 5), y: 90 };
    return { x: 95, y: 90 - ((t - 2 / 3) / (1 / 3)) * (90 - 12) };
  }

  function tick() {
    const phase = (Date.now() % (HALF_PERIOD * 2)) / (HALF_PERIOD * 2);
    const t = phase < 0.5 ? phase * 2 : (1 - phase) * 2; // ping-pong 0→1→0
    const p = uPath(t);
    sunState.x = p.x;
    sunState.y = p.y;
    el.style.left = `${p.x}%`;
    el.style.top = `${p.y}%`;
  }

  tick();
  setInterval(tick, 140);
}

// Toys/bowls/tree spawn, hang around a while so cats can visit, then fade out.
// `propList` is the live list cats read to seek things out.
function runPropEvents(container, getZones, propList, vignetteList) {
  const MAX_PROPS = 3;

  function spawnProp() {
    const prop = pick(PROPS);
    const scale = prop.displayH / prop.h;
    const zones = getZones();
    const obstacles = obstacleRects(propList, vignetteList);
    // Find a spot clear of the menus, on-stage, and not overlapping any other
    // toy/tree/vignette. If nothing's free this round, skip — try again later.
    let x, y, rect, placed = false;
    for (let i = 0; i < 22; i++) {
      x = randRange(EDGE_X + 3, 100 - EDGE_X - 5);
      y = randRange(EDGE_Y + 8, 100 - EDGE_Y - 6);
      if (inZone(x, y, zones)) continue;
      rect = propRect(container, prop, x, y);
      if (rect.r > 100 - EDGE_X || rect.b > 100 - EDGE_Y) continue;
      if (obstacles.some((o) => rectsOverlap(o, rect))) continue;
      placed = true;
      break;
    }
    if (!placed) return;

    const el = document.createElement("div");
    el.className = "critter-prop";
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    el.style.width = `${prop.w * scale}px`;
    el.style.height = `${prop.h * scale}px`;
    el.style.backgroundImage = `url(${prop.sheet})`;
    el.style.backgroundPosition = `-${prop.x * scale}px -${prop.y * scale}px`;
    el.style.backgroundSize = `${prop.sheetW * scale}px ${prop.sheetH * scale}px`;
    el.style.opacity = "0";
    el.style.transform = "scale(0.6)";
    el.style.transition = "opacity 0.4s ease, transform 0.4s ease";
    container.appendChild(el);
    const entry = { el, x, y, kind: prop.kind, rect };
    propList.push(entry);

    void el.offsetWidth;
    el.style.opacity = "0.95";
    el.style.transform = "scale(1)";

    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "scale(0.6)";
      setTimeout(() => {
        el.remove();
        const idx = propList.indexOf(entry);
        if (idx !== -1) propList.splice(idx, 1);
      }, 400);
    }, randRange(16000, 28000));
  }

  (async function loop() {
    for (;;) {
      await sleep(randRange(4000, 9000));
      if (propList.length < MAX_PROPS) spawnProp();
    }
  })();
}

// A cat wanders over to a bowl/tree, settles beside it, and hangs out.
async function visitProp(record, propList, getZones, laserState, activeCats) {
  const props = propList.filter((p) => p.el.isConnected);
  if (!props.length) return;
  const prop = pick(props);
  const zones = getZones();
  // Hang out beside the prop, but on a spot no other cat is already using.
  const side = Math.random() < 0.5 ? -4 : 4;
  const { x: tx, y: ty } = avoidCats(prop.x + side, prop.y + randRange(0, 2.5), record, activeCats, zones, 6);
  if (inZone(tx, ty, zones)) return;
  playAction(record, pick(record.config.walkActions));
  await moveAvoiding(record, tx, ty, zones);
  if (!record.alive) return;
  const until = Date.now() + randRange(5000, 11000);
  while (record.alive && !laserState.active && Date.now() < until) {
    playAction(record, pick(record.config.idleActions));
    if (Math.random() < record.emoteChance) showEmotion(record);
    const s = await waitInterruptible(randRange(2600, 4600), record, laserState);
    if (s !== "done") break;
  }
}

export function initCritterScene(container, zoneSelectors = [".controls-square", ".qr-square"]) {
  const laserState = { active: false, x: 50, y: 50 };
  const sunState = { x: 5, y: 50 };
  const activeCats = [];
  const propList = [];
  const vignetteList = []; // footprints of prop vignettes currently playing
  const getZones = () => computeZones(container, zoneSelectors);

  runSun(container, sunState);
  runPropEvents(container, getZones, propList, vignetteList);

  function spawnCat(forcedType) {
    const typeKey = forcedType || pick(CAT_TYPES);
    const config = CRITTERS[typeKey];
    const sizeMult = randRange(0.9, 1.05);
    const wrapper = document.createElement("div");
    wrapper.className = "critter";
    const { el: spriteEl, scale } = makeSpriteEl(config, sizeMult);
    wrapper.appendChild(spriteEl);

    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? -12 : 112;
    const startY = randRange(EDGE_Y, 100 - EDGE_Y);
    wrapper.style.left = `${startX}%`;
    wrapper.style.top = `${startY}%`;

    container.appendChild(wrapper);

    const canInteract = !!(config.interactions && config.interactions.length);
    const record = {
      wrapper,
      spriteEl,
      config,
      typeKey,
      scale,
      sizeMult,
      x: startX,
      y: startY,
      facing: fromLeft ? "right" : "left",
      alive: true,
      frameTimer: null,
      // Personality — each cat reacts, animates, and moves at its own pace.
      fpsMult: randRange(0.8, 1.12),
      reactionMult: randRange(0.8, 1.35),
      moveMult: randRange(0.85, 1.25),
      energy: COLOR_ENERGY[typeKey] || 1,
      // Per-cat behaviour odds — rolled wide so no two cats share a rhythm and
      // the corral never acts on one shared timer.
      emoteChance: randRange(0.28, 0.72),
      relocateChance: randRange(0.14, 0.48),
      propChance: randRange(0.22, 0.52),
      // Roughly half are sun-lovers; those that are get their own pull strength.
      sunLove: Math.random() < 0.5 ? randRange(0.4, 0.8) : 0,
      // Cats with a signature toy (wheel / post+tunnel / yarn) reach for it a
      // LOT — it's their thing — so it shows up often for them specifically.
      interactChance: canInteract ? randRange(0.5, 0.82) : 0,
      // This cat's own baseline sit length + spread.
      dwellBase: randRange(3000, 7200),
      dwellVar: randRange(1500, 5500),
    };
    activeCats.push(record);

    runCatLife(record, getZones, laserState, activeCats, sunState, propList, vignetteList, (finished) => {
      const idx = activeCats.indexOf(finished);
      if (idx !== -1) activeCats.splice(idx, 1);
      // Replace after a RANDOM delay so replacements don't arrive in a wave.
      setTimeout(() => spawnCat(), randRange(RESPAWN_MIN, RESPAWN_MAX));
    });
  }

  // Seed the initial population, staggered with jitter (not a clean grid) so
  // they don't march in on one beat.
  let seedDelay = randRange(0, 600);
  for (let i = 0; i < TARGET_POPULATION; i++) {
    setTimeout(() => spawnCat(), seedDelay);
    seedDelay += randRange(500, 1900);
  }

  // Watchdog: if population ever drifts below target, top it back up gently.
  setInterval(() => {
    if (activeCats.length < TARGET_POPULATION) spawnCat();
  }, 9000);

  runLaserEvents(container, laserState, getZones);
}
