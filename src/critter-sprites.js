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
  },
  catGreyTabby: newCat(catGreyTabby, 53),
  catOrange: newCat(catOrange, 56),
  catSiamese: newCat(catSiamese, 50),
  catSolidGrey: newCat(catSolidGrey, 57),
  catTortoiseshell: newCat(catTortoiseshell, 55),
};

// Which breeds can play which prop-interaction vignettes (only breeds with
// dedicated "active" sheets). Orange + grey tabby get the treadmill wheel.
CRITTERS.catOrange.interactions = ["wheel"];
CRITTERS.catGreyTabby.interactions = ["wheel"];

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
  wheel: {
    catOrange: {
      sheet: orangeWheel,
      sheetW: 720,
      sheetH: 1488,
      scale: 0.62,
      fps: 7,
      getOn: [[13, 416, 169, 133], [178, 416, 179, 134], [392, 413, 138, 134], [564, 413, 138, 134], [25, 585, 136, 133], [204, 584, 139, 134]],
      run: [[27, 778, 129, 131], [206, 778, 130, 131], [386, 778, 130, 131], [566, 778, 130, 131], [27, 953, 129, 131], [206, 953, 130, 131], [386, 953, 130, 131], [566, 953, 130, 133]],
      slowDown: [[34, 1177, 113, 90], [215, 1183, 113, 84], [399, 1187, 106, 78], [569, 1136, 125, 131]],
      getOff: [[27, 1318, 155, 128], [178, 1318, 184, 127], [358, 1318, 184, 127], [538, 1361, 155, 84]],
    },
    catGreyTabby: {
      sheet: greyTabbyWheel,
      sheetW: 1440,
      sheetH: 2976,
      scale: 0.33,
      fps: 7,
      getOn: [[31, 833, 329, 261], [360, 837, 350, 257], [789, 830, 265, 256], [1132, 830, 266, 256], [54, 1174, 263, 256], [414, 1174, 264, 256]],
      run: [[58, 1559, 250, 254], [417, 1560, 251, 253], [778, 1560, 250, 254], [1137, 1560, 250, 253], [58, 1910, 250, 254], [417, 1910, 251, 254], [778, 1911, 250, 253], [1137, 1911, 249, 253]],
      slowDown: [[72, 2370, 218, 156], [477, 2356, 139, 170], [803, 2374, 201, 152], [1142, 2277, 242, 249]],
      getOff: [[58, 2640, 240, 246], [339, 2640, 238, 246], [617, 2640, 246, 246], [931, 2677, 189, 209], [1152, 2688, 229, 198]],
    },
  },
};
