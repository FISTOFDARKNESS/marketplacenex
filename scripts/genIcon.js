// One-off PNG icon generator (no external deps). Draws the NexBlox "N" mark.
const zlib = require('zlib');
const fs = require('fs');

function makeIcon(size) {
  const W = size, H = size;
  const buf = Buffer.alloc(W * H * 4);

  const set = (x, y, r, g, b) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4;
    buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255;
  };

  // background
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) set(x, y, 10, 10, 10);

  const gold = [234, 200, 71];
  const m = Math.round(size * 0.16); // margin
  const t = Math.max(2, Math.round(size * 0.05)); // border thickness
  const radius = Math.round(size * 0.14);
  const cx = W / 2, cy = H / 2;

  const inRounded = (x, y) => {
    const left = m, right = W - m, top = m, bottom = H - m;
    if (x < left || x > right || y < top || y > bottom) return false;
    // corners
    const corners = [
      [left + radius, top + radius],
      [right - radius, top + radius],
      [left + radius, bottom - radius],
      [right - radius, bottom - radius],
    ];
    for (const [rxc, ryc] of corners) {
      const dx = x - rxc, dy = y - ryc;
      const inCorner = (rxc < cx ? x < rxc : x > rxc) && (ryc < cy ? y < ryc : y > ryc);
      if (inCorner) {
        if (dx * dx + dy * dy > radius * radius) return false;
      }
    }
    return true;
  };

  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (inRounded(x, y)) {
      const left = m, right = W - m, top = m, bottom = H - m;
      if (x - left < t || right - x < t || y - top < t || bottom - y < t) set(x, y, ...gold);
    }
  }

  // "N": two vertical bars + diagonal
  const bx = Math.round(size * 0.30); // bar width
  const bxo = Math.round(size * 0.26); // left offset
  const byo = Math.round(size * 0.30); // top offset
  const bye = H - byo; // bottom
  const gap = Math.round(size * 0.30);
  const leftX = bxo, rightX = W - bxo - bx;

  const drawBar = (x0) => { for (let y = byo; y < bye; y++) for (let x = x0; x < x0 + bx; x++) set(x, y, ...gold); };
  drawBar(leftX);
  drawBar(rightX);

  // diagonal from bottom-left to top-right
  for (let y = byo; y < bye; y++) {
    const f = (y - byo) / (bye - byo);
    const x0 = Math.round(leftX + f * (rightX + bx - leftX));
    for (let x = x0; x < x0 + Math.max(2, Math.round(size * 0.05)); x++) set(x, y, ...gold);
  }

  // PNG encode
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (W * 4 + 1)] = 0; // filter none
    buf.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
  }
  const idat = zlib.deflateSync(raw);

  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c >>> 0;
  }
  const crc32 = (b) => {
    let c = 0xffffffff;
    for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type, 'ascii');
    const cd = Buffer.concat([t, data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(cd), 0);
    return Buffer.concat([len, cd, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

fs.writeFileSync('public/icon-192.png', makeIcon(192));
fs.writeFileSync('public/apple-touch-icon.png', makeIcon(180));
console.log('icons written');
