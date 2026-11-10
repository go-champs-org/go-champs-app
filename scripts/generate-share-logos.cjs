// Builds the share-sticker logos (Compartilhar perfil) from the transparent
// dark wordmark: a dark one and a white and lime one, cropped and at half size,
// plus the checkerboard tiles that show transparency behind the previews.
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'assets/branding/wordmark-dark.png');
const outDir = path.join(root, 'assets/images/share');
const im = PNG.sync.read(fs.readFileSync(src));
const DARK = [29, 29, 27], WHITE = [255, 255, 255], LIME = [213, 255, 39];
let l = im.width, t = im.height, r = 0, b = 0;
for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) {
  if (im.data[(y * im.width + x) * 4 + 3] > 0) { l = Math.min(l, x); t = Math.min(t, y); r = Math.max(r, x); b = Math.max(b, y); }
}
const pad = 4; l -= pad; t -= pad; r += pad; b += pad;
let w = r - l + 1, h = b - t + 1; if (w % 2) { w++; } if (h % 2) { h++; }
const ballX = 1130, ballY = 1065; // the ball sits right of "GO", above "CHAMPS"
const build = (colorAt) => {
  const out = new PNG({ width: w / 2, height: h / 2 });
  for (let y = 0; y < h / 2; y++) for (let x = 0; x < w / 2; x++) {
    let a = 0, c = [0, 0, 0];
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const sx = l + x * 2 + dx, sy = t + y * 2 + dy;
      const alpha = sx < im.width && sy < im.height ? im.data[(sy * im.width + sx) * 4 + 3] : 0;
      const col = colorAt(sx, sy);
      a += alpha; for (let k = 0; k < 3; k++) c[k] += col[k] * alpha;
    }
    const i = (y * (w / 2) + x) * 4;
    out.data[i + 3] = Math.round(a / 4);
    for (let k = 0; k < 3; k++) out.data[i + k] = a ? Math.round(c[k] / a) : 0;
  }
  return out;
};
fs.writeFileSync(path.join(outDir, 'logo-dark.png'), PNG.sync.write(build(() => DARK)));
fs.writeFileSync(path.join(outDir, 'logo-light.png'), PNG.sync.write(build((x, y) => (x >= ballX && y < ballY ? LIME : WHITE))));
// 2x2 checkerboard tiles that show transparency behind the previews.
const checker = (a, bb, name) => {
  const size = 10, out = new PNG({ width: size * 2, height: size * 2 });
  for (let y = 0; y < size * 2; y++) for (let x = 0; x < size * 2; x++) {
    const col = (Math.floor(x / size) + Math.floor(y / size)) % 2 ? bb : a;
    out.data.set([...col, 255], (y * size * 2 + x) * 4);
  }
  fs.writeFileSync(path.join(outDir, name), PNG.sync.write(out));
};
checker([236, 236, 230], [214, 214, 206], 'checker-light.png');
checker([58, 58, 56], [44, 44, 42], 'checker-dark.png');
console.log(`share logos: ${w / 2}x${h / 2}`);
