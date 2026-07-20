import catWhite from "./assets/critters/cat-white.png";
import catBlack from "./assets/critters/cat-black.png";
import catCalico from "./assets/critters/cat-calico.png";
import catCalicoTrue from "./assets/critters/cat-calico-true.png";
import catGreyTabby from "./assets/critters/cat-grey-tabby.png";
import catOrange from "./assets/critters/cat-orange.png";
import catSiamese from "./assets/critters/cat-siamese.png";
import catSolidGrey from "./assets/critters/cat-solid-grey.png";
import catTortoiseshell from "./assets/critters/cat-tortoiseshell.png";
import catTree from "./assets/critters/cat-tree.png";
import foodBowls from "./assets/critters/food-bowls.png";
import emotionBubbles from "./assets/critters/emotion-bubbles.png";
import orangeWheel from "./assets/critters/cat-orange-wheel.png";
import greyTabbyWheel from "./assets/critters/cat-greytabby-wheel.png";
import whiteActive from "./assets/critters/cat-white-active.png";
import tsActive from "./assets/critters/cat-ts-active.png";
import blackYarn from "./assets/critters/cat-black-yarn.png";
import siameseYarn from "./assets/critters/cat-siamese-yarn.png";

// 8-row sheets: turn, walk, standBack, walk2, sit, sit2, prowl, sleep.
function catActions8() {
  return {
    turn: { row: 0, frames: 4, fps: 4 },
    walk: { row: 1, frames: 4, fps: 6 },
    standBack: { row: 2, frames: 4, fps: 3 },
    walk2: { row: 3, frames: 4, fps: 6 },
    sit: { row: 4, frames: 4, fps: 3 },
    sit2: { row: 5, frames: 4, fps: 3 },
    prowl: { row: 6, frames: 4, fps: 6 },
    sleep: { row: 7, frames: 2, fps: 1.5 },
  };
}

// 6-row sheet (Calico.jpg): turn, walk, standBack, walk2, sit, sit2 — no
// prowl/sleep rows.
function catActions6() {
  return {
    turn: { row: 0, frames: 4, fps: 4 },
    walk: { row: 1, frames: 4, fps: 6 },
    standBack: { row: 2, frames: 4, fps: 3 },
    walk2: { row: 3, frames: 4, fps: 6 },
    sit: { row: 4, frames: 4, fps: 3 },
    sit2: { row: 5, frames: 4, fps: 3 },
  };
}

// New-format 8-row sheets (grey tabby, orange, siamese, solid grey,
// tortoiseshell): 720x1488, 180x186 cells, same row order as catActions8.
function newCat(sheet, speed) {
  return {
    kind: "cat",
    sheet,
    sheetW: 720,
    sheetH: 1488,
    cellW: 720 / 4,
    cellH: 1488 / 8,
    displayH: 76,
    speed,
    facing: "left",
    actions: catActions8(),
    idleActions: ["sit", "sit2", "turn", "standBack"],
    walkActions: ["walk", "walk2", "prowl"],
    // Head top / center within the cell (fraction), for placing emote bubbles
    // just above the head instead of over the cat.
    head: { topFrac: 0.355, centerFrac: 0.502 },
  };
}

export const CRITTERS = {
  catWhite: {
    kind: "cat",
    sheet: catWhite,
    sheetW: 495,
    sheetH: 1024,
    cellW: 495 / 4,
    cellH: 1024 / 8,
    displayH: 74,
    speed: 55,
    facing: "left",
    actions: catActions8(),
    idleActions: ["sit", "sit2", "turn", "standBack"],
    walkActions: ["walk", "walk2", "prowl"],
    head: { topFrac: 0.3516, centerFrac: 0.5036 },
  },
  catBlack: {
    kind: "cat",
    sheet: catBlack,
    sheetW: 495,
    sheetH: 1024,
    cellW: 495 / 4,
    cellH: 1024 / 8,
    displayH: 74,
    speed: 58,
    facing: "left",
    actions: catActions8(),
    idleActions: ["sit", "sit2", "turn", "standBack"],
    walkActions: ["walk", "walk2", "prowl"],
    head: { topFrac: 0.3516, centerFrac: 0.5032 },
  },
  catCalico: {
    kind: "cat",
    sheet: catCalico,
    sheetW: 385,
    sheetH: 741,
    cellW: 385 / 4,
    cellH: 741 / 8,
    displayH: 72,
    speed: 52,
    facing: "left",
    actions: catActions8(),
    idleActions: ["sit", "sit2", "turn", "standBack"],
    walkActions: ["walk", "walk2", "prowl"],
    head: { topFrac: 0.4426, centerFrac: 0.4944 },
  },
  catCalicoTrue: {
    kind: "cat",
    sheet: catCalicoTrue,
    sheetW: 636,
    sheetH: 982,
    cellW: 636 / 4,
    cellH: 982 / 6,
    displayH: 76,
    speed: 54,
    facing: "left",
    actions: catActions6(),
    idleActions: ["sit", "sit2", "turn", "standBack"],
    walkActions: ["walk", "walk2"],
    head: { topFrac: 0.1222, centerFrac: 0.5032 },
  },
  catGreyTabby: newCat(catGreyTabby, 53),
  catOrange: newCat(catOrange, 56),
  catSiamese: newCat(catSiamese, 50),
  catSolidGrey: newCat(catSolidGrey, 57),
  catTortoiseshell: newCat(catTortoiseshell, 55),
};

