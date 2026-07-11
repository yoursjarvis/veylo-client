# Workspace & Project Management Implementation Plan

**Goal:** Redesign project lists, creation dialogs, and workspace management to embody the professional, tool-like aesthetic of the Stealth Pro design system.

**Architecture:**
- **Project Grid/List**: Transition from a card gallery to a high-density grid that emphasizes technical metadata.
- **Project Creation Flow**: Refactor the dialog into a structured "technical spec" form.
- **Empty States**: Implement a minimalist, professional invitation to act.
- **Workspace Context**: Ensure perfect integration with the layered charcoal depth.

**Tech Stack:** Tailwind CSS v4, OKLCH colors, shadcn/ui, Hugeicons.

## Global Constraints
- Ultra-minimalist, High-contrast, Dark-mode-first.
- Palette: Deep Charcoal backgrounds, Electric Indigo accent.
- Borders: Hairline `border-border/50` instead of shadows.
- Typography: Weights and tracking for hierarchy.
- Icons: `Hugeicons` primary, `Lucide` fallback.
- No git commits (manual review at end).

---

### Task 1: High-Density Project Grid Refactor

**Files:**
- Modify: `app/(authenticated)/[workspaceSlug]/projects/page.tsx`

**Interfaces:**
- Consumes: Refactored `Card`, `Badge`, and `Button` components.
- Produces: A project list that feels like a professional dashboard rather than a gallery of cards.

- [ ] **Step 1: Refine Project Card Layout**
  - Remove `CardHeader` and `CardFooter` wrappers.
  - Use a flat structure with `p-5` padding.
  - Replace the bottom footer with a hairline border `border-border/50` and a clean metadata row at the bottom.
- [ ] **Step 2: Typography & Metadata Polish**
  - Project Title: Semi-bold, `text-foreground`.
  - Project Key: Small, uppercase, wide-tracked `text-muted-foreground` (e.g., `text-[10px] uppercase tracking-wider`).
  - Member Count: Use the refactored minimalist `Badge` with a status dot.
- [ ] **Step 3: Hover Interaction**
  - Ensure the `hover:border-primary/40` and `-translate-y-0.5` effects are active.

### Task 2: "Surgical" Project Creation Dialog

**Files:**
- Modify: `app/(authenticated)/[workspaceSlug]/projects/page.tsx`

**Interfaces:**
- Consumes: Refactored `Input`, `Textarea`, `Combobox`, and `Button`.

- [ ] **Step 1: Form Layout Overhaul**
  - Update all labels to "technical specification" style: `text-xs uppercase tracking-wider text-muted-foreground`.
  - Use a strict `gap-4` between form groups.
- [ ] **Step 2: Field Refinement**
  - Project Key Warning: Refine the warning box to use a hairline border `border-amber-500/20` and `bg-amber-500/10` with a muted text.
  - Template Picker: Ensure the `Combobox` items follow the high-contrast, minimalist aesthetic.
- [ ] **Step 3: Footer Action Polish**
  - "Create Project" button: Electric Indigo primary style.
  - "Cancel" button: Ghost/Outline variant.

### Task 3: Professional Empty State Implementation

**Files:**
- Modify: `app/(authenticated)/s[workspaceSlug]/projects/page.tsx` (Correct path: `app/(authenticated)/[workspaceSlug]/projects/page.tsx`)

**Interfaces:**
- Consumes: Refactored `Button` and `Hugeicons`.

- [ ] **Step 1: Visual De-cluttering**
  - Remove `border-dashed` and `bg-card` heavy styling.
  - Use a quiet, centered layout with a single muted `Hugeicons` icon.
Surgical precision on a simple center-aligned flex container.
- [ ] **Step 2: Primary CTA Focus**
  - Center the "Create Project" button as the clear, singular focal point.
