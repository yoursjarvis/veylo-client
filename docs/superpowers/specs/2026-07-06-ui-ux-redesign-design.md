# Design Spec: Comprehensive UI/UX Redesign (Stealth Pro)

**Date:** 2026-07-06
**Status:** Approved / Pending Implementation
**Aesthetic Goal:** Ultra-minimalist, High-contrast, Dark-mode-first "Stealth Pro" aesthetic.

---

## 1. Visual Identity & Foundations

### 1.1 Color Palette (Deep Charcoal)
The system uses a layered charcoal approach to create depth and hierarchy without relying on heavy shadows.

| Role | Light Mode (Contrast) | Dark Mode (Stealth) | Implementation / Variable |
| :--- | :--- | :--- | :--- |
| **Background** | `oklch(0.98 0 0)` | `oklch(0.15 0 0)` | `--background` |
| **Surface/Card** | `oklch(1 0 0)` | `oklch(0.18 0 0)` | `--card` |
| **Border** | `oklch(0.9 0 0)` | `oklch(0.25 0 0)` | `--border` (Used as `border-border/50`) |
| **Primary Text** | `oklch(0.2 0 0)` | `oklch(0.95 0 0)` | `--foreground` |
| **Secondary Text** | `oklch(0.5 0 0)` | `oklch(0.65 0 0)` | `--muted-foreground` |
| **Accent** | `oklch(0.6 0.2 260)` | `oklch(0.6 0.2 260)` | `--primary` (Electric Indigo) |

### 1.2 Typography
A surgical hierarchy focused on weights and spacing rather than size.

- **Primary Font**: `Alan Sans` (or equivalent high-precision sans-serif).
- **Hierarchy**:
  - **Page Titles**: Semi-bold, tight letter-spacing, high contrast.
  - **Section Headings**: Medium weight, `text-foreground/80`, uppercase, wider tracking.
  - **Body/Data**: Regular weight, `text-foreground/90`.
  - **Metadata/Labels**: Regular weight, small size, `text-muted-foreground`.

---

## 2. Layout & Component Architecture

### 2.1 The "Invisible" Grid
- **Spacing**: Strict 4px-based system.
  - Page Gutters: `p-8` (32px).
  - Component Gaps: `gap-4` or `gap-6`.
  - Internal Padding: `p-4` or `p-6`.
- **Separation**: Use hairline borders (`border-border/50`) instead of shadows for a flat, engineered look.

### 2.2 Component Aesthetics
- **Buttons**: 
  - `rounded-md` (no rounded-full).
  - Primary: Solid Electric Indigo.
  - Secondary/Ghost: Transparent with `bg-muted/50` hover.
- **Cards**:
  - `bg-card` + `border-border/50`.
  - Hover: Shift to `border-primary/40` + `-translate-y-0.5`.
- **Forms**:
  - `bg-background` with thin borders. Glow on focus.
  - Labels: Small, uppercase, wide-tracked `text-muted-foreground`.
- **Badges**: 
  - Outlined style with muted text + small colored dot for status.
- **Icons**:
  - **Primary**: `Hugeicons` (Required).
  - **Fallback**: `Lucide` (Only if Hugeicon is unavailable).

---

## 3. Interactions & Experience

### 3.1 Motion Model
- **Feel**: Snappy, professional, and functional. No "bouncy" animations.
- **Transitions**: Standard `duration-200 ease-out`.
- **Feedback**: 
  - Button press: `active:scale-95`.
  - Hover state: Crisp border transition.

### 3.2 Orchestrated Motion (`motion`)
- **Page Transitions**: Fade-in + subtle vertical slide-up (`y: 10` $\rightarrow$ `y: 0`).
- **Layout Shifts**: Spring-based height transitions for collapsible elements.
- **Confirmation**: Brief accent-color "flash" on successful status changes.

### 3.3 Loading & Empty States
- **Skeletons**: 
  - Layout-aware shapes mirroring actual content.
  - Color: Deep charcoal pulse (`bg-muted/30`).
  - Transition: Cross-fade from skeleton to content.
- **Empty States**: 
  - Single muted `hugeicon` + concise heading.
  - Centered primary CTA.
  - No decorative illustrations.

---

## 4. Implementation Guidelines

- **Strict Adherence**: Every change must be verified in both Light and Dark themes.
- **C-S-P**: Maintain Consistent Spacing and Padding across all views.
- **Surgical Detail**: Use thin horizontal dividers (not full width) for lists and tables.
- **Accessibility**: Ensure contrast ratios meet WCAG standards despite the minimalist approach.
