const fs = require('fs');
const drawerFile = '/home/codeclouds-tanmoy/Personal/Veylo/veylo-client/features/tasks/components/task-details-drawer.tsx';
const pageFile = '/home/codeclouds-tanmoy/Personal/Veylo/veylo-client/app/(authenticated)/[workspaceSlug]/tasks/[taskId]/page.tsx';

function fixFile(file, isDrawer) {
  let code = fs.readFileSync(file, 'utf8');

  // Fix PopoverTrigger
  code = code.replace(/<PopoverTrigger asChild>/g, '<PopoverTrigger>');

  // Fix Image import
  if (code.includes('<Image') && !code.includes('import Image from "next/image"')) {
    code = code.replace(/import \{[^}]+\} from "lucide-react"\n?/, match => `${match}import Image from "next/image"\n`);
  }

  // Fix Activity import
  if (code.includes('<Activity') && !code.includes('Activity')) {
    code = code.replace(/import \{([^}]+)\} from "lucide-react"/, 'import { $1, Activity } from "lucide-react"');
  }

  // Fix Status Combobox itemToStringLabel
  if (isDrawer) {
    code = code.replace(
      /<Combobox\n(\s+)value=\{task\?\.statusId \|\| null\}\n(\s+)onValueChange=\{\(val: string \| null\) => handleFieldChange\("statusId", val\)\}/g,
      `<Combobox\n$1value={task?.statusId || null}\n$2onValueChange={(val: string | null) => handleFieldChange("statusId", val)}\n$2itemToStringLabel={(v) => projectStatuses.find((s) => s.id === v)?.name || "Select status"}`
    );
    
    code = code.replace(
      /<Combobox\n(\s+)value=\{task\?\.type \|\| null\}\n(\s+)onValueChange=\{\(val: string \| null\) => handleFieldChange\("type", val\)\}/g,
      `<Combobox\n$1value={task?.type || null}\n$2onValueChange={(val: string | null) => handleFieldChange("type", val)}\n$2itemToStringLabel={(v) => v === "bug" ? "Bug (Defect)" : v === "feature" ? "Feature" : "Task"}`
    );
    
    code = code.replace(
      /<Combobox\n(\s+)value=\{task\?\.priority \|\| null\}\n(\s+)onValueChange=\{\(val: string \| null\) => handleFieldChange\("priority", val\)\}/g,
      `<Combobox\n$1value={task?.priority || null}\n$2onValueChange={(val: string | null) => handleFieldChange("priority", val)}\n$2itemToStringLabel={(v) => v ? v.charAt(0).toUpperCase() + v.slice(1) : "Select priority"}`
    );
    
    code = code.replace(
      /<Combobox\n(\s+)value=\{task\?\.sprintId \|\| null\}\n(\s+)onValueChange=\{\(val: string \| null\) => handleFieldChange\("sprintId", val \|\| null\)\}/g,
      `<Combobox\n$1value={task?.sprintId || null}\n$2onValueChange={(val: string | null) => handleFieldChange("sprintId", val || null)}\n$2itemToStringLabel={(v) => v === "null" ? "No sprint" : (projectSprints.find((s) => s.id === v)?.name || "Select sprint")}`
    );

    code = code.replace(
      /<Combobox\n(\s+)value=\{task\?\.epicId \|\| null\}\n(\s+)onValueChange=\{\(val: string \| null\) => handleFieldChange\("epicId", val \|\| null\)\}/g,
      `<Combobox\n$1value={task?.epicId || null}\n$2onValueChange={(val: string | null) => handleFieldChange("epicId", val || null)}\n$2itemToStringLabel={(v) => v === "null" ? "No epic" : (projectEpics.find((e) => e.id === v)?.title || "Select epic")}`
    );

    code = code.replace(
      /<Combobox\n(\s+)value=\{task\?\.milestoneId \|\| null\}\n(\s+)onValueChange=\{\(val: string \| null\) => handleFieldChange\("milestoneId", val \|\| null\)\}/g,
      `<Combobox\n$1value={task?.milestoneId || null}\n$2onValueChange={(val: string | null) => handleFieldChange("milestoneId", val || null)}\n$2itemToStringLabel={(v) => v === "null" ? "No milestone" : (projectMilestones.find((m) => m.id === v)?.title || "Select milestone")}`
    );
    
    // Assignee comboboxValue fix
    code = code.replace(
      /const comboboxValue = selectedMember\n\s*\?\s*\{\n\s*value: selectedMember\.user\?\.id \|\| "",\n\s*label: selectedMember\.user\?\.name \|\| "",\n\s*\}\n\s*:\s*\{\s*value:\s*"unassigned",\s*label:\s*"Unassigned"\s*\}/g,
      `const comboboxValue = selectedMember ? (selectedMember.user?.id || "") : "unassigned"`
    );
    code = code.replace(
      /onValueChange=\{\(\n\s*val: \{ value: string; label: string \} \| null\n\s*\) =>/g,
      'onValueChange={(val: string | null) =>'
    );
    code = code.replace(
      /val\?\.value === "unassigned"\n\s*\?\s*null\n\s*:\s*val\?\.value \|\| null/g,
      'val === "unassigned" ? null : (val || null)'
    );
    
    code = code.replace(
      /<ComboboxItem\n(\s+)key=\{m\.user\?\.id\}\n(\s+)value=\{\{ value: m\.user\?\.id, label: m\.user\?\.name \}\}/g,
      '<ComboboxItem\n$1key={m.user?.id}\n$2value={m.user?.id || ""}'
    );
    code = code.replace(
      /<ComboboxItem\n(\s+)value=\{\{\n\s*value: "unassigned",\n\s*label: "Unassigned",\n\s*\}\}/g,
      '<ComboboxItem\n$1value={"unassigned"}'
    );
    
    // Add itemToStringLabel to assignee
    code = code.replace(
      /<Combobox\n(\s+)value=\{comboboxValue\}\n(\s+)onValueChange=/g,
      `<Combobox\n$1value={comboboxValue}\n$2itemToStringLabel={(v) => v === "unassigned" ? "Unassigned" : (projectMembers.find(m => m.user?.id === v)?.user?.name || "Search assignee")}\n$2onValueChange=`
    );
    
    // Dependencies
    code = code.replace(
      /value=\{\s*\{\s*value:\s*depDirection,\s*label:\s*depDirection === "blocked_by"\s*\?\s*"Is blocked by"\s*:\s*"Blocks",\s*\}\s*\}/g,
      `value={depDirection || null}\nitemToStringLabel={(v) => v === "blocked_by" ? "Is blocked by" : "Blocks"}`
    );
    
    // Target Project
    code = code.replace(
      /value=\{\s*\{\s*value:\s*targetProjectId,\s*label:\s*projects\.find\(\(p: Project\) => p\.id === targetProjectId\)\?\.name \|\| "",\s*\}\s*\}/g,
      `value={targetProjectId || null}\nitemToStringLabel={(v) => projects.find((p) => p.id === v)?.name || "Select Project"}`
    );
    
    // Target Task
    code = code.replace(
      /value=\{\s*\{\s*value:\s*targetTaskId,\s*label:\s*availableTasks\.find\(\(t: Task\) => t\.id === targetTaskId\)\?\.title \|\| "",\s*\}\s*\}/g,
      `value={targetTaskId || null}\nitemToStringLabel={(v) => availableTasks.find((t) => t.id === v)?.title || "Select Task"}`
    );
  }

  fs.writeFileSync(file, code);
}

fixFile(drawerFile, true);
fixFile(pageFile, false);
