# Halo User Mobile App

Branch: `feature/mobile-user-app`

This document tracks the user-only React Native/Expo implementation. It is updated after each completed phase.

## Scope

- Mobile application for the `user` role only.
- Existing web and backend functionality remain intact.
- The mobile app uses backend APIs and never connects directly to PostgreSQL.
- Admin mobile functionality is explicitly out of scope for this branch.

## Audit inventory

| Web feature                     | Web route/screen                              | API                                                                    | Mobile status                                 |
| ------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------- |
| Login                           | `/`                                           | `POST /auth/login`                                                     | Existing prototype; being rebuilt             |
| Registration                    | Login screen                                  | `POST /auth/register`                                                  | Missing                                       |
| Google login                    | Login screen                                  | `POST /auth/google`                                                    | Dependency exists; integration pending        |
| Forgot password                 | `/forgot-password`                            | `POST /auth/forgot-password`                                           | Missing                                       |
| Reset password                  | `/reset-password`                             | `POST /auth/reset-password`                                            | Missing                                       |
| Email verification              | `/verify-email`                               | `GET /auth/verify-email`                                               | Missing                                       |
| Session persistence and refresh | App bootstrap                                 | `POST /auth/refresh`                                                   | Partial; refresh handling pending             |
| Salon directory and location    | `salons`                                      | `GET /salon/directory`                                                 | Partial                                       |
| Salon selection                 | Salon directory                               | `GET /salon/:id`                                                       | Partial                                       |
| Booking                         | `appointments`                                | `GET /appointments/slots`, `POST /appointments`                        | Partial                                       |
| Appointment list                | `appointments`                                | `GET /appointments`                                                    | Partial                                       |
| Reschedule and cancel           | Appointment cards                             | `PATCH /appointments/:id/reschedule`, `PATCH /appointments/:id/cancel` | Partial                                       |
| Profile                         | `account`                                     | `GET/PATCH /customers/me`                                              | Read-only prototype                           |
| Appointment history             | Account/customer history                      | `GET /customers/me/history`                                            | Missing                                       |
| Hair passport                   | Passport experience/API                       | `GET/PUT /passport`                                                    | Partial                                       |
| Prices and offers               | `price-list`                                  | `GET /salon/price-list`                                                | Basic list exists                             |
| Products                        | `products`                                    | `GET /salon`                                                           | Basic list exists                             |
| Reviews                         | Tools                                         | `GET/POST /reviews`                                                    | Partial                                       |
| Payments and invoices           | Tools                                         | `GET /payments`, `POST /payments/intent`                               | Partial; checkout limitation documented below |
| Notification preferences        | Tools                                         | `GET/PUT /auth/preferences`                                            | Partial                                       |
| Notification history            | Notification panel                            | `GET /notifications`                                                   | Missing                                       |
| Push notifications              | Web push tools                                | `/notifications/push/*`                                                | Expo push integration pending                 |
| Legal pages                     | `/privacy-policy`, `/terms`, `/photo-consent` | None                                                                   | Missing                                       |

Admin-only web functionality (dashboard, consultations, scan/AI, salon administration, customer administration, banners, approvals, and refunds) is excluded.

## Implementation plan

1. Replace the prototype entry flow with Expo Router and user-only route groups.
2. Add secure authentication, registration, password recovery, verification, Google login, refresh, and logout.
3. Build mobile navigation and the salon directory/detail/booking workflow.
4. Build appointments, profile, history, passport, prices, products, reviews, payments, and notification screens.
5. Add resilient API behavior: environment configuration, loading/error/empty states, expired-session handling, and network failures.
6. Add native UX: safe areas, keyboard handling, Android back behavior, pull-to-refresh, and accessible controls.
7. Remove Admin navigation and reject Admin sessions from the mobile client.
8. Test TypeScript, Expo export, authentication, booking, appointment actions, profile, and role separation.
9. Update this document with completed work, tests, and blockers.

## Known backend limitations

- `POST /payments/intent` creates an intent but the current app does not expose a complete native provider checkout flow.
- Existing push APIs use web-push subscriptions; Expo Push Token support may require a backend extension.
- The web app does not currently expose user image upload as a separate profile workflow; mobile will not invent one.

## Progress

### Phase 1 — Audit

- Status: Complete.
- Audited frontend screens, routes, role-gated rendering, mobile prototype, API client, and backend controllers/DTOs.
- No existing files were changed during the audit.

### Phase 2 — Mobile foundation

- Status: In progress.
- Added Expo Router and changed the mobile entry point to `expo-router/entry`.
- Added a user-only route tree with authentication and tabs.
- Added secure access/refresh token helpers and one-time 401 refresh retry.
- Added real backend login, guest registration, and forgot-password requests.
- Added initial user screens for salon directory, appointments, account, and More.
- Disabled the local mobile demo bootstrap so the app uses the real API.
- Added `dist` to the TypeScript exclusion so Expo web exports do not pollute type checking.
- Validation: `npx expo export --platform web` passed and `npx tsc --noEmit` passed.

