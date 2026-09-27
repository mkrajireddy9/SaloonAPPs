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
- Upload image option with preview.
- Camera capture option on supported mobile browsers.
- Protected AI image-quality check before analysis.
- Selected image forwarded to consultation analysis.
- Consultation result save action with selected services and hairstyle.
- Before image and generated after-look reference persisted in PostgreSQL.
- Saved before-and-after images shown in the Hair Passport.
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
- Customer profile editing and appointment history view.
- Service duration and pricing editor.
- Stylist working-day and leave-date editor.
- Calendar-style available booking slots.
- Review and rating API with admin moderation statuses.
- Multi-branch salon data model and migrations.

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
- PostgreSQL-backed Hair Passport API with notes and service history.
- PostgreSQL-backed admin dashboard summary API.
- Swagger documentation for all current API modules.
- TypeORM initial migration with startup migration execution.
- Refresh-token rotation and logout token revocation.
- Appointment ownership boundaries and stylist time-slot conflict validation.
- Dedicated AI module with Ollama provider abstraction and deterministic fallback.
- Protected AI analysis, image-quality, and virtual try-on API endpoints.
- Shared component and screen structure in React.
- Production builds passing for frontend and backend.

## Pending

### Backend and Database

- Connect remaining report, media, and final-look flows to the NestJS API.
- Persist generated reports and image metadata in PostgreSQL.
- Add production identity-provider integration and secure token storage strategy.
- Add configurable working hours and appointment availability rules.

### Real AI and Image Processing

- Run Ollama with a vision model such as `llama3.2-vision` for local image analysis.
- Add face landmarks and face-shape confidence scoring.
- Add hair segmentation and visible hair-condition analysis.
- Add automated image-quality checks for lighting, blur, angle, face visibility, and hair visibility.
- Add retake guidance based on failed quality checks.
- Connect a real generative virtual try-on provider; the current endpoint returns a local preview response.
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

- Save consultation decisions and stylist overrides as structured records.
- Save recommended and completed services.
- Link favorites and successful previous styles to future recommendations.
- Add complete customer profile and consultation history views.
- Add multi-salon ownership to the editable service catalog.
- Add richer dashboard filters and date-range database queries.

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

## Production Readiness Pending (2026-09-27)

### UI and Product

1. Review submission and rating screen.
2. Admin review moderation screen.
3. Branch management UI and branch selection during booking.
4. Service image upload and display.
5. Stylist profile editor with photos and bio.
6. Payment status and invoice screens.
7. Notification preferences screen.

### Backend Integrations

8. Email confirmations and reminders.
9. SMS notifications.
10. WhatsApp notifications.
11. Payment gateway and webhook handling.
12. Cloud image storage.
13. Image upload validation and cleanup.
14. PostgreSQL-backed logo and theme settings.

### Admin

15. Revenue analytics using actual service prices.
16. Booking, cancellation, and conversion reports.
17. Staff performance analytics.
18. Customer export and advanced filters.
19. Audit logs.

### Security

20. Rate limiting.
21. Password reset.
22. Email verification.
23. Strong production JWT and refresh-token handling.
24. CORS and security headers.
25. Secret management and token rotation.
26. File privacy and access control.

### Testing

27. Backend unit tests.
28. API integration tests.
29. Frontend component tests.
30. End-to-end booking tests.
31. Authentication and authorization tests.
32. Payment and notification webhook tests.

### Deployment

33. Production PostgreSQL backups.
34. Frontend deployment.
35. Backend deployment.
36. Domain and HTTPS.
37. Production migration pipeline.
38. CI/CD.
39. Monitoring and error tracking.
40. Staging environment.
41. Load testing and recovery plan.

### AI, Deferred

42. Valid image-generation provider configuration.
43. Real after-image generation.
44. Face landmarks and confidence scoring.
45. Hair segmentation and condition analysis.
46. Advanced image-quality validation.
47. AI retries, quotas, queues, and failure handling.
48. Production virtual try-on workflow.

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

1. Connect report, media, and final-look flows to NestJS.
2. Add secure image storage and consent.
3. Integrate image-quality validation and one real AI provider.
4. Connect a virtual try-on provider behind an async job endpoint.
5. Run a pilot with 5–10 salons and collect stylist feedback.
