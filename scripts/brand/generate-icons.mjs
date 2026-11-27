// Genera los íconos del sitio a partir del logo (armiño con auriculares, SVG).
//   npm run brand:icons
// Escribe en public/: favicon.ico (16, 32 y 48 px), favicon-96.png,
// y apple-touch-icon.png (180 px).
// Solo hace falta volver a correrlo si cambia el logo.
import { writeFile } from "node:fs/promises";
import sharp from "sharp";

const LOGO = "src/assets/brand/weasel-auriculares.svg";
const OUT = "public";

// Colores de src/styles/tokens.css
const VERMILION = "#e64a19";
const AMBER = "#ff9103";

// El SVG se rasteriza a este ancho antes de recortar (736×952 en su tamaño natural).
const RASTER_WIDTH = 1024;

// En tamaños chicos el cuerpo no se distingue: se recorta un cuadrado con la cabeza
// y los auriculares (fracciones del ancho del logo rasterizado).
const HEAD = { left: 0, top: 0, size: 1 };

function background(size, round) {
  const shape = round
    ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="url(#g)"/>`
    : `<rect width="${size}" height="${size}" fill="url(#g)"/>`;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${VERMILION}"/><stop offset="1" stop-color="${AMBER}"/>
      </linearGradient></defs>${shape}</svg>`,
  );
}

/** Logo sobre el fondo naranja. `round`: círculo con esquinas transparentes. */
async function icon(size, { round = true, crop = HEAD, scale = 0.92 } = {}) {
  const inner = Math.round(size * scale);
  const raster = await sharp(LOGO, { density: 300 }).resize({ width: RASTER_WIDTH }).png().toBuffer();
  const side = Math.round(RASTER_WIDTH * crop.size);
  const area = { left: Math.round(RASTER_WIDTH * crop.left), top: Math.round(RASTER_WIDTH * crop.top), width: side, height: side };
  const logo = await sharp(raster).extract(area).resize(inner, inner).png().toBuffer();
  const offset = Math.round((size - inner) / 2);
  return sharp(background(size, round))
    .composite([{ input: logo, top: offset, left: offset }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** ICO con PNG embebidos (formato aceptado por todos los navegadores actuales). */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // tipo: ícono
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4); // planos
    header.writeUInt16LE(32, e + 6); // bits por píxel
    header.writeUInt32LE(data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.data)]);
}

const icoSizes = [16, 32, 48];
const icoImages = await Promise.all(icoSizes.map(async (size) => ({ size, data: await icon(size) })));
await writeFile(`${OUT}/favicon.ico`, ico(icoImages));
await writeFile(`${OUT}/favicon-96.png`, await icon(96));

// iOS redondea el ícono por su cuenta: fondo cuadrado y algo de margen.
await writeFile(`${OUT}/apple-touch-icon.png`, await icon(180, { round: false, scale: 0.8 }));

console.log("Íconos generados en public/");
