const $ = (id) => document.getElementById(id);
const STORE = {
  runs: "david_lab_runs_v2",
  specimens: "david_lab_specimens_v2"
};

let registry = { schema_version: "unknown", operators: [] };
let selectedOps = new Set();
let runs = load(STORE.runs, []);
let specimens = load(STORE.specimens, []);
let childDraft = null;

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function persist() {
  localStorage.setItem(STORE.runs, JSON.stringify(runs));
  localStorage.setItem(STORE.specimens, JSON.stringify(specimens));
  refreshAll();
}
function esc(s="") {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function uid(prefix="run") {
  if (crypto.randomUUID) return prefix + "-" + crypto.randomUUID().slice(0,8);
  return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,7);
}
function now() { return new Date().toISOString(); }
function text(id) { return $(id).value.trim(); }
function num(id) {
  const v = $(id).value;
  return v === "" ? null : Number(v);
}
function clamp(n, a=0, b=1){ return Math.max(a, Math.min(b, n)); }

async function boot() {
  try {
    const r = await fetch("./data/operators.json");
    registry = await r.json();
    renderOperators();
    $("registryMeta").textContent =
      "operator schema: " + registry.schema_version +
      "\noperators: " + registry.operators.length +
      "\nsource: merrypranxter/ai_slop / machine/operators.json";
  } catch (err) {
    $("operators").innerHTML = '<div class="empty">Could not load operator registry. Serve this directory over HTTP rather than file://.</div>';
  }
  bindUI();
  refreshAll();
  makeSweep();
}

function bindUI() {
  document.querySelectorAll("[data-nav]").forEach(btn => {
    btn.addEventListener("click", () => navigate(btn.dataset.nav));
  });
  $("operatorSearch").addEventListener("input", renderOperators);
  $("dose").addEventListener("input", () => {
    $("doseOut").value = Number($("dose").value).toFixed(2);
    makeSweep();
  });
  $("width").addEventListener("input", () => {
    $("widthOut").value = Number($("width").value).toFixed(2);
    makeSweep();
  });
  $("sweepBtn").addEventListener("click", makeSweep);
  $("packetBtn").addEventListener("click", compilePacket);
  $("copyPacket").addEventListener("click", copyPacket);
  $("saveRun").addEventListener("click", saveRun);
  $("clearBuild").addEventListener("click", clearBuild);
  $("quickExport").addEventListener("click", exportLab);
  $("exportBtn").addEventListener("click", exportLab);
  $("importFile").addEventListener("change", importLab);
  $("nukeBtn").addEventListener("click", nukeLab);
  $("addSpecimen").addEventListener("click", addSpecimen);
  $("compareBtn").addEventListener("click", compareRoutes);
  $("breedBtn").addEventListener("click", breed);
  $("saveChild").addEventListener("click", saveChild);
}

function navigate(name) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll("#nav [data-nav]").forEach(b => b.classList.toggle("active", b.dataset.nav === name));
  $("view-" + name).classList.add("active");
  window.scrollTo({top: 0, behavior: "smooth"});
  refreshAll();
}

function renderOperators() {
  const q = ($("operatorSearch")?.value || "").toLowerCase();
  const rows = registry.operators.filter(o =>
    !q || [o.id,o.name,o.class,o.summary,o.status].join(" ").toLowerCase().includes(q)
  );
  $("operators").innerHTML = rows.map(o => `
    <div class="op ${selectedOps.has(o.id) ? "selected" : ""}" data-op="${esc(o.id)}">
      <div class="op-name">${esc(o.name)}</div>
      <div class="op-meta">${esc(o.class)} · ${esc(o.status)}${o.temporary_mind ? " · MIND #"+o.temporary_mind : ""}</div>
      <div class="op-summary">${esc(o.summary)}</div>
    </div>
  `).join("") || '<div class="empty">No operator matches that query.</div>';

  document.querySelectorAll("[data-op]").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.dataset.op;
      selectedOps.has(id) ? selectedOps.delete(id) : selectedOps.add(id);
      renderOperators();
      renderSelected();
    });
  });
  renderSelected();
}
function renderSelected() {
  const names = [...selectedOps].map(id => registry.operators.find(o => o.id===id)?.name || id);
  $("selectedOps").textContent = names.length ? names.join(" + ") : "none";
}

