## Context
Two opt-in checkboxes in the "Nuevo planificador" form let a user start a new year from the previous year's data: either the whole palette, or the holiday chips placed on the same month-and-day. Both are conditional on a planner for the previous year existing.
Stack: Vite + React 19 + TypeScript + date-fns + plain CSS, PWA (`vite-plugin-pwa`), local storage v2, UI in Spanish.
Expensive decisions: none

## Backlog
1. As a user creating a new planner, I want to optionally copy the previous year's palette tags so that my custom tags are already in the new palette without re-creating them.
2. As a user creating a new planner, I want to optionally copy the previous year's holiday chips onto the same month and day so that the fixed holidays are already placed in the new year.
