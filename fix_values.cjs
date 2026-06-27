const fs = require('fs');
const file = '/home/codeclouds-tanmoy/Personal/Veylo/veylo-client/features/tasks/components/task-details-drawer.tsx';
let code = fs.readFileSync(file, 'utf8');

// STATUS
code = code.replace(
  /value=\{\s*task\?\.statusId\s*\?\s*\{\s*value:\s*task\.statusId,\s*label:\s*projectStatuses\.find\(\s*\(s: TaskStatus\) => s\.id === task\.statusId\s*\)\?\.name \|\| "",\s*\}\s*:\s*null\s*\}/g,
  'value={task?.statusId || null}'
);
code = code.replace(
  /onValueChange=\{\(\s*val: \{ value: string; label: string \} \| null\s*\) => handleFieldChange\("statusId", val\?\.value\)\}/g,
  'onValueChange={(val: string | null) => handleFieldChange("statusId", val)}'
);
code = code.replace(
  /value=\{\{ value: st\.id, label: st\.name \}\}/g,
  'value={st.id} textValue={st.name}'
);

// TYPE
code = code.replace(
  /value=\{\s*task\?\.type\s*\?\s*\{\s*value:\s*task\.type,\s*label:\s*task\.type === "bug"\s*\?\s*"Bug \(Defect\)"\s*:\s*task\.type === "feature"\s*\?\s*"Feature"\s*:\s*"Task",\s*\}\s*:\s*null\s*\}/g,
  'value={task?.type || null}'
);
code = code.replace(
  /onValueChange=\{\(\s*val: \{ value: string; label: string \} \| null\s*\) => handleFieldChange\("type", val\?\.value\)\}/g,
  'onValueChange={(val: string | null) => handleFieldChange("type", val)}'
);
code = code.replace(
  /value=\{\{ value: typeItem\.id, label: typeLabel \}\}/g,
  'value={typeItem.id} textValue={typeLabel}'
);

// PRIORITY
code = code.replace(
  /value=\{\s*task\?\.priority\s*\?\s*\{\s*value:\s*task\.priority,\s*label:\s*task\.priority\.charAt\(0\)\.toUpperCase\(\) \+\s*task\.priority\.slice\(1\),\s*\}\s*:\s*null\s*\}/g,
  'value={task?.priority || null}'
);
code = code.replace(
  /onValueChange=\{\(\s*val: \{ value: string; label: string \} \| null\s*\) => handleFieldChange\("priority", val\?\.value\)\}/g,
  'onValueChange={(val: string | null) => handleFieldChange("priority", val)}'
);
code = code.replace(
  /value=\{\{ value: priority\.id, label: priority\.label \}\}/g,
  'value={priority.id} textValue={priority.label}'
);

// SPRINT
code = code.replace(
  /value=\{\s*task\?\.sprintId\s*\?\s*\{\s*value:\s*task\.sprintId,\s*label:\s*projectSprints\.find\(\(s: Sprint\) => s\.id === task\.sprintId\)\?\.name \|\| "",\s*\}\s*:\s*null\s*\}/g,
  'value={task?.sprintId || null}'
);
code = code.replace(
  /onValueChange=\{\(\s*val: \{ value: string; label: string \} \| null\s*\) =>\s*handleFieldChange\("sprintId", val\?\.value \|\| null\)\s*\}/g,
  'onValueChange={(val: string | null) => handleFieldChange("sprintId", val || null)}'
);
code = code.replace(
  /value=\{\{ value: s\.id, label: s\.name \}\}/g,
  'value={s.id} textValue={s.name}'
);
code = code.replace(
  /value=\{\{ value: "null", label: "No sprint" \}\}/g,
  'value={"null"} textValue={"No sprint"}'
);

// EPIC
code = code.replace(
  /value=\{\s*task\?\.epicId\s*\?\s*\{\s*value:\s*task\.epicId,\s*label:\s*projectEpics\.find\(\(e: Epic\) => e\.id === task\.epicId\)\?\.title \|\| "",\s*\}\s*:\s*null\s*\}/g,
  'value={task?.epicId || null}'
);
code = code.replace(
  /onValueChange=\{\(\s*val: \{ value: string; label: string \} \| null\s*\) => handleFieldChange\("epicId", val\?\.value \|\| null\)\}/g,
  'onValueChange={(val: string | null) => handleFieldChange("epicId", val || null)}'
);
code = code.replace(
  /value=\{\{ value: e\.id, label: e\.title \}\}/g,
  'value={e.id} textValue={e.title}'
);
code = code.replace(
  /value=\{\{ value: "null", label: "No epic" \}\}/g,
  'value={"null"} textValue={"No epic"}'
);