function sweepValues() {
  const center = Number($("dose").value);
  const width = Number($("width").value);
  return [-1,-.5,0,.5,1].map(m => Number(clamp(center + m*width).toFixed(2)));
}
function makeSweep() {
  if (!$("sweep")) return;
  $("doseOut").value = Number($("dose").value).toFixed(2);
  $("widthOut").value = Number($("width").value).toFixed(2);
  $("sweep").innerHTML = sweepValues().map((v,i) => `
    <div class="dose-box ${i===2 ? "center" : ""}">
      <span>${i===2 ? "CENTER" : "DOSE "+(i+1)}</span>
      <b>${v.toFixed(2)}</b>
    </div>
  `).join("");
}

function buildRecord(overrides={}) {
  const observed = text("observed") || "UNRUN";
  return {
    run_id: uid("run"),
    date: now(),
    researcher: "merry",
    media: $("media").value,
    model_or_tool: text("model") || "UNSPECIFIED",
    model_version: null,
    operator_ids: [...selectedOps],
    epistemic_status_before: $("status").value,
    input_or_seed_material: null,
    seed_or_randomness: null,
    reference_assets: [],
    assumption_attacked: text("assumption"),
    mechanism_claim: null,
    competing_conditions: [text("condA"), text("condB")].filter(Boolean),
    invariant_or_anchor: text("anchor") || null,
    procedure: text("procedure"),
    baseline: null,
    control: null,
    ablation: null,
    independent_variable: text("independent") || "dose_or_strength",
    dose_or_strength: Number($("dose").value),
    boundary_sweep: sweepValues(),
    iteration_or_cycle: 1,
    operation_order: [...selectedOps],
    expected_artifact_family: text("expected") || null,
    condition_dropout_risk: text("dropout") || null,
    known_confounds: [],
    observed_result: observed,
    artifact_coordinates_or_timestamps: null,
    persistence_after_cause_removed: null,
    route_or_history_effect: text("routeEffect") || null,
    creative_utility: num("creative"),
    mechanism_confidence: num("confidence"),
    next_test: text("nextTest") || null,
    notes: "Created in DAVID LAB 0.2",
    lineage: { parents: [], generation: 0, breeding_seed: null },
    ...overrides
  };
}

function compilePacket() {
  const r = buildRecord({run_id:"DRAFT"});
  const opLines = r.operator_ids.map(id => {
    const o = registry.operators.find(x=>x.id===id);
    return o ? "- "+o.name+": "+o.summary : "- "+id;
  }).join("\n") || "- none selected";
  const packet = [
    "[DAVID_LAB_EXPERIMENT]",
    "MEDIUM: "+r.media,
    "MODEL/TOOL: "+r.model_or_tool,
    "ANCHOR / INVARIANT: "+(r.invariant_or_anchor || "none"),
    "ASSUMPTION ATTACKED: "+(r.assumption_attacked || "unspecified"),
    "ACTIVE OPERATORS:",
    opLines,
    "COMPETING PRESSURES:",
    ...(r.competing_conditions.length ? r.competing_conditions.map((x,i)=>(i+1)+". "+x) : ["none specified"]),
    "DOSE: "+Number(r.dose_or_strength).toFixed(2),
    "BOUNDARY SWEEP: "+r.boundary_sweep.join(", "),
    "PROCEDURE: "+(r.procedure || "unspecified"),
    "EXPECTED FAILURE FAMILY: "+(r.expected_artifact_family || "open"),
    "CONDITION-DROPOUT RISK: "+(r.condition_dropout_risk || "unknown"),
    "",
    "EXECUTION CONTRACT:",
    "Keep the anchor active while applying the selected operational rules.",
    "Do not add decorative weirdness merely to satisfy the theme.",
    "If competing conditions cannot both be satisfied cleanly, preserve the compromise rather than silently dropping one.",
    "Return the requested artifact normally. Do not explain this controller unless asked.",
    "[END_DAVID_LAB_EXPERIMENT]"
  ].join("\n");
  $("packet").textContent = packet;
}
async function copyPacket() {
  if ($("packet").textContent.startsWith("Build a packet")) compilePacket();
  await navigator.clipboard.writeText($("packet").textContent);
  const b = $("copyPacket");
  const old = b.textContent; b.textContent = "COPIED"; setTimeout(()=>b.textContent=old,800);
}

