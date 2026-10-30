import { brotliDecompressSync } from "node:zlib";

/*
 * Minimal WOFF2 reader for the font tests (no dependency): the table
 * directory, the Brotli stream, and the untransformed `cmap` and `fvar`
 * tables (https://www.w3.org/TR/WOFF2/). Glyph data is never decoded.
 */

/** Known table tags, in the order of the WOFF2 specification (index 0–62). */
const knownTags = [
  "cmap",
  "head",
  "hhea",
  "hmtx",
  "maxp",
  "name",
  "OS/2",
  "post",
  "cvt ",
  "fpgm",
  "glyf",
  "loca",
  "prep",
  "CFF ",
  "VORG",
  "EBDT",
  "EBLC",
  "gasp",
  "hdmx",
  "kern",
  "LTSH",
  "PCLT",
  "VDMX",
  "vhea",
  "vmtx",
  "BASE",
  "GDEF",
  "GPOS",
  "GSUB",
  "EBSC",
  "JSTF",
  "MATH",
  "CBDT",
  "CBLC",
  "COLR",
  "CPAL",
  "SVG ",
  "sbix",
  "acnt",
  "avar",
  "bdat",
  "bloc",
  "bsln",
  "cvar",
  "fdsc",
  "feat",
  "fmtx",
  "fvar",
  "gvar",
  "hsty",
  "just",
  "lcar",
  "mort",
  "morx",
  "opbd",
  "prop",
  "trak",
  "Zapf",
  "Silf",
  "Glat",
  "Gloc",
  "Feat",
  "Sill",
];

function readBase128(buffer, state) {
  let value = 0;
  for (let i = 0; i < 5; i += 1) {
    const byte = buffer[state.offset];
    state.offset += 1;
    if (byte === undefined) throw new Error("truncated UIntBase128");
    if (i === 0 && byte === 0x80)
      throw new Error("leading zero in UIntBase128");
    value = value * 128 + (byte & 0x7f);
    if ((byte & 0x80) === 0) return value;
  }
  throw new Error("UIntBase128 longer than 5 bytes");
}

/** The decompressed tables of a WOFF2 file, by tag. */
export function readWoff2Tables(buffer) {
  if (buffer.toString("latin1", 0, 4) !== "wOF2") {
    throw new Error("not a WOFF2 file");
  }
  const numTables = buffer.readUInt16BE(12);
  const totalCompressedSize = buffer.readUInt32BE(20);
  const state = { offset: 48 };
  const directory = [];
  for (let i = 0; i < numTables; i += 1) {
    const flags = buffer[state.offset];
    state.offset += 1;
    let tag;
    if ((flags & 0x3f) === 0x3f) {
      tag = buffer.toString("latin1", state.offset, state.offset + 4);
      state.offset += 4;
    } else {
      tag = knownTags[flags & 0x3f];
    }
    const origLength = readBase128(buffer, state);
    const version = (flags >> 6) & 0x03;
    const transformed =
      tag === "glyf" || tag === "loca" ? version === 0 : version !== 0;
    const length = transformed ? readBase128(buffer, state) : origLength;
    directory.push({ tag, length, transformed });
  }
  const stream = brotliDecompressSync(
    buffer.subarray(state.offset, state.offset + totalCompressedSize),
  );
  const tables = new Map();
  let offset = 0;
  for (const { tag, length, transformed } of directory) {
    tables.set(tag, {
      transformed,
      data: stream.subarray(offset, offset + length),
    });
    offset += length;
  }
  if (offset !== stream.length) {
    throw new Error(`table lengths ${offset} ≠ stream ${stream.length}`);
  }
  return tables;
}

function table(tables, tag) {
  const entry = tables.get(tag);
  if (entry === undefined) return null;
  if (entry.transformed) throw new Error(`${tag} is transformed`);
  return entry.data;
}

/** Code points the font maps to a glyph other than .notdef. */
export function readCodePoints(tables) {
  const cmap = table(tables, "cmap");
  if (cmap === null) throw new Error("no cmap table");
  const count = cmap.readUInt16BE(2);
  const subtables = [];
  for (let i = 0; i < count; i += 1) {
    const record = 4 + i * 8;
    subtables.push({
      platform: cmap.readUInt16BE(record),
      encoding: cmap.readUInt16BE(record + 2),
      offset: cmap.readUInt32BE(record + 4),
    });
  }
  const pick =
    subtables.find((s) => s.platform === 3 && s.encoding === 10) ??
    subtables.find((s) => s.platform === 3 && s.encoding === 1) ??
    subtables.find((s) => s.platform === 0);
  if (pick === undefined) throw new Error("no Unicode cmap subtable");
  const at = pick.offset;
  const format = cmap.readUInt16BE(at);
  const codePoints = new Set();
  if (format === 12) {
    const groups = cmap.readUInt32BE(at + 12);
    for (let i = 0; i < groups; i += 1) {
      const group = at + 16 + i * 12;
      const start = cmap.readUInt32BE(group);
      const end = cmap.readUInt32BE(group + 4);
      const glyph = cmap.readUInt32BE(group + 8);
      for (let c = start; c <= end; c += 1) {
        if (glyph + (c - start) !== 0) codePoints.add(c);
      }
    }
    return codePoints;
  }
  if (format !== 4) throw new Error(`cmap format ${format} not supported`);
  const segments = cmap.readUInt16BE(at + 6) / 2;
  const ends = at + 14;
  const starts = ends + segments * 2 + 2;
  const deltas = starts + segments * 2;
  const rangeOffsets = deltas + segments * 2;
  for (let i = 0; i < segments; i += 1) {
    const end = cmap.readUInt16BE(ends + i * 2);
    const start = cmap.readUInt16BE(starts + i * 2);
    const delta = cmap.readInt16BE(deltas + i * 2);
    const rangeOffsetAt = rangeOffsets + i * 2;
    const rangeOffset = cmap.readUInt16BE(rangeOffsetAt);
    for (let c = start; c <= end && c !== 0xffff; c += 1) {
      let glyph;
      if (rangeOffset === 0) {
        glyph = (c + delta) & 0xffff;
      } else {
        const raw = cmap.readUInt16BE(
          rangeOffsetAt + rangeOffset + (c - start) * 2,
        );
        glyph = raw === 0 ? 0 : (raw + delta) & 0xffff;
      }
      if (glyph !== 0) codePoints.add(c);
    }
  }
  return codePoints;
}

/** Variation axes as { tag: [min, default, max] }; empty for a static font. */
export function readAxes(tables) {
  const fvar = table(tables, "fvar");
  if (fvar === null) return {};
  const axesOffset = fvar.readUInt16BE(4);
  const axisCount = fvar.readUInt16BE(8);
  const axisSize = fvar.readUInt16BE(10);
  const fixed = (at) => fvar.readInt32BE(at) / 65536;
  const axes = {};
  for (let i = 0; i < axisCount; i += 1) {
    const at = axesOffset + i * axisSize;
    axes[fvar.toString("latin1", at, at + 4)] = [
      fixed(at + 4),
      fixed(at + 8),
      fixed(at + 12),
    ];
  }
  return axes;
}
