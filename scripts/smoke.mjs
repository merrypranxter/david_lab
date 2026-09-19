import fs from "node:fs";

const required = [
  "index.html",
  "styles.css",
  "app.js",
  "data/operators.json",
  "data/experiment.schema.json"
];

for (const path of required) {
  if (!fs.existsSync(path)) throw new Error("Missing " + path);
}

const ops = JSON.parse(fs.readFileSync("data/operators.json", "utf8"));
const schema = JSON.parse(fs.readFileSync("data/experiment.schema.json", "utf8"));
const html = fs.readFileSync("index.html", "utf8");
const js = fs.readFileSync("app.js", "utf8");

if (!Array.isArray(ops.operators) || ops.operators.length < 20) {
  throw new Error("Operator registry looks incomplete");
}
const ids = new Set();
for (const op of ops.operators) {
  if (!op.id || ids.has(op.id)) throw new Error("Invalid or duplicate operator id");
  ids.add(op.id);
}
for (const req of schema.required || []) {
  if (!js.includes(req)) throw new Error("App does not appear to emit schema field: " + req);
}
for (const id of ["view-build","view-runs","view-zoo","view-scars","view-breed","view-data"]) {
  if (!html.includes(`id="${id}"`)) throw new Error("Missing UI view: " + id);
}

console.log(`DAVID LAB smoke test passed: ${ops.operators.length} operators, schema + UI present.`);
