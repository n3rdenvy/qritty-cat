# QRitty Cat

A cute, fully client-side **custom QR code generator** — with a corral of pixel cats living in the background.

Everything runs in your browser. No sign-up, no server, nothing leaves your device.

## Features

- **Custom QR codes** — colors, gradients, dot styles, corner + corner-dot styles, outer shape (square/circle), error-correction level, and a center logo with built-in image filters (line-art, background removal, subject extraction).
- **Data types** — plain URL/text, WiFi, contact card, and email.
- **Downloads** — PNG, SVG, JPEG, WEBP.
- **The cats** — an ambient scene of pixel cats that wander, emote, chase the occasional laser dot, and play with toys that come and go.

## Run it

```bash
npm install
npm run dev      # → http://localhost:5299
npm run build    # production build
```

## Stack

Vite (vanilla JS) + [`qr-code-styling`](https://github.com/kozakdenys/qr-code-styling). QR generation is all local; the cat sprites are background flavor.

## A note on art assets

The pixel-cat sprites, props, and emotion bubbles under `src/assets/critters/` are third-party / placeholder game-art assets used here for a personal project. If you fork or reuse this, check the licensing of those assets before redistributing them.
