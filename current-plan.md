## Story
As a planner user, I want the day palette to show tags in the order I set, so that my most-used tags are where I expect them.

## Acceptance criteria
- [ ] Given I moved tags in the editor, when I close the editor and look at the palette, then the tag chips appear in the same order as in the editor list, with the ✏️ Etiquetas button still last.
- [ ] Given I set an order and then reload the planner, when the palette appears, then its chips keep that order.
- [ ] Given two planners have different tag orders, when I switch between them, then each palette shows the order of the planner I'm viewing.

## Plan
- Use the planner's stored tag list as the palette's source of order, with no second ordering state.
- Lock the order with a component check: after a move, palette chips follow the editor list.
- Add an end-to-end check that goes through the real editor, closes it and reads the palette order.
- Check the order after a reload and when switching planners.
- Leave chip labels, icons, selection behavior and day chips exactly as they are.

## Out of scope
- The statistics bar following the order (story #3).
- Day chips inside a cell, which keep their applied order.
- New reorder controls or changes to the editor.
- Version bump to v0.9.0 and release notes.

## Suggestions (your call)
- The palette currently renders the tag list in its existing order, so this story may need no product change — just the checks that keep it true. If you expected a visible difference here, tell me what it should be before we build.

@backlog.md #2
