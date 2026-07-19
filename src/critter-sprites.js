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

// Cropped from the new emotion-bubbles sheet (1792x2390), background stripped.
export const EMOTION_SPRITES = [
  { x: 1558, y: 954, w: 64, h: 57, sheetW: 1792, sheetH: 2390 },
  { x: 1640, y: 954, w: 113, h: 169, sheetW: 1792, sheetH: 2390 },
  { x: 20, y: 1201, w: 231, h: 221, sheetW: 1792, sheetH: 2390 },
  { x: 482, y: 1201, w: 200, h: 221, sheetW: 1792, sheetH: 2390 },
  { x: 1300, y: 1212, w: 140, h: 128, sheetW: 1792, sheetH: 2390 },
  { x: 1610, y: 1201, w: 164, h: 221, sheetW: 1792, sheetH: 2390 },
].map((s) => ({ ...s, sheet: emotionBubbles }));
