# Z-Index Hierarchy

## Layer Stack (bottom to top)

```
0     - Default page content
999   - Film grain overlay (pointer-events: none, visual only)
1000  - Main navigation bar (#vjti-main-nav)
1001  - Mobile menu overlay (#nav-mobile-menu)
1050  - Mobile hamburger button (#nav-mobile-toggle)
```

## Why This Order?

1. **Film Grain (999)**: Visual texture overlay, doesn't interfere with clicks due to `pointer-events: none`

2. **Nav Bar (1000)**: Above film grain so it remains sharp and visible

3. **Mobile Menu (1001)**: Fullscreen overlay that appears above everything when opened

4. **Hamburger Button (1050)**: Highest layer so it remains clickable even when menu is open (transforms to X button)

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
