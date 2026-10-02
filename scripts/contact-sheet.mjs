// =============================================================================
// Suits Made Simple — imagery contact sheet
//
// Lays every generated frame out on one page so the whole collection can be
// reviewed at a glance, including any that still carry painted-on lettering.
//
//   node scripts/contact-sheet.mjs
//
// The sheet is written to `public/_review/contact-sheet.jpg`, which the dev or
// production server serves at http://localhost:3000/_review/contact-sheet.jpg
// =============================================================================

import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const COLUMNS = 6;
const CELL_WIDTH = 240;
const IMAGE_HEIGHT = 300;
const LABEL_HEIGHT = 30;
const GAP = 6;
const PADDING = 24;

const TITLE_HEIGHT = 56;

async function collect() {
  const frames = [];

  const products = path.join(ROOT, "public", "products");
  for (const file of (await readdir(products)).filter((name) => name.endsWith(".jpg")).sort()) {
    frames.push({ file: path.join(products, file), label: file.replace(/\.jpg$/, "") });
  }

  const hero = path.join(ROOT, "public", "hero");
  for (const file of (await readdir(hero)).filter((name) => name.endsWith(".jpg")).sort()) {
    frames.push({ file: path.join(hero, file), label: `hero/${file.replace(/\.jpg$/, "")}` });
  }

  return frames;
}

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (character) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character]
  );
}

async function main() {
  const frames = await collect();
  const columns = Math.min(COLUMNS, frames.length);
  const rows = Math.ceil(frames.length / columns);
  const cellHeight = IMAGE_HEIGHT + LABEL_HEIGHT;

  const width = PADDING * 2 + columns * CELL_WIDTH + (columns - 1) * GAP;
  const height = PADDING * 2 + TITLE_HEIGHT + rows * cellHeight + (rows - 1) * GAP;

  const canvas = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 250, g: 249, b: 246 },
    },
  });

  const composites = [];
  const labels = [];

  for (const [index, frame] of frames.entries()) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const left = PADDING + column * (CELL_WIDTH + GAP);
    const top = PADDING + TITLE_HEIGHT + row * (cellHeight + GAP);

    const tile = await sharp(frame.file)
      .resize(CELL_WIDTH, IMAGE_HEIGHT, { fit: "cover", position: "top" })
      .toBuffer();

    composites.push({ input: tile, left, top });
    labels.push(
      `<text x="${left + CELL_WIDTH / 2}" y="${top + IMAGE_HEIGHT + 19}" ` +
        `font-family="Helvetica,Arial,sans-serif" font-size="11" fill="#5A6675" ` +
        `text-anchor="middle">${escapeXml(frame.label)}</text>`
    );
  }

  const overlay = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">` +
      `<text x="${PADDING}" y="${PADDING + 22}" font-family="Georgia,serif" font-size="22" fill="#242B34">` +
      `Suits Made Simple — imagery review (${frames.length} frames)</text>` +
      `<text x="${PADDING}" y="${PADDING + 42}" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#8B95A3">` +
      `Check each frame for painted-on lettering, logos or signage.</text>` +
      labels.join("") +
      `</svg>`
  );

  const reviewDir = path.join(ROOT, "public", "_review");
  await mkdir(reviewDir, { recursive: true });
  const out = path.join(reviewDir, "contact-sheet.jpg");
  const info = await canvas
    .composite([...composites, { input: overlay, left: 0, top: 0 }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(out);

  console.log(`Wrote ${path.relative(ROOT, out)} — ${width}x${height}, ${Math.round(info.size / 1024)} KB`);
  console.log("Open it at http://localhost:3000/_review/contact-sheet.jpg");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
