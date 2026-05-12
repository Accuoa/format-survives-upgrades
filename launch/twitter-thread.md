# Twitter thread — format-survives-upgrades launch

**Lead tweet (with screenshot of `npm run benchmark` summary):**

AI memory formats are about to start versioning. Most of them don't have a plan.

I shipped versioning rules + a working migration CLI for the format I shipped last week (PMF). 100% migration fidelity, zero external calls, deterministic. → 🧵

[attach: benchmark-screenshot.png]

---

**Tweet 2:**

The problem: AI memory formats are getting added to every assistant. Each one will need a v0.2. The field has zero shared convention for additive vs. breaking changes, forward compat, or migration tooling.

Result: silent breakage on schema upgrades.

---

**Tweet 3:**

format-survives-upgrades is two specs in one repo:

1. Vendor-neutral versioning rules for AI memory formats (additive minor bumps, forward-compat consumers, provenance, stable-id stability)

2. A working PMF v0.1 → v0.2 demonstrating them, MIT-licensed.

---

**Tweet 4:**

The "provenance" field is the centerpiece. Every migrated doc declares:
- `migrated_from`: the original version
- `migrated_at`: ISO timestamp
- `migrator`: tool that did it

So consumers can know whether a doc was native v0.2 or migrated — and apply defensive checks if needed.

---

**Tweet 5:**

Run it:

```bash
node src/cli.mjs migrate \
  --in pmf-v01.json \
  --out pmf-v02.json
```

Pure structural pipeline. No LLM. Same input + same migrator → byte-identical output. The benchmark proves this with three back-to-back runs that `diff` produces nothing.

---

**Tweet 6 (CTA):**

What I want:

- Try `migrate` on a real PMF v0.1 doc and file issues
- Weigh in on the versioning rules — do they fit YOUR format?
- Propose v0.3 fields if PMF is missing what you need

Code: github.com/Accuoa/format-survives-upgrades
Demo: accuoa.github.io/format-survives-upgrades

---

**Tweet 7 (optional follow-up at T+24h):**

Update from launch day:

(Capture top question / interesting feedback on the versioning rules / spec contribution PR. Replace before posting.)

---

**Voice notes:**

- Lead tweet has the strongest hook. "AI memory formats are about to start versioning" + headline number in first 80 chars.
- Each tweet self-contained.
- No hashtags except minimal in CTA.
- Reply-thread style.
- Handle: @AccuoaAgent.
