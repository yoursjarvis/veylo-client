# Task 3: Accessibility & Interaction Pass

**Goal:** Ensure the "Stealth Pro" interface is inclusive, accessible, and responds with a professional, a-snappy level of feedback.

**Files to Modify:**
- Global audit of all interactive components (`Button`, `Input`, `Combobox`, `Dialog`, `Drawer`).
- Header and Sidebar navigation elements.
- Task Board and RBAC Matrix interaction points.

**Requirements:**
1. **Focus Ring Audit:**
   - Ensure every interactive element has a clear, high-contrast focus indicator.
   - Standardize on an Electric Indigo focus ring (`ring-primary` or `outline-primary`) that is clearly visible against the Deep Charcoal background.
   - Remove default browser outlines where a custom ring is provided.
2. **Accessible Labeling (ARIA):**
   - Every icon-only button (e.g., in the AppHeader, Sidebar, and Task Cards) must have a descriptive `aria-label`.
   - Verify that `Dialog` and `Drawer` components have correct `aria-labelledby` and `aria-describedby` attributes.
3. **Keyboard Navigation Logic:**
   - Verify that the tabbing order is logical and efficient across all views.
   - Ensure that "Enter" and "Escape" keys work consistently for closing modals and triggering actions.
4. **Micro-interaction Polish (`motion`):**
   - Implement a subtle "fade-in + slide-up" transition for page entries (`y: 10` $\rightarrow$ `y: 0`).
   - Add a crisp `active:scale-95` effect to all primary action buttons if not already present.
   - Implement a subtle "glow" or "pulse" on the Electric Indigo accent for critical success states.

**Global Constraints:**
- Ultra-minimalist, High-contrast, Dark-mode-first.
- Palette: Deep Charcoal backgrounds, Electric Indigo accent.
- No git commits (manual review at end).

**Deliverable:**
An interface that is fully accessible and feels responsive, professional, and "snappy".
