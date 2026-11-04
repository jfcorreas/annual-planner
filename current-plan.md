# Current plan — Story #6: Used/remaining counter for the work permit

Approved story for the next `/pair` session (backlog #6, v0.3.0 tags rework).

## Story
As a planner user, I want to see how many permit days I have used and how many
remain in the year, so that I know where I stand without counting by hand.

## Acceptance criteria
- [ ] Given a work-permit tag with a yearly max and U applications in the year,
      when the year statistics bar renders, then its row reads
      "U de N · Restantes (N − U)".
- [ ] Given more applications than the max, then "Restantes" shows a negative
      number highlighted in red — applications are never blocked or capped.
- [ ] Given the month statistics bar, then the permit row keeps showing only the
      applications in that month, with no remaining days (the max is yearly).

## Plan
- No new stored state: the permit tag already carries its yearly max and the
  statistics already count the period.
- Year bar: the permit row renders "U de N · Restantes R", with R = max − year
  count; the counter follows automatically when the max is edited.
- Negative remaining gets a red highlight (a visual state on the counter); zero
  and positive stay normal.
- Month bar: unchanged — the plain count, since a monthly remaining would not
  mean anything against a yearly max.
- Chips, palette, editor and delete rule stay untouched.

## Out of scope
- Blocking or warning when the max is exceeded (applications stay unlimited).
- Global tag across planners (#7) and refusal of previous-version data (#9).
- Showing the counter anywhere else (detail modal, editor list, chips).
- Changing how the max is configured (that is #5, already shipped).

## Suggestions (your call)
- None: the permit row is already a separate group and the badge helper exists,
  so this is a small rendering change.

## Decisions taken during refinement
1. Wording: "U de N · Restantes R" (capital R), e.g. "3 de 20 · Restantes 17".
2. A negative remaining is highlighted in red; applications are never blocked.
3. The month bar keeps the plain per-month count (no remaining).
4. The detail modal stays as is ("N veces este año") — out of scope.

## Existing tests to review in the pair session (not touched yet)
- `src/App.test.tsx` — "year and month bars show the permit group … with the
  period count" (~line 987): the year permit row's `.stats__count` becomes
  "U de N · Restantes R", so the expected text changes; the month assertion
  should stay as the plain count.
- `src/App.test.tsx` — the `monthCount`/`.stats__count` helpers (~lines 42–44)
  target the month bar and should keep working.
- `src/components/MonthZoom.test.tsx` — `Stats` fixture (`counts: []`,
  `permits: []`) needs no change, verify.
