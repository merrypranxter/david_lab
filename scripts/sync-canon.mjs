import fs from "node:fs";

const root = "https://raw.githubusercontent.com/merrypranxter/ai_slop/main/machine";
const targets = [
  ["operators.json", "data/operators.json"],
  ["experiment.schema.json", "data/experiment.schema.json"]
];

for (const [remote, local] of targets) {
  const r = await fetch(root + "/" + remote);
  if (!r.ok) throw new Error(`Failed to fetch ${remote}: ${r.status}`);
  const text = await r.text();
  JSON.parse(text);
  fs.mkdirSync("data", {recursive:true});
  fs.writeFileSync(local, text);
  console.log("synced", remote, "->", local);
}
console.log("Canonical machine data refreshed from merrypranxter/ai_slop.");
