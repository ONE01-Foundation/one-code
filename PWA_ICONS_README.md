# PWA Icons Setup Guide

## Required Icon Files

For proper PWA support with theme-aware icons, you need to create the following PNG icon files:

### Light Theme Icons
- `/public/icon-180x180.png` - iOS apple-touch-icon (180x180px, square)
- `/public/icon-192x192.png` - Android icon (192x192px, square, maskable)
- `/public/icon-512x512.png` - Android splash/launcher (512x512px, square, maskable)

### Dark Theme Icons
- `/public/icon-dark-180x180.png` - iOS apple-touch-icon dark (180x180px, square)
- `/public/icon-dark-192x192.png` - Android icon dark (192x192px, square, maskable)
- `/public/icon-dark-512x512.png` - Android splash/launcher dark (512x512px, square, maskable)

## Icon Design Guidelines

### Important: Square Design with Safe Area

1. **Design for Square, Not Circle**
   - Create square icons (not circular)
   - The OS will mask/cut them into circles automatically
   - Keep important content within the center 80% (safe area)
   - Avoid placing text/elements too close to edges

2. **Safe Area**
   - Keep critical elements (logo, text) within the center 80% of the square
   - Outer 10% on each side may be cropped by some launchers
   - Use padding around your design

3. **Theme Colors**
   - **Light theme icons**: Use dark/colored design on light/white background
   - **Dark theme icons**: Use light/colored design on dark/black background
   - Match the overall app theme

4. **Maskable Icons (Android)**
   - Android 12+ uses maskable icons
   - Design should look good when masked into various shapes
   - Center-focused design works best

## Example Design

```
┌─────────────────────────┐
│  (10% padding)          │
│   ┌─────────────────┐   │
│   │                 │   │
│   │   [LOGO/TEXT]   │   │ ← Center 80% (safe area)
│   │                 │   │
│   └─────────────────┘   │
│  (10% padding)          │
└─────────────────────────┘
```

## Creating Icons

### Option 1: Using Design Tools (Recommended)

1. Create a 512x512px square canvas
2. Design your icon with safe area padding
3. Export at all required sizes:
   - 180x180px (iOS)
   - 192x192px (Android standard)
   - 512x512px (Android high-res)

### Option 2: Using Online Tools

Tools like:
- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Favicon.io](https://favicon.io/)

Can generate all sizes from a single source image.

### Option 3: Convert Existing ICO Files

If you have existing favicon.ico files:
1. Extract the icon from ICO file
2. Resize to square format (add padding if needed)
3. Create theme variants (light/dark)
4. Export as PNG at required sizes

## Current Implementation

The code is set up to:
- ✅ Dynamically update icons based on theme (via `PWAIconUpdater` component)
- ✅ Update manifest.json with theme-appropriate icons
- ✅ Handle iOS apple-touch-icon updates
- ✅ Support maskable icons for Android

## Testing

After adding icon files:

1. **iOS Testing:**
   - Add to home screen
   - Verify icon appears correctly
   - Switch theme, re-add to home screen, verify icon updates

2. **Android Testing:**
   - Add to home screen
   - Verify icon appears correctly
   - Check maskable icon renders properly
   - Switch theme, verify icon updates

3. **Browser Testing:**
   - Check `manifest.json` loads correctly
   - Verify icon URLs resolve
   - Check theme switching updates icons

## Fallback

If icon files are missing:
- Browser will use favicon.ico as fallback
- PWA installation may show default/placeholder icon
- Functionality remains, but icon won't be theme-aware