// Which breeds can play which prop-interaction vignettes (only breeds with
// dedicated "active" sheets). Orange + grey tabby run the wheel; white +
// tortoiseshell scratch the post and play in the tunnel.
CRITTERS.catOrange.interactions = ["wheel"];
CRITTERS.catGreyTabby.interactions = ["wheel"];
CRITTERS.catWhite.interactions = ["post", "tunnel"];
CRITTERS.catTortoiseshell.interactions = ["post", "tunnel"];
CRITTERS.catBlack.interactions = ["yarn"];
CRITTERS.catSiamese.interactions = ["yarn"];

export const CAT_TYPES = [
  "catWhite",
  "catBlack",
  "catCalico",
  "catCalicoTrue",
  "catGreyTabby",
  "catOrange",
  "catSiamese",
  "catSolidGrey",
  "catTortoiseshell",
];

// Props render at `displayH` px tall; the scene scales x/y/w/h and the
// background to match. `kind` lets cats seek specific props with intent.
export const PROPS = [
  { kind: "water", sheet: foodBowls, x: 20, y: 30, w: 105, h: 100, sheetW: 617, sheetH: 174, displayH: 40 },
  { kind: "fish", sheet: foodBowls, x: 200, y: 30, w: 108, h: 100, sheetW: 617, sheetH: 174, displayH: 40 },
  { kind: "kibble", sheet: foodBowls, x: 466, y: 30, w: 120, h: 100, sheetW: 617, sheetH: 174, displayH: 40 },
  { kind: "tree", sheet: catTree, x: 0, y: 0, w: 172, h: 281, sheetW: 172, sheetH: 281, displayH: 128 },
];

// All 18 emotes from the emotion-bubbles sheet (1792x2390), exterior stripped
// but the white speech-bubble interiors preserved so they stay readable.
export const EMOTION_SPRITES = [
  { x: 20, y: 946, w: 232, h: 176 },
  { x: 267, y: 946, w: 205, h: 176 },
  { x: 486, y: 946, w: 203, h: 176 },
  { x: 702, y: 946, w: 204, h: 176 },
  { x: 916, y: 946, w: 202, h: 176 },
  { x: 1130, y: 946, w: 203, h: 176 },
  { x: 1346, y: 946, w: 205, h: 176 },
  { x: 1559, y: 955, w: 63, h: 54 },
  { x: 1640, y: 955, w: 113, h: 167 },
  { x: 21, y: 1202, w: 231, h: 219 },
  { x: 267, y: 1202, w: 201, h: 219 },
  { x: 482, y: 1202, w: 201, h: 219 },
  { x: 698, y: 1202, w: 200, h: 219 },
  { x: 909, y: 1202, w: 199, h: 219 },
  { x: 1121, y: 1202, w: 180, h: 219 },
  { x: 1318, y: 1226, w: 104, h: 195 },
  { x: 1426, y: 1202, w: 171, h: 219 },
  { x: 1610, y: 1202, w: 165, h: 219 },
].map((s) => ({ ...s, sheetW: 1792, sheetH: 2390, sheet: emotionBubbles }));

