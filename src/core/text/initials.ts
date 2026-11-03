const MAX_INITIALS = 3;
const CAPITAL_LETTER = /^\p{Lu}$/u;

// Same placeholder the public site draws for a team or tournament with no
// logo (go-champs-web packages/ui/src/utils/initials.ts): up to three capitals
// of the name, or the first letter of each word when it has none.
export const initials = (name?: string | null): string => {
  const value = (name || '').trim();
  const capitals = Array.from(value).filter((char) => CAPITAL_LETTER.test(char));

  if (capitals.length > 0) return capitals.slice(0, MAX_INITIALS).join('');

  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, MAX_INITIALS)
    .join('');
};
