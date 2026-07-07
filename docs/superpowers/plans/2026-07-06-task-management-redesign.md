# Task Management Redesign Implementation Plan

**Goal:** Elevate the Task Board, List, Timeline, and Detail views into a professional, high-density experience with surgical precision and high contrast.

**Architecture:**
- **Task Cards**: Transition from chunky cards to "Technical Entries". Replace heavy shadows with hairline borders and a "Data Line" footer.
- **Kanban Board**: Redesign columns as "Tool Panels" using layered charcoal depth and high-contrast indicators.
- **Task Detail Drawer**: Overhaul the drawer into a structured "Specification Panel" with a clean vertical hierarchy.
- **List/Timeline Views**: Transition to a high-density table-like layout with surgical typography and precision borders.

**Tech Stack:** Tailwind CSS v4, OKLCH colors, shadcn/ui, `motion`, Hugeicons.

## Global Constraints
- Ultra-minimalist, High-contrast, Dark-mode-first.
- Palette: Deep Charcoal backgrounds, Electric Indigo accent.
- Borders: Hairline `border-border/50` instead of shadows.
- Typography: Weights over sizes; a high-precision, technical scale.
- Icons: `Hugeicons` primary, `Lucide` fallback.
- No git commits (manual review at end).

---

### Task 1: Surgical Task Card Refactor

**Files:**
- Modify: `features/tasks/components/task-board.tsx` (Specifically `TaskCard` and `SubtaskItem`)

**Interfaces:**
- Consumes: Refactored `Badge` (with status dot).
- Produces: A high-density, high-contrast task entry.

- [ ] **Step 1: Structural Flatting**
  - Remove `shadow-sm` and `rounded-xl`. Use `rounded-md`.
  - Set border to `border-border/50`.
  - Background to `bg-card`.
- [ ] **Step 2: Typography & Metadata Refinement**
  - **Task Key**: Implement as `text-[10px] uppercase tracking-wider text-muted-foreground font-medium`.
  - **Title**: Semi-bold, `text-foreground`.
  - **Priority Badge**: Replace the solid-fill `getPriorityBadge` logic with the new minimalist outlined badge with status dot.
- [ ] **Step 3: The "Data Line" Footer**
  - Refactor the bottom section (`mt-3 flex flex-col border-t border-border/40 pt-3`).
  - Ensure it feels like a precision data row, using `text-muted-foreground` for counts and labels.
- [ ] **Step 4: Subtask Item Polish**
  - Update `SubtaskItem` to use a hairline border and the same "technical" typography as the main card.

### Task 2: Kanban Board "Tool Panel" Redesign

**Files:**
- Modify: `features/tasks/components/task-board.tsx` (Specifically `BoardColumn` and `TaskBoard`)

**Interfaces:**
- Consumes: Refactored `Button`, `Input`, and `Badge`.

- [ ] **Step 1: Column Aesthetic Overhaul**
  - Remove `bg-secondary/20` and `backdrop-blur-md`.
  - Implement a layered charcoal depth using `bg-card/50` or a custom deep charcoal.
- [ ] **Step 2: Column Header Precision**
  - Labels: Semi-bold, `text-foreground`.
  - Count Badge: Use the minimalist outlined badge.
  - "Add Column" button: Ghost variant with a dashed hairline border.
- [ ] **Step 3: Quick-Add Form Polish**
  - Update the quick-add input to use `bg-background`, `border-border/50`, and a subtle focus glow.
- [ ] **Step 4: Drag-and-Drop Visuals**
  - Update the `DragOverlay` to use a high-contrast border (`border-primary`) and a subtle scale effect.

### Task 3: Task Detail Drawer Refactor

**Files:**
- Modify: `features/tasks/components/task-details-drawer.tsx`
- Modify: `features/tasks/components/task-details-header.tsx`
- Modify: `features/tasks/components/task-details-sidebar.tsx`

**Interfaces:**
- Consumes: All refactored base UI components.

- [ ] **Step 1: Layout Hierarchy Overhaul**
  - Transition the drawer from a generic list of sections to a structured "Specification Panel".
  - Use a strict `gap-6` vertical spacing between major sections.
 lavered l
- [ ] **Step 2: Section Labeling (Technical Style)**
  - Every section header (Description, Attachments, Activity) must use the "technical spec" style: `text-xs uppercase tracking-wider text-muted-foreground font-semibold`.
- [ lavered l
- [ ] **Step 3: Activity Feed Polish**
  - Refine the activity timeline to use hairline vertical separators and a muted, high-contrast text flow.
- [ ] **Step 4: Detail Sidebar Refinement**
  - Clean up the metadata fields (Priority, Due Date, Assignee) into a high-density, a-border-first list. lavered lavered l
- [ ] **Step 5: Interaction Polish**
  - Update the "Save" and "Cancel" buttons to the new surgical variants.

### Task 4: Task List & Timeline View Alignment

**Files:**
- Modify: `features/tasks/components/task-list.tsx`
- Modify: `features/tasks/components/project-timeline.tsx`

**Interfaces:**
- Consumes: Refactored `Badge` and `Button`.

- [ ] **Step 1: List View High-Density Transition**
  - Replace chunky rows with a precision table-like layout.
  - Use hairline borders `border-border/50` between rows.
  - Apply the surgical typography scale to all columns.
- [ lavered lavered l
- [ ] **Step 2: Timeline Visual Refinement**
  - Ensure the timeline bars use a "high-contrast" palette (Electric Indigo for active, muted grey for planned).
  - Remove heavy shadows from timeline markers.
- [ ] **Step 3: Interaction Polish**
  - Ensure all row hovers use the `bg-muted/50` subtle transition.
