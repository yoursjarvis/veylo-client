# Design Spec: Reusable Searchable Select Component

Create a reusable `SearchableSelect` component and use it in the Create New Objective modal for both Project and Epic selections on the OKRs dashboard.

## 1. Requirements

- **Searchable Dropdown**: Use `Popover` and `Command` components (matching the pattern in the "add blocked by task" component) to allow users to filter options dynamically.
- **Clear Button**: Support clearing selection via an "X" button inside the trigger for optional fields (like Epic).
- **Icons**: Always prefer Hugeicons (e.g. `Cancel01Icon` or similar) for UI elements. Fallback to Lucide React icons only when necessary.
- **No Git Commits**: Do not commit any changes to the Git repository.

## 2. API Design

### `SearchableSelectProps`
- `value`: `string | null` - The current selected value.
- `onValueChange`: `(value: string | null) => void` - Callback when an option is selected or cleared.
- `options`: `{ value: string; label: string }[]` - List of options.
- `placeholder`: `string` - Placeholder text when no option is selected.
- `searchPlaceholder`?: `string` - Placeholder inside the search input (defaults to "Search...").
- `emptyText`?: `string` - Text displayed when no search results match (defaults to "No results found.").
- `clearable`?: `boolean` - If true, displays a clear button ("X") when a value is selected.
- `disabled`?: `boolean` - If true, disables the dropdown trigger.
- `className`?: `string` - Optional CSS class for trigger container.

## 3. Implementation Details

- **File Location**: [components/ui/searchable-select.tsx](file:///home/codeclouds-tanmoy/Personal/Veylo/veylo-client/components/ui/searchable-select.tsx)
- **Styling**: Align styling of the trigger with [components/ui/select.tsx](file:///home/codeclouds-tanmoy/Personal/Veylo/veylo-client/components/ui/select.tsx)'s `SelectTrigger`.
- **Deselection Event Handling**: The clear button click must call `e.stopPropagation()` and `e.preventDefault()` to avoid opening the popover.
- **Focus Management**: Incorporate a slight delay (`setTimeout` / `isRendered`) before focusing the input to ensure it consistently receives focus after the popover mounts.
