# LangFlow — AI-Driven German Acquisition Engine

A Next.js implementation of the Technical Blueprint. All 10 modules are implemented as pure logic libraries behind Next.js API routes, backed by Supabase migrations and a Vitest test suite.

## Setup

1. Install dependencies:
   ```bash
   cd langflow
   npm install
   ```

2. Install Edge TTS (for audio generation):
   ```bash
   pip install edge-tts
   ```

3. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy `.env.example` to `.env.local` and fill in your Supabase URL, anon key, and LLM API key
   - Run migrations: `supabase migration up` (or execute migrations in the Supabase SQL editor in order: 0001 through 0010)

4. Run the dev server:
   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000` to use the demo UI.

## Run Tests

```bash
npm test
```

All 18 test suites run under Vitest (302 tests).

## Module Structure

### M01 — User Cognitive Profile Engine
- `src/lib/profile/types.ts` — profile domain models
- `src/lib/profile/onboarding.ts` — onboarding intake logic
- `src/lib/profile/profileUpdate.ts` — post-session profile updates
- `src/lib/profile/repository.ts` — Supabase data access layer
- `src/app/api/profile/` — Next.js API routes

### M02 — Vocabulary & Grammar Mastery Database
- `src/lib/mastery/types.ts` — domain models
- `src/lib/mastery/masteryScore.ts` — mastery score calculation
- `src/lib/mastery/spacedRepetition.ts` — SM-2 derived scheduler
- `src/lib/mastery/reviewQueue.ts` — 4-tier review queue builder
- `src/lib/mastery/introductionGate.ts` — new item introduction gate
- `src/lib/mastery/repository.ts` — Supabase data access layer
- `src/app/api/mastery/` — Next.js API routes

### M03 — Scenario Generation Engine (LLM Core)
- `src/lib/scenario/types.ts` — Scenario, DialogueTurn, ScaffoldingConfig types
- `src/lib/scenario/selection.ts` — domain/context/vocab/grammar selection, turn count, scaffolding inference
- `src/lib/scenario/promptBuilder.ts` — Section 15.1 prompt template with SVG diagram instructions
- `src/lib/scenario/validation.ts` — scenario schema validation
- `src/lib/scenario/templates.ts` — static fallback scenarios (Section 17)
- `src/lib/scenario/llmClient.ts` — DeepSeek + Gemini provider client
- `src/lib/scenario/ttsClient.ts` — Edge TTS integration (free, no API key)
- `src/lib/scenario/generator.ts` — full orchestrator with retry + fallback
- `src/lib/scenario/repository.ts` — Supabase persistence
- `src/app/api/scenario/route.ts` — POST endpoint for scenario generation
- `supabase/migrations/0003_scenario_engine.sql` — scenarios table schema

### M04 — Multisensory Delivery Engine (MSLT Layer)
- `src/lib/delivery/types.ts` — DeliveryChannelPlan, ComprehensionGateResult, BreakdownResult types
- `src/lib/delivery/synchronization.ts` — word-synced audio highlighting timing
- `src/lib/delivery/delivery.ts` — comprehension gate + delivery plan builder
- `src/lib/delivery/breakdown.ts` — analytic/synthetic breakdown flow
- `src/lib/delivery/repository.ts` — Supabase persistence
- `src/app/api/delivery/route.ts` — POST endpoint
- `supabase/migrations/0004_delivery_engine.sql`

### M05 — Kinesthetic Interaction Engine (TPR Layer)
- `src/lib/kinesthetic/types.ts` — WordCardTaskResult, ClassificationTaskResult types
- `src/lib/kinesthetic/wordCardTask.ts` — word card ordering with 3-attempt loop
- `src/lib/kinesthetic/classificationTask.ts` — grammatical sorting
- `src/lib/kinesthetic/repository.ts` — Supabase persistence
- `src/app/api/kinesthetic/route.ts` — POST endpoint
- `supabase/migrations/0005_kinesthetic_engine.sql`

### M06 — Oral Output & Speech Processing Engine
- `src/lib/oral/types.ts` — OralPreparationPlan, OralPerformanceRecord types
- `src/lib/oral/preparation.ts` — anti-anxiety oral preparation sequence
- `src/lib/oral/processing.ts` — STT, code-switch detection, lexical/grammar/pronunciation evaluation
- `src/lib/oral/masteryUpdate.ts` — mastery score updates from oral performance
- `src/lib/oral/repository.ts` — Supabase persistence
- `src/app/api/oral/route.ts` — POST endpoint
- `supabase/migrations/0006_oral_engine.sql`

### M07 — Cognitive Load Monitor
- `src/lib/cognitiveLoad/types.ts` — CognitiveLoadInput/Result types
- `src/lib/cognitiveLoad/calculator.ts` — Section 10.2 weighted composite
- `src/lib/cognitiveLoad/responseActions.ts` — Section 10.3 load response actions
- `src/lib/cognitiveLoad/repository.ts` — Supabase persistence
- `src/app/api/cognitive-load/route.ts` — POST endpoint
- `supabase/migrations/0007_cognitive_load_engine.sql`

### M08 — Progression & Spaced Repetition Engine
- `src/lib/progression/types.ts` — MasteryProgress types
- `src/lib/progression/spacedRepetition.ts` — SM-2 derived scheduler
- `src/lib/progression/progressionGate.ts` — CEFR progression gate
- `src/lib/progression/repository.ts` — Supabase persistence
- `src/app/api/progression/route.ts` — POST endpoint
- `supabase/migrations/0008_progression_engine.sql`

### M09 — Session Orchestrator (Master Loop)
- `src/lib/orchestrator/types.ts` — SessionState, SessionSummary, SessionPreview
- `src/lib/orchestrator/sessionInit.ts` — session init with scaffolding inference + review queue builder
- `src/lib/orchestrator/sessionLoop.ts` — full turn routing (M04→M05→M06→M10), cognitive load checks, recovery injection
- `src/lib/orchestrator/sessionClose.ts` — real session summary metrics
- `src/app/api/orchestrator/route.ts` — POST endpoint (INIT/ADVANCE/APPLY_RECOVERY/RESUME_RECOVERY/CLOSE)
- `supabase/migrations/0009_orchestrator_engine.sql`

### M10 — Feedback & Assessment Engine
- `src/lib/feedback/types.ts` — FeedbackPackage, TurnPerformance types
- `src/lib/feedback/builder.ts` — recast generation, rule reminders, code-switch resolution
- `src/lib/feedback/delivery.ts` — feedback formatting/delivery
- `src/app/api/feedback/route.ts` — POST endpoint (BUILD/DELIVER)
- `supabase/migrations/0010_feedback_engine.sql`

### Section 14 — UI State Machine
- `src/lib/uiStateMachine/types.ts` — all 15 AppUIState + 22 UIEventType
- `src/lib/uiStateMachine/machine.ts` — transition table, LOAD_ESCALATION injection, guards
- `src/app/api/ui-state/route.ts` — POST endpoint (TRANSITION/CAN_TRANSITION/DEFAULT)

### Section 15 — AI Prompt Architecture
- `src/lib/scenario/promptBuilder.ts` — Section 15.1 scenario generation template
- `src/lib/prompts/grammarErrorDetection.ts` — Section 15.2 grammar error detection template + response parser
- `src/lib/prompts/recastFeedback.ts` — Section 15.3 recast feedback template + response validator

### Section 16 — Event Bus
- `src/lib/events/bus.ts` — EventBus with module subscription, wildcard, once, unsubscribe

### Section 17 — Error States & Fallback Logic
- `src/lib/errors/registry.ts` — unified error registry with all 7 fallback handlers

## LLM Providers

Configure via `.env.local`:

### DeepSeek (default)
```
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions
DEEPSEEK_MODEL=deepseek-chat
```

### Gemini (alternative)
```
LLM_PROVIDER=gemini
GEMINI_API_KEY=AIza...
```

Both providers have free tiers. The system uses OpenAI-compatible format for DeepSeek and Google native format for Gemini.

## TTS

Uses Microsoft Edge TTS (completely free, no API key). German neural voices: `de-DE-ConradNeural` (male), `de-DE-KatjaNeural` (female). Audio files are saved to `public/audio/` and referenced by URL in scenario objects. Speed adapts by month phase (0.75x / 0.9x / 1.0x).

## Diagram Generation

SVG diagrams are generated by the LLM itself (no separate service). The prompt instructs the LLM to output inline SVG data URIs for turns involving spatial prepositions or complex grammar. This is free and pedagogically flexible.

## Deploy to Vercel

```bash
vercel