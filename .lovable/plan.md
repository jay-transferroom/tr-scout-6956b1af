

# How Ratings Work Across the App — Analysis & Plan

## Current State

The app has multiple rating system types defined in templates: **numeric 1-5**, **numeric 1-10**, **letter grades (A-E)**, **custom tags**, and **percentage**. However, the averaging and display logic is fragile and inconsistent:

### Averaging (the core problem)

In `reportGrouping.ts`, when calculating `avgRating` across multiple reports for a player, the code **only includes ratings that are `typeof "number"`** — letter grades like "A" or "B" are silently dropped. This means:

- A player with 3 reports graded A, B, A → `avgRating = null` (no numeric values found)
- A player with numeric 1-10 reports → works fine, averages correctly
- Mixed rating types across reports → only numeric ones count

The `convertRatingToNumeric` utility in `ratingConversion.ts` exists (A→9, B→7.5, C→6, D→4, E→2) but is **never called during averaging** — it's only imported in `reportDataExtraction.ts` but not used in the grouping/averaging path.

### Display

The `ScoutingGrade` component handles both numeric and string grades with a colored dot, which is good. But averaged values are always shown as numbers (e.g., `7.5`) even if the underlying reports used letter grades.

### Where ratings appear

1. **Reports list** (`GroupedReportsTable`, `ReportRow`) — shows `ScoutingGrade` with `avgRating`
2. **Dashboard** (`Index.tsx`) — shows `ScoutingGrade` for recent reports
3. **Player profile** (`PlayerStatusActions`) — shows scouting grade
4. **Shortlist cards** — currently show NO scouting grade at all
5. **Squad view** — uses scouting report ratings with colored pills

---

## Proposed Plan

### 1. Fix averaging to handle all rating types

Update `reportGrouping.ts` to use `convertRatingToNumeric` when calculating `avgRating`, so letter grades and custom tags are properly included in averages.

### 2. Add "display format" awareness to averaged ratings

Store the original rating system type alongside the average so the UI can decide how to display it:
- If all reports used **letter grades** → convert average back to nearest letter (e.g., 8.25 → "A")
- If all reports used **numeric** → show as number (e.g., "7.5")
- If **mixed** → show as number with the converted scale

Add a helper `convertNumericToDisplay(avg, ratingSystemType)` that maps back.

### 3. Update ScoutingGrade component

Enhance to accept an optional `displayFormat` prop so it can render "A" instead of "9" when the template used letter grades, while keeping the colored dot logic.

### 4. Add scouting grade to shortlist PlayerCard

Show the averaged scouting grade on shortlist cards (currently missing), using the same `ScoutingGrade` component.

### 5. Files to modify

| File | Change |
|---|---|
| `src/utils/reportGrouping.ts` | Use `convertRatingToNumeric` in averaging; detect rating system type from report template |
| `src/utils/ratingConversion.ts` | Add `convertNumericToGrade(value, type)` reverse mapping |
| `src/components/ui/scouting-grade.tsx` | Accept optional `displayFormat` for letter/numeric rendering |
| `src/components/shortlists/PlayerCard.tsx` | Add ScoutingGrade display using report data |
| `src/hooks/useReportPlayerData.ts` | Ensure avgRating + rating type are returned |
| `src/components/reports/GroupedReportsTable.tsx` | Pass display format to ScoutingGrade |

