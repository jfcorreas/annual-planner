# Current plan — Story #7: Global toggle (tag usable in every planner)

Approved story for the next `/pair` session (backlog #7, v0.3.0 tags rework).

## Story
As a planner user, I want to mark a tag as global, so that I can reuse it in
every planner without recreating it each time.

## Acceptance criteria
- [ ] Given the tags editor, when I mark a tag as "Global", then the choice is
      saved with the tag, the tag shows the 🌐 badge in the editor list and in
      the tag detail modal (and only there), and from then on it appears in the
      palette and editor of every planner, existing and newly created.
- [ ] Given a global tag, when I edit its name, color or flags in any planner,
      then every planner shows the same change; when I create a new planner,
      then it starts with the default tags plus the current global tags.
- [ ] Given a global tag, when I try to unmark it as global while another
      planner uses it, then the action is blocked with a toast (if no other
      planner uses it, it becomes local to the current planner); when I try to
      delete it while any planner uses it, then the action is blocked with a
      toast showing the total usage ("N días en M planificadores"), and
      otherwise it is removed everywhere.

## Plan
- Tag model: an optional global flag (missing = local; old data and imports
  stay valid, no migration).
- Editor: a "Global" checkbox saved and loaded with the tag; the editor list
  and the tag detail modal render the 🌐 badge next to global tags; palette,
  chips and statistics stay unchanged.
- Tag operations become cross-planner for global tags: creating or editing one
  writes it into every planner, creating a planner includes the current
  globals, and unmarking keeps it local to the current planner.
- Usage is counted across all planners for the two guards: unmarking is
  blocked when another planner uses the tag, deleting is blocked when any
  planner uses it (toast with days and planners).
- Everything else (palette, chips, statistics, day applications, export
  format) stays as is: a global tag is a normal tag that exists in every
  planner.

## Out of scope
- Per-planner overrides of a global tag (name, color and flags are shared).
- Reconciling global tags on import beyond the copies each planner carries.
- A "used in planners X, Y" list in the UI.
- Refusal of previous-version data (#9).
- Changing the local-tag delete rule (#2, unchanged).

## Suggestions (your call)
- Usage is computed today only for the active planner, and the two guards need
  cross-planner totals: a small shared "usage across planners" helper avoids
  duplicating that loop in two places.
- The badge helper is shared by palette, chips, stats, editor and detail modal;
  since 🌐 is only wanted in two of them, it should take an option instead of
  adding the icon unconditionally.

## Decisions taken during refinement
1. Badge/label: 🌐 + "Global".
2. The 🌐 badge shows in the tags editor list and the tag detail modal only —
   not in the palette, chips or statistics.
3. Editor list: one mixed list (global and local tags together) with the badge.
4. Unmarking a global tag while another planner uses it is blocked with a
   toast; when no other planner uses it, it becomes local to the current one.
5. Deleting a global tag is blocked while any planner uses it, with a toast
   showing the total usage ("N días en M planificadores"); otherwise it is
   removed from every planner.
6. Storage: global tags are copies sharing the same id inside each planner,
   kept in sync by the tag operations. No app-level tag list; export format
   unchanged.
7. New planners start with the default tags plus the current global tags, and
   editing a global tag propagates name/color/flags to every planner.

## Existing tests to review in the pair session (not touched yet)
- `src/hooks/useAppData.test.tsx` — tag CRUD per planner; the global sync
  changes `addTag`/`updateTag`/`removeTag` and `addPlanner` behavior.
- `src/App.test.tsx` — editor form tests (`formCheckbox` helper, tag list),
  planner creation and the delete-blocked toast tests.
- `src/defaults.test.ts` — `createPlanner` may need the current globals; verify
  the default-tag tests still hold.
- `src/components/TagDetailModal.test.tsx` — title rendering; add the 🌐 badge
  case there.
- `src/storage.test.ts` — `isTag` ignores extra fields; verify `global` loads
  and exports unchanged (no migration expected).
