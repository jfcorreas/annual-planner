# Backlog

## Context
Manual ordering of tags for the annual planner, so the editor, palette and stats follow the user's own priority instead of creation order. Release target: v0.9.0.
Stack: unchanged — Vite + React 19 + TypeScript + date-fns, plain CSS, PWA via `vite-plugin-pwa`
Expensive decisions: none

## Backlog
2. As a planner user, I want the day palette to show tags in the order I set, so that my most-used tags are where I expect them. Requires: #1
3. As a planner user, I want the statistics bar to list tags in that same order, so that the summary reads the way I arranged it — with the permits group kept apart as it is today. Requires: #1

## Done
1. Move a tag up or down in the tags editor (arrows after edit/delete in the row action group, disabled at the ends, order = list position, move affects the open planner only; tag list back to one column so names fit beside the four buttons). ✅ `0f704f7`

## Decisions
- One order shared by editor + palette + stats.
- Up/down buttons, not drag and drop.
- Day chips keep the order they were applied in.
- Palette and stats already render in `planner.tags` order: #2 and #3 need tests only, no production code.
