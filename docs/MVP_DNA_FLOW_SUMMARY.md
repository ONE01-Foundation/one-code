# Moment → Preview → Confirm DNA Flow

## Implementation Summary

### Features Added

1. **Draft Moment System**
   - User input creates draft (not real moment)
   - Draft stored in Zustand: `draftMoment`, `showMomentPreview`
   - Preview modal shown before committing

2. **MomentPreviewModal Component**
   - Shows raw text
   - Tags (node names) with remove toggle (×)
   - "Add Tag" dropdown (existing nodes only)
   - Suggested Next Step (from AI)
   - "Create Card from this" checkbox with editable title
   - Cancel/Confirm buttons

3. **Commit Logic**
   - On Confirm: Creates actual moment with selected nodeIds
   - If card checkbox enabled: Creates card under best parent
     - Default: current focused node (if not root)
     - Fallback: first selected node (if sphere/cluster)
   - Links moment to card via `moment.cardId`

4. **Units Measurement**
   - Moments now store `units` (word count)
   - CenterPreview shows "X units today"
   - Aggregates for Worlds (sum of all descendants)

5. **Magic Button Update**
   - Prompt: "Generate ONE actionable instruction (max 14 words)"
   - Format: "Do X" or "Create Y" or "Turn Z into W"
   - Truncates if > 14 words

### Files Modified

1. **lib/mvp/types.ts**
   - Added `DraftMoment` interface
   - Added `units`, `cardId` to `Moment`

2. **lib/mvp/store.ts**
   - Added `draftMoment`, `showMomentPreview` state
   - Added `createDraftMoment()`, `commitDraftMoment()`, `cancelDraftMoment()`
   - Updated `createMoment()` to calculate units (word count)
   - Added `getUnitsToday()` for aggregation
   - Enhanced `getMetrics()` to aggregate for Worlds

3. **lib/mvp/ai.ts**
   - Updated `ClassificationResult` with suggested fields
   - Enhanced `classifyInput()` to return suggestedNextStep, suggestedCardTitle, suggestedCardType
   - Updated `generateInsight()` prompt for one action (max 14 words)

4. **components/mvp/InputBar.tsx**
   - Changed to create draft instead of immediate moment
   - Calls `createDraftMoment()` instead of `createMoment()`

5. **components/mvp/MomentPreviewModal.tsx** (NEW)
   - Full preview UI with tags, suggestions, card creation option
   - Tag management (add/remove)
   - Confirm/Cancel actions

6. **components/mvp/CenterPreview.tsx**
   - Added "X units today" metric display
   - Uses `getUnitsToday()` for aggregation

7. **components/mvp/OneView.tsx**
   - Added `<MomentPreviewModal />` component

8. **components/mvp/CardsList.tsx**
   - Added "+ Card" button (already implemented in previous commit)

### Flow Diagram

```
User Types Text
  ↓
InputBar.handleSubmit()
  ↓
classifyInput() → AI classification
  ↓
createDraftMoment() → Store draft
  ↓
showMomentPreview = true
  ↓
MomentPreviewModal renders
  ↓
User reviews/edits tags
User optionally checks "Create Card"
  ↓
User clicks "Confirm"
  ↓
commitDraftMoment()
  ├─→ createMoment() (with selected nodeIds)
  └─→ createCard() (if checkbox enabled)
  ↓
Clear draft, close modal
```

### Constraints Maintained

- ✅ No voice input yet
- ✅ No Supabase persistence yet
- ✅ No new top-level nodes creation
- ✅ Minimal UI, consistent theme
- ✅ `/api/oneStep` usage unchanged

### Build Status

- ✅ TypeScript: PASSING
- ✅ Next.js Build: PASSING
- ✅ Production Ready: YES

