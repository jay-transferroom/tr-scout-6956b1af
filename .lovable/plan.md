
# Depth View: Showing 5 Players Per Position

Current state: pitch is a fixed 16:9 container. Each position card shows 3 players + "+N more" that expands in place with z-index. With 5 players per every position, expanding one still overlaps others, and expanding all is impossible without overflow.

Below are four options to solve this, from lowest to highest lift. They aren't mutually exclusive — a combination is likely best.

## Option A — Taller pitch + always-show-5 (simplest)

Drop the fixed 16:9 aspect ratio and give the pitch a taller canvas (e.g. min-height 780–900px, or aspect 4:3). Cards render all 5 players by default at a slightly reduced row height. Remove the expand/collapse entirely.

- Pros: no interaction cost, "at a glance" comparison across all positions, cleanest for PDF/PNG export.
- Cons: pitch becomes tall — requires page scroll on smaller laptops. Cards get denser (smaller text or tighter rows).
- Best for: users who want to scan depth quickly and export.

## Option B — Compact rows + selective expansion (small lift)

Keep the current 16:9 canvas but shrink each row (avatar-less, ~18px tall, smaller font) so 5 fit in the current card footprint. No expand button needed at 5.

- Pros: no layout change, no overlap risk, works today.
- Cons: text gets small (~10–11px); rating pills shrink; less breathing room.
- Best for: keeping the current single-screen pitch feel.

## Option C — Density toggle (Compact / Standard / Full)

Add a segmented control in the header:
- Compact: 5 players visible per card, small rows (Option B styling).
- Standard: current 3 + expand behaviour.
- Full: taller pitch, all 5 always visible (Option A styling).

- Pros: user chooses their tradeoff; supports both "quick scan" and "detailed review".
- Cons: more UI to build and test; needs a sensible default (suggest Compact).

## Option D — Side drawer for depth detail (hybrid)

Cards stay compact (top 2–3 on pitch). Clicking a position opens a right-hand drawer showing the full 5-player depth list with richer detail (age, contract, rating breakdown, notes). Pitch never overflows.

- Pros: pitch stays clean and exportable; drawer can carry much more info than a pill card ever could; scales beyond 5.
- Cons: only one position visible in detail at a time — worse for cross-position comparison.

## Recommendation

Ship **Option C (density toggle)** with **Compact as default**, because it directly answers "see all 5 for every position" while preserving today's behaviour for users who prefer it. Optionally layer **Option D** later for deep-dive per-position review.

## Technical notes

- File: `src/components/squad-view/SquadDepthView.tsx`
  - Replace fixed `aspectRatio: '16/9'` with a density-driven style (Compact = 16/9, Full = 4/3 or min-height).
  - Extract `COLLAPSED_COUNT` and row typography into density-driven constants.
  - Remove expand/collapse when density shows all players.
- Header: `src/components/squad-view/SquadViewHeader.tsx` gains a `depthDensity` prop + segmented control (visible only in Depth mode).
- Persist choice in `localStorage` (`squad-depth-density`).
- Export (PNG/PDF) should always render in "Full" density regardless of on-screen setting so exports show all 5.

## Open questions

1. Preferred default density: Compact (fit today's pitch) or Full (taller pitch, always show all)?
2. Want the Option D drawer as a follow-up, or is the toggle enough for now?
