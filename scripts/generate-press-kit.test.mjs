import { describe, it, expect } from 'vitest';
import { buildZip, crc32, buildLogoVariants } from './generate-press-kit.mjs';

describe('generate-press-kit', () => {
  it('crc32 matches the known check value', () => {
    expect(crc32(Buffer.from('123456789'))).toBe(0xcbf43926);
  });

  it('buildZip writes local headers, a central directory and an end record', () => {
    const zip = buildZip([
      { name: 'a.txt', data: Buffer.from('hello hello hello hello') },
      { name: 'd/b.txt', data: Buffer.from('x') },
    ]);
    expect(zip.readUInt32LE(0)).toBe(0x04034b50);
    const eocd = zip.length - 22;
    expect(zip.readUInt32LE(eocd)).toBe(0x06054b50);
    expect(zip.readUInt16LE(eocd + 10)).toBe(2);
  });

  it('light logo variant swaps black ink for white', () => {
    const v = buildLogoVariants(
      '<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h10v10z" fill="black"/></svg>',
    );
    expect(v['micode-logo-light.svg'].toString()).toContain('white');
    expect(v['micode-logo-dark.svg'].toString()).toContain('black');
    expect(v['micode-logo-dark.png'].subarray(1, 4).toString()).toBe('PNG');
  });
});
