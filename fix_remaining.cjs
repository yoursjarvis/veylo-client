const fs = require('fs');

function fix(file) {
  let code = fs.readFileSync(file, 'utf8');

  // Fix all ComboboxItem object values
  // e.g. value={{ value: "blocks", label: "blocks" }}
  // e.g. value={{ \n value: "blocked_by", \n label: "is blocked by" \n }}
  code = code.replace(/<ComboboxItem\s+([^>]*)value=\{\{\s*value:\s*([^,]+),\s*label:\s*[^}]+\s*\}\}/g, '<ComboboxItem $1value={$2}');
  
  // Also handle cases where key=... is before or after
  code = code.replace(/value=\{\{\s*value:\s*([^,]+),\s*label:\s*[^}]+\s*\}\}/g, 'value={$1}');

  // Fix Combobox value objects that my previous script missed
  // Dependency Direction
  code = code.replace(
    /value=\{\s*depDirection\s*\?\s*\{\s*value:\s*depDirection,\s*label:\s*[^}]+\s*\}\s*:\s*null\s*\}/g,
    'value={depDirection || null}\nitemToStringLabel={(v) => v === "blocked_by" ? "Is blocked by" : "Blocks"}'
  );
  code = code.replace(
    /onValueChange=\{\(\s*val: \{ value: string; label: string \} \| null\s*\) =>\s*setDepDirection\(([^)]+)\)\s*\}/g,
    'onValueChange={(val: string | null) => setDepDirection((val as "blocks" | "blocked_by") || "blocked_by")}'
  );

  // Target Project
  code = code.replace(
    /value=\{\s*targetProjectId\s*\?\s*\{\s*value:\s*targetProjectId,\s*label:[^}]+\}\s*:\s*null\s*\}/g,
    'value={targetProjectId || null}\nitemToStringLabel={(v) => projects.find((p) => p.id === v)?.name || "Select Project"}'
  );
  code = code.replace(
    /onValueChange=\{\(\s*val: \{ value: string; label: string \} \| null\s*\) => \{\s*setTargetProjectId\([^)]+\)\s*setTargetTaskId\(""\)\s*\}\}/g,
    'onValueChange={(val: string | null) => { setTargetProjectId(val || ""); setTargetTaskId(""); }}'
  );

  // Target Task
  code = code.replace(
    /value=\{\s*targetTaskId\s*\?\s*\{\s*value:\s*targetTaskId,\s*label:[^}]+\}\s*:\s*null\s*\}/g,
    'value={targetTaskId || null}\nitemToStringLabel={(v) => availableTasks.find((t) => t.id === v)?.title || "Select Task"}'
  );
  code = code.replace(
    /onValueChange=\{\(\s*val: \{ value: string; label: string \} \| null\s*\) =>\s*setTargetTaskId\([^)]+\)\s*\}/g,
    'onValueChange={(val: string | null) => setTargetTaskId(val || "")}'
  );

  // Fix missing onValueChange signature
  code = code.replace(
    /onValueChange=\{\(\s*val: \{ value: string; label: string \} \| null\s*\) =>/g,
    'onValueChange={(val: string | null) =>'
  );
  code = code.replace(
    /handleFieldChange\(\s*"assigneeId",\s*val\?\.value === "unassigned"\s*\?\s*null\s*:\s*val\?\.value \|\| null\s*\)/g,
    'handleFieldChange("assigneeId", val === "unassigned" ? null : (val || null))'
  );
  code = code.replace(
    /val\?\.value as "blocks" \| "blocked_by"/g,
    'val as "blocks" | "blocked_by"'
  );

  // Fix the old Image syntax and missing props
  code = code.replace(/<Image\s+unoptimized/g, '<Image unoptimized');

  fs.writeFileSync(file, code);
}

fix('/home/codeclouds-tanmoy/Personal/Veylo/veylo-client/features/tasks/components/task-details-drawer.tsx');
fix('/home/codeclouds-tanmoy/Personal/Veylo/veylo-client/app/(authenticated)/[workspaceSlug]/tasks/[taskId]/page.tsx');

