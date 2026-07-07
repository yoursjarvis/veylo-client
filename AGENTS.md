# Frontend Agent Rules

> This project is a **frontend-only** application built with **Next.js 16**.
> The backend is a completely separate **Express.js** application.
> Never implement backend logic inside the frontend.

- Do not make assumptions. If required information is missing or implementation details are ambiguous, ask for clarification instead of inventing behavior or APIs.
- Always prefer existing project utilities, components, hooks, and abstractions before creating new ones.
- Keep code modular, reusable, and easy to maintain.
- Avoid duplication. Extract shared logic whenever it is used more than once.
- Keep functions focused on a single responsibility.
- Prefer composition over inheritance.
- Never leave TODOs, FIXMEs, or incomplete implementations unless explicitly requested.
- Remove unused imports, variables, functions, and files.
- Never introduce dead code.
- Always keep the project buildable.

---

# General

- Always write production-ready code.
- Never make assumptions about APIs or business logic.
- Ask for clarification whenever requirements are ambiguous.
- Prefer readability over clever code.
- Keep code simple, maintainable, and reusable.
- Reuse existing components, utilities, and hooks whenever possible.
- Do not duplicate logic.
- Extract shared logic into reusable hooks or utilities.
- Remove unused imports, variables, and code.
- Never leave TODOs, FIXMEs, or placeholder implementations unless explicitly requested.
- Keep components focused on a single responsibility.
- Use composition over duplication.

---

# TypeScript

- Never use `any`.
- Never use `@ts-ignore`.
- Never use `@ts-expect-error`.
- Never disable TypeScript.
- Never suppress type errors.
- Fix the types properly.
- Prefer `type` over `interface` unless declaration merging is required.
- Export proper types for reusable code.
- Avoid unnecessary type assertions.
- Use discriminated unions where appropriate.
- Prefer strict typing everywhere.
- Avoid nullable values unless required.
- Zero TypeScript errors before finishing.

---

# ESLint

- Never disable ESLint rules.
- Never ignore lint errors.
- Fix every lint issue properly.
- Zero ESLint warnings.
- Zero ESLint errors.

---

# Next.js 16

- Always use the App Router.
- Prefer Server Components whenever possible.
- Only use Client Components when browser APIs or React hooks are required.
- Keep Client Components as small as possible.
- Avoid unnecessary client-side JavaScript.
- Use `next/image` for images.
- Never use plain `<img>` unless absolutely necessary.
- Use `next/font`.
- Use the Metadata API.
- Use Suspense where appropriate.
- Use loading.tsx.
- Use error.tsx.
- Use not-found.tsx where appropriate.
- Use dynamic imports only when they improve performance.
- Keep bundle size minimal.
- Do not implement backend APIs inside Next.js.

---

# API Communication

- The backend is Express.
- Never implement backend logic in the frontend.
- Never call APIs directly inside UI components.
- Always create reusable API functions.
- Keep API requests inside dedicated service files.
- Keep API endpoints centralized.
- Never duplicate endpoint URLs.
- Properly type every request and response.
- Handle loading, error, and success states.
- Handle API failures gracefully.
- Never assume response structures.
- Validate responses whenever appropriate.

Example:

```
services/
    auth/
    users/
    products/
```

---

# Data Fetching

- Always use TanStack Query.
- Never manually manage server state with useState.
- Configure staleTime intentionally.
- Configure gcTime intentionally.
- Use optimistic updates where appropriate.
- Invalidate queries correctly.
- Prefetch data when beneficial.
- Avoid duplicate requests.
- Keep query keys centralized.
- Use infinite queries when appropriate.
- Always handle:
  - Loading
  - Error
  - Empty
  - Success

---

# Forms

- Always use TanStack Form.
- Never build forms with manual useState.
- Always validate using Zod.
- Share validation schemas with the backend whenever possible.
- Validate before submitting.
- Display validation errors directly underneath each field.
- Never show validation errors only inside toast notifications.
- Show server validation errors inline whenever possible.
- Disable submit buttons while submitting.
- Prevent duplicate submissions.
- Preserve user input after validation failures.
- Always provide loading states.

---

# Validation

- Always use Zod.
- Validate all user input.
- Never trust API data blindly.
- Parse external data whenever appropriate.
- Keep schemas reusable.

---

# UI Components

- Always use shadcn/ui components.
- Never use native:
  - input
  - textarea
  - select
  - button
- Always use reusable project components.
- Keep components generic whenever possible.
- Follow the existing design system.
- Support light mode.
- Support dark mode.
- Ensure accessibility.

---

# Styling

- Always use Tailwind CSS.
- Never use inline styles.
- Never use arbitrary Tailwind values unless explicitly requested.
- Never use hardcoded colors.
- Always use theme tokens.
- Mobile-first design.
- Responsive on:
  - Mobile
  - Tablet
  - Desktop
- Keep utility classes organized.
- Do not use arbitrary text sizing e.g. text-[10px], text-[20px]. Always use predefine tailwind classes e.g. text-xs, text-sm, text-lg.
- Do not use arbitrary bg color or text color or border colors. Use theme settings colors always unless explicitly requested.

---

# Icons