// Prop-interaction vignettes. Each frame is [x, y, w, h] in the sheet; the
// player anchors every frame by its bottom-center so the wheel/cat stays
// planted. `scale` sizes the whole vignette; phases play getOn → run(loop) →
// slowDown → getOff. Coords mapped from the labeled sprite sheets.
export const INTERACTIONS = {
  // Treadmill wheel — run-only loop that fades in/out (like the post/tunnel/yarn
  // vignettes). Frames are UNIFORM grid cells (the wheel sits at the same spot in
  // every cell), so bottom-center anchoring keeps the wheel planted instead of
  // scrolling sideways as the cat's pose changes. The cat's own walk in/out is
  // the approach; the climb-on / dismount frames are intentionally dropped.
  wheel: {
    catOrange: {
      sheet: orangeWheel,
      sheetW: 720,
      sheetH: 1488,
      scale: 0.57,
      fps: 7,
      getOn: [],
      run: [[0, 779, 180, 128], [180, 779, 180, 128], [360, 779, 180, 128], [540, 779, 180, 128], [0, 954, 180, 128], [180, 954, 180, 128], [360, 954, 180, 128], [540, 954, 180, 128]],
      slowDown: [],
      getOff: [],
    },
    catGreyTabby: {
      sheet: greyTabbyWheel,
      sheetW: 1440,
      sheetH: 2976,
      scale: 0.285,
      fps: 7,
      getOn: [],
      run: [[0, 1557, 360, 256], [360, 1557, 360, 256], [720, 1557, 360, 256], [1080, 1557, 360, 256], [0, 1907, 360, 256], [360, 1907, 360, 256], [720, 1907, 360, 256], [1080, 1907, 360, 256]],
      slowDown: [],
      getOff: [],
    },
  },

  // Yarn play — black + siamese cats bat, hug, and roll a ball of yarn. Loop-only
  // (fades in/out); frames are uniform grid cells so the cat/yarn stays planted.
  yarn: {
    catBlack: {
      sheet: blackYarn,
      sheetW: 495,
      sheetH: 1024,
      scale: 0.55,
      fps: 5,
      getOn: [],
      run: [[0, 512, 124, 128], [0, 384, 124, 128], [124, 384, 124, 128], [248, 640, 124, 128], [124, 512, 124, 128], [248, 512, 124, 128], [371, 512, 124, 128], [248, 384, 124, 128]],
      slowDown: [],
      getOff: [],
    },
    catSiamese: {
      sheet: siameseYarn,
      sheetW: 1440,
      sheetH: 2976,
      scale: 0.195,
      fps: 5,
      getOn: [],
      run: [[0, 1488, 360, 372], [0, 1116, 360, 372], [360, 1116, 360, 372], [720, 1860, 360, 372], [360, 1488, 360, 372], [720, 1488, 360, 372], [1080, 1488, 360, 372], [720, 1116, 360, 372]],
      slowDown: [],
      getOff: [],
    },
  },

  // Scratching post — the cat's own walk-in is the approach; the vignette is the
  // clean scratch loop (getOn/slowDown/getOff empty; the player fades it in/out).
  post: {
    catWhite: {
      sheet: whiteActive,
      sheetW: 2692,
      sheetH: 1568,
      scale: 0.54,
      fps: 5,
      getOn: [],
      run: [[30, 394, 167, 185], [210, 394, 176, 185], [406, 394, 176, 185], [600, 394, 178, 185], [794, 394, 179, 185], [994, 394, 172, 185], [1189, 394, 168, 185], [1379, 394, 168, 185]],
      slowDown: [],
      getOff: [],
    },
    catTortoiseshell: {
      sheet: tsActive,
      sheetW: 1024,
      sheetH: 596,
      scale: 1.39,
      fps: 5,
      getOn: [],
      run: [[11, 149, 65, 72], [80, 149, 67, 72], [153, 149, 69, 72], [227, 149, 69, 72], [302, 149, 68, 72], [377, 149, 67, 72], [450, 149, 67, 72], [524, 149, 65, 72]],
      slowDown: [],
      getOff: [],
    },
  },

  // Play tunnel — cat pokes head/tail in and out of a short tube (loop).
  tunnel: {
    catWhite: {
      sheet: whiteActive,
      sheetW: 2692,
      sheetH: 1568,
      scale: 0.45,
      fps: 4,
      getOn: [],
      run: [[215, 1108, 191, 190], [406, 1108, 191, 190], [597, 1108, 191, 190], [788, 1108, 191, 190], [979, 1108, 191, 190], [1170, 1108, 191, 190], [1361, 1108, 191, 190], [1552, 1108, 191, 190], [1743, 1108, 191, 190], [1934, 1108, 191, 190], [2125, 1108, 191, 190], [2316, 1108, 191, 190], [2507, 1108, 185, 190]],
      slowDown: [],
      getOff: [],
    },
    catTortoiseshell: {
      sheet: tsActive,
      sheetW: 1024,
      sheetH: 596,
      scale: 1.42,
      fps: 4,
      getOn: [],
      run: [[8, 440, 63, 48], [80, 440, 72, 54], [156, 440, 72, 54], [231, 440, 70, 54], [303, 443, 71, 51], [376, 440, 70, 54], [448, 440, 71, 54], [521, 440, 70, 54], [594, 443, 70, 51], [666, 443, 70, 51], [738, 443, 71, 51], [811, 443, 76, 51], [888, 449, 136, 40]],
      slowDown: [],
      getOff: [],
    },
  },
};
