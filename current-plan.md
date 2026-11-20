## Story
As a user creating a new planner, I want to optionally copy the previous year's holiday chips onto the same month and day, so that the fixed holidays are already placed in the new year.

## Acceptance criteria
- [ ] Given a planner for the previous year exists with holiday chips on certain dates, when I create a new planner with the holiday-copy option checked, then those chips appear on the same month and day in the new planner — including their subtitles, with 29 February landing on 28 February — and no other day chips are copied.
- [ ] Given the holiday-copy option is checked, when the new planner is created, then the holiday tags used by those chips are in its palette even if the palette-copy option is off, so each chip keeps its original label and color.
- [ ] Given the holiday-copy option is unchecked, or there is no planner for the previous year, when I create a new planner, then no holiday chips are copied and its palette follows the existing behavior.

## Plan
- Add a second opt-in option to the create form, shown under the same previous-year condition as the palette option.
- Pass the new choice alongside the existing one through creation, keeping the two options independent.
- On creation, map each previous-year holiday chip to the same month and day in the new year, keeping its subtitle and skipping every non-holiday chip.
- Bring over only the holiday tags those chips need, without changing the palette choice made by the other option.
- Cover the three criteria with focused tests for copied days, palette availability, and the unchecked/no-previous cases.

## Out of scope
- Copying non-holiday chips, subtitles on non-holiday chips, or any full-day tag usage.
- Changing the palette-copy option or its checkbox (#1).
- Computing movable holidays or suggesting dates — only chips already placed in the previous year are copied.

## Suggestions (your call)
- Reuse the existing day-key formatting helper for the month/day mapping, so leap-day handling and key validity stay consistent with the rest of the app.

@backlog.md #2
