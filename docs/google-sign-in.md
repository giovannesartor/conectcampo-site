# Google Sign-In

## Server configuration

- `GOOGLE_SIGN_IN_ENABLED=true`
- `GOOGLE_WEB_CLIENT_ID`: the Google OAuth Web client ID (also the server audience for native ID tokens).
- `GOOGLE_IOS_CLIENT_ID`: the Google OAuth iOS client ID, accepted as an authorized presenter (`azp`).

The Google client secret is **not used**. Never commit downloaded OAuth JSON files or place a client secret in frontend environment variables. The frontend obtains only the public client ID from `/api/v1/auth/google/config`.

Web OAuth authorized JavaScript origins: `https://app.conectcampo.digital`, `https://conectcampo.digital`, `https://www.conectcampo.digital`. No redirect URI is needed for the GIS JavaScript popup callback used here. The consent-screen authorized domain is `conectcampo.digital`. Configure the basic identity scopes only; Gmail/mailbox access is not requested.

## Flows and security

- GIS renders the official Google button in browsers; the app uses the native plugin and Google iOS SDK instead of opening OAuth inside WKWebView. Older builds do not display an unsupported Google button.
- The backend creates random, one-use, five-minute challenges bound to purpose and, for linking, the authenticated user. It validates the ID token signature using Google's JWKS, issuer, audience, authorized presenter, expiry, issued-at and nonce. Identity is indexed by Google's `sub`, not email.
- No email-based automatic linking. An existing user must sign in and explicitly link Google in Account settings after confirming their current password. Social-only accounts can set a password through verified email recovery before adding another provider.
- New Google users complete the normal plan/profile/consent form without a password. Gmail and Workspace authoritative emails are verified; external Google-account email addresses receive ConectCampo's own email verification message. Google access does not grant admin privileges.
- No Google refresh/access tokens are persisted by this integration. The backend issues its own session tokens. Account deletion removes the Google identity mapping. Google-only accounts can use email recovery to set the password required by the existing deletion flow.
- Anonymous provider-level login, registration and linking outcomes appear in Administration > Accesses and emails. No ID tokens, email addresses or Google secrets are included in these counters.

## Release boundaries

The Prisma schema additions must be applied using the existing deployment process before the new API starts. Web login needs authorized origins and published/appropriately configured Google consent audience. Native login additionally requires the matching iOS client, bundle identifier, URL scheme and a new cloud-built binary. Configuration being present is not proof that a real login completed.

No local tests, builds, simulators or servers were executed for this implementation. Real login and account linking require browser/device confirmation; do not mark them validated based solely on successful deployment.
