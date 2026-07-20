import QRCodeStyling from "qr-code-styling";
import "./style.css";
import { applyLineArt, removeBackground, extractSubject } from "./image-filters.js";
import { initCritterScene } from "./critter-scene.js";

import iconDownload from "./icons/download-bold.svg?raw";
import iconUpload from "./icons/gallery-add-bold.svg?raw";
import iconLink from "./icons/link-bold.svg?raw";
import iconPalette from "./icons/palette-bold.svg?raw";
import iconWand from "./icons/magic-stick-3-bold.svg?raw";
import iconQr from "./icons/qr-code-bold.svg?raw";

const PRESETS = [
  { fg: "#3a2f2a", bg: "#ffffff", name: "Classic" },
  { fg: "#ef5f52", bg: "#fff8f0", name: "Blush" },
  { fg: "#4fae95", bg: "#f2fbf8", name: "Mint" },
  { fg: "#6c63ff", bg: "#f4f2ff", name: "Grape" },
  { fg: "#ff9f43", bg: "#fff6ea", name: "Peach" },
  { fg: "#2d3436", bg: "#dfe6e9", name: "Slate" },
];

const DOT_STYLES = [
  ["rounded", "Rounded"],
  ["dots", "Dots"],
  ["classy-rounded", "Classy"],
  ["extra-rounded", "Extra Rounded"],
  ["square", "Square"],
];

const CORNER_STYLES = [
  ["extra-rounded", "Extra Rounded"],
  ["dot", "Dot"],
  ["rounded", "Rounded"],
  ["classy", "Classy"],
  ["classy-rounded", "Classy Rounded"],
  ["dots", "Dots"],
  ["square", "Square"],
];

const CORNER_DOT_STYLES = [
  ["dot", "Dot"],
  ["square", "Square"],
  ["rounded", "Rounded"],
  ["dots", "Dots"],
  ["classy", "Classy"],
  ["classy-rounded", "Classy Rounded"],
  ["extra-rounded", "Extra Rounded"],
];

const ERROR_LEVELS = [
  ["L", "Low"],
  ["M", "Med"],
  ["Q", "Quart"],
  ["H", "High"],
];

document.querySelector("#app").innerHTML = `
  <div class="hero-bar">
    <div class="wordmark">${iconQr} QRitty Cat</div>
    <span class="badge">Free · no sign-up · nothing leaves your browser</span>
  </div>

  <div id="view-quick"></div>
`;

initQuickStyle(document.querySelector("#view-quick"));

const critterStage = document.createElement("div");
critterStage.className = "critter-stage";
document.body.prepend(critterStage);
// The scene computes the box "no-stop" zones itself from live rects each query,
// so it always tracks the current layout (and dodges the innerWidth-at-load quirk).
initCritterScene(critterStage, [".controls-square", ".qr-square"]);

