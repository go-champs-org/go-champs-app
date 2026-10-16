# iOS distribution

## Status and scope

This repository uses Expo SDK 54 / React Native 0.81, Expo Router, Hermes and
New Architecture. GitHub Actions generates iOS projects using Expo Prebuild;
Fastlane archives, signs, verifies and uploads them to existing Apple apps.
The local, previously generated iOS project was stale (Expo 52 / RN 0.76) and
is now ignored, not deleted. Android is unchanged. EAS project metadata remains
in app.json, but EAS is not part of this pipeline.

**Backend isolation is deferred by explicit request.** These variants isolate
installation identity, URL scheme and signing only. Both retain current routing:
production API by default, staging fallback for recent tournaments, staging
organizations, production signup/recovery links. Do not describe Preprod as
staging-only or production as production-only. Resolve this before a public launch
if strict environment isolation is required. Build selection does not change APIs.

Uploads are disabled until an owner explicitly enables the repository and
environment switches below. No credentials, Apple records, reviewer rules or
TestFlight groups are created by these files.

## Build variants and architecture

| IOS_APP_ENV | Display name | Bundle ID | Generated scheme | URL scheme |
| --- | --- | --- | --- | --- |
| staging | Go Champs Preprod | com.gochamps.app.staging | GoChampsPreprod | gochamps-staging |
| production | Go Champs | com.gochamps.app | GoChamps | gochamps |

`config/ios-environments.json` is the identity source of truth. `app.config.js`
applies it only when IOS_APP_ENV is explicitly set. Ordinary Expo Go/web/Android
commands retain their original configuration. IOS_DISTRIBUTION=true rejects a
missing environment; invalid environments always fail. Both schemes archive with
Release. There is no runtime environment selector or duplicated application code.
Do not manually edit generated Xcode projects. Run Prebuild in a clean checkout;
the workflow refuses to overwrite an existing ios directory.

Separate `ios-staging.yml` and `ios-production.yml` entry workflows call the same
`ios-distribution.yml` implementation and reusable `ci.yml` validation. Production
manual dispatch must select a release tag; main is rejected.

Linux runs npm ci, lint, TypeScript, Jest coverage and both Expo configuration
checks. Successful validation gates a macOS job. The macOS job selects the
configured Xcode version, installs locked Ruby/npm dependencies, generates iOS,
installs pods, signs in a temporary keychain, verifies the IPA, uploads it, and
waits for Apple processing. No automatic App Review submission or public release
occurs, including in production.

Why this tooling: the repository is public, so standard GitHub-hosted runners
have no execution charge. Fastlane supplies established signing, ASC querying and
upload logic. Expo remains the native project generator. EAS would reduce CI
maintenance but introduce a second service, credentials and build quotas without
an established EAS pipeline to preserve. The same tooling can support Android
later without adding Android work now.

