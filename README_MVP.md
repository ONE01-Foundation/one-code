# OneView MVP

Clean rebuild of OneView UI with Apple Watch-like sphere navigation.

## Features

- **Sphere Navigation**: Drag spheres to center to focus, tap to enter
- **Worlds**: Health, Money, Career (seeded on first load)
- **Moments**: Create moments via text input, auto-classified by AI
- **Cards**: View and manage cards in drill-down views
- **Magic Button**: Generate AI insights for focused spheres
- **Breadcrumb Navigation**: Clear path back to home

## Running Locally

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (create `.env.local`):
   ```env
   # OpenAI API (required for AI features)
   OPENAI_API_KEY=your_openai_api_key

   # Supabase (optional for MVP - using in-memory store)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
npm start
```

## Architecture

### Components (`/components/mvp/`)
- `OneView.tsx` - Main component
- `SphereCanvas.tsx` - Sphere navigation canvas
- `SphereNode.tsx` - Individual sphere
- `CenterPreview.tsx` - Centered preview with metrics
- `BreadcrumbBar.tsx` - Navigation breadcrumb
- `MagicButton.tsx` - AI insight generation
- `InputBar.tsx` - Text input for creating moments
- `CardsList.tsx` - Cards view and management

### State Management (`/lib/mvp/`)
- `store.ts` - Zustand store (in-memory)
- `types.ts` - TypeScript types
- `ai.ts` - AI integration (reuses `/api/oneStep`)

### Data Model

- **World**: Top-level (Health, Money, Career)
- **SphereNode**: Domain nodes (can be sphere, cluster, or card)
- **Card**: Unit of work/deliverable
- **Moment**: Event log from user input

## Usage

1. **Home View**: Shows 3-7 spheres around center
2. **Drag to Focus**: Drag any sphere near center to focus it
3. **Tap to Enter**: Tap centered sphere to drill down
4. **Create Moments**: Type in input bar at bottom
5. **Magic Insight**: Click ✨ Magic button for AI insights
6. **Navigate Back**: Use breadcrumb bar or Home button

## Environment Variables

### Required
- `OPENAI_API_KEY` - For AI classification and insights

### Optional (for future Supabase integration)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Notes

- **Current State**: In-memory store (data resets on refresh)
- **Future**: Will migrate to Supabase persistence
- **AI**: Uses existing `/api/oneStep` endpoint
- **No Auth**: Anonymous user mode for MVP

## Deployment

Safe for Vercel deployment. Build passes TypeScript checks and Next.js production build.

