# MCP Discord post draft — format-survives-upgrades

## Target channel

`#<TBD-after-research>` — fill in from pre-launch channel research (likely `#showcase`, `#projects`, or a tools-focused channel — Discord servers reorganize, verify before posting).

## Opening post

(Substantive + inviting back-and-forth. NOT a one-shot announcement. Copy from "Spent the last week..." through "...Happy to dig into any of this in thread." as the body to paste into Discord.)

Spent the last week thinking about AI memory format versioning after shipping PMF v0.1 in my `context-portability` repo and immediately wanting to add a field. Realized the field has no shared convention for additive-vs-breaking, forward-compat, or migration tooling, so I wrote one down.

`format-survives-upgrades` is two specs in one repo:

1. Vendor-neutral rules for how AI memory formats should version (additive minor bumps, forward-compat consumers ignore unknown fields, provenance on migrated docs, stable-id stability under additive change)

2. A working PMF v0.1 → v0.2 migration CLI demonstrating the rules end-to-end

The "provenance" pattern was inspired in part by how MCP handles capability negotiation — every migrated doc declares `migrated_from`, `migrated_at`, `migrator` so consumers can know whether a doc was natively produced or migrated, and apply defensive checks accordingly.

100% migration fidelity on a 30-sample benchmark, zero external network calls (audit-log verified), three byte-identical runs (determinism via injected `now`).

Repo: github.com/Accuoa/format-survives-upgrades
Demo: accuoa.github.io/format-survives-upgrades

Specific questions I'm curious about — would love takes from anyone with relevant experience:
- The rules in SPEC.md Part 1 — do they fit non-PMF formats you've worked with?
- Provenance: should it be at document level (current choice) or per-memory-entry?
- Multi-hop migrations: my engine resolves a path through the registry. Anyone done this differently?

Happy to dig into any of this in thread.

## Posting cadence

- **T+0min:** Post the opening message in the target channel.
- **T+15min:** If no responses, drop into another adjacent channel (e.g., `#general`) with a one-line reference: "if anyone has format-versioning takes I posted in `#showcase` — would love a sanity check".
- **T+30min–T+2h:** Reply to every response. Tone: factual, generous, willing to be wrong. If someone points out a flaw in the rules, acknowledge it inline.
- **T+2h–T+6h:** Periodic check-in for stragglers.

## What to NOT do

- Don't post the same message in multiple channels at once (Discord considers this spam).
- Don't link to a sales page or pricing — there isn't one, but make sure links go to the spec/repo.
- Don't argue. If someone disagrees with a rule, ask why, log the feedback in an issue, move on.
- Don't @-mention regulars unprompted.
- Don't post immediately before a holiday/weekend.

## When to submit

US morning ET / UTC 13:00–15:00. Discord activity peaks late EU / early US. Avoid weekends.

## After-action

T+24h: capture any substantive feedback in a GitHub issue. Update the Twitter thread Tweet 7 if anything notable came up.