function saveRun() {
  const r = buildRecord();
  if (!r.assumption_attacked && !r.procedure && !r.operator_ids.length) {
    alert("Give the experiment at least an assumption, procedure, or operator before saving the little bastard.");
    return;
  }
  runs.unshift(r);
  persist();
  clearBuild();
  navigate("runs");
}

function clearBuild() {
  ["model","anchor","assumption","condA","condB","procedure","expected","dropout","observed","creative","confidence","routeEffect","nextTest"].forEach(id => $(id).value = "");
  $("independent").value = "dose_or_strength";
  $("dose").value = ".50"; $("width").value = ".20";
  selectedOps = new Set();
  $("packet").textContent = "Build a packet to see the execution contract.";
  renderOperators(); makeSweep();
}

function refreshAll() {
  $("runCount").textContent = runs.length;
  $("zooCount").textContent = specimens.length;
  renderRuns();
  populateRunSelects();
  renderZoo();
}

function runLabel(r) {
  const ops = (r.operator_ids || []).slice(0,2).join("+") || "no-op";
  return `${r.run_id} · ${r.media} · ${ops}`;
}
function renderRuns() {
  if (!runs.length) {
    $("runs").innerHTML = '<div class="empty">No runs yet. Build one, save it, then come back with wreckage.</div>';
    return;
  }
  $("runs").innerHTML = "";
  runs.forEach(r => {
    const node = $("runTemplate").content.cloneNode(true);
    node.querySelector(".run-id").textContent = r.run_id;
    node.querySelector(".run-media").textContent = r.media+" · "+r.model_or_tool;
    const cu = r.creative_utility ?? "—", mc = r.mechanism_confidence ?? "—";
    node.querySelector(".run-score").textContent = "ART "+cu+" / CONF "+mc;
    node.querySelector(".run-title").textContent = r.assumption_attacked || "Untitled pressure test";
    const chips = [
      ...(r.operator_ids||[]).map(x=>({t:x,c:"opchip"})),
      {t:"dose "+r.dose_or_strength,c:""},
      ...(r.lineage?.generation ? [{t:"gen "+r.lineage.generation,c:""}] : [])
    ];
    node.querySelector(".chips").innerHTML = chips.map(x=>'<span class="chip '+x.c+'">'+esc(x.t)+'</span>').join("");
    node.querySelector(".run-result").textContent = r.observed_result || "UNRUN";
    node.querySelector(".run-json").textContent = JSON.stringify(r,null,2);
    node.querySelector(".duplicate-run").onclick = () => duplicateRun(r.run_id);
    node.querySelector(".delete-run").onclick = () => deleteRun(r.run_id);
    $("runs").appendChild(node);
  });
}
function duplicateRun(id) {
  const src = runs.find(r=>r.run_id===id);
  if (!src) return;
  const copy = structuredClone(src);
  copy.run_id = uid("run");
  copy.date = now();
  copy.observed_result = "UNRUN";
  copy.creative_utility = null;
  copy.mechanism_confidence = null;
  copy.notes = (copy.notes || "") + " | duplicated";
  runs.unshift(copy); persist();
}
function deleteRun(id) {
  if (!confirm("Delete this local run record?")) return;
  runs = runs.filter(r=>r.run_id!==id);
  specimens = specimens.filter(s=>s.run_id!==id);
  persist();
}

function populateRunSelects() {
  const ids = ["zooRun","scarA","scarB","parentA","parentB"];
  ids.forEach(id => {
    const el = $(id); if (!el) return;
    const previous = el.value;
    el.innerHTML = '<option value="">— choose —</option>' + runs.map(r=>`<option value="${esc(r.run_id)}">${esc(runLabel(r))}</option>`).join("");
    if (runs.some(r=>r.run_id===previous)) el.value = previous;
  });
}

