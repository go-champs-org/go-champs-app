const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { PNG } = require('pngjs');
const { generateImageAsync } = require('@expo/image-utils');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'assets/branding/source-logo.png');
const output = path.join(root, 'assets/images');
const background = [29, 29, 27];
const foreground = [213, 255, 39];

async function main() {
  const source = PNG.sync.read(fs.readFileSync(sourcePath));
  const artwork = new PNG({ width: source.width, height: source.height });
  const direction = foreground.map((value, channel) => value - background[channel]);
  const magnitude = direction.reduce((sum, value) => sum + value * value, 0);
  let left = source.width, top = source.height, right = 0, bottom = 0;

  // Recover the original flat-color artwork and antialiased edges from its dark matte.
  for (let y = 0; y < source.height; y++) {
    for (let x = 0; x < source.width; x++) {
      const index = (y * source.width + x) * 4;
      const coverage = Math.max(0, Math.min(1, direction.reduce((sum, value, channel) =>
        sum + (source.data[index + channel] - background[channel]) * value, 0) / magnitude));
      const alpha = Math.round(coverage * source.data[index + 3]);
      artwork.data.set([...foreground, alpha], index);
      if (alpha > 0) {
        left = Math.min(left, x); top = Math.min(top, y);
        right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
    }
  }
  if (left > right || top > bottom) throw new Error('Source artwork is empty');
  const cropped = new PNG({ width: right - left + 1, height: bottom - top + 1 });
  PNG.bitblt(artwork, cropped, left, top, cropped.width, cropped.height, 0, 0);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'go-champs-icons-'));
  try {
    const croppedPath = path.join(temp, 'artwork.png');
    fs.writeFileSync(croppedPath, PNG.sync.write(cropped));

    async function render(filename, size, artworkSize, opaque, monochrome = false) {
      const { source: resized } = await generateImageAsync({ projectRoot: root }, {
        src: croppedPath, width: artworkSize, height: artworkSize, resizeMode: 'contain',
      });
      const symbol = PNG.sync.read(resized);
      const canvas = new PNG({ width: size, height: size });
      const offset = Math.floor((size - artworkSize) / 2);
      PNG.bitblt(symbol, canvas, 0, 0, symbol.width, symbol.height, offset, offset);
      for (let index = 0; index < canvas.data.length; index += 4) {
        const alpha = canvas.data[index + 3] / 255;
        for (let channel = 0; channel < 3; channel++) {
          canvas.data[index + channel] = opaque
            ? Math.round(canvas.data[index + channel] * alpha + background[channel] * (1 - alpha))
            : monochrome ? 255 : canvas.data[index + channel];
        }
        if (opaque) canvas.data[index + 3] = 255;
      }
      fs.writeFileSync(path.join(output, filename), PNG.sync.write(canvas, { colorType: opaque ? 2 : 6 }));
      console.log(`${filename}: ${size}x${size}, ${opaque ? 'opaque RGB' : 'transparent RGBA'}`);
    }

    await render('icon.png', 1024, 720, true);
    await render('adaptive-icon.png', 1024, 608, false);
    await render('adaptive-icon-monochrome.png', 1024, 608, false, true);
    await render('android-play-store.png', 512, 360, true);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