function initQuickStyle(root) {
  root.innerHTML = `
    <div class="dual-square">
      <div class="mega-square controls-square">
        <div class="field">
          <div class="row row-2-uneven">
            <div>
              <label>Type</label>
              <select id="data-type">
                <option value="url">URL / Text</option>
                <option value="wifi">WiFi</option>
                <option value="contact">Contact</option>
                <option value="email">Email</option>
              </select>
            </div>
            <div id="simple-field-wrap">
              <label>${iconLink} <span id="data-label">Link or text</span></label>
              <input id="data-input-simple" type="text" placeholder="https://your-link.com or any text" value="https://howcanerik.help" />
            </div>
          </div>
        </div>

        <div class="field" id="wifi-fields" style="display:none">
          <div class="row row-3">
            <div><label>SSID</label><input id="wifi-ssid" type="text" placeholder="Network name" /></div>
            <div><label>Password</label><input id="wifi-pass" type="text" placeholder="Password" /></div>
            <div><label>Security</label><select id="wifi-enc"><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">None</option></select></div>
          </div>
        </div>

        <div class="field" id="contact-fields" style="display:none">
          <div class="row row-3">
            <div><label>Name</label><input id="contact-name" type="text" placeholder="Full name" /></div>
            <div><label>Phone</label><input id="contact-phone" type="text" placeholder="Phone" /></div>
            <div><label>Email</label><input id="contact-email" type="text" placeholder="Email" /></div>
          </div>
        </div>

        <div class="field" id="email-fields" style="display:none">
          <div class="row row-3">
            <div><label>To</label><input id="email-to" type="text" placeholder="name@example.com" /></div>
            <div><label>Subject</label><input id="email-subject" type="text" placeholder="Subject" /></div>
            <div><label>Body</label><input id="email-body" type="text" placeholder="Message" /></div>
          </div>
        </div>

        <div class="field">
          <label>${iconPalette} Colors</label>
          <div class="row">
            <div class="color-field">
              <input id="fg-color" type="color" value="#3a2f2a" />
              <span>Foreground</span>
            </div>
            <div class="color-field">
              <input id="bg-color" type="color" value="#ffffff" />
              <span>Background</span>
            </div>
          </div>
        </div>

        <div class="field">
          <label>Cute presets</label>
          <div class="presets" id="presets"></div>
        </div>

        <div class="field">
          <div class="row style-grid">
            <div><label>Dot style</label><select id="dot-style"></select></div>
            <div><label>Corner style</label><select id="corner-style"></select></div>
            <div><label>Corner dot</label><select id="corner-dot-style"></select></div>
            <div><label>Outer shape</label><select id="outer-shape"><option value="square">Square</option><option value="circle">Circle</option></select></div>
            <div><label>Error level</label><select id="error-level"></select></div>
            <div class="gradient-toggle-cell"><label class="checkbox-label"><input type="checkbox" id="gradient-toggle" /> Gradient</label></div>
          </div>
          <div class="row" id="gradient-row" style="display:none">
            <div class="color-field">
              <input id="gradient-color" type="color" value="#6fa855" />
              <span>Gradient end</span>
            </div>
            <div>
              <select id="gradient-type">
                <option value="linear">Linear</option>
                <option value="radial">Radial</option>
              </select>
            </div>
          </div>
        </div>

        <div class="field">
          <label>${iconUpload} Center logo (optional)</label>
          <div class="upload-row">
            <label class="upload-btn" for="logo-input">${iconUpload} Upload</label>
            <input id="logo-input" type="file" accept="image/*" hidden />
            <span class="logo-chip" id="logo-chip"><img id="logo-preview" /> <button id="logo-remove">×</button></span>
          </div>
          <div class="filter-row" id="logo-filters" style="display:none">
            <button type="button" class="filter-chip active" data-filter="original">Original</button>
            <button type="button" class="filter-chip" data-filter="lineArt">Line Art</button>
            <button type="button" class="filter-chip" data-filter="removeBg">Remove BG</button>
            <button type="button" class="filter-chip" data-filter="extractSubject">Extract</button>
          </div>
        </div>

        <button class="randomize" id="randomize-btn">${iconWand} Surprise me</button>
      </div>

      <div class="mega-square qr-square">
        <div class="qr-frame">
          <div id="qr-canvas"></div>
        </div>
        <div class="download-row">
          <button class="btn btn-primary" id="download-png">${iconDownload} PNG</button>
          <button class="btn btn-ghost" id="download-svg">${iconDownload} SVG</button>
          <button class="btn btn-ghost" id="download-jpeg">${iconDownload} JPEG</button>
          <button class="btn btn-ghost" id="download-webp">${iconDownload} WEBP</button>
        </div>
      </div>
    </div>
  `;

  const dotSelect = root.querySelector("#dot-style");
  dotSelect.innerHTML = DOT_STYLES.map(([v, l]) => `<option value="${v}">${l}</option>`).join("");

  const cornerSelect = root.querySelector("#corner-style");
  cornerSelect.innerHTML = CORNER_STYLES.map(([v, l]) => `<option value="${v}">${l}</option>`).join("");

  const cornerDotSelect = root.querySelector("#corner-dot-style");
  cornerDotSelect.innerHTML = CORNER_DOT_STYLES.map(([v, l]) => `<option value="${v}">${l}</option>`).join("");

  const errorSelect = root.querySelector("#error-level");
  errorSelect.innerHTML = ERROR_LEVELS.map(([v, l]) => `<option value="${v}">${l}</option>`).join("");

  const shapeSelect = root.querySelector("#outer-shape");

  const presetsEl = root.querySelector("#presets");
  presetsEl.innerHTML = PRESETS.map(
    (p, i) =>
      `<button class="preset-dot" data-index="${i}" title="${p.name}" style="background:linear-gradient(135deg, ${p.fg} 50%, ${p.bg} 50%)"></button>`
  ).join("");

  const state = {
    dataType: "url",
    simpleValue: "https://howcanerik.help",
    wifi: { ssid: "", pass: "", enc: "WPA" },
    contact: { name: "", phone: "", email: "" },
    email: { to: "", subject: "", body: "" },
    fg: "#3a2f2a",
    bg: "#ffffff",
    dots: "rounded",
    corners: "extra-rounded",
    cornerDots: "dot",
    shape: "square",
    errorLevel: "Q",
    gradient: false,
    gradientColor: "#6fa855",
    gradientType: "linear",
    logo: null,
    logoOriginal: null,
  };

  function buildData() {
    switch (state.dataType) {
      case "wifi":
        return `WIFI:T:${state.wifi.enc};S:${state.wifi.ssid};P:${state.wifi.pass};;`;
      case "contact":
        return `MECARD:N:${state.contact.name};TEL:${state.contact.phone};EMAIL:${state.contact.email};;`;
      case "email":
        return `mailto:${state.email.to}?subject=${encodeURIComponent(state.email.subject)}&body=${encodeURIComponent(state.email.body)}`;
      default:
        return state.simpleValue;
    }
  }

  function colorOrGradient(color) {
    if (!state.gradient) return { color, gradient: undefined };
    return {
      color,
      gradient: {
        type: state.gradientType,
        rotation: Math.PI / 4,
        colorStops: [
          { offset: 0, color },
          { offset: 1, color: state.gradientColor },
        ],
      },
    };
  }

  const qrCode = new QRCodeStyling({
    width: 320,
    height: 320,
    type: "svg",
    shape: state.shape,
    data: buildData() || " ",
    margin: 8,
    qrOptions: { errorCorrectionLevel: state.errorLevel },
    imageOptions: { crossOrigin: "anonymous", margin: 6, imageSize: 0.4 },
    dotsOptions: { type: state.dots, ...colorOrGradient(state.fg) },
    backgroundOptions: { color: state.bg },
    cornersSquareOptions: { type: state.corners, ...colorOrGradient(state.fg) },
    cornersDotOptions: { type: state.cornerDots, ...colorOrGradient(state.fg) },
  });

  qrCode.append(root.querySelector("#qr-canvas"));

  function refresh() {
    const effectiveError = state.logo && state.errorLevel !== "H" ? "H" : state.errorLevel;
    qrCode.update({
      data: buildData() || " ",
      image: state.logo || undefined,
      shape: state.shape,
      qrOptions: { errorCorrectionLevel: effectiveError },
      dotsOptions: { type: state.dots, ...colorOrGradient(state.fg) },
      backgroundOptions: { color: state.bg },
      cornersSquareOptions: { type: state.corners, ...colorOrGradient(state.fg) },
      cornersDotOptions: { type: state.cornerDots, ...colorOrGradient(state.fg) },
    });
  }

  const typeSelect = root.querySelector("#data-type");
  const simpleField = root.querySelector("#simple-field-wrap");
  const wifiFields = root.querySelector("#wifi-fields");
  const contactFields = root.querySelector("#contact-fields");
  const emailFields = root.querySelector("#email-fields");
  const dataLabel = root.querySelector("#data-label");

  typeSelect.addEventListener("change", (e) => {
    state.dataType = e.target.value;
    simpleField.style.display = state.dataType === "url" ? "block" : "none";
    wifiFields.style.display = state.dataType === "wifi" ? "block" : "none";
    contactFields.style.display = state.dataType === "contact" ? "block" : "none";
    emailFields.style.display = state.dataType === "email" ? "block" : "none";
    dataLabel.textContent = state.dataType === "url" ? "Link or text" : "";
    refresh();
  });

  root.querySelector("#data-input-simple").addEventListener("input", (e) => {
    state.simpleValue = e.target.value;
    refresh();
  });

  ["wifi-ssid", "wifi-pass"].forEach((id) => {
    root.querySelector(`#${id}`).addEventListener("input", (e) => {
      state.wifi[id.replace("wifi-", "")] = e.target.value;
      refresh();
    });
  });
  root.querySelector("#wifi-enc").addEventListener("change", (e) => {
    state.wifi.enc = e.target.value;
    refresh();
  });

  ["contact-name", "contact-phone", "contact-email"].forEach((id) => {
    root.querySelector(`#${id}`).addEventListener("input", (e) => {
      state.contact[id.replace("contact-", "")] = e.target.value;
      refresh();
    });
  });

  ["email-to", "email-subject", "email-body"].forEach((id) => {
    root.querySelector(`#${id}`).addEventListener("input", (e) => {
      state.email[id.replace("email-", "")] = e.target.value;
      refresh();
    });
  });

  root.querySelector("#fg-color").addEventListener("input", (e) => {
    state.fg = e.target.value;
    refresh();
  });

  root.querySelector("#bg-color").addEventListener("input", (e) => {
    state.bg = e.target.value;
    refresh();
  });

  dotSelect.value = state.dots;
  dotSelect.addEventListener("change", (e) => {
    state.dots = e.target.value;
    refresh();
  });

  cornerSelect.value = state.corners;
  cornerSelect.addEventListener("change", (e) => {
    state.corners = e.target.value;
    refresh();
  });

  cornerDotSelect.value = state.cornerDots;
  cornerDotSelect.addEventListener("change", (e) => {
    state.cornerDots = e.target.value;
    refresh();
  });

  shapeSelect.value = state.shape;
  shapeSelect.addEventListener("change", (e) => {
    state.shape = e.target.value;
    refresh();
  });

  errorSelect.value = state.errorLevel;
  errorSelect.addEventListener("change", (e) => {
    state.errorLevel = e.target.value;
    refresh();
  });

  const gradientToggle = root.querySelector("#gradient-toggle");
  const gradientRow = root.querySelector("#gradient-row");
  gradientToggle.addEventListener("change", (e) => {
    state.gradient = e.target.checked;
    gradientRow.style.display = state.gradient ? "grid" : "none";
    refresh();
  });

  root.querySelector("#gradient-color").addEventListener("input", (e) => {
    state.gradientColor = e.target.value;
    refresh();
  });

  root.querySelector("#gradient-type").addEventListener("change", (e) => {
    state.gradientType = e.target.value;
    refresh();
  });

  presetsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".preset-dot");
    if (!btn) return;
    const preset = PRESETS[Number(btn.dataset.index)];
    state.fg = preset.fg;
    state.bg = preset.bg;
    root.querySelector("#fg-color").value = preset.fg;
    root.querySelector("#bg-color").value = preset.bg;
    refresh();
  });

  const logoInput = root.querySelector("#logo-input");
  const logoChip = root.querySelector("#logo-chip");
  const logoPreview = root.querySelector("#logo-preview");
  const logoFilters = root.querySelector("#logo-filters");
  const filterButtons = [...logoFilters.querySelectorAll(".filter-chip")];

  function setLogo(dataUrl) {
    state.logoOriginal = dataUrl;
    state.logo = dataUrl;
    logoPreview.src = dataUrl;
    logoChip.style.display = "inline-flex";
    logoFilters.style.display = "flex";
    filterButtons.forEach((b) => b.classList.toggle("active", b.dataset.filter === "original"));
    refresh();
  }

  logoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result);
    reader.readAsDataURL(file);
  });

  root.querySelector("#logo-remove").addEventListener("click", () => {
    state.logo = null;
    state.logoOriginal = null;
    logoInput.value = "";
    logoChip.style.display = "none";
    logoFilters.style.display = "none";
    refresh();
  });

  logoFilters.addEventListener("click", async (e) => {
    const btn = e.target.closest(".filter-chip");
    if (!btn || !state.logoOriginal) return;
    filterButtons.forEach((b) => b.classList.toggle("active", b === btn));
    const filter = btn.dataset.filter;
    let result = state.logoOriginal;
    if (filter === "lineArt") result = await applyLineArt(state.logoOriginal);
    else if (filter === "removeBg") result = await removeBackground(state.logoOriginal);
    else if (filter === "extractSubject") result = await extractSubject(state.logoOriginal);
    state.logo = result;
    logoPreview.src = result;
    refresh();
  });

  root.querySelector("#randomize-btn").addEventListener("click", () => {
    const preset = PRESETS[Math.floor(Math.random() * PRESETS.length)];
    const dot = DOT_STYLES[Math.floor(Math.random() * DOT_STYLES.length)][0];
    const corner = CORNER_STYLES[Math.floor(Math.random() * CORNER_STYLES.length)][0];
    const cornerDot = CORNER_DOT_STYLES[Math.floor(Math.random() * CORNER_DOT_STYLES.length)][0];
    const errorLevel = ERROR_LEVELS[Math.floor(Math.random() * ERROR_LEVELS.length)][0];
    const gradientOn = Math.random() < 0.5;
    // Gradient end = a different preset's foreground, so the blend is always two
    // on-palette colors rather than a random muddy hex.
    let gradEnd = state.gradientColor;
    for (let i = 0; i < 6 && gradEnd === state.gradientColor; i++) {
      gradEnd = PRESETS[Math.floor(Math.random() * PRESETS.length)].fg;
    }
    if (gradEnd === preset.fg) gradEnd = state.gradientColor;
    const gradType = Math.random() < 0.5 ? "linear" : "radial";

    state.fg = preset.fg;
    state.bg = preset.bg;
    state.dots = dot;
    state.corners = corner;
    state.cornerDots = cornerDot;
    state.errorLevel = errorLevel;
    state.gradient = gradientOn;
    state.gradientColor = gradEnd;
    state.gradientType = gradType;
    // NOTE: state.logo / state.logoOriginal are deliberately left untouched — an
    // uploaded logo survives every "Surprise me" (refresh() re-applies it, and
    // bumps error-correction to H automatically when a logo is present).

    root.querySelector("#fg-color").value = preset.fg;
    root.querySelector("#bg-color").value = preset.bg;
    dotSelect.value = dot;
    cornerSelect.value = corner;
    cornerDotSelect.value = cornerDot;
    errorSelect.value = errorLevel;
    gradientToggle.checked = gradientOn;
    gradientRow.style.display = gradientOn ? "grid" : "none";
    root.querySelector("#gradient-color").value = gradEnd;
    root.querySelector("#gradient-type").value = gradType;
    refresh();
  });

  ["png", "svg", "jpeg", "webp"].forEach((ext) => {
    root.querySelector(`#download-${ext}`).addEventListener("click", () => {
      qrCode.download({ name: "qr-code", extension: ext });
    });
  });
}
