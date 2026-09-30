# Z-Index Hierarchy

## Layer Stack (bottom to top)

```
0     - Default page content
20    - Hero section content (.hero-content, .hero-scroll-indicator)
999   - Film grain overlay (pointer-events: none, visual only)
9999  - Main navigation bar (#vjti-main-nav)
10000 - Mobile menu overlay (#nav-mobile-menu) - FULLSCREEN
10001 - Mobile hamburger button (#nav-mobile-toggle) - ALWAYS ON TOP
```

## Why This Order?

1. **Default Content (0)**: All regular page elements

2. **Hero Content (20)**: Hero section with parallax layers and content

3. **Film Grain (999)**: Visual texture overlay, doesn't interfere with clicks due to `pointer-events: none`

4. **Nav Bar (9999)**: Above film grain and all content, remains sharp and visible

5. **Mobile Menu (10000)**: Fullscreen overlay that appears above EVERYTHING when opened

6. **Hamburger Button (10001)**: Highest layer so it remains clickable even when menu is open (transforms to X button)

## Mobile Menu Behavior

When hamburger is clicked:
- Menu slides in from top with fullscreen overlay
- Body scroll is disabled (`overflow: hidden`)
- Nav bar becomes solid black (`!bg-[#050807]`)
- Hamburger animates to X (close button)
- Menu shows above all page content
- Click X or any nav link to close

## Testing Checklist

- [ ] Desktop: Nav scrolls smoothly with blur effect
- [ ] Mobile: Hamburger button visible on all backgrounds
- [ ] Mobile: Click hamburger → fullscreen black menu appears
- [ ] Mobile: Body scroll disabled when menu open
- [ ] Mobile: Nav bar solid black when menu open
- [ ] Mobile: Hamburger transforms to X
- [ ] Mobile: Click X → menu closes, scroll restored
- [ ] Mobile: Click any nav link → menu closes
- [ ] Mobile: Menu appears ABOVE all page content (not behind)

## Files Modified

- `src/css/main.css` - Z-index values in CSS
- `partials/nav.html` - Z-index values in Tailwind classes
- `src/js/components/nav.js` - Menu open/close logic