// MILESTONE
code = code.replace(
  /value=\{\s*task\?\.milestoneId\s*\?\s*\{\s*value:\s*task\.milestoneId,\s*label:\s*projectMilestones\.find\(\(m: Milestone\) => m\.id === task\.milestoneId\)\?\.title \|\| "",\s*\}\s*:\s*null\s*\}/g,
  'value={task?.milestoneId || null}'
);
code = code.replace(
  /onValueChange=\{\(\s*val: \{ value: string; label: string \} \| null\s*\) => handleFieldChange\("milestoneId", val\?\.value \|\| null\)\}/g,
  'onValueChange={(val: string | null) => handleFieldChange("milestoneId", val || null)}'
);
code = code.replace(
  /value=\{\{ value: m\.id, label: m\.title \}\}/g,
  'value={m.id} textValue={m.title}'
);
code = code.replace(
  /value=\{\{ value: "null", label: "No milestone" \}\}/g,
  'value={"null"} textValue={"No milestone"}'
);

// CUSTOM FIELDS
code = code.replace(
  /value=\{\s*fieldValue\s*\?\s*\{\s*value:\s*fieldValue,\s*label:\s*fieldValue,\s*\}\s*:\s*null\s*\}/g,
  'value={fieldValue || null}'
);
code = code.replace(
  /onValueChange=\{\(\s*val: \{\s*value: string\s*label: string\s*\} \| null\s*\) =>\s*handleCustomFieldChange\(\s*fieldDef\.id,\s*val\?\.value \|\| ""\s*\)\s*\}/g,
  'onValueChange={(val: string | null) => handleCustomFieldChange(fieldDef.id, val || "")}'
);
code = code.replace(
  /value=\{\{ value: opt, label: opt \}\}/g,
  'value={opt} textValue={opt}'
);

// DEPENDENCIES
code = code.replace(
  /value=\{\s*depDirection\s*\?\s*\{\s*value:\s*depDirection,\s*label:\s*depDirection === "blocked_by"\s*\?\s*"Is blocked by"\s*:\s*"Blocks",\s*\}\s*:\s*null\s*\}/g,
  'value={depDirection || null}'
);
code = code.replace(
  /onValueChange=\{\(\s*val: \{ value: string; label: string \} \| null\s*\) =>\s*setDepDirection\(\(val\?\.value as "blocks" \| "blocked_by"\) \|\| "blocked_by"\)\s*\}/g,
  'onValueChange={(val: string | null) => setDepDirection((val as "blocks" | "blocked_by") || "blocked_by")}'
);

code = code.replace(
  /value=\{\s*targetProjectId\s*\?\s*\{\s*value:\s*targetProjectId,\s*label:\s*projects\.find\(\(p: Project\) => p\.id === targetProjectId\)\?\.name \|\| "",\s*\}\s*:\s*null\s*\}/g,
  'value={targetProjectId || null}'
);
code = code.replace(
  /onValueChange=\{\(\s*val: \{ value: string; label: string \} \| null\s*\) => \{\s*setTargetProjectId\(val\?\.value \|\| ""\)\s*setTargetTaskId\(""\)\s*\}\}/g,
  'onValueChange={(val: string | null) => { setTargetProjectId(val || ""); setTargetTaskId(""); }}'
);
code = code.replace(
  /value=\{\{ value: p\.id, label: p\.name \}\}/g,
  'value={p.id} textValue={p.name}'
);

code = code.replace(
  /value=\{\s*targetTaskId\s*\?\s*\{\s*value:\s*targetTaskId,\s*label:\s*availableTasks\.find\(\(t: Task\) => t\.id === targetTaskId\)\?\.title \|\| "",\s*\}\s*:\s*null\s*\}/g,
  'value={targetTaskId || null}'
);
code = code.replace(
  /onValueChange=\{\(\s*val: \{ value: string; label: string \} \| null\s*\) => setTargetTaskId\(val\?\.value \|\| ""\)\}/g,
  'onValueChange={(val: string | null) => setTargetTaskId(val || "")}'
);
code = code.replace(
  /value=\{\{ value: t\.id, label: t\.title \}\}/g,
  'value={t.id} textValue={t.title}'
);
code = code.replace(
  /value=\{\{\s*value: "blocks",\s*label: "Blocks",\s*\}\}/g,
  'value={"blocks"} textValue={"Blocks"}'
);
code = code.replace(
  /value=\{\{\s*value: "blocked_by",\s*label: "Is blocked by",\s*\}\}/g,
  'value={"blocked_by"} textValue={"Is blocked by"}'
);

// FINALLY, REMOVE isItemEqualToValue FROM ALL OF THEM
// Since Assignee is the only one passing an object, wait, assignee still passes object?
// Wait, if Assignee passes object, it NEEDS isItemEqualToValue. 
// Did I add isItemEqualToValue to others earlier? Yes, I did! I need to remove it from the ones I just changed to string.
// Instead of complex regex, I can just remove ALL isItemEqualToValue, and then manually add it back to Assignee.

code = code.replace(/\s+isItemEqualToValue=\{[^\}]+\}/g, '');

fs.writeFileSync(file, code);
