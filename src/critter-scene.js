import { CRITTERS, CAT_TYPES, PROPS, EMOTION_SPRITES } from "./critter-sprites.js";

// Global frame-rate damper — cats were spazzing; everything animates calmer.
const CALM = 0.55;
const TARGET_POPULATION = 10;
const RESPAWN_DELAY = 6000; // spawn 6s after a despawn
const LIFESPAN_MIN = 20000;
const LIFESPAN_MAX = 45000;
const EDGE_X = 3.5; // % clear buffer from left/right screen edges before a cat stops
const EDGE_Y = 5; // % clear buffer from top/bottom screen edges
const ZONE_PAD = 1.2; // % padding around the white boxes for stop-target rejection
const EMOTE_CHANCE = 0.375; // 25% more than the prior 0.3

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
      record.facing = toX < fromX ? "left" : "right";
      record.spriteEl.style.transform = record.facing === "left" ? "scaleX(1)" : "scaleX(-1)";
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
  const displayH = 28 * record.sizeMult;
  const scale = displayH / sprite.h;
  const displayW = sprite.w * scale;
  const facingRight = record.facing === "right";

  const bubble = document.createElement("div");
  bubble.className = "critter-emotion";
  bubble.style.width = `${displayW}px`;
  bubble.style.height = `${displayH}px`;
  bubble.style.backgroundImage = `url(${sprite.sheet})`;
  bubble.style.backgroundRepeat = "no-repeat";
  bubble.style.backgroundSize = `${sprite.sheetW * scale}px ${sprite.sheetH * scale}px`;
  bubble.style.backgroundPosition = `-${sprite.x * scale}px -${sprite.y * scale}px`;
  // Bubble sits toward the side the cat faces, flipped so its tail points back
  // at the cat — reads as the cat "speaking" in that direction.
  bubble.style.left = facingRight ? "72%" : "28%";
  const flip = facingRight ? -1 : 1;
  bubble.style.transform = `translate(-50%, 4px) scaleX(${flip})`;
  record.wrapper.appendChild(bubble);
  void bubble.offsetWidth;
  bubble.style.opacity = "1";
  bubble.style.transform = `translate(-50%, -10px) scaleX(${flip})`;
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
// crowding another cat. Cats may still WALK across forbidden areas (behind the
// boxes, near edges) — they just can't come to rest there.
function pickStopTarget(zones, activeCats, self) {
  let fallback = null;
  for (let attempt = 0; attempt < 16; attempt++) {
    const x = randRange(EDGE_X, 100 - EDGE_X);
    const y = randRange(EDGE_Y, 100 - EDGE_Y);
    if (inZone(x, y, zones)) continue;
    fallback = { x, y };
    const crowded = activeCats.some(
      (o) => o !== self && o.alive && Math.abs(o.x - x) < 7 && Math.abs(o.y - y) < 7
    );
    if (!crowded) return { x, y };
  }
  return fallback || { x: EDGE_X + 4, y: 100 - EDGE_Y - 4 };
}

