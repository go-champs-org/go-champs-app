import { buildShareFormats, shareFormatById } from '../shareFormats';

const formats = buildShareFormats<'a' | 'b'>({
  a: { label: 'Primeiro', description: 'Layout A' },
  b: { label: 'Segundo', description: 'Layout B' },
});

describe('buildShareFormats', () => {
  it('lists every layout with the dark, then the light logo', () => {
    expect(formats).toEqual([
      { id: 'a-dark', layout: 'a', logo: 'dark', label: 'Primeiro · logo escuro', description: 'Layout A, logo escuro' },
      { id: 'a-light', layout: 'a', logo: 'light', label: 'Primeiro · logo claro', description: 'Layout A, logo claro' },
      { id: 'b-dark', layout: 'b', logo: 'dark', label: 'Segundo · logo escuro', description: 'Layout B, logo escuro' },
      { id: 'b-light', layout: 'b', logo: 'light', label: 'Segundo · logo claro', description: 'Layout B, logo claro' },
    ]);
  });
});

describe('shareFormatById', () => {
  it('finds the format and falls back to the first one for an unknown id', () => {
    expect(shareFormatById(formats, 'b-light').id).toBe('b-light');
    expect(shareFormatById(formats, 'nope').id).toBe('a-dark');
  });
});
