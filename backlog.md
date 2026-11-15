# Backlog

## Context
Manual ordering of tags for the annual planner, so the editor, palette and stats follow the user's own priority instead of creation order. Release target: v0.9.0.
Stack: unchanged — Vite + React 19 + TypeScript + date-fns, plain CSS, PWA via `vite-plugin-pwa`
Expensive decisions: none

## Backlog
1. As a planner user, I want to move a tag up or down in the tags editor, so that the list reflects my own priority instead of creation order.
2. As a planner user, I want the day palette to show tags in the order I set, so that my most-used tags are where I expect them. Requires: #1
3. As a planner user, I want the statistics bar to list tags in that same order, so that the summary reads the way I arranged it — with the permits group kept apart as it is today. Requires: #1

## Decisions
- One order shared by editor + palette + stats.
- Up/down buttons, not drag and drop.
- Day chips keep the order they were applied in.