function addSpecimen() {
  const run = runs.find(r=>r.run_id===$("zooRun").value);
  const family = text("zooFamily");
  if (!run || !family) {
    alert("Pick a run and name the failure family.");
    return;
  }
  specimens.unshift({
    specimen_id: uid("specimen"),
    run_id: run.run_id,
    family,
    note: text("zooNote"),
    created_at: now(),
    operator_ids: run.operator_ids || [],
    dose: run.dose_or_strength,
    media: run.media
  });
  $("zooFamily").value=""; $("zooNote").value="";
  persist();
}
function renderZoo() {
  if (!specimens.length) {
    $("zoo").innerHTML = '<div class="empty">The cages are empty. Promote an interesting failure from a run.</div>';
    return;
  }
  $("zoo").innerHTML = specimens.map(s => `
    <article class="specimen">
      <div class="family">${esc(s.family)} · ${esc(s.media)} · dose ${esc(s.dose)}</div>
      <h3>${esc(s.specimen_id)}</h3>
      <p>${esc(s.note || "No note.")}</p>
      <div class="chips">${(s.operator_ids||[]).map(x=>'<span class="chip opchip">'+esc(x)+'</span>').join("")}</div>
      <small>source: ${esc(s.run_id)}</small>
    </article>
  `).join("");
}

function compareRoutes() {
  const a = runs.find(r=>r.run_id===$("scarA").value);
  const b = runs.find(r=>r.run_id===$("scarB").value);
  if (!a || !b) { $("scarResult").innerHTML = '<div class="empty">Choose two routes.</div>'; return; }
  const fields = [
    ["Operators","operator_ids"],["Dose","dose_or_strength"],["Anchor","invariant_or_anchor"],
    ["Assumption","assumption_attacked"],["Pressures","competing_conditions"],["Observed result","observed_result"],
    ["Route effect","route_or_history_effect"],["Creative utility","creative_utility"],["Mechanism confidence","mechanism_confidence"]
  ];
  const col = r => fields.map(([label,key]) => `<div class="diff-row"><b>${label}</b>${esc(Array.isArray(r[key]) ? r[key].join(" | ") : (r[key] ?? "—"))}</div>`).join("");
  const opA = new Set(a.operator_ids||[]), opB = new Set(b.operator_ids||[]);
  const gained = [...opB].filter(x=>!opA.has(x)), lost=[...opA].filter(x=>!opB.has(x));
  const doseDelta = Number((Number(b.dose_or_strength||0)-Number(a.dose_or_strength||0)).toFixed(3));
  const scarText = [
    gained.length ? "operators gained: "+gained.join(", ") : "",
    lost.length ? "operators lost: "+lost.join(", ") : "",
    doseDelta ? "dose delta: "+(doseDelta>0?"+":"")+doseDelta : "",
    a.observed_result !== b.observed_result ? "recorded outcomes differ" : "recorded outcomes match",
    b.route_or_history_effect ? "B records a route/history effect" : ""
  ].filter(Boolean).join(" · ");
  $("scarResult").innerHTML = `
    <div class="diff-grid">
      <div class="diff-col"><h3>ROUTE A</h3>${col(a)}</div>
      <div class="diff-col"><h3>ROUTE B</h3>${col(b)}</div>
    </div>
    <div class="delta"><b>SCAR CANDIDATES</b><p>${esc(scarText || "No recorded difference in the compared fields.")}</p>
    <small>This is a record diff, not proof of causality. A scar graduates only when the route difference survives controls/ablation.</small></div>`;
}

function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h,16777619); }
  return h >>> 0;
}
function rngFrom(seed) {
  let x = hashSeed(seed) || 123456789;
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}
function pick(rand,a,b){ return rand()<.5 ? a : b; }

