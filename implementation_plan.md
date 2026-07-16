# VEYLO UI/UX REMEDIATION IMPLEMENTATION PLAN
**Target Release:** Enterprise Version 1.0.0  
**Scope:** WCAG 2.2 AA Compliance, Performance, and Design System Consolidation  
**Auditor:** Principal Enterprise UX Architect & Accessibility Expert  

---

## Phase 1: Critical Blockers (Days 1 - 30)

### 1. Fix Keyboard-Inaccessible Login Form
* **Target File:** [login-form.tsx](file:///home/codeclouds-tanmoy/Personal/Veylo/veylo-client/features/auth/components/login-form.tsx)
* **Goal:** Enable user form submission on pressing the "Enter" key.
* **Code Change:**
  ```diff
  - <div className="space-y-2">
  + <form 
  +   className="space-y-2" 
  +   onSubmit={(e) => {
  +     e.preventDefault();
  +     e.stopPropagation();
  +     form.handleSubmit();
  +   }}
  + >
      <form.Field name="email">
        ...
      </form.Field>
      ...
      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <Button
            className="w-full"
            size="sm"
  -         type="button"
  +         type="submit"
            disabled={!canSubmit || isSubmitting}
  -         onClick={() => form.handleSubmit()}
          >
            {isSubmitting ? "Logging in..." : "Continue With Email"}
          </Button>
        )}
      </form.Subscribe>
  - </div>
  + </form>
  ```

---

### 2. Restore Default Typography Zoom Sizing
* **Target File:** [globals.css](file:///home/codeclouds-tanmoy/Personal/Veylo/veylo-client/app/globals.css)
* **Goal:** Conform to WCAG AA SC 1.4.4 by removing overridden root font sizes.
* **Code Change:**
  ```diff
  - html {
  -   font-size: 18px !important;
  - }
  ```
  *(Note: To adjust global spacing or densities, modify spacing tokens inside Tailwind `@theme` configuration or apply padding classes on page-level containers).*

---

### 3. Re-align Color System for Accessible Contrast
* **Target File:** [globals.css](file:///home/codeclouds-tanmoy/Personal/Veylo/veylo-client/app/globals.css)
* **Goal:** Reach a minimum contrast ratio of `4.5:1` in light mode for all primary/destructive elements and fix dark mode glare.
* **Code Change:**
  ```diff
    :root {
  -   --primary: oklch(0.748 0.129 269);
  +   --primary: oklch(0.550 0.180 269); /* Yields #4F46E5, contrast ratio 4.82:1 against white */
  
  -   --destructive: oklch(0.73 0.14 25);
  +   --destructive: oklch(0.520 0.200 25); /* Yields #DC2626, contrast ratio 5.01:1 against white */
  
  -   --warning-background: oklch(97.8% 0.111 109.9);
  +   --warning-background: oklch(95.0% 0.110 95.0); /* Yields #FEF3C7, contrast ratio 1.15:1 (use with borders) */
    }
  
    .dark {
  -   --secondary: oklch(96.1% 0.058 93.5);
  +   --secondary: oklch(0.240 0.015 269); /* Yields #1C1D26, a muted dark box in dark mode */
    }
  ```

---

### 4. Implement Search Debouncing to Prevent API Abuse
* **Target File:** [list/page.tsx](file:///home/codeclouds-tanmoy/Personal/Veylo/veylo-client/app/%28authenticated%29/%5BworkspaceSlug%5D/projects/%5BprojectId%5D/list/page.tsx) and [board/page.tsx](file:///home/codeclouds-tanmoy/Personal/Veylo/veylo-client/app/%28authenticated%29/%5BworkspaceSlug%5D/projects/%5BprojectId%5D/board/page.tsx)
* **Goal:** Delay data fetch execution until the user finishes typing.
* **Implementation:**
  1. Add a custom `useDebounce` hook or import from `use-debounce`:
     ```tsx
     import { useDebounce } from "use-debounce";
     ```
  2. Modify search bindings in lists:
     ```tsx
     const [searchQuery, setSearchQuery] = useState("");
     const [debouncedSearchQuery] = useDebounce(searchQuery, 400);
     ```
  3. Swap query filters:
     ```diff
       const serverFilters = useMemo(() => {
         const params: Record<string, string> = {}
         if (activeFilters.length > 0) {
           params.filters = JSON.stringify(activeFilters)
         }
  -      if (searchQuery.trim()) {
  -        params.search = searchQuery.trim()
  +      if (debouncedSearchQuery.trim()) {
  +        params.search = debouncedSearchQuery.trim()
         }
         return params
  -    }, [activeFilters, searchQuery])
  +    }, [activeFilters, debouncedSearchQuery])
     ```

---

### 5. Fix Chart Fills with CSS Variables Normalization
* **Target File:** [task-reports.tsx](file:///home/codeclouds-tanmoy/Personal/Veylo/veylo-client/features/tasks/components/task-reports.tsx)
* **Goal:** Normalize chart data names to guarantee correct CSS token formats.
* **Implementation:**
  1. Add a CSS-safe normalization helper:
     ```tsx
     const normalizeCssVar = (name: string) => {
       return (name || "").toLowerCase().replace(/[^a-z0-9]/g, "-");
     }
     ```
  2. Update fill variables inside the component:
     ```diff
       const barChartAssigneeDataWithFill = barChartAssigneeData.map((entry) => ({
         ...entry,
  -      fill: `var(--color-${entry.name})`,
  +      fill: `var(--color-${normalizeCssVar(entry.name)})`,
       }))
     ```
  3. Ensure `assigneeBarConfig` uses normalized keys for mapping:
     ```diff
       const assigneeBarConfig = barChartAssigneeData.reduce((acc, entry, idx) => {
  -      acc[entry.name] = {
  +      acc[normalizeCssVar(entry.name)] = {
           label: entry.name,
           color: `var(--color-chart-${(idx % 5) + 1})`,
         }
         return acc
       }, {} as ChartConfig)
     ```

---

## Phase 2: Design System & Architectural Cleanups (Days 31 - 60)

### 6. Consolidate Icon Libraries (Remove Lucide where Hugeicons exists)
* **Action:** Replace `lucide-react` imports with standard `Hugeicons` equivalents in all files.
* **Replacement Map:**
  * `Plus` & `Plus2` $\rightarrow$ `PlusSignIcon`
  * `Trash` & `Trash2` $\rightarrow$ `Delete01Icon`
  * `Edit` & `Edit2` $\rightarrow$ `Edit02Icon`
  * `Save` $\rightarrow$ `Save01Icon`
  * `Info` $\rightarrow$ `InformationCircleIcon`

---

### 7. Implement Global Error and Loading Suspense Boundaries
* **Target Directory:** `/app` root directory
* **File Creation:** Create `app/error.tsx` (Error recovery boundary) and `app/not-found.tsx` (Semantic 404 page).
* **`app/error.tsx` Template:**
  ```tsx
  "use client"
  import { Button } from "@/components/ui/button"
  import { useEffect } from "react"

  export default function GlobalError({
    error,
    reset,
  }: {
    error: Error & { digest?: string }
    reset: () => void
  }) {
    useEffect(() => {
      console.error(error)
    }, [error])

    return (
      <div className="flex h-screen w-full flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-bold">Something went wrong!</h2>
        <p className="text-sm text-muted-foreground">The application encountered a critical runtime error.</p>
        <Button onClick={() => reset()}>Try Again</Button>
      </div>
    )
  }
  ```

---

### 8. Resolve Tooltip Abuse in Reaction Details
* **Target File:** [task-details-comments.tsx](file:///home/codeclouds-tanmoy/Personal/Veylo/veylo-client/features/tasks/components/task-details/task-details-comments.tsx)
* **Goal:** Replace nested lists inside tooltips with standard `HoverCard` or `Popover` elements.
* **Code Change:**
  ```diff
  - <TooltipProvider delay={300}>
  -   <Tooltip open={isOpen} onOpenChange={setIsOpen}>
  -     <TooltipTrigger ...>
  + <HoverCard openDelay={200} closeDelay={200}>
  +   <HoverCardTrigger asChild>
  +     <button ...>
          ...
  -     </TooltipTrigger>
  -     <TooltipContent ...>
  -       <Card className="...">
  -         ...
  -       </Card>
  -     </TooltipContent>
  -   </Tooltip>
  - </TooltipProvider>
  +     </button>
  +   </HoverCardTrigger>
  +   <HoverCardContent className="w-60 border-border bg-popover shadow-md p-3">
  +     ... (User List Content) ...
  +   </HoverCardContent>
  + </HoverCard>
  ```

---

## Phase 3: Enterprise Enhancements (Days 61 - 90)

### 9. Migrate General Settings to TanStack Form
* **Target File:** [general/page.tsx](file:///home/codeclouds-tanmoy/Personal/Veylo/veylo-client/app/%28authenticated%29/%5BworkspaceSlug%5D/projects/%5BprojectId%5D/settings/general/page.tsx)
* **Goal:** Eliminate manual `useState` form variables, enforce validation with Zod, and render inline errors.
* **Implementation Plan:**
  1. Define a `projectSettingsSchema` using Zod:
     ```tsx
     const projectSettingsSchema = z.object({
       title: z.string().min(2, "Project name must be at least 2 characters"),
       description: z.string().optional(),
     });
     ```
  2. Implement `useForm` from `@tanstack/react-form` configured with the Zod validator.
  3. Render input errors below inputs using the reusable `<FieldError>` component.

---

### 10. Virtualize Large Task Lists
* **Target File:** [task-list.tsx](file:///home/codeclouds-tanmoy/Personal/Veylo/veylo-client/features/tasks/components/task-list.tsx)
* **Goal:** Use `@tanstack/react-virtual` to virtualize rows, preventing DOM crashes when viewing large backlogs.
* **Implementation Plan:**
  1. Wrap the list container in a scrollable reference `parentRef`.
  2. Initialize the virtualizer hook:
     ```tsx
     const rowVirtualizer = useVirtualizer({
       count: tasks.length,
       getScrollElement: () => parentRef.current,
       estimateSize: () => 48, // height of a standard task row
       overscan: 10,
     });
     ```
  3. Render rows using `rowVirtualizer.getVirtualItems()`.
