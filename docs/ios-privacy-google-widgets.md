# Privacy disclosure delta: Google Sign-In and rural widgets

Reviewed by reading the implementation and official documentation on 2026-09-28. No local/remote tests or builds were executed for this review. This is an implementation inventory, not a legal-compliance certification or a replacement for the complete app's existing disclosures.

## Google

The application backend receives the Google ID token only for validation, and persists the Google subject mapped to the ConectCampo account. For new registrations, authorized name and email prefill the form; the user completes the existing profile/plan/consent process. The app requests no Gmail, Drive, Contacts or Calendar scopes. Google's native SDK signs out after returning the ID token; ConectCampo manages its own separate login session.

Google's short privacy guide describes user identifier and IP-derived approximate location for authorization and fraud prevention. The pinned **GoogleSignIn 9.0.0 privacy manifest** declares a broader set. Do not infer the SDK's entire collection from the fields read by our own backend:

| SDK-declared type | Linked to user | Purpose | Tracking |
| --- | --- | --- | --- |
| Name, email, phone number, coarse location | Yes | App functionality | No |
| User ID, other data types | Yes | App functionality and analytics | No |
| Device ID, other usage data | Yes | Analytics | No |

These SDK declarations must be considered in App Store Connect alongside the application's existing collection. Our application also stores name, email and its account ID for account functionality, and uses the name in the profile/dashboard. Keep any existing product-personalization purpose that applies. OAuth configuration alone is not evidence of a successful sign-in.

## Widgets

- Weather is opt-in through selection of an existing property. The shared, backup-excluded local snapshot contains its latitude/longitude and city/state label, not its name or the user's identity. These coordinates can have precise resolution. They already belong to an account-linked property on the backend; therefore do not downgrade the entire app's location disclosure to approximate merely because the widget displays a city label.
- The extension sends coordinates to Apple's WeatherKit for a forecast. It does not request device GPS permission or track device movement. Our request does not include the user's ConectCampo identifier, email or documents.
- Agenda is opt-in. The extension receives dates/counts of upcoming reminders, not event titles, monetary amounts or documents. It uses local snapshots rather than an authenticated background API session. Agenda display expires after 12 hours without synchronization; the backing account's reminders are not deleted by that expiry.
- App Group data remains on the device, is excluded from backup, and contains no auth tokens. Settings changes, logout, expiry of the app session and account deletion clear/restrict the shared summary. iOS schedules redraws, so do not promise instantaneous screen removal or real-time data.
- Public market quotation requests contain no account token, though the server records ordinary HTTP metadata such as IP address.

## Tracking

The added implementation does not read IDFA or integrate advertising/attribution networks. The pinned Google SDK manifest declares `NSPrivacyTracking=false`, no tracking domains and no tracking purposes for its collected data. Its analytics collection is **not the same as cross-company advertising tracking**. These observations support keeping "not used for tracking" for these additions; they are not a new exhaustive audit of every existing platform integration.

## Primary references

- [Apple App Privacy definitions and collection rules](https://developer.apple.com/app-store/app-privacy-details/)
- [Google Sign-In iOS privacy guide](https://developers.google.com/identity/sign-in/ios/app-privacy?hl=en)
- [Pinned GoogleSignIn 9.0.0 privacy manifest](https://github.com/google/GoogleSignIn-iOS/blob/9.0.0/GoogleSignIn/Sources/Resources/PrivacyInfo.xcprivacy)
- [Apple WeatherKit](https://developer.apple.com/weatherkit/)

Public policy: `/legal/privacidade`. App Store Connect declarations must be read back after saving; source edits do not update the store form automatically. Apple's guidance says currently available-app answers should reflect that available version; coordinate any newly collected-data changes with the release rather than claiming an unpublished binary is already live.
