## Story
As a user creating a new planner, I want to optionally copy the previous year's palette tags, so that my custom tags are already in the new palette without re-creating them.

## Acceptance criteria
- [ ] Given a planner for the previous year exists, when I create a new planner with the palette-copy option checked, then its palette shows the same tags in the same order as the previous year's and its days are empty.
- [ ] Given a planner for the previous year exists, when I create a new planner with that option unchecked, then it starts with the standard tags as it does today.
- [ ] Given no planner for the previous year exists, when I create a new planner, then it starts with the standard tags and no previous-year data is copied.

## Plan
- Add the opt-in option to the create form and make it available only when the immediately preceding year's planner exists.
- On creation with the option checked, carry over the previous palette as the new palette; otherwise keep today's standard starting tags.
- Leave the new planner's days untouched — this story never copies day assignments.
- Keep the existing create flow, active-planner switch and success notice unchanged.
- Cover the three criteria with focused tests around form creation and the resulting palette.

## Out of scope
- Copying holiday chips onto days, or any day assignments, subtitles or tag usage (story #2).
- Copying from any year other than the one immediately before the new planner.
- Changing the tag editor or how existing planners are managed.

## Suggestions (your call)
- Keep the copy choice explicit from the form through creation, so story #2's independent holiday option can travel the same path without changing this story's behavior.

@backlog.md #1
