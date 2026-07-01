
## 1. Seed the Depth view with 5 players per position

Populate the current formation (default 4-3-3, 11 positions) so each position card in `SquadDepthView` has 5 players (1 active + 4 alternates).

**Approach:** Add a "Demo: fill depth (5 per position)" action in the `SquadViewHeader` overflow menu (dev-only, hidden in production) that:
- Takes the current formation's positions
- Pulls 55 eligible Chelsea/loan players from `useSquadData`, ranked by rating
- Assigns 5 unique players per position via `useMultiPlayerPositions.loadFromAssignments`
- Falls back to repeating from top-rated players if fewer than 55 eligible players exist

This is non-destructive (uses the in-memory multi-player slot store) and gives us a realistic dense view to design against.

## 2. Pitch view — supporting many players per position

The current card shows only the top 3 players then a "+N more" line. With 5+ this becomes the norm and the card feels truncated. Options to explore (I'd build one, then we iterate):

**A. Expandable stack (recommended default)**
- Show top 3 by default; click the card to expand it in-place to full list (max-height + scroll)
- Keeps the pitch readable, one-click reveal, no layout shift for other cards (uses absolute overlay + z-index)

**B. Density toggle in header** ("Compact / Standard / Full")
- Compact: name only, 5 rows fit
- Standard: current
- Full: name + rating + age + contract chip

**C. Avatar-stack summary + hover peek**
- Card shows overlapping avatar bubbles (up to 5) with a single position rating; hover/click opens the full sidebar (existing `DepthPositionSidebar`)
- Best for very dense formations; loses inline rating visibility

**D. Column-per-position layout (non-pitch)**
- Alternative "List depth" mode where each position is a vertical column of cards, unlimited length, no pitch background. Great for exports and printing.

Recommendation: ship **A** as the interaction, keep the existing sidebar for edit; add **B** later if needed.

## 3. Export / PDF

Add an "Export" button in `SquadViewHeader` with two options:

- **PNG snapshot** — `html-to-image` on the pitch container. Fast, one-click, good for Slack/email.
- **PDF** — `jspdf` + `html-to-image`. Page 1: pitch snapshot + formation/coach/rating header. Page 2+: per-position depth tables (position, player name, age, club rating, report rating, contract expiry) — rendered from data, not DOM, so it's crisp and paginated cleanly.

Filename: `chelsea-depth-{formation}-{yyyy-mm-dd}.pdf`.

Dependencies to add: `jspdf`, `jspdf-autotable`, `html-to-image`.

### Technical notes
- Depth seeding lives in a new util `src/utils/depthDemoSeed.ts`; header button wired via existing `onStartNewSquad`-style pattern.
- Expandable card state kept locally in `SquadDepthView` (`expandedPosition: string | null`).
- Export logic in `src/utils/squadExport.ts`, invoked from header; no backend changes.

## Questions before I build
1. For the depth seed — happy with a dev-only button, or do you want it to auto-populate on first load of the Depth view when empty?
2. For the pitch density — go with **A (expandable stack)**, or do you want to see **B/C** too?
3. PDF format — pitch snapshot + per-position tables sound right, or do you want scout notes / recommendations included?
