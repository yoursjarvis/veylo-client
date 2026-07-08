### Task 2: Integrate `SearchableSelect` Component in `OkrsDashboard`

**Files:**
- Modify: `features/okrs/components/okrs-dashboard.tsx`

**Interfaces:**
- Consumes: `SearchableSelect` from `@/components/ui/searchable-select`

- [ ] **Step 1: Modify okrs-dashboard.tsx**

Replace the Select components for Project and Epic inside the Create Objective dialog in [okrs-dashboard.tsx](file:///home/codeclouds-tanmoy/Personal/Veylo/veylo-client/features/okrs/components/okrs-dashboard.tsx) with the new `SearchableSelect`.

Update imports in `okrs-dashboard.tsx`:
```tsx
import { SearchableSelect } from "@/components/ui/searchable-select"
```

Prepare options arrays before the Dialog content rendering:
```tsx
  const projectOptions = projects.map((p) => ({ value: p.id, label: p.title }))
  const epicOptions = epics.map((e: Epic) => ({ value: e.id, label: e.title }))
```

Replace the Select sections:
```tsx
              <div className="mt-2 space-y-4 border-t pt-4">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Link Project & Epic
                </h4>
                <div className="space-y-2">
                  <Label>Project</Label>
                  <SearchableSelect
                    value={selectedProjectId}
                    onValueChange={(val) => {
                      setSelectedProjectId(val)
                      setSelectedEpicId(null)
                    }}
                    options={projectOptions}
                    placeholder="Select a project"
                  />
                </div>

                {selectedProjectId && (
                  <div className="space-y-2">
                    <Label>Epic (Optional)</Label>
                    <SearchableSelect
                      value={selectedEpicId}
                      onValueChange={(val) => setSelectedEpicId(val)}
                      options={epicOptions}
                      placeholder="Select an epic"
                      clearable
                    />
                  </div>
                )}
              </div>
```

- [ ] **Step 2: Verify types and linting**

Run: `npm run typecheck`
Expected: PASS

Run: `npm run lint`
Expected: PASS

Run: `npm run build`
Expected: PASS (no build errors)
