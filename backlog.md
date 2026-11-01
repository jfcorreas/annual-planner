# Backlog — Tags rework (v0.3.0)

Tags re-implemented from scratch. Detailed criteria per story live in the
user's tracker; the story currently being built has its approved block in
`current-plan.md`. This file is the overview of the 9 stories.

**Agreed model:** Tag = name (always shown) + color, plus the per-story flags
below. The subtitle stays per *day application* (DayTag), not on the tag (the
original spec that put it on Tag was a mistake). Clean break with v0.2.0: no
migration (active refusal = story #9). Legacy data with stray fields loads and
the fields are ignored until #9.

| #  | Story                                                             | Status             |
|----|-------------------------------------------------------------------|--------------------|
| 1  | Flat tags: name + color only, no types (editor, detail, stats)    | ✅ Done (committed)|
| 2  | Delete blocked with usage-count toast when the tag is in use      | ✅ Done (committed)|
| 3  | Statistics flag: per-tag checkbox; bars list only included tags, "Sin etiqueta" row removed | ✅ Done (committed)|
| 4  | Holiday flag (forces statistics = false, shows icon)              | ⬜ Pending         |
| 5  | Work-license flag + max per year (icon, always in stats, apart)   | ⬜ Pending         |
| 6  | Used/remaining counter for the work license (can go negative)     | ⬜ Pending         |
| 7  | Global toggle: tag usable in every planner                        | ⬜ Pending         |
| 8  | _(to confirm — details live in the tracker)_                      | ⬜ Pending         |
| 9  | Refuse data and exports from the previous version                 | ⬜ Pending         |

**Delete rule (all stories):** deleting any tag in use is blocked with a toast
showing the usage count (global tag: used in *any* planner) — implemented in
story #2.

**Story #3 status detail:** shipped — `inStats?: boolean` on the tag model
(missing = included, no migration), editor checkbox ("Incluir en
estadísticas"), statistics filtered to included tags, "Sin etiqueta" row and
its dead styles removed.

**Out of scope of the rework (unchanged):** day-chip interactions (1 click =
detail modal, double click / 600 ms hold = remove from day), 2 tags max per
day, per-day subtitles.