- Always use Hugeicons.
- Import icons from:

### Hugeicons Example

```tsx
import { Bug01FreeIcons } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"

export function BugButton() {
  return (
    <Button className="flex items-center gap-2">
      <HugeiconsIcon icon={Bug01FreeIcons} className="h-5 w-5" />
      Report Bug
    </Button>
  )
}
```

### Multiple Icons Example

```tsx
import {
  ArrowRight01Icon,
  CalendarIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

export function Example() {
  return (
    <div className="flex items-center gap-4">
      <HugeiconsIcon icon={SparklesIcon} className="h-5 w-5" />
      <HugeiconsIcon icon={CalendarIcon} className="h-5 w-5" />
      <HugeiconsIcon icon={ArrowRight01Icon} className="h-5 w-5" />
    </div>
  )
}
```

### Lucide Fallback Example

Only use Lucide when the required icon is unavailable in Hugeicons.

```tsx
import { ScanFace } from "lucide-react"

export function FaceScanButton() {
  return <ScanFace className="h-5 w-5" />
}
```

```

- Only use Lucide when Hugeicons does not provide an equivalent icon.
- Verify Hugeicons first.
- Keep icon sizing consistent.

---

# Tables

- Build reusable table components.
- Support:
  - Sorting
  - Filtering
  - Pagination
  - Loading state
  - Empty state
  - Error state

---

# Lists

- Never render huge DOM trees.
- Always virtualize long lists.
- Always provide loading placeholders.
- Always provide empty states.

---

# Infinite Scrolling

- Always use:

```

@tanstack/react-virtual

```

- Never render thousands of DOM nodes.
- Preserve scroll position.
- Optimize overscan.
- Prevent layout shifts.

---

# Search & Filters

- Always use nuqs.
- Store filters in the URL.
- Store sorting in the URL.
- Store pagination in the URL whenever appropriate.
- Make filtered URLs shareable.
- Support browser back/forward navigation.
- Debounce search input.

---

# State Management

- Use React state only for local UI state.
- Use TanStack Query for server state.
- Avoid unnecessary Context providers.
- Lift state only when necessary.
- Avoid duplicated state.

---

# Performance

- Avoid unnecessary re-renders.
- Avoid unnecessary useEffect.
- Avoid unnecessary memoization.
- Virtualize large lists.
- Lazy-load heavy components.
- Lazy-load dialogs.
- Minimize hydration.
- Keep bundle size small.
- Prevent layout shifts.

---

# Component Design

- Keep components small.
- One responsibility per component.
- One responsibility per hook.
- Move business logic into hooks.
- Keep pages lightweight.
- Prefer composition.
- Reuse existing components.
- Extract repeated UI.

---

# Hooks

- Reuse existing hooks.
- Extract reusable logic.
- Keep hooks focused.
- Never perform unrelated work inside a single hook.

---

# File Organization

Organize by feature whenever possible.

Example:

```

features/
auth/
api/
components/
hooks/
schemas/
types/

    users/
        api/
        components/
        hooks/
        schemas/

```

Avoid dumping everything into a global components folder.

---

# Naming

Use descriptive names.

Never abbreviate variables like:

- obj
- tmp
- val
- btn
- arr
- data1
- data2

Good examples:

```

selectedCustomer
filteredProducts
isSubmitting
currentCategory

```

---

# Error Handling

Always handle failures.

Every async operation should have:

- Loading state
- Error state
- Retry when appropriate

Never swallow errors.

Never leave empty catch blocks.

---

# Loading UX

Prefer skeletons over spinners.

Every page should handle:

- Initial loading
- Background fetching
- Empty results
- Errors

---

# Accessibility

- Keyboard accessible.
- Screen reader friendly.
- Proper labels.
- Proper aria attributes.
- Proper focus management.
- Proper heading hierarchy.
- Accessible form errors.
- Accessible dialogs.

---

# Utilities

- Extract repeated formatting logic.
- Never duplicate utility functions.
- Keep date formatting centralized.
- Keep currency formatting centralized.
- Keep string formatting centralized.

---

# Constants

- Never hardcode repeated strings.
- Never hardcode repeated routes.
- Never hardcode repeated query keys.
- Store constants centrally.

---

# Logging

- Never commit console.log.
- Remove debugging code before finishing.

---

# Imports

- Keep imports organized.
- Remove unused imports.
- Prefer absolute imports if configured.
- Avoid circular dependencies.

---

# Before Finishing

Verify all of the following:

- Zero TypeScript errors.
- Zero ESLint errors.
- Zero build errors.
- No disabled lint rules.
- No ignored TypeScript errors.
- No `any`.
- No unused imports.
- No dead code.
- No inline styles.
- No arbitrary Tailwind values.
- No hardcoded colors.
- Uses Tailwind only.
- Uses shadcn/ui components.
- Uses TanStack Form for forms.
- Uses Zod validation.
- Displays validation errors below each field.
- Uses TanStack Query for server state.
- Uses TanStack Virtual for large lists.
- Uses nuqs for URL filters.
- Uses Hugeicons.
- Responsive on all screen sizes.
- Works in both light and dark mode.
- Keyboard accessible.
- Screen reader accessible.
- Production ready.
```
