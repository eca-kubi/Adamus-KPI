const fs = require('fs');

const file = 'c:\\Users\\nnyame\\Desktop\\Adamus KPI\\frontend\\js\\app.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add "Drill Rigs" to DEPARTMENTS Engineering array
content = content.replace(
    /"Graders",\s*"Dozers",\s*"Crusher",/,
    '"Graders",\n        "Dozers",\n        "Drill Rigs",\n        "Crusher",'
);

// 2. Add "Drill Rigs" to Engineering metrics check
content = content.replace(
    /metric === "Dozers"\) && STATE.currentDept === "Engineering"\) {/,
    'metric === "Dozers" || metric === "Drill Rigs") && STATE.currentDept === "Engineering") {'
);

// 3. Add else if for Drill Rigs
content = content.replace(
    /\} else if \(dept === "Engineering" && metricName === "Dozers"\) \{\s*renderEngineeringDozersForm\(dept, metricName, card\);\s*\}/,
    '} else if (dept === "Engineering" && metricName === "Dozers") {\n        renderEngineeringDozersForm(dept, metricName, card);\n    } else if (dept === "Engineering" && metricName === "Drill Rigs") {\n        renderEngineeringDrillRigsForm(dept, metricName, card);\n    }'
);

// 4. Duplicate renderEngineeringDozersForm to renderEngineeringDrillRigsForm
const dozerStart = content.indexOf('function renderEngineeringDozersForm(dept, metricName, card) {');
const nextFunc = content.indexOf('function renderEngineeringCrusherForm(dept, metricName, card) {');
if (dozerStart !== -1 && nextFunc !== -1) {
    const dozerFunc = content.slice(dozerStart, nextFunc);
    const drillRigsFunc = dozerFunc.replace(/renderEngineeringDozersForm/g, 'renderEngineeringDrillRigsForm').replace(/Dozers/g, 'Drill Rigs');
    content = content.replace(dozerFunc, dozerFunc + '\n' + drillRigsFunc);
} else {
    console.error("Could not find boundaries for renderEngineeringDozersForm");
}


// 5. Add "Drill Rigs" to table handling
content = content.replace(
    /STATE.currentMetric === 'Dozers' \|\| STATE.currentMetric === 'Graders'\) \{/g,
    "STATE.currentMetric === 'Dozers' || STATE.currentMetric === 'Graders' || STATE.currentMetric === 'Drill Rigs') {"
);

fs.writeFileSync(file, content);
console.log('Patch complete.');
