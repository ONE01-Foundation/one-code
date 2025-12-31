# Rollback Plan

## Quick Rollback (Disable Persistence - 1 minute)

If persistence is causing issues but you want to keep the code:

1. **Comment out persistence call in `app/page.tsx`** (around line 507):
   ```typescript
   // Persist card if suggested (non-blocking, fire and forget)
   // DISABLED - Uncomment to re-enable
   /*
   if (data.suggestedCard) {
     // ... persistence code ...
   }
   ```
2. The API routes will remain but won't be called
3. Existing UI continues to work normally

---

## Full Rollback (Remove All Changes - 5 minutes)

To completely remove all persistence code:

### Step 1: Revert API Route Changes

**File: `app/api/brain/route.ts`**

Revert to original (remove structured JSON parsing):

```typescript
const reply = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";

return NextResponse.json({ reply });
```

### Step 2: Remove Persistence Call

**File: `app/page.tsx`**

Remove the persistence block (around line 507-530):
- Delete the entire `if (data.suggestedCard) { ... }` block
- Keep the word-by-word animation code intact

### Step 3: Delete New Files

Delete these files:
- `app/api/cards/ingest/route.ts`
- `lib/card-persistence.ts`
- `supabase/migrations/001_initial_schema.sql`
- `IMPLEMENTATION_PLAN.md`
- `ROLLBACK_PLAN.md` (this file)

### Step 4: Drop Database Tables (Optional)

If you want to remove the database schema:

```sql
-- Run in Supabase SQL Editor
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS card_events CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
```

---

## Verification After Rollback

1. ✅ Chat messages still work (stored in React state)
2. ✅ AI responses still display correctly
3. ✅ Word-by-word animation still works
4. ✅ No console errors related to `/api/cards/ingest`
5. ✅ No database errors in logs

---

## Data Safety

- **No existing data affected** - This feature adds persistence, doesn't modify existing data
- **All changes are additive** - Original code paths remain intact
- **Can rollback anytime** - No data migration needed
- **Database tables can be dropped** - They only store new data from this feature

---

## Partial Rollback Options

### Option A: Keep Schema, Disable API Calls
- Comment out persistence call in `app/page.tsx`
- Keep database tables (for future use)
- Keep API routes (won't be called)

### Option B: Keep Code, Disable Database
- Comment out Supabase calls in `lib/card-persistence.ts`
- Keep API routes and client code
- Can re-enable when database is ready

### Option C: Keep Everything, Add Feature Flag
- Add `ENABLE_CARD_PERSISTENCE` env variable
- Wrap persistence call in feature flag check
- Easy to toggle on/off

---

## Emergency Rollback (30 seconds)

If the site is broken:

1. **Quick fix** - Comment out this block in `app/page.tsx`:
   ```typescript
   // if (data.suggestedCard) { ... entire block ... }
   ```

2. **Deploy** - Push and deploy immediately

3. **Site restored** - All original functionality intact

4. **Investigate later** - Check logs, fix issues, re-enable when ready

