# AI Hair & Salon Consultant

## Current Status

The current release is a React UI MVP with API-backed authentication, appointments, consultations, and salon catalog data. PostgreSQL is used for the connected flows, with local dummy-data fallback where a service is unavailable.

## Completed

### Customer Experience

- Admin and guest login screens.
- Role-based navigation for admin and guest users.
- Guest appointment booking flow.
- Appointment list with service, date, time, stylist, status, and notes.
- Dynamic login and workspace branding.
- Custom brand name, logo mark, logo image URL, and theme colors.

### Consultation Workflow

- Guest intake form.
- Styling goal selection.
- Preferred length and hair texture selection.
- Guided front, left, and right scan flow.
- Optional back-of-head scan.
- Scan progress state and capture checklist.
- Dummy consultation report.
- Face-shape estimate.
- Hair texture, length, density, movement, and visible-condition fields.
- Visible-condition signals with safe non-medical wording.
- Ranked hairstyle recommendations.
- Stylist override controls.
- Recommended salon services.
- Simulated virtual hairstyle try-on.
- Style selection and favorite action.

### Hair Passport

- Guest profile.
- Hair profile and preferences.
- Stylist memory notes.
- Favorite styles.
- Service history.
- Before-and-after section.

### Admin Workspace

- Today's consultation queue.
- Studio activity feed.
- Recommendation confidence display.
- Customer search.
- Basic consultation and conversion metrics.
- Service catalog view.
- Booking and revenue summary data.

### Project Structure

- React frontend separated under `frontend/`.
- NestJS backend separated under `backend/`.
- PostgreSQL Docker Compose configuration.
- Consultation entity, DTOs, controller, and service scaffold.
- Optional Ollama integration with a deterministic fallback.
- JWT authentication API with bcrypt password hashing.
- User and admin roles with admin invite-code protection.
- Bearer-token authentication and role authorization guards.
- Protected appointment and consultation API routes.
- PostgreSQL-backed salon profile, services, and stylist catalog API.
- Demo salon data seeded on first authenticated salon read.
- React salon setup and guest booking flows connected to the salon API.
- Shared component and screen structure in React.
- Production builds passing for frontend and backend.

## Pending

### Backend and Database

- Connect remaining React flows, including Hair Passport, to the NestJS API.
- Persist passports, styles, reports, and notes in PostgreSQL.
- Add migrations instead of development-only schema synchronization.
- Add refresh-token/session rotation and production identity-provider integration.
- Add appointment availability and conflict validation.
- Add customer and stylist ownership boundaries.

### Real AI and Image Processing

- Replace dummy report data with a real face-analysis provider.
- Add face landmarks and face-shape confidence scoring.
- Add hair segmentation and visible hair-condition analysis.
- Add automated image-quality checks for lighting, blur, angle, face visibility, and hair visibility.
- Add retake guidance based on failed quality checks.
- Connect a real virtual try-on provider.
- Add asynchronous generation progress, retry handling, quotas, and failure states.
- Add a provider abstraction so AI vendors can be changed later.

### Camera and Media

- Use the device camera instead of the simulated camera screen.
- Upload images securely to private object storage.
- Store before and after images with consent records.
- Add a before-and-after comparison slider.
- Add image deletion and retention controls.
- Add final-look capture after a salon service.

### Hair Passport and Salon Operations

- Persist passport history across sessions and devices.
- Save consultation decisions and stylist overrides.
- Save recommended and completed services.
- Link favorites and successful previous styles to future recommendations.
- Add complete customer profile and consultation history views.
- Add multi-salon ownership to the editable service catalog.
- Replace dashboard metrics with real database queries.

### Privacy and Safety

- Add explicit customer likeness and image-processing consent.
- Add privacy policy and data retention messaging.
- Encrypt sensitive data and private media at rest and in transit.
- Add account deletion and image deletion workflows.
- Keep visible hair assessment clearly separate from medical diagnosis.
- Add audit logs for staff access to customer records.

### Infrastructure

- Add Redis/BullMQ or another job system for long-running AI processing.
- Add object storage configuration for production.
- Add environment-specific configuration and secrets management.
- Add API and UI tests.
- Add error monitoring, logging, rate limits, and health checks.
- Add deployment configuration and CI checks.

### Product Expansion

- Build the React Native customer mobile application described in the product plan.
- Add salon and stylist selection for guests.
- Add consultation history on the customer side.
- Add saved-style sharing with the stylist.
- Add pilot analytics such as scan completion, retakes, time to result, recommendation engagement, and consultation-to-service conversion.
- Create a stylist labeling and evaluation workflow for pilot salons.

## Intentionally Deferred

The product document recommends not building these in the first MVP:

- Medical hair-loss diagnosis.
- Exact laboratory-style damage percentages.
- Microscopic cuticle analysis.
- Specialized scan hardware.
- Custom foundation AI models.
- Large salon marketplace.
- Full POS, inventory, accounting, or complex CRM suite.
- Multi-country expansion.
- Large loyalty program.

## Recommended Next Phase

1. Connect the React login, appointments, consultation, and passport flows to NestJS.
2. Add PostgreSQL migrations and refresh-token/session hardening.
3. Add secure image storage and consent.
4. Integrate image-quality validation and one real AI provider.
5. Connect a virtual try-on provider behind an async job endpoint.
6. Run a pilot with 5–10 salons and collect stylist feedback.
