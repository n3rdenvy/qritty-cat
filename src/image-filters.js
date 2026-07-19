function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

async function toCanvas(dataUrl) {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return { canvas, ctx };
}

function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

export async function applyLineArt(dataUrl) {
  const { canvas, ctx } = await toCanvas(dataUrl);
  const { width, height } = canvas;
  const src = ctx.getImageData(0, 0, width, height);
  const gray = new Float32Array(width * height);

  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    gray[i] = 0.299 * src.data[o] + 0.587 * src.data[o + 1] + 0.114 * src.data[o + 2];
  }

  const out = ctx.createImageData(width, height);
  const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sx = 0;
      let sy = 0;
      let k = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const val = gray[(y + dy) * width + (x + dx)];
          sx += val * gx[k];
          sy += val * gy[k];
          k++;
        }
      }
      const magnitude = Math.sqrt(sx * sx + sy * sy);
      const isEdge = magnitude > 90;
      const o = (y * width + x) * 4;
      out.data[o] = 0;
      out.data[o + 1] = 0;
      out.data[o + 2] = 0;
      out.data[o + 3] = isEdge ? 255 : 0;
    }
  }

  ctx.clearRect(0, 0, width, height);
  ctx.putImageData(out, 0, 0);
  return canvas.toDataURL("image/png");
}

export async function removeBackground(dataUrl, tolerance = 34) {
  const { canvas, ctx } = await toCanvas(dataUrl);
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  const corners = [0, (width - 1) * 4, (height - 1) * width * 4, ((height - 1) * width + width - 1) * 4];
  let br = 0;
  let bg = 0;
  let bb = 0;
  corners.forEach((o) => {
    br += data[o];
    bg += data[o + 1];
    bb += data[o + 2];
  });
  br /= corners.length;
  bg /= corners.length;
  bb /= corners.length;

  const visited = new Uint8Array(width * height);
  const queue = [];
  for (let x = 0; x < width; x++) {
    queue.push(x, x + (height - 1) * width);
  }
  for (let y = 0; y < height; y++) {
    queue.push(y * width, y * width + width - 1);
  }

  let qi = 0;
  while (qi < queue.length) {
    const idx = queue[qi++];
    if (visited[idx]) continue;
    visited[idx] = 1;
    const o = idx * 4;
    const dist = colorDistance(data[o], data[o + 1], data[o + 2], br, bg, bb);
    if (dist > tolerance) continue;

    data[o + 3] = 0;

    const x = idx % width;
    const y = (idx / width) | 0;
    if (x > 0 && !visited[idx - 1]) queue.push(idx - 1);
    if (x < width - 1 && !visited[idx + 1]) queue.push(idx + 1);
    if (y > 0 && !visited[idx - width]) queue.push(idx - width);
    if (y < height - 1 && !visited[idx + width]) queue.push(idx + width);
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

export async function extractSubject(dataUrl, tolerance = 34, padding = 6) {
  const bgRemoved = await removeBackground(dataUrl, tolerance);
  const { canvas, ctx } = await toCanvas(bgRemoved);
  const { width, height } = canvas;
  const { data } = ctx.getImageData(0, 0, width, height);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) return bgRemoved;

  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);
  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;

  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = cropW;
  cropCanvas.height = cropH;
  cropCanvas.getContext("2d").drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
  return cropCanvas.toDataURL("image/png");
}