async function chaseLaser(record, laserState) {
  playAction(record, pick(record.config.walkActions));
  while (laserState.active && record.alive) {
    const tx = Math.max(EDGE_X, Math.min(100 - EDGE_X, laserState.x + randRange(-3, 3)));
    const ty = Math.max(EDGE_Y, Math.min(100 - EDGE_Y, laserState.y + randRange(-2, 2)));
    await moveTo(record, tx, ty, randRange(1.0, 1.5));
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
async function baskInSun(record, sunState, laserState) {
  playAction(record, pick(record.config.walkActions));
  await moveTo(record, sunState.x, sunState.y, travelDuration(record, sunState.x, sunState.y) * 1.7);

  const baskUntil = Date.now() + randRange(7000, 15000);
  const pose = baskAction(record.config);
  while (record.alive && !laserState.active && Date.now() < baskUntil) {
    playAction(record, pose);
    if (Math.random() < EMOTE_CHANCE) showEmotion(record);
    const signal = await waitInterruptible(randRange(2600, 4600), record, laserState);
    if (signal !== "done") break;
    // Drift after the moving sun, but lazily.
    if (Math.abs(record.x - sunState.x) > 6 || Math.abs(record.y - sunState.y) > 6) {
      playAction(record, pick(record.config.walkActions));
      await moveTo(record, sunState.x, sunState.y, travelDuration(record, sunState.x, sunState.y) * 2);
    }
  }
}

async function runCatLife(record, getZones, laserState, activeCats, sunState, onExit) {
  const deadline = Date.now() + randRange(LIFESPAN_MIN, LIFESPAN_MAX);

  // Walk in from off-screen to a first resting spot.
  const first = pickStopTarget(getZones(), activeCats, record);
  playAction(record, pick(record.config.walkActions));
  await moveTo(record, first.x, first.y, travelDuration(record, first.x, first.y));

  while (record.alive) {
    if (laserState.active) {
      await chaseLaser(record, laserState);
      continue;
    }

    // Idle a while — dwell time scaled by reaction personality + breed energy.
    playAction(record, pick(record.config.idleActions));
    if (Math.random() < EMOTE_CHANCE) showEmotion(record);
    const dwell = (randRange(3200, 6800) * record.reactionMult) / record.energy;
    const signal = await waitInterruptible(dwell, record, laserState);
    if (signal === "dead") break;
    if (signal === "laser") continue;

    if (Date.now() > deadline) break;

    // Sometimes relocate, sometimes just settle in and idle again (calmer).
    if (Math.random() < 0.5 * record.energy) {
      if (record.sunSeeker && Math.random() < 0.5) {
        await baskInSun(record, sunState, laserState);
      } else {
        const target = pickStopTarget(getZones(), activeCats, record);
        playAction(record, pick(record.config.walkActions));
        await moveTo(record, target.x, target.y, travelDuration(record, target.x, target.y));
      }
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

function runLaserEvents(container, laserState) {
  async function fireLaser() {
    const dot = document.createElement("div");
    dot.className = "laser-dot";
    container.appendChild(dot);

    const waypoints = Array.from({ length: 5 + Math.floor(Math.random() * 3) }, () => ({
      x: randRange(EDGE_X, 100 - EDGE_X),
      y: randRange(EDGE_Y, 100 - EDGE_Y),
    }));

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

// Toys spawn, sit around 11–19s, then fade out — never permanent furniture.
function runPropEvents(container, getZones) {
  const activeProps = [];
  const MAX_PROPS = 3;

  function spawnProp() {
    const prop = pick(PROPS);
    const scale = prop.displayH / prop.h;
    const zones = getZones();
    let x, y;
    for (let i = 0; i < 14; i++) {
      x = randRange(EDGE_X, 100 - EDGE_X - 4);
      y = randRange(EDGE_Y + 6, 100 - EDGE_Y - 6);
      if (!inZone(x, y, zones)) break;
    }
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
    activeProps.push(el);

    void el.offsetWidth;
    el.style.opacity = "0.95";
    el.style.transform = "scale(1)";

    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "scale(0.6)";
      setTimeout(() => {
        el.remove();
        const idx = activeProps.indexOf(el);
        if (idx !== -1) activeProps.splice(idx, 1);
      }, 400);
    }, randRange(11000, 19000));
  }

  (async function loop() {
    for (;;) {
      await sleep(randRange(4000, 9000));
      if (activeProps.length < MAX_PROPS) spawnProp();
    }
  })();
}

export function initCritterScene(container, zoneSelectors = [".controls-square", ".qr-square"]) {
  const laserState = { active: false, x: 50, y: 50 };
  const sunState = { x: 5, y: 50 };
  const activeCats = [];
  const getZones = () => computeZones(container, zoneSelectors);

  runSun(container, sunState);
  runPropEvents(container, getZones);

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
      // About a third of cats are drawn to the sun.
      sunSeeker: Math.random() < 0.35,
    };
    activeCats.push(record);

    runCatLife(record, getZones, laserState, activeCats, sunState, (finished) => {
      const idx = activeCats.indexOf(finished);
      if (idx !== -1) activeCats.splice(idx, 1);
      // Each despawn breeds a replacement 6s later — steady turnover.
      setTimeout(() => spawnCat(), RESPAWN_DELAY);
    });
  }

  // Seed the initial population, staggered so they don't all pop in together.
  for (let i = 0; i < TARGET_POPULATION; i++) {
    setTimeout(() => spawnCat(), i * 700);
  }

  // Watchdog: if population ever drifts below target, top it back up gently.
  setInterval(() => {
    if (activeCats.length < TARGET_POPULATION) spawnCat();
  }, 9000);

  runLaserEvents(container, laserState);
}
