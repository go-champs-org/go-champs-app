// Where a row that slides on its own goes next: one item further, never past
// the end, and back to the start once the end is showing.
export const nextCarouselOffset = (offset: number, step: number, maxOffset: number): number => {
  if (maxOffset <= 0 || step <= 0) return 0;
  // A pixel of slack: a scroll can stop a fraction short of the end.
  if (offset >= maxOffset - 1) return 0;
  return Math.min(offset + step, maxOffset);
};

// How far a row can scroll: its content (padding, items and the gaps between
// them) minus what the screen shows. Zero when everything fits.
export const carouselMaxOffset = (
  containerWidth: number,
  count: number,
  itemWidth: number,
  gap: number,
  padding: number,
): number => {
  if (count === 0) return 0;
  const contentWidth = padding * 2 + count * itemWidth + (count - 1) * gap;
  return Math.max(0, contentWidth - containerWidth);
};
