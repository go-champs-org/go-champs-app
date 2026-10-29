# Launcher Icons

`source-logo.png` is the supplied Go Champs visual signature. Its original colors are dark `#1D1D1B` and green `#D5FF27`.

Run `npm run icons:generate` to regenerate:

- `assets/images/icon.png`: opaque RGB, 1024x1024, used by iOS and legacy Android launchers.
- `assets/images/adaptive-icon.png`: transparent RGBA, 1024x1024, centered Android foreground within the circular 66/108 safe zone.
- `assets/images/adaptive-icon-monochrome.png`: white alpha mask for Android themed icons, using the same safe area.
- `assets/images/android-play-store.png`: opaque RGB, 512x512, ready for a Google Play listing.

The generator removes the source matte while preserving antialiased edges, centers the original symbol, and resizes through Expo image utilities. Backgrounds and platform masks are applied by the OS; no rounded corners are baked into the PNGs.
