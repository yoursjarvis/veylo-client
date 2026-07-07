# Foundational Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the "Stealth Pro" visual identity by updating the CSS variables and the base shadcn/ui components.

**Architecture:** 
- Update `app/globals.css` to implement the Deep Charcoal OKLCH palette.
- Refactor base UI components in `components/ui/` to match the minimalist, hairline-border aesthetic.
- Update the typography scale via CSS variables in `app/globals.css`.

**Tech Stack:** Tailwind CSS v4, OKLCH colors, shadcn/ui, Hugeicons.

## Global Constraints
- Ultra-minimalist, High-contrast, Dark-mode-first.
- Palette: Deep Charcoal backgrounds, Electric Indigo accent.
- Typography: Weights over sizes for hierarchy.
- Borders: Hairline `border-border/50` instead of heavy shadows.
- Icons: `Hugeicons` primary, `Lucide` fallback.
- Components: `rounded-md` (not rounded-full).
- No git commits (manual review at end).

---

### Task 1: Theme & Color Foundation

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Produces: CSS variables for `--background`, `--card`, `--border`, `--primary`, and `--muted-foreground`.

- [ ] **Step 1: Update :root and .dark variables**
  Replace the existing OKLCH values with the "Stealth Pro" palette.
  - Background: `oklch(0.15 0 0)` (Dark), `oklch(0.98 0 0)` (Light)
  - Card: `oklch(0.18 0 0)` (Dark), `oklch(1 0 0)` (Light)
  - Border: `oklch(0.25 0 0)` (Dark), `oklch(0.9 0 0)` (Light)
  - Primary: `oklch(0.6 0.2 260)` (Electric Indigo)
  - Foreground: `oklch(0.95 0 0)` (Dark), `oklch(0.2 0 0)` (Light)
  - Muted-Foreground: `oklch(0.65 0 0)` (Dark), `oklch(0.5 0 0)` (Light)

- [ ] **Step 2: Refine the @theme inline block**
  Ensure all `var(--...)` mappings are correct and add the refined typography scale variables.

### Task 2: Surgical Button Refactor

**Files:**
- Modify: `components/ui/button.tsx`

**Interfaces:**
- Consumes: `--primary` from `globals.css`.
- Produces: Updated `Button` component with `rounded-md` and an `active:scale-95` transition.

- [ ] **Step 1: Update button variants**
  - `default`: Solid Electric Indigo, `rounded-md`.
  - `outline`: Hairline border `border-border/50`, `text-foreground`.
  - `ghost`: Transparent, `hover:bg-muted/50`.
- [ ] **Step 2: Add micro-interactions**
  Add `transition-all duration-200 active:scale-95` to the base button classes.

### Task 3: Precision Card & Badge Refactor

**Files:**
- Modify: `components/ui/card.tsx`
- Modify: `components/ui/badge.tsx`

**Interfaces:**
- Consumes: `--card`, `--border` from `globals.css`.

- [ ] **Step 1: Refactor Card**
  - Remove any heavy shadow classes.
  - Set border to `border-border/50`.
  - Background to `bg-card`.
  - Add `transition-all duration-200 hover:border-primary/40 hover:-translate-y-0.5`.
- [ ] **Step 2: Refactor Badge**
  - Change from solid fill to a minimalist outlined style.
  - Use `text-muted-foreground` with a small colored dot for priority/status.

### Task 4: Minimalist Input & Textarea Refactor

**Files:**
- Modify: `components/ui/input.tsx`
- Modify: `components/ui/textarea.tsx`

**Interfaces:**
- Consumes: `--background`, `--border` from `globals.css`.

- [ ] **Step 1: Refactor Input**
  - Background: `bg-background`.
  - Border: `border-border/50`.
  - Focus: `ring-1 ring-primary` (subtle glow).
  - Padding: `px-3 py-2` for a balanced look.
- [ ] **Step 2: Refactor Textarea**
  - Match Input styles.
  - Ensure `resize-none` is applied by default for a cleaner look.