References: [Expo Prebuild](https://docs.expo.dev/workflow/continuous-native-generation/),
[GitHub billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions),
[Fastlane API authentication](https://docs.fastlane.tools/app-store-connect-api/).
Standard runner compute is free for public repositories; storage can be billed.
Only the generated Podfile.lock is retained for seven days. IPAs, profiles,
keychains and private keys are never uploaded as GitHub artifacts. Pod download,
npm and Bundler caches avoid repeating dependency downloads. CocoaPods resolves
native transitive dependencies on each fresh generation; retain the lock for
diagnosis and review native dependency changes when upgrading npm packages.

## Apple Developer setup (manual)

1. In Certificates, Identifiers & Profiles, verify the existing explicit identifiers
   match both bundle IDs above and belong to Go Champs Tecnologia LTDA. The former
   local ID com.wagnerassis.go-champs-app is not used. Do not create new identifiers.
2. Confirm the Apple Team ID. Inspect enabled capabilities against the generated
   entitlements. This app currently has no push/associated-domain integration;
   do not enable capabilities merely for this pipeline.
3. Reuse an approved Apple Distribution certificate with its private key. Export
   it from Keychain Access as a password-protected .p12. If none exists, obtain
   explicit approval before creating one, especially for production.
4. Create or obtain an App Store Connect distribution provisioning profile for
   each existing identifier using that certificate. Development/ad hoc/enterprise
   profiles are rejected. Download each .mobileprovision file.
5. Keep original private material in the team's approved secure storage, never in
   the repository. Base64 is transport encoding, not encryption.

Both apps should coexist because their bundle IDs differ. Verify installation
and deep links on a physical device after approved uploads. No coexistence claim
has been validated on a device yet.

## App Store Connect setup (manual)

1. Open each existing app's App Information. Record its numeric Apple ID and
   confirm its bundle ID exactly matches the table. CI checks this mapping through
   the API before building; it never creates app records.
2. An Account Holder/Admin enables API access if necessary. In Users and Access,
   Integrations, App Store Connect API, generate an appropriately named API key.
   Use Developer permissions for upload/build reading where sufficient. If the
   account requires a broader role for a specific operation, review that need
   rather than granting Admin by default. Key creation may require an Admin.
3. Record Key ID and Issuer ID; download the .p8 once. Store its full PEM content
   in ASC_API_PRIVATE_KEY. Use separate environment keys where practical. Team API
   keys can have account-wide app scope: separate keys do not inherently restrict
   access to a single app. Review Apple's current key-scope controls.
4. In the staging app's TestFlight tab, manually configure an internal testing
   group and eligible team members. Enable automatic distribution to that internal
   group if desired; otherwise manually add each processed build. CI does not
   create groups or add/remove testers and uses skip_submission=true.
5. Complete export compliance and other Apple requirements manually as needed.
   Do not set an encryption exemption without assessing the app's actual use.

[Apple API keys](https://developer.apple.com/help/app-store-connect/get-started/app-store-connect-api/)
[Fastlane upload behavior](https://docs.fastlane.tools/actions/upload_to_testflight/)

## GitHub setup and approval

Create environments named exactly `staging` and `production` in repository
Settings > Environments. Configure the following separately in each:

| Type | Name | Value |
| --- | --- | --- |
| Secret | IOS_DISTRIBUTION_P12_BASE64 | Single-line base64 of the approved .p12 |
| Secret | IOS_DISTRIBUTION_P12_PASSWORD | Export password |
| Secret | IOS_PROVISIONING_PROFILE_BASE64 | Single-line base64 of this app's profile |
| Secret | ASC_API_PRIVATE_KEY | Full .p8 PEM text |
| Variable | APPLE_TEAM_ID | Apple Developer Team ID |
| Variable | ASC_APP_ID | Existing numeric app ID for this variant |
| Variable | ASC_KEY_ID | API key ID |
| Variable | ASC_ISSUER_ID | API issuer ID |
| Variable | IOS_XCODE_VERSION | Installed macos-15 runner Xcode version, e.g. 26.2 if available |
| Variable | IOS_UPLOAD_ENABLED | Leave false until that environment's uploads are authorized |

Set repository variable `IOS_DISTRIBUTION_ENABLED=false` initially. Validation
runs while distribution is skipped. After reviewing configuration and explicitly
authorizing uploads, set the desired environment's IOS_UPLOAD_ENABLED=true and
repository IOS_DISTRIBUTION_ENABLED=true. This opt-in authorizes automatic staging
uploads on future relevant merges; production still waits for approval each run.
Do not enable production until its reviewer policy has been configured.

Production must have required reviewers and administrator bypass disabled; the
Linux release-policy job checks these before the macOS job. Restrict production
deployments to `ios-v*` tags, protect those tags against unauthorized creation or
replacement, and protect main and workflow/configuration files with review rules.
Enable prevention of self-review if a second authorized reviewer is available.
Restrict staging to main. Never pass distribution secrets to pull-request jobs.
Workflow token permissions are contents:read, with actions:read only on the
release-policy job to inspect protection rules; signing and ASC credentials are
scoped to the distribution step. Temporary signing files are removed in ensure
blocks, and GitHub-hosted machines are ephemeral even if a job is terminated.

Public repositories support required reviewers on GitHub Free/Pro/Team. If the
repository becomes private and loses that feature, this pipeline fails closed.
An alternative must be deliberately implemented: an authorized maintainer invokes
workflow_dispatch on a validated release tag as the explicit approval, with
restricted write access and environment secrets. Merely creating an environment
or adding workflow_dispatch does not provide a separate reviewer gate.

[Environment protection](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
[Runner images and installed Xcode versions](https://github.com/actions/runner-images)

## Staging deployment

1. Complete setup and authorize/enable staging uploads.
2. Merge a mobile change into main, or dispatch iOS staging on main.
3. Watch Linux checks, then the macOS job. Documentation-only branch pushes skip
   distribution. Pull requests run validation without signing secrets.
4. A successful summary reports bundle ID, version, build number and commit after
   Apple processing. Failure or timeout does not mean the upload failed; inspect
   App Store Connect before retrying.
5. Internal testers accept their invitation in TestFlight and install Go Champs
   Preprod after the build is assigned to their group and Apple requirements pass.

## Production deployment

1. Update app.json and package.json to the same X.Y.Z marketing version in a
   reviewed change; regenerate package-lock.json if its root version changes.
2. After merging, create and push `ios-vX.Y.Z` on the intended reviewed commit.
   Tag creation/push and actual uploads require human authorization.
3. Linux validation checks the tag/version and production protection rules.
4. An authorized reviewer approves the production environment deployment.
5. CI uploads only to com.gochamps.app and waits for processing. In App Store
   Connect, manually select the processed build, complete metadata/compliance,
   submit for App Review and choose the release timing. Nothing publishes itself.

## Versioning, retries and concurrency

app.json version is authoritative, package.json must match, and production tags
must exactly equal ios-v followed by that version. The generated Info.plist is
updated before archiving and inspected inside the exported IPA.

For each bundle ID and marketing version, CI reads the latest TestFlight build
number and adds one (starting at 1 for an empty train). This pipeline accepts
integer build numbers 1..9999; a dotted existing number fails with a migration
message. Bump the marketing version before exhausting this range. Staging and
production use separate Apple app records and separate counters.

The shared distribution workflow uses one concurrency group per environment covers allocation through Apple
processing. Running deployments are never canceled by newer commits. GitHub may
replace an older pending run with a newer pending run; every merge is not
promised an individual binary. This is intentional for staging. Avoid queuing
multiple production releases simultaneously. Only this pipeline should upload to
these app records: external/manual concurrent uploads bypass its lock. On a
processing timeout, inspect ASC and wait until the prior upload is visible before
retrying. Duplicate numbers are rejected by Apple, never treated as success.

## Credential maintenance

Before certificates/profiles expire, obtain approval for replacements, export and
upload new secrets to the correct environment, and perform an approved staging
validation followed by an approved production build. Keep the old certificate
until all consumers have migrated. Regenerating profiles is necessary when their
certificate or capabilities change. Do not revoke shared certificates blindly.

For API-key rotation, create the replacement with minimum necessary permissions,
update that environment's key/issuer/private-key values, validate with an approved
run, then revoke the old key in App Store Connect. If compromised, disable uploads,
revoke the affected key/certificate promptly, replace secrets and inspect prior
runs. Do not paste secret material into issues, chat, logs or screenshots.

## Troubleshooting and validation

- Missing secret/variable: the lane names the missing input without printing it.
- Wrong ASC app: verify numeric app ID, bundle ID, team and key access. Never create
  another app to work around a mismatch.
- Profile failure: verify App Store distribution type, expiry, team, exact bundle
  identifier and certificate/private-key pair. Regenerate only with approval.
- Capability/signing errors: compare generated entitlements with the registered
  identifier and profile; never silently strip a required entitlement.
- Xcode missing: choose an installed version from the runner image manifest and
  update IOS_XCODE_VERSION after compatibility review. Runner images evolve.
- CocoaPods: inspect the generated Podfile.lock artifact and npm/Gemfile locks;
  retry without the download cache if corrupt. Never reuse the old local ios tree.
- Bundling/Hermes: run npm ci under Node 22, npm run check:ios-config and a release
  export. Review native module compatibility before upgrading Expo/RN.
- Authentication: check API key/issuer IDs, PEM formatting, revocation and role;
  never substitute a personal Apple password.
- Upload/processing: inspect ASC delivery status, export compliance and agreements.
  The lane waits up to 30 minutes for processing and fails on timeout. Check ASC
  before rerunning; a timeout does not prove the binary was rejected.
- Environment mismatch: identity checks do not validate API destinations. Backend
  routing is intentionally unchanged in this release tooling work.

Local checks: npm run check:ios-config, npm run typecheck, npm run lint,
npm run test:coverage -- --runInBand, ruby -c fastlane/Fastfile and actionlint.
Generate both variants in disposable checkouts with IOS_APP_ENV set and
IOS_DISTRIBUTION=true; inspect bundle IDs, display names, Release schemes and
Hermes/New Architecture settings. Do not run clean prebuild over custom local
native work. Real signed archives, successful Apple processing, tester access and
simultaneous device installation remain required integration/manual checks.

## Implementation validation (2026-10-16)

- Node 22: lint and TypeScript passed; 24 Jest suites / 130 tests passed, with
  99.1% statement and 93.33% branch coverage.
- Both resolved Expo configs passed identity checks; missing/invalid release
  environments fail closed. Both native projects generated in temporary folders.
- Generated bundle IDs, display names, Release archive schemes, Hermes and New
  Architecture settings passed inspection for both variants.
- Staging CocoaPods install passed (90 pods); staging iOS release export produced
  Hermes bytecode successfully.
- Fastlane lane loading, Ruby syntax, four signing/build-number tests and the
  disabled-upload guard passed. Actionlint passed for all workflows.
- Native archive attempt is blocked by the local Xcode installation: its required
  iOS 26.5 platform is missing. No signed archive or actual upload was attempted.
- GitHub environment rules, live Apple app mapping, signing credentials, TestFlight
  processing and physical-device coexistence remain unverified until setup and
  an explicitly approved integration run.
