/**
 * Reads the Unicode code points a TrueType/OpenType font maps to glyphs
 * (its `cmap` table, formats 4 and 12). Used by the share card test to prove
 * that the card font draws every Turkish letter instead of a fallback box.
 */
export function readFontCodePoints(font: Uint8Array): Set<number> {
  const view = new DataView(font.buffer, font.byteOffset, font.byteLength);
  const tableCount = view.getUint16(4);
  let cmapOffset = -1;
  for (let index = 0; index < tableCount; index += 1) {
    const record = 12 + index * 16;
    const tag = String.fromCharCode(
      view.getUint8(record),
      view.getUint8(record + 1),
      view.getUint8(record + 2),
      view.getUint8(record + 3),
    );
    if (tag === "cmap") cmapOffset = view.getUint32(record + 8);
  }
  if (cmapOffset < 0) throw new Error("The font has no cmap table.");

  const codePoints = new Set<number>();
  const subtableCount = view.getUint16(cmapOffset + 2);
  for (let index = 0; index < subtableCount; index += 1) {
    const record = cmapOffset + 4 + index * 8;
    const offset = cmapOffset + view.getUint32(record + 4);
    const format = view.getUint16(offset);

    if (format === 4) {
      const segments = view.getUint16(offset + 6) / 2;
      const ends = offset + 14;
      const starts = ends + segments * 2 + 2;
      const deltas = starts + segments * 2;
      const rangeOffsets = deltas + segments * 2;
      for (let segment = 0; segment < segments; segment += 1) {
        const end = view.getUint16(ends + segment * 2);
        const start = view.getUint16(starts + segment * 2);
        const delta = view.getInt16(deltas + segment * 2);
        const rangeOffsetAt = rangeOffsets + segment * 2;
        const rangeOffset = view.getUint16(rangeOffsetAt);
        for (let code = start; code <= end && code !== 0xffff; code += 1) {
          const glyph =
            rangeOffset === 0
              ? (code + delta) & 0xffff
              : view.getUint16(
                  rangeOffsetAt + rangeOffset + (code - start) * 2,
                );
          if (glyph !== 0) codePoints.add(code);
        }
      }
    } else if (format === 12) {
      const groups = view.getUint32(offset + 12);
      for (let group = 0; group < groups; group += 1) {
        const at = offset + 16 + group * 12;
        const start = view.getUint32(at);
        const end = view.getUint32(at + 4);
        const startGlyph = view.getUint32(at + 8);
        for (let code = start; code <= end; code += 1) {
          if (startGlyph + (code - start) !== 0) codePoints.add(code);
        }
      }
    }
  }
  return codePoints;
}
