## Story
As a planner user, I want to move a tag up or down in the tags editor, so that the list reflects my own priority instead of creation order.

## Acceptance criteria
- [ ] Given the tags editor is open with at least two tags, when I press ⬆️ on a tag, then it swaps position with the tag above it and the list shows the new order at once.
- [ ] Given a tag is the first or the last in the list, when I look at its ⬆️ / ⬇️ button, then that button is disabled so it can't leave the list.
- [ ] Given I moved a tag, when I reload the planner, then the tags editor shows the tags in the order I left them.

## Plan
- Store the move in the planner's tag list itself, so position = order and no new data field is added; it saves through the same path as any other change in that planner.
- Add ⬆️ / ⬇️ buttons to each tag row, inside the existing action group next to edit and delete, disabled at both ends and labelled in Spanish for screen readers.
- Route the move through the editor's existing "change a tag" callback into the planner, replacing the position of the open planner only (a global tag keeps its old position in the other planners).
- Leave the form, the global sync of tag *content* and the delete blocking exactly as they are.
- Cover it with tests: swap up and down, disabled at the ends, and the order surviving a reload.

## Out of scope
- The palette and the statistics bar following the new order (stories #2 and #3).
- Drag and drop, sorting alphabetically, and any "restore default order".
- Day chips inside a cell (they keep their applied order).
- Version bump to v0.9.0 and release notes — those come with the last story.

## Suggestions (your call)
- Each row already renders edit and delete as a small action group; adding the two arrows there keeps one visual pattern instead of a second mini-toolbar. If that group starts repeating its markup badly, we can look at a small shared icon-button then, not now.

@backlog.md #1
