# DAVID LAB

Executable workbench for the AI SLOP project.

DAVID LAB turns the operator library and experimental method from `merrypranxter/ai_slop` into a browser instrument for designing pressure tests, running dose sweeps manually, recording results, preserving scars, comparing routes, and breeding experiment lineages.

This repo is the **software body**. The canonical research brain remains in `merrypranxter/ai_slop`.

## Status

Early working build. Local-first, zero API calls, zero model costs.

Open `index.html` through a local static server, or deploy the repo to Netlify.

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Current capabilities

- browse canonical AI SLOP operators
- define anchor, attacked assumption, and competing pressures
- generate boundary/dose sweeps
- record results and scores
- save experiment runs in browser localStorage
- compare two runs for route/scar differences
- archive interesting failure specimens
- breed two experiment records into a deterministic child recipe
- import/export all local lab data as JSON

No model is called automatically yet. That is deliberate: the first version makes the experimental state and lineage real before adding paid or model-specific adapters.


## Behavioral Observation Recorder — Chipu Proposal 001

Open **OBSERVE ↗** in DAVID LAB, or navigate directly to [recorder.html](./recorder.html). This is a standalone, local-first observation notebook proposed during the Chipu Commons AI SLOP exchange.

The recorder stores one entry for each study/seed/condition under a common protocol:

- **A** — operator A alone
- **B** — operator B alone
- **A+B** — simple combined operators without claiming emergent behavior
- **CHILD** — bred experiment recipe
- **ABLATION** — child with one suspected causal rule removed

For each trial it captures the exact task, model/settings, seed, optional linked DAVID LAB run ID, output reference or text excerpt, observer identity/type, observed structural change/pattern, constraints held/broken, and uncertainty. Every record is explicitly **PLANNED** or **OBSERVED**; the latter requires an artifact reference/text plus a descriptive observation.

The matrix counts only observed trials toward a matched A/B/A+B/CHILD set; study, seed, task **and settings must match**. An ablation is optional and separately counted. The compact CHIPU RECEIPT button generates a <=480-character text summary suitable for a chat that cannot open files or links. The receipt is descriptive evidence bookkeeping, not a novelty score or a claim of causal discovery.

Observations live under a separate localStorage key (\`david_lab_behavioral_observations_v1\`) so existing lab runs and breeding are untouched. Export and import JSON from the recorder page to preserve/share evidence. No model inference, automated artifact analysis, or fitness selection is performed by this version.

### Manual smoke test

1. Create a new study and save an A trial as PLANNED. Confirm it does **not** count as observed or matched.
2. Enter an OBSERVED A trial with no artifact/reference and verify that the form rejects it.
3. Save OBSERVED A, B, A+B and CHILD using identical study, task, settings and seed, with actual output references and descriptive notes. Confirm the matrix reports one complete matched set.
4. Change the settings for CHILD and save another observation. Confirm it appears as a separate (unmatched) row.
5. Save an OBSERVED ABLATION with a real reference. Confirm the ablation count increases, without changing the definition of a complete set.
6. Export JSON and import it into the same recorder. Confirm records deduplicate by ID.
7. Copy the receipt and verify it accurately distinguishes recorded/planned/observed trials and stays within 480 characters.

**Not yet included:** systematic inheritance traces; configurable 25% extra-operator inheritance sweep; artifact analyzer; automatic discovery of novelty/fitness. Those are follow-on experiments, not claims about this build.
