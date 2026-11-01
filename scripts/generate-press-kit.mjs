// Builds the press-kit assets served from /press/:
//   public/press/logos/*.svg|png      logo variants (dark ink for light bg, white for dark bg)
//   public/press/screenshots/*.png    product screenshots (copied from src/assets/images)
//   public/downloads/micode-press-kit.zip   everything above + boilerplate .txt files
// Run from `prebuild`. See docs/contracts/press-kit-page.md.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { deflateRawSync } from 'zlib';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Minimal ZIP writer. entries: [{ name, data: Buffer }]. Fixed timestamp => reproducible output. */
export function buildZip(entries) {
  const DOS_TIME = 0;
  const DOS_DATE = ((2024 - 1980) << 9) | (1 << 5) | 1;
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const deflated = deflateRawSync(data);
    const useDeflate = deflated.length < data.length;
    const body = useDeflate ? deflated : data;
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(useDeflate ? 8 : 0, 8);
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    locals.push(local, nameBuf, body);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(useDeflate ? 8 : 0, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);
    offset += 30 + nameBuf.length + body.length;
  }
  const centralBuf = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralBuf, end]);
}

export function buildLogoVariants(markSvg) {
  // The source mark is black ink on transparent. The light variant swaps ink to white.
  const dark = markSvg;
  const light = markSvg.replace(/\bblack\b/g, 'white');
  const png = (svg) => new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return {
    'micode-logo-dark.svg': Buffer.from(dark),
    'micode-logo-dark.png': png(dark),
    'micode-logo-light.svg': Buffer.from(light),
    'micode-logo-light.png': png(light),
  };
}

export function run(rootDir = root) {
  const data = JSON.parse(readFileSync(join(rootDir, 'src/data/press-kit.json'), 'utf8'));
  const logosDir = join(rootDir, 'public/press/logos');
  const shotsDir = join(rootDir, 'public/press/screenshots');
  mkdirSync(logosDir, { recursive: true });
  mkdirSync(shotsDir, { recursive: true });
  mkdirSync(join(rootDir, 'public/downloads'), { recursive: true });

  const entries = [];
  const logos = buildLogoVariants(readFileSync(join(rootDir, 'public/mi_code_logo_mark.svg'), 'utf8'));
  for (const [name, buf] of Object.entries(logos)) {
    writeFileSync(join(logosDir, name), buf);
    entries.push({ name: `logos/${name}`, data: buf });
  }
  for (const shot of data.screenshots) {
    const from = join(rootDir, 'src/assets/images', shot.src);
    if (!existsSync(from)) throw new Error(`press kit: missing screenshot ${shot.src}`);
    copyFileSync(from, join(shotsDir, shot.src));
    entries.push({ name: `screenshots/${shot.src}`, data: readFileSync(from) });
  }
  if (data.includeFounderPhoto) {
    entries.push({ name: 'founder.jpg', data: readFileSync(join(rootDir, 'public/founder.jpg')) });
  }
  for (const lang of ['pl', 'en', 'ru']) {
    const b = data.boilerplate[lang];
    entries.push({ name: `boilerplate-${lang}.txt`, data: Buffer.from(`${b.short}\n\n---\n\n${b.long}\n`, 'utf8') });
  }
  entries.push({
    name: 'README.txt',
    data: Buffer.from(
      `MiCode press kit\nhttps://mi-code.pl/press/\nContact: ${data.contactEmail}\n\nLogo: use the dark version on light backgrounds, the light one on dark. Do not stretch or recolour.\n`,
      'utf8',
    ),
  });
  const zip = buildZip(entries);
  writeFileSync(join(rootDir, 'public', data.zipPath), zip);
  console.log(`  press kit: ${entries.length} files, zip ${(zip.length / 1024).toFixed(0)} KB`);
  return { entries, zip };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run();
