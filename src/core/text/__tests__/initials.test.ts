import { initials } from '../initials';

describe('initials', () => {
  it.each([
    ['SOGIPA', 'SOG'],
    ['Grêmio Basket', 'GB'],
    ['Liga de Basquete Amador', 'LBA'],
    ['Éxito Clube', 'ÉC'],
    ['pinheiros rs', 'PR'],
    ['  ', ''],
    [null, ''],
  ])('reads %s as %s', (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});
