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
