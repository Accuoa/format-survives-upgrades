# Calibration log

## Runs

### Run 1 (baseline)

- Date: 2026-05-12
- Hardware: Windows 11, native Node 20

```
FIDELITY: total: 30/30 (100.0%) — happy: 15/15, edge: 10/10, malformed: 5/5
NETWORK: external calls: 0
```

### Run 2 / Run 3 (stability)

Identical to Run 1 — `diff` on the captured logs confirms three byte-identical runs. The migration engine takes injected `now` and `migrator` in the benchmark so determinism is expected, and verified.

## Final headline numbers (used in launch artifacts)

- **Total migration fidelity: 100% (30/30 samples)**
- **External network calls: 0**

Breakdown:

- Happy-path: 15/15 (100%)
- Edge-case: 10/10 (100%)
- Malformed: 5/5 errored cleanly (100%)

## Acceptance band

**Strong** — 100% fidelity + 0 external network calls.

Headline copy: "100% migration fidelity on 30 samples, zero external calls."

## Methodology notes

- Pipeline: PMF v0.1 doc → engine (validate v0.1 → migrate → populate provenance → validate v0.2) → output
- 30 hand-built v0.1 samples: 15 happy / 10 edge / 5 malformed
- Each sample run independently; no LLM, no embeddings, no I/O beyond local files
- Audit log truncated at start; final external count = 0 across all runs
- Engine takes injected `now` and `migrator` in the benchmark so output is fully deterministic — three runs confirmed byte-identical via `diff`
- Reproduce with: `npm install && npm run benchmark`
