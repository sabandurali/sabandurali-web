/**
 * The publication card grids and the `sizes` of their card images, from one
 * place. The browser picks an image source from `sizes` before layout, so
 * each `sizes` must name the same breakpoints as the grid's column classes:
 * a card that is one column wide but announced as 50vw loads a blurry
 * source, and a quarter-width card announced as 50vw loads twice the bytes.
 *
 * Widths: the page container is at most 1296 px of content (90rem minus the
 * 72 px gutters) with 20 px gaps, so a third is about 420 px and a quarter
 * about 310 px.
 */
export const cardGrids = {
  /** Lists and sections: one column, two from md, three from xl. */
  3: {
    className: "m-0 grid list-none gap-5 p-0 md:grid-cols-2 xl:grid-cols-3",
    sizes: "(min-width: 1280px) 420px, (min-width: 768px) 50vw, 100vw",
  },
  /** Photo strips: one column, two from sm, four from xl. */
  4: {
    className: "m-0 grid list-none gap-5 p-0 sm:grid-cols-2 xl:grid-cols-4",
    sizes: "(min-width: 1280px) 320px, (min-width: 640px) 50vw, 100vw",
  },
} as const;

export type CardGridColumns = keyof typeof cardGrids;
