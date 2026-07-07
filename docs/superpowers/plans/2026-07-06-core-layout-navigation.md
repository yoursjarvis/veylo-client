# Core Layout & Navigation Implementation Plan

**Goal:** Redesign the main application shell, sidebars, and headers to embody the "Stealth Pro" visual identity.

**Architecture:**
- **AppShell**: Refine the wrapper to use the new charcoal base and remove unnecessary padding/margins that clash with the minimalist grid.
- **AppSidebar**: Update the sidebar to use a layered charcoal depth. The sidebar should feel like a distinct but integrated tool panel.
- **AppHeader**: Refine the top navigation bar to be a crisp, border-first element with high-contrast typography for breadcrumbs and a clean, refined set of actions.
- **Navigation Elements**: Update all nav links and groups to use the new typography weights and the Electric Indigo accent for active states.

**Tech Stack:** Tailwind CSS v4, OKLCH colors, shadcn/ui Sidebar, Hugeicons.

## Global Constraints
- Ultra-minimalist, High-contrast, Dark-mode-first.
- Palette: Deep Charcoal backgrounds, Electric Indigo accent.
- Borders: Hairline `border-border/50` instead of shadows.
- Typography: Weights over sizes for hierarchy.
- Icons: `Hugeicons` primary, `Lucide` fallback.
- No git commits (manual review at end).

---

### Task 1: AppShell & Global Layout Refinement

**Files:**
- Modify: `components/layout/app-shell.tsx`
- Modify: `app/(authenticated)/layout.tsx`

**Interfaces:**
- Produces: A refined global wrapper that correctly handles the Deep Charcoal background and consistent page gutters.

- [ ] **Step 1: Refine AppShell padding and alignment**
  Update the main content area in `AppShell` to use a strict 4px-based system. Replace generic `p-4 md:p-6` with a more precise `p-6 md:p-8` to provide the "airy" but professional feel.
- [ ] **Step 2: Verify Background Integration**
  Ensure `AppShell` and `AuthenticatedLayout` are not introducing any competing background colors or unexpected margins that break the "Invisible Grid".

### Task 2: Surgical Sidebar Redesign

**Files:**
- Modify: `components/layout/app-sidebar.tsx`
- Modify: `components/ui/sidebar.tsx` (if needed for base styles)

**Interfaces:**
- Consumes: `--background`, `--card`, `--primary` from `globals.css`.
- Produces: A high-contrast, professional sidebar with surgical navigation items.

- [ ] **Step 1: Update Sidebar Palette**
  Remove the radial gradient and generic background. Set the sidebar to a layered charcoal depth (using `bg-card` or a custom charcoal value) to create subtle structural separation.
- [ ] **Step 2: Refine Navigation Items**
  - Update `SidebarMenuButton` active states to use the Electric Indigo accent (`text-primary` or a thin left-border accent).
  - Implement the "Surgical Typography": Use `text-muted-foreground` for inactive links and high-contrast `text-foreground` for active links, focusing on font weight.
- [ ] **Step 3: Header and Footer Cleanup**
  Refine the `SidebarHeader` and `SidebarFooter` to use hairline borders (`border-border/50`) and a professional, technical layout for the copyright and versioning info.

### Task 3: High-Contrast AppHeader Refinement

**Files:**
- Modify: `components/layout/app-header.tsx`
- Modify: `components/layout/app-breadcrumbs.tsx`

**Interfaces:**
- Produces: A crisp, tool-like top bar with high contrast and a clear visual hierarchy.

- [ ] **Step 1: Refine Header Visuals**
  Update `AppHeader` to use `bg-background/95` with a refined `border-b border-border/50`. Ensure the backdrop blur is subtle and professional.
- [ ] **Step 2: Surgical Breadcrumbs**
  Update `AppBreadcrumbs` to use the new typography scale:
  - Current page: Semi-bold, high-contrast.
  - Parent pages: Regular, `text-muted-foreground`.
  - Separators: Thin, low-opacity lines.
- [ ] **Step 3: Action Button Polish**
  Ensure all buttons in the header (e.g., the navigation button) use the new refactored `Button` component with its hairline borders and `active:scale-95` interaction.

### Task 4: NavGroup & Navigation Logic Polish

**Files:**
- Modify: `components/layout/nav-group.tsx`
- Modify: `components/layout/app-shared.ts` (if needed for nav labels)

**Interfaces:**
- Produces: A clean, modular navigation structure.

- [ ] **Step 1: Refactor NavGroup Headers**
  Update the group labels to be small, uppercase, wide-tracked `text-muted-foreground` for a "technical specification" feel.
- [ ] **Step 2: Verify Icon Consistency**
  Ensure all navigation icons are `Hugeicons` and consistently sized (`h-4 w-4`) and aligned.
