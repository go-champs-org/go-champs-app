// Loads an athlete profile and its game lists side by side. Without a profile
// the lists answer 404 and are never read. With one, a failed list is a real
// failure: reading it as empty would hide the athlete's games behind a
// "no games yet" state that only a manual refresh clears.
export const withProfileLists = async <P, L>(
  profile: Promise<P | null>,
  lists: Promise<L>
): Promise<{ profile: P; lists: L } | null> => {
  // Read below only when the profile exists; this keeps an unread rejection
  // from surfacing as unhandled.
  lists.catch(() => undefined);
  const loaded = await profile;
  if (!loaded) return null;
  return { profile: loaded, lists: await lists };
};
