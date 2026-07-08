# TanStack Form Refactor & Deduplication Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Create New Objective modal form in `okrs-dashboard.tsx` to use TanStack React Form and Zod validation, and resolve the duplicate project names bug.

**Architecture:** Use `@tanstack/react-form` for form state management and `@tanstack/zod-form-adapter` for validation. Replace state variables with form fields. Wrap the form in `<form>` and handle submit through `form.handleSubmit`. Deduplicate query values using `React.useMemo` and a unique identifier `Set`.

**Tech Stack:** React, TanStack React Form, Zod, TanStack Zod Form Adapter.

## Global Constraints
- Do not commit any changes on Git (do not run `git commit`, `git add`, etc.).
- Never use `any`, `@ts-ignore`, or `@ts-expect-error`.
- For icons, always use Hugeicons. Only use Lucide React icons if not present.
- Support both light and dark modes.

---

### Task 1: Refactor Form & Deduplicate Options in OkrsDashboard

**Files:**
- Modify: `features/okrs/components/okrs-dashboard.tsx`

- [ ] **Step 1: Update okrs-dashboard.tsx with TanStack Form**

Apply the following modifications to [okrs-dashboard.tsx](file:///home/codeclouds-tanmoy/Personal/Veylo/veylo-client/features/okrs/components/okrs-dashboard.tsx):

Add imports:
```tsx
import { useForm } from "@tanstack/react-form"
import { zodValidator } from "@tanstack/zod-form-adapter"
import { z } from "zod"
import { Field, FieldError } from "@/components/ui/field"
```

Define the form schema:
```tsx
const objectiveSchema = z.object({
  title: z.string().min(1, "Objective title is required"),
  description: z.string().optional(),
  krTitle: z.string().optional(),
  krTarget: z.string().optional(),
  projectId: z.string().nullable().optional(),
  epicId: z.string().nullable().optional(),
})
```

Define unique project options & epic options (solving the duplicate bug):
```tsx
  const projectOptions = React.useMemo(() => {
    const seen = new Set<string>()
    return projects
      .filter((p) => {
        if (!p.id || seen.has(p.id)) return false
        seen.add(p.id)
        return true
      })
      .map((p) => ({ value: p.id, label: p.title }))
  }, [projects])

  const epicOptions = React.useMemo(() => {
    const seen = new Set<string>()
    return epics
      .filter((e) => {
        if (!e.id || seen.has(e.id)) return false
        seen.add(e.id)
        return true
      })
      .map((e: Epic) => ({ value: e.id, label: e.title }))
  }, [epics])
```

Remove local state hooks for form fields:
```tsx
  // Remove these:
  // const [newTitle, setNewTitle] = useState("")
  // const [newDesc, setNewDesc] = useState("")
  // const [newKrTitle, setNewKrTitle] = useState("")
  // const [newKrTarget, setNewKrTarget] = useState("")
  // const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  // const [selectedEpicId, setSelectedEpicId] = useState<string | null>(null)
```

Define `form` using `useForm`:
```tsx
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      krTitle: "",
      krTarget: "",
      projectId: null as string | null,
      epicId: null as string | null,
    },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
      const keyResults: KeyResult[] = []
      if (value.krTitle.trim()) {
        keyResults.push({
          id: `kr-${Date.now()}`,
          title: value.krTitle.trim(),
          progress: 0,
          target: value.krTarget || "100%",
        })
      }

      const linkedProjects: string[] = []
      if (value.projectId) {
        const project = projects.find((p) => p.id === value.projectId)
        if (project) linkedProjects.push(project.title)
      }
      if (value.epicId) {
        const epic = epics.find((e: Epic) => e.id === value.epicId)
        if (epic) linkedProjects.push(epic.title)
      }

      const newOkr: Objective = {
        id: `obj-${Date.now()}`,
        title: value.title.trim(),
        description: value.description,
        progress: 0,
        keyResults,
        linkedProjects,
      }
      setOkrs([newOkr, ...okrs])

      form.reset()
      setIsDialogOpen(false)
    },
  })

  // Watch projectId to fetch epics
  const selectedProjectId = form.useStore((state) => state.values.projectId)

  // Reset form on open
  React.useEffect(() => {
    if (isDialogOpen) {
      form.reset()
    }
  }, [isDialogOpen, form])
```

Wrap the Dialog content inputs in a `<form>` and wire up fields using `<form.Field>`:
- **Title Field**:
  ```tsx
              <form.Field
                name="title"
                validators={{ onChange: objectiveSchema.shape.title }}
              >
                {(field) => (
                  <Field>
                    <Label htmlFor={field.name}>Objective Title</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. Expand into Enterprise Market"
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
  ```
- **Description Field**:
  ```tsx
              <form.Field name="description">
                {(field) => (
                  <Field>
                    <Label htmlFor={field.name}>Description</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Short summary of this objective"
                    />
                  </Field>
                )}
              </form.Field>
  ```
- **Key Result Title Field**:
  ```tsx
                    <form.Field name="krTitle">
                      {(field) => (
                        <Field>
                          <Label htmlFor={field.name} className="text-xs">
                            KR Title
                          </Label>
                          <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="e.g. Increase MAU by 20%"
                          />
                        </Field>
                      )}
                    </form.Field>
  ```
- **Key Result Target Field**:
  ```tsx
                    <form.Field name="krTarget">
                      {(field) => (
                        <Field>
                          <Label htmlFor={field.name} className="text-xs">
                            Target
                          </Label>
                          <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="e.g. 20%"
                          />
                        </Field>
                      )}
                    </form.Field>
  ```
- **Project Field**:
  ```tsx
                  <form.Field name="projectId">
                    {(field) => (
                      <Field>
                        <Label>Project</Label>
                        <SearchableSelect
                          value={field.state.value}
                          onValueChange={(val) => {
                            field.handleChange(val)
                            form.setFieldValue("epicId", null)
                          }}
                          options={projectOptions}
                          placeholder="Select a project"
                        />
                      </Field>
                    )}
                  </form.Field>
  ```
- **Epic Field**:
  ```tsx
                {selectedProjectId && (
                  <form.Field name="epicId">
                    {(field) => (
                      <Field>
                        <Label>Epic (Optional)</Label>
                        <SearchableSelect
                          value={field.state.value}
                          onValueChange={(val) => field.handleChange(val)}
                          options={epicOptions}
                          placeholder="Select an epic"
                          clearable
                        />
                      </Field>
                    )}
                  </form.Field>
                )}
  ```

Add dynamic submit/disabled states:
```tsx
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                {([canSubmit, isSubmitting]) => (
                  <Button type="submit" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Objective"}
                  </Button>
                )}
              </form.Subscribe>
            </DialogFooter>
```

- [ ] **Step 2: Verify typescript compilation and linting**

Run: `npm run typecheck`
Expected: 0 errors

Run: `npm run lint`
Expected: 0 errors
