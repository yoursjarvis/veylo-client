# Task 4: Task List & Timeline View Alignment

**Goal:** Transition the Task List and Timeline views into high-density, precision-engineered layouts that match the "Stealth Pro" aesthetic.

**Files to Modify:**
- `features/tasks/components/task-list.tsx`
- `features/tasks/components/project-timeline.tsx`

**Requirements:**
1. **List View High-Density Transition:**
   - Replace chunky, spaced rows with a precision table-like layout.
   - Implement hairline borders `border-border/50` between rows for a clean, modular separation.
   - Apply the surgical typography scale:
     - Task Title: Semi-bold, `text-foreground`.
     - Metadata (Due Date, Assignee): Regular, `text-muted-foreground`, `text-xs`.
   - Use `bg-muted/50` for the row hover state with a `duration-200` transition.

2. **Timeline Visual Refinement:**
   - Ensure the timeline bars use a high-contrast palette:
     - Active/Current tasks: Electric Indigo (`bg-primary`).
     - Planned/Past tasks: Muted grey (`bg-muted`).
   - Remove any heavy shadows or generic rounded-full markers; use `rounded-md` for a professional look.
   - Maintain a clean, non-cluttered grid background (hairline rules).

3. **General Polish:**
   - Ensure all icons are `Hugeicons` and sized `h-4 w-4`.
   - Verify that no hardcoded colors are used; only semantic theme variables.

**Global Constraints:**
- Ultra-minimalist, High-contrast, Dark-mode-first.
- Palette: Deep Charcoal backgrounds, Electric Indigo accent.
- Borders: Hairline `border-border/50` instead of shadows.
- No git commits (manual review at end).

**Deliverable:**
A refined Task List and Timeline view that feels like a high-performance project management tool.
