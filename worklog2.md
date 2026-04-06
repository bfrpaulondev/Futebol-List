---
Task ID: 7 - feature-implementation
### Work Task
Implement logo, OpenAI config, new draw system with arrival tracking, animated teams page, and Palestrinha chat bot.

### Work Summary

**1. Logo Implementation (4 files modified):**
- `src/app/layout.tsx`: Updated metadata icons to use `/logo.png` for both icon and apple
- `src/app/(auth)/login/page.tsx`: Replaced emoji ⚽ with `<Image src="/logo.png">`, added Image import
- `src/app/(auth)/register/page.tsx`: Same logo change as login
- `src/app/(app)/layout.tsx`: Replaced loading spinner emoji with logo image, added Image import

**2. OpenAI Configuration (1 file created):**
- `src/lib/openai.ts`: New module with `chatCompletion()` function using gpt-4o-mini model, hardcoded API key fallback with env var preference

**3. Prisma Schema Update (2 files modified):**
- `prisma/schema.prisma`: Added `arrivedAt DateTime?` field to GameAttendee model
- `src/lib/seed-check.ts`: Added `"arrivedAt" DATETIME` column to GameAttendee CREATE TABLE

**4. Draw API Rewrite (1 file modified):**
- `src/app/api/games/[id]/draw/route.ts`: Complete rewrite with new logic:
  - Separates goalkeepers (GR) from field players
  - Shuffles GKs and field players separately
  - 2+ GKs: randomly assigns A/B sides
  - 1 GK: goes to Team A, best-rated field player becomes Team B GK
  - 0 GKs: 2 random field players assigned as GKs
  - Alternating distribution: A, B, A, B... cap at 6v6
  - Extras go to reserves array
  - AI coach commentary via OpenAI chatCompletion
  - Saves teamsJson as { teamA, teamB, reserves }

**5. New Arrival API (1 file created):**
- `src/app/api/games/[id]/arrive/route.ts`: POST endpoint
  - Only confirmed players can mark arrival
  - Sets arrivedAt to now()
  - Returns list of arrived players
  - Checks 10-minute rule for canDraw
  - Checks Friday 20:40 UTC auto-draw

**6. New Draw Status API (1 file created):**
- `src/app/api/games/[id]/draw-status/route.ts`: GET endpoint
  - Returns arrived players list, total confirmed count
  - canDraw boolean (10-min rule + Friday check)
  - teamsDrawn boolean, teams data if drawn
  - timeUntilDraw milliseconds for countdown
  - AI coach comment if available

**7. Palestrinha Chat Bot API (1 file created):**
- `src/app/api/chat/palestrinha/route.ts`: POST endpoint
  - System prompt defines Palestrinha character (funny mini-coach, pt-PT slang)
  - Accepts message, history, playerNames
  - Uses OpenAI chatCompletion with temperature 0.95
  - Returns { reply: string }
  - Graceful fallback on error

**8. Teams Page Redesign with Animated Draw (1 file modified):**
- `src/app/(app)/teams/page.tsx`: Complete rewrite using framer-motion
  - 4 states: loading, pre_draw, drawing, drawn
  - PRE_DRAW: Player arrival list, "Cheguei!" button, countdown timer, progress bar, rules card
  - DRAWING: 5-phase animation (GK spinning → A/B coin flip → server draw → players flying in → confetti celebration)
  - DRAWN: Final field visualization with animated player entries, reserves section, AI commentary
  - Admin-only draw button with 10-min wait enforcement
  - 5-second polling for status updates

**9. Chat Page with Palestrinha Integration (1 file modified):**
- `src/app/(app)/chat/page.tsx`: Added Palestrinha bot
  - @palestrinha mention triggers bot response
  - Typing indicator with animated dots ("Palestrinha está a digitar...")
  - Bot messages styled with amber/orange gradient, 🧑‍💼 avatar
  - @mention button in header and in input area
  - Conversation history tracking for context
  - Framer-motion for message entrance animations

**Build: ✓ Compiled successfully (no errors, no warnings)**
**Lint: ✓ No errors**
