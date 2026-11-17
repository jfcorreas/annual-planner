# Backlog

## Context
Manual ordering of tags for the annual planner, so the editor, palette and stats follow the user's own priority instead of creation order. Release target: v0.9.0.
Stack: unchanged — Vite + React 19 + TypeScript + date-fns, plain CSS, PWA via `vite-plugin-pwa`
Expensive decisions: none

## Backlog
3. As a planner user, I want the statistics bar to list tags in that same order, so that the summary reads the way I arranged it — with the permits group kept apart as it is today. Requires: #1

## Done
1. Move a tag up or down in the tags editor (arrows after edit/delete in the row action group, disabled at the ends, order = list position, move affects the open planner only; tag list back to one column so names fit beside the four buttons). ✅ `0f704f7`
2. Day palette shows tags in the editor's order, per planner and across reloads, ✏️ Etiquetas last — checks only, no product change (3 component + 1 e2e test). ✅ `31e59d3`

## Decisions
- One order shared by editor + palette + stats.
- Up/down buttons, not drag and drop.
- Day chips keep the order they were applied in.
- Palette and stats already render in `planner.tags` order: #3 needs tests only, no production code.