### Expo SDK compatibility update

- Updated the mobile project from Expo SDK 57 to SDK 58 to match the installed Expo Go application.
- Synchronized Expo Router, React Native, React, Secure Store, Notifications, Image Picker, WebView, and related SDK packages.
- Normalized the monorepo install so Expo config plugins resolve correctly from the repository root.
- Validation: `npx tsc --noEmit` passed and `npx expo export --platform web` passed under SDK 58.

### Physical-device development fix

- Updated the local mobile API URL from `localhost` to the Mac LAN address `http://192.168.29.227:3000`.
- Verified the backend health endpoint through both localhost and the LAN address with HTTP 200.
- The phone and Mac must remain on the same Wi-Fi network; restart Expo after changing `.env`.
- Mobile user login now accepts local credentials `test` / `test` and maps them to the guarded backend test account.
- Backend login validation now also accepts the literal local username `test` before email validation, while real and production logins still require an email.
- Login DTO now treats the login identifier as a string so the guarded local test username reaches the local test-login path; registration still requires a valid email.
- Verified the LAN login request returns access and refresh tokens for `test` / `test`; restarted Expo with a clean LAN bundle on `exp://192.168.29.227:8082`.

### Phase 3 — User feature implementation

- Status: In progress.
- Added salon detail and real slot-based appointment booking.
- Added appointment rescheduling and cancellation actions.
- Added editable profile fields and paginated appointment history loading.
- Added password reset, email verification, privacy policy, and terms routes.
- Added editable hair passport fields and notification history access to More.
- Added optional Google sign-in using the existing backend endpoint when `EXPO_PUBLIC_GOOGLE_CLIENT_ID` is configured.
- Added native route coverage for privacy policy and terms of use.
- Corrected mobile payment-intent requests to use the backend’s required appointment ID and idempotency key.
- Hardened More screen list rendering so payment, notification, booking, banner, approval, customer, and consultation responses are normalized before `.map()` is called. This fixes the `TypeError: undefined is not a function` crash when the payments endpoint returns an empty or non-array response.
- Added the Expo-compatible `@expo/vector-icons` package and native Ionicons to the bottom tabs: search, appointments, account, and more.
- Redesigned the user More tab as a settings hub with a Halo header, account identity card, two-column action cards, icons, descriptions, selected-state styling, and improved spacing. Existing More actions and API behavior are preserved.
- Refined the More tab to a production-style settings layout: one scroll surface, top app bar, grouped account sections, full-width 76px touch rows, consistent icon containers, concise descriptions, and accessible selected states. Removed the cramped two-column interaction pattern.
- Reordered the user menu by frequency of use: Quick actions (booking, payments), Your account (profile, hair passport), then Salon & preferences. Combined prices and products into Salon details, and combined notification preferences with notification history. Admin navigation remains unchanged.
- Added an Account-tab slide-in drawer with profile, hair passport, notifications, salon details, payments, feedback, privacy policy, and terms. The drawer uses the existing More screen routes through section parameters, while More now presents only the primary booking and payment actions.
- Moved the drawer trigger to the main salon directory screen, removed Account from the bottom tab bar, and exposed Account as a standalone `/account` screen with back navigation. The main drawer now opens Account plus the account-related destinations.
- Removed Privacy Policy and Terms of Use from all visible mobile navigation; the underlying routes remain available but are no longer linked from the drawer or More screen.
- Restored Privacy Policy, Terms of Use, and Sign out in the main account drawer. Sign out clears local access and refresh tokens before returning to login; legal pages remain available only from this drawer.
- Removed the duplicate Sign out action from the account profile page so account actions are maintained in the drawer.
- Changed the drawer footer to compact Privacy Policy, Terms of Use, and Sign out links instead of full navigation rows.
- Prevented the login screen from initializing Google auth when `EXPO_PUBLIC_GOOGLE_CLIENT_ID` is absent; the Google button is now hidden until the client ID is configured, avoiding the Expo AuthSession client-ID crash.
- Hardened drawer navigation by completing the modal close before routing, passing a navigation nonce, and remounting More for each requested section so drawer destinations cannot retain stale content.
- Kept the More route navigable while removing it from the bottom tab bar by replacing `href: null` with an invisible `tabBarButton`; drawer destinations can now resolve the route without showing a duplicate tab.
- Added the native salon splash configuration using the existing Halo splash mark on the brand deep-green background (`mobile/assets/splash-icon.png`, `#20352d`). This is a static native splash for reliable iOS/Android startup; Expo Go may continue showing its own launch shell.
- Added a drawer-origin back button to More destinations. The button is shown only when a section was opened from the account drawer and returns to the previous screen.
- Moved Privacy Policy and Terms to the bottom of the drawer as compact links, and changed Sign out to a separate full-width outlined button.
- Restored the drawer width by removing the flex rule that was overriding its `84%` width, and added visible Back buttons to Privacy Policy and Terms.
- Added a Rewards destination to the drawer with Refer a Friend and Coupons options. Referral sharing uses the device share sheet; coupon entry is currently a prepared UI flow because the backend has no referral/coupon endpoints yet.
- Moved Hair Passport out of the account drawer into a dedicated bottom tab with its own editable screen, while keeping the existing `/passport` API integration.
- Moved Payments out of the account drawer into a dedicated bottom tab with payment history and payment-intent creation using the existing `/payments` APIs.
- Tightened the four visible bottom tabs to use equal full-width items, removed horizontal padding, reduced label size, and shortened labels to prevent excess spacing.
- Refreshed the account drawer with a branded member hero card, grouped Account and Rewards sections, improved hierarchy, and a scrollable panel for smaller screens while preserving every existing destination.
- Refined the drawer to a fixed no-scroll panel, removed the divider above the legal footer, and styled Privacy Policy and Terms of Use as underlined links.
- Reduced the Halo Member hero height and tightened drawer row, icon, header, and footer spacing so the legal links remain visible without scrolling; legal links now use stronger underlined styling.
- Corrected the final drawer spacing styles and hid the internal More tab item itself so only the four visible tabs receive equal width; Privacy Policy and Terms now render as explicit underlined links.
- Applied the Halo theme to Privacy Policy and Terms with deep-green hero headers, mint eyebrow labels, coral back links, warm paper backgrounds, and consistent typography.
- Redesigned Privacy Policy and Terms as mobile-friendly editorial screens with compact legal navigation, branded hero panels, update metadata, readable content cards, numbered sections, and footer guidance.
- Updated the drawer’s My Account action to navigate directly to `/(tabs)/account` instead of the standalone re-export alias, removing the route ambiguity that prevented account navigation.
- Removed the eager `expo-auth-session` Google provider import from login because the current native client does not include `ExpoApplication`. Standard username/password login, including `test` / `test`, no longer depends on that native module. Google sign-in can be reintroduced after building a native client with the matching Expo modules.
- Added safe-area spacing below the status bar to the main directory, More screen, standalone Account screen, and account drawer panel for notch and dynamic-island devices.
- Extended safe-area handling to every mobile route: authentication forms, password reset, email verification, appointments, salon booking, privacy, and terms screens. Keyboard-avoiding layouts remain intact.
- Audited cross-screen navigation and fixed More state synchronization: direct `/more` navigation now opens Quick actions instead of hidden Profile, and drawer section parameters now update an already-mounted More screen. Deep-linked drawer sections also show their current account context.
- Fixed Directory “View and book” to use an explicit Expo Router dynamic route with the salon ID. Hidden the More route from the bottom tab bar to remove duplicate Booking/Payments navigation; it remains available internally for drawer destinations.
- Updated the salon booking screen to track its loading state separately and display the API error plus a back-to-directory action when salon details cannot be loaded, instead of showing an indefinite spinner.
- Validation: `npx tsc --noEmit` and `npx expo export --platform web` pass after the latest changes.
- Local runtime blocker: the backend currently cannot start because its configured PostgreSQL server at `127.0.0.1:5432` is unavailable. Until PostgreSQL is started or the backend is pointed at the Neon database, the mobile app cannot load salons, slots, or bookings.
- Remaining: native Expo push-token registration, native payment checkout, and final device workflow QA after the backend database is available.

### Temporary removals / restore checklist

These items were disabled or deferred to keep the current test build stable. Revisit them after login, navigation, booking, and backend testing are complete:

- Google sign-in: restore `expo-auth-session` only after creating a native development/production build that includes the matching Expo modules, configuring `EXPO_PUBLIC_GOOGLE_CLIENT_ID`, and testing the `/auth/google` flow.
- Expo push notifications: add native Expo Push Token registration, permission handling, token storage, and backend delivery integration. The existing web-push endpoints are not a complete native implementation.
- Native payment checkout: complete the provider checkout UI after `POST /payments/intent`; currently the app creates a payment intent and displays its result but does not launch a native payment sheet.

These were intentional navigation changes, not pending removals:

- Account was removed from the bottom tab bar and moved to the account drawer/standalone Account screen.
- More was removed from the visible bottom tab bar to avoid duplicate Booking/Payments actions; its route remains available for drawer destinations.
- Privacy Policy and Terms remain available as bottom drawer links, and Sign out remains as the drawer button.

### Phase 4 — QA and handoff

- Status: Not started.