function breed() {
  const a = runs.find(r=>r.run_id===$("parentA").value);
  const b = runs.find(r=>r.run_id===$("parentB").value);
  if (!a || !b || a.run_id===b.run_id) {
    $("childPreview").textContent = "Choose two different parents.";
    return;
  }
  const seed = text("breedSeed") || "controlled-freak-001";
  const rand = rngFrom(seed+"|"+a.run_id+"|"+b.run_id);
  const aOps=[...(a.operator_ids||[])], bOps=[...(b.operator_ids||[])];
  const childOps = [];
  if (aOps.length) childOps.push(aOps[Math.floor(rand()*aOps.length)]);
  if (bOps.length) {
    const x=bOps[Math.floor(rand()*bOps.length)];
    if (!childOps.includes(x)) childOps.push(x);
  }
  [...new Set([...aOps,...bOps])].forEach(x => { if (!childOps.includes(x) && rand()<.25) childOps.push(x); });
  const avgDose=(Number(a.dose_or_strength||0)+Number(b.dose_or_strength||0))/2;
  const jitter=(rand()-.5)*.16;
  childDraft = {
    ...structuredClone(pick(rand,a,b)),
    run_id: uid("bred"),
    date: now(),
    media: pick(rand,a.media,b.media),
    model_or_tool: pick(rand,a.model_or_tool,b.model_or_tool),
    operator_ids: childOps,
    operation_order: childOps,
    assumption_attacked: pick(rand,a.assumption_attacked,b.assumption_attacked),
    competing_conditions: [
      ...(rand()<.5 ? (a.competing_conditions||[]).slice(0,1) : (b.competing_conditions||[]).slice(0,1)),
      ...(rand()<.5 ? (b.competing_conditions||[]).slice(-1) : (a.competing_conditions||[]).slice(-1))
    ].filter(Boolean),
    invariant_or_anchor: pick(rand,a.invariant_or_anchor,b.invariant_or_anchor),
    procedure: pick(rand,a.procedure,b.procedure),
    dose_or_strength: Number(clamp(avgDose+jitter).toFixed(2)),
    expected_artifact_family: pick(rand,a.expected_artifact_family,b.expected_artifact_family),
    condition_dropout_risk: pick(rand,a.condition_dropout_risk,b.condition_dropout_risk),
    epistemic_status_before: "HYPOTHESIS",
    observed_result: "UNRUN",
    route_or_history_effect: null,
    creative_utility: null,
    mechanism_confidence: null,
    next_test: "Run child against both parents under comparable settings.",
    notes: "Deterministically bred in DAVID LAB 0.2",
    lineage: {
      parents:[a.run_id,b.run_id],
      generation: Math.max(a.lineage?.generation||0,b.lineage?.generation||0)+1,
      breeding_seed: seed
    }
  };
  childDraft.boundary_sweep = [-.2,-.1,0,.1,.2].map(d=>Number(clamp(childDraft.dose_or_strength+d).toFixed(2)));
  $("childPreview").textContent = JSON.stringify(childDraft,null,2);
  $("saveChild").disabled = false;
}
function saveChild() {
  if (!childDraft) return;
  runs.unshift(childDraft);
  childDraft=null;
  $("childPreview").textContent="Child saved. Breed again or inspect the ledger.";
  $("saveChild").disabled=true;
  persist();
  navigate("runs");
}

function exportLab() {
  const payload = {
    david_lab_version:"0.2",
    exported_at:now(),
    operator_registry_version:registry.schema_version,
    runs,
    specimens
  };
  const blob = new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download="david-lab-"+new Date().toISOString().slice(0,10)+".json";
  a.click(); URL.revokeObjectURL(url);
}
async function importLab(ev) {
  const file=ev.target.files?.[0]; if(!file) return;
  try{
    const data=JSON.parse(await file.text());
    const incomingRuns=Array.isArray(data.runs)?data.runs:[];
    const incomingSpecimens=Array.isArray(data.specimens)?data.specimens:[];
    const byId=new Map(runs.map(r=>[r.run_id,r]));
    incomingRuns.forEach(r=>byId.set(r.run_id,r));
    runs=[...byId.values()];
    const sById=new Map(specimens.map(s=>[s.specimen_id,s]));
    incomingSpecimens.forEach(s=>sById.set(s.specimen_id,s));
    specimens=[...sById.values()];
    persist();
    alert("Imported "+incomingRuns.length+" runs and "+incomingSpecimens.length+" specimens.");
  }catch(e){ alert("That JSON did not smell like a DAVID LAB export."); }
  ev.target.value="";
}
function nukeLab() {
  if (!confirm("Clear ALL DAVID LAB runs and specimens from this browser?")) return;
  runs=[]; specimens=[]; localStorage.removeItem(STORE.runs); localStorage.removeItem(STORE.specimens); refreshAll();
}

boot();
