const fs = require('fs');

function fixFile(file) {
  let code = fs.readFileSync(file, 'utf8');

  // Fix all ComboboxItem object values explicitly
  code = code.replace(/value=\{\{\s*value:\s*"blocked_by",\s*label:\s*"is blocked by"\s*\}\}/g, 'value="blocked_by"');
  code = code.replace(/value=\{\{\s*value:\s*"blocks",\s*label:\s*"blocks"\s*\}\}/g, 'value="blocks"');
  code = code.replace(/value=\{\{\s*value:\s*p\.id,\s*label:[^}]+\}\}/g, 'value={p.id}');
  code = code.replace(/value=\{\{\s*value:\s*t\.id,\s*label:[^}]+\}\}/g, 'value={t.id}');
  code = code.replace(/value=\{\{\s*value:\s*"task",\s*label:\s*"Task"\s*\}\}/g, 'value="task"');
  code = code.replace(/value=\{\{\s*value:\s*"bug",\s*label:\s*"Bug \(Defect\)"\s*\}\}/g, 'value="bug"');
  code = code.replace(/value=\{\{\s*value:\s*"feature",\s*label:\s*"Feature"\s*\}\}/g, 'value="feature"');
  code = code.replace(/value=\{\{\s*value:\s*"low",\s*label:\s*"Low"\s*\}\}/g, 'value="low"');
  code = code.replace(/value=\{\{\s*value:\s*"medium",\s*label:\s*"Medium"\s*\}\}/g, 'value="medium"');
  code = code.replace(/value=\{\{\s*value:\s*"high",\s*label:\s*"High"\s*\}\}/g, 'value="high"');
  code = code.replace(/value=\{\{\s*value:\s*"urgent",\s*label:\s*"Urgent"\s*\}\}/g, 'value="urgent"');
  code = code.replace(/value=\{\{\s*value:\s*"",\s*label:\s*"Backlog"\s*\}\}/g, 'value=""');
  code = code.replace(/value=\{\{\s*value:\s*sp\.id,\s*label:[^}]+\}\}/g, 'value={sp.id}');
  code = code.replace(/value=\{\{\s*value:\s*"",\s*label:\s*"No Epic"\s*\}\}/g, 'value=""');
  code = code.replace(/value=\{\{\s*value:\s*ep\.id,\s*label:\s*ep\.title\s*\}\}/g, 'value={ep.id}');
  code = code.replace(/value=\{\{\s*value:\s*"",\s*label:\s*"Select Milestone"\s*\}\}/g, 'value=""');
  code = code.replace(/value=\{\{\s*value:\s*ms\.id,\s*label:\s*ms\.title\s*\}\}/g, 'value={ms.id}');

  // Fix implicit any
  code = code.replace(/projects\.find\(\(p\) => p\.id === v\)/g, 'projects.find((p: Project) => p.id === v)');
  code = code.replace(/availableTasks\.find\(\(t\) => t\.id === v\)/g, 'availableTasks.find((t: Task) => t.id === v)');

  // Fix setTargetProjectId(val?.value || projectId)
  code = code.replace(/setTargetProjectId\(val\?\.value \|\| projectId\)/g, 'setTargetProjectId(val || projectId)');

  // And `value={task?.sprintId ? { value: task.sprintId, label: ... } : null}` which might still be there for Sprint, Epic, Milestone!
  // Wait, let's fix them manually:
  code = code.replace(/value=\{\s*task\?\.sprintId\s*\?\s*\{\s*value:\s*task\.sprintId,\s*label:[^}]+\}\s*:\s*null\s*\}/g, 'value={task?.sprintId || null}');
  code = code.replace(/value=\{\s*task\?\.epicId\s*\?\s*\{\s*value:\s*task\.epicId,\s*label:[^}]+\}\s*:\s*null\s*\}/g, 'value={task?.epicId || null}');
  code = code.replace(/value=\{\s*task\?\.milestoneId\s*\?\s*\{\s*value:\s*task\.milestoneId,\s*label:[^}]+\}\s*:\s*null\s*\}/g, 'value={task?.milestoneId || null}');

  fs.writeFileSync(file, code);
}

fixFile('/home/codeclouds-tanmoy/Personal/Veylo/veylo-client/features/tasks/components/task-details-drawer.tsx');
fixFile('/home/codeclouds-tanmoy/Personal/Veylo/veylo-client/app/(authenticated)/[workspaceSlug]/tasks/[taskId]/page.tsx');
