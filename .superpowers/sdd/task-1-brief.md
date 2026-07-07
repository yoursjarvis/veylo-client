# Task 1: Global Theme & Contrast Audit

**Goal:** Ensure 100% compliance with the "Stealth Pro" color system and verify visual consistency across both Light and Dark themes.

**Files to Modify:**
- Global audit of all recently modified components and pages.

**Requirements:**
1. **Zero Hardcoded Colors (The Critical Pass):**
   - Perform a global search for all hex codes (`#`), `rgba()`, and specific Tailwind color names (e.g., `slate-`, `zinc-`, `red-`, `blue-`, `white`, `black`) that are not part of the semantic theme.
   - Replace every instance with a semantic theme variable (e.g., `text-foreground`, `bg-muted`, `text-destructive`).
2. **Dark Mode Depth Audit:**
   - Verify that the "Deep Charcoal" layering is consistent.
   - Ensure no "too-bright" greys are used, which can break the stealth aesthetic.
   - Check that the Electric Indigo accent (`--primary`) provides a clear, high-contrast focal point without being overwhelming.
3. **Light Mode Contrast Audit:**
   - Verify that the high-contrast light mode (Near White background, Deep Black text) remains readable and professional.
   - Ensure all borders use the refined `border-border/50` hairline style.
4. **WCAG Contrast Verification:**
   - Check that primary text, secondary text, and accent elements meet WCAG AA contrast ratios in both themes.

**Global Constraints:**
- Ultra-minimalist, High-contrast, Dark-mode-first.
- Palette: Deep Charcoal backgrounds, Electric Indigo accent.
- No git commits (manual review at end).

**Deliverable:**
A fully audited codebase with zero hardcoded colors and a consistent, high-contrast visual identity in both themes.
