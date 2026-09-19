# DAVID LAB architecture

DAVID LAB is the executable workbench for the AI SLOP project. It is intentionally separate from `merrypranxter/ai_slop`.

## Authority split

- `ai_slop` = canonical research, operator definitions, epistemic labels, experimental method.
- `david_lab` = executable state, UI, run records, specimens, scars, lineage, and later model/media adapters.

The files under `data/` are vendored snapshots of the machine-readable layer from `ai_slop`. They are not a competing canon.

## v0.2 runtime objects

### Experiment
A structured record compatible with the canonical experiment schema plus DAVID LAB additions such as `boundary_sweep` and `lineage`.

### Operator
A canonical transition rule selected from `data/operators.json`.

### Boundary sweep
Five dose values around a center point. This is the first implementation of the Boundary Miner idea: search near regime changes instead of simply maximizing contradiction.

### Specimen
A preserved failure family entry in the Fault Zoo. It points back to the exact run that produced it.

### Scar comparison
A comparison of two recorded routes. v0.2 only reports candidate differences; it explicitly does not claim causality. A real scar requires controlled route tests and ablation.

### Lineage
Every bred child records two parents, generation number, and deterministic breeding seed.

## Local-first rule

v0.2 uses browser `localStorage`. Nothing is automatically sent to a model or cloud service. Export/import prevents the browser store from becoming a data trap.

## Intended growth path

1. result editing and stronger run controls
2. baseline/control/ablation bundles
3. artifact attachments
4. route graph visualization
5. scar tests with A→C vs A→B→C
6. behavioral archive / MAP-Elites style niches
7. model-specific media adapters
8. automated boundary search
9. optional local/open-model intervention adapters
10. cross-modal closed-loop experiments

The project rule remains: **creative utility and mechanism confidence are separate variables.**
