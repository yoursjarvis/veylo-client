const fs = require('fs');
const code = fs.readFileSync('/home/codeclouds-tanmoy/Personal/Veylo/veylo-client/features/tasks/components/task-details-drawer.tsx', 'utf8').split('\n');

const linesToView = [783, 796, 830, 845, 883, 1252, 1253, 1254, 1436, 1562, 1606];

for (const lineNum of linesToView) {
    console.log(`Line ${lineNum}: ${code[lineNum - 1]}`);
    console.log(`Line ${lineNum + 1}: ${code[lineNum]}`);
    console.log('---');
}
