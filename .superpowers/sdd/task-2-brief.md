# Task 2: Responsive Layout Calibration

**Goal:** Calibrate the application layout across mobile, tablet, and desktop breakpoints to ensure a seamless, professional, and "invisible" grid experience.

**Files to Modify:**
- `components/layout/app-shell.tsx`
- `app/(authenticated)/layout.tsx`
- `features/tasks/components/task-board.tsx`
- `features/org/components/members-table.tsx`
- `app/(authenticated)/[workspaceSlug]/projects/page.tsx`

**Requirements:**
1. **Mobile Navigation & Shell Review:**
   - Verify that the `AppSidebar` and `AppHeader` collapse gracefully on mobile.
   - Ensure the main content area (`AppShell` and `AuthenticatedLayout`) handles the transition from `p-6` to `p-8` (or mobile equivalent) without horizontal overflow.
2. **Grid & Table Adaptation:**
   - **Project Grid**: Ensure the project grid in `projects/page.tsx` handles column shifts (1 $\rightarrow$ 2 $\rightarrow$ 3) perfectly.
   - **Members Table**: Implement an overflow container for the `MembersTable` to ensure that horizontal scrolling is smooth and doesn't break the overall page layout on small screens.
   - **Task Board**: Verify that the `TaskBoard` (Kanban) horizontal scroll is intuitive and that columns maintain their minimum width (`w-72` / `lg:w-80`) without shrinking.
3. **Modal & Drawer Sizing:**
   - Audit all "Surgical" Dialogs and Drawers.
   - Ensure `sm:max-w-112.5` or similar constraints are applied to maintain professional proportions on tablets and desktops while filling the screen reasonably on mobile.

**Global Constraints:**
- Ultra-minimalist, High-contrast, Dark-mode-first.
- No horizontal scrolling at the page level (only inside specific components like tables/boards).
- No git commits (manual review at end).

**Deliverable:**
A fully responsive application where the "Stealth Pro" aesthetic is preserved across all device categories.
