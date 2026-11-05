import { carouselMaxOffset, nextCarouselOffset } from '../carousel';

describe('nextCarouselOffset', () => {
  it('moves one item further', () => {
    expect(nextCarouselOffset(0, 80, 300)).toBe(80);
    expect(nextCarouselOffset(80, 80, 300)).toBe(160);
  });

  it('stops at the end instead of going past it', () => {
    expect(nextCarouselOffset(240, 80, 300)).toBe(300);
  });

  it('goes back to the start once the end is showing', () => {
    expect(nextCarouselOffset(300, 80, 300)).toBe(0);
    expect(nextCarouselOffset(299.5, 80, 300)).toBe(0);
  });

  it('stays at the start when nothing scrolls', () => {
    expect(nextCarouselOffset(0, 80, 0)).toBe(0);
    expect(nextCarouselOffset(40, 0, 300)).toBe(0);
  });
});

describe('carouselMaxOffset', () => {
  it('is the content wider than the screen', () => {
    // 16 + 6 * 72 + 5 * 8 + 16 = 504 wide, 360 showing.
    expect(carouselMaxOffset(360, 6, 72, 8, 16)).toBe(144);
  });

  it('is zero when everything fits', () => {
    expect(carouselMaxOffset(360, 3, 72, 8, 16)).toBe(0);
    expect(carouselMaxOffset(360, 0, 72, 8, 16)).toBe(0);
  });
});
