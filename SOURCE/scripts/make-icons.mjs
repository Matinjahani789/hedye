// One-off generator for the PWA icons (pure Node, no dependencies).
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const crcT = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const IV = hex("#FBFAF7"), BR = hex("#563E32"), GO = hex("#C7A76A"), PA = hex("#FFFFFF");

function shade(x, y) { // x,y in 0..1
  const d = Math.hypot(x - .5, y - .5);
  if (d > .365 && d < .385) return GO;
  if (d <= .33) {
    const inBox = x > .34 && x < .66 && y > .47 && y < .68;
    const inLid = x > .31 && x < .69 && y > .41 && y <= .47;
    const rib = Math.abs(x - .5) < .018 && y > .41 && y < .68;
    const ribH = Math.abs(y - .535) < .012 && x > .34 && x < .66;
    const bowL = Math.abs(Math.hypot((x - .445) / 1.3, y - .375) - .045) < .009 && y < .415;
    const bowR = Math.abs(Math.hypot((x - .555) / 1.3, y - .375) - .045) < .009 && y < .415;
    if (rib || bowL || bowR || (ribH && false)) return GO;
    if (inLid) return PA;
    if (inBox) return IV;
    return BR;
  }
  return IV;
}
function png(size, file) {
  const S = 3, raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
        const c = shade((x + (sx + .5) / S) / size, (y + (sy + .5) / S) / size);
        r += c[0]; g += c[1]; b += c[2];
      }
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r / (S * S); raw[o + 1] = g / (S * S); raw[o + 2] = b / (S * S); raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]));
}
png(192, "public/icons/icon-192.png");
png(512, "public/icons/icon-512.png");
png(180, "public/icons/apple-touch-icon.png");
console.log("icons written");
