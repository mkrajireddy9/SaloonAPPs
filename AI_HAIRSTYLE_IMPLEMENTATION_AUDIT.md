# AI hairstyle implementation audit

## Existing architecture

- Web: Next.js app routes in `frontend/app`, with the existing studio/customer UI in `frontend/src`.
- Mobile: Expo Router in `mobile/app`, shared API client in `mobile/src/api.ts`, and existing salon/account/booking tabs.
- Backend: NestJS in `backend/src`, TypeORM with PostgreSQL and migrations under `backend/src/database/migrations`.
- Authentication: JWT access/refresh tokens through `JwtAuthGuard`; the token contains the authenticated email, role, and salon scope.
- Media: authenticated uploads through `MediaController`/`MediaService`, Sharp validation, local private storage or authenticated Cloudinary delivery.
- Existing AI: `backend/src/ai` already contains Gemini/Ollama/Pollinations adapters and catalog-backed recommendations, but its controller is admin-only, accepts raw base64 from clients, has no session/job persistence, and returns local preview fallbacks.
- Booking: mobile salon detail and appointment routes already create appointments through `/appointments`; the AI flow will pass optional hairstyle context into this existing request.
- Configuration/deployment: backend environment validation is in `backend/src/app.module.ts`; Render and local configuration are represented by `render.yaml`, `.env` conventions, and the existing workspace scripts.

## Reuse decisions

- Reuse JWT authentication and the existing customer identity rather than adding a second auth system.
- Reuse `MediaService` for private image validation/storage and extend it only where AI ownership checks require it.
- Reuse `GeminiProvider` for analysis and configurable image generation; keep provider/model selection behind backend interfaces.
- Reuse `HAIRSTYLE_CATALOG`, existing salon service categories, mobile theme styles, and the existing appointment API.
- Add persisted AI sessions, recommendations, generation jobs, usage records, and a migration instead of storing image bytes in PostgreSQL.

## Scope implemented on this branch

The AI feature is being added as an opt-in customer flow: upload with consent, analyze, review five recommendations, generate one selected preview, review history, delete a session, and continue to existing salon booking. Provider credentials remain server-only and the feature is disabled unless `AI_HAIRSTYLE_ENABLED=true`.

## Known verification limits

Live Gemini analysis/image generation requires the corresponding backend environment variables and provider quota. Automated tests cover authorization, validation, persistence rules, and provider failures without requiring real provider credentials.
