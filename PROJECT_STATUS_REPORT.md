# 📊 Detailed Project Status Report: TAO Social (Pantheon)

**Report Date:** January 1, 2026  
**Prepared by:** CeeCee (AI Engineering Partner)  
**Reviewed by:** Oracle (Technical Advisor)

---

## Executive Summary

**TAO Social** is a fork of the official Bluesky Social app that adds **TruAnon identity verification** as its key differentiator. The project is currently in a **"paused + drifting"** state with significant upstream divergence and several production-blocking issues.

**Estimated Resurrection Effort:** 12-35 person-weeks depending on scope

---

## 🏗️ What This Project Is

| Aspect | Details |
|--------|---------|
| **Origin** | Fork of [bluesky-social/social-app](https://github.com/bluesky-social/social-app) |
| **Repository** | git@github.com:javellan/Pantheon.git |
| **Owner** | TAO LLC (`com.taollc.taosocial`) |
| **Version** | 1.99.0 |
| **Stack** | React Native 0.76.6, Expo SDK 52, TypeScript 5.7.2 |
| **Protocol** | AT Protocol (decentralized social media) |
| **Platforms** | iOS, Android, Web (web has issues) |
| **App Store ID** | 6746351404 |
| **EAS Project ID** | 1b6ab0e8-2c18-4d28-869c-49d9d56d59ee |

### Key Differentiator: TruAnon Identity Verification

The main custom feature is integration with **TruAnon** - a privacy-preserving identity verification service. Users can display verified badges based on external identity proofs including:

- TikTok verification
- ID-level verification  
- Social media link validation

**Badge Ranks (lowest to highest):**
1. Dangerous - High risk, avoiding transparency
2. Cautioned - Partial validation, limited exposure
3. Credible - ID-level confidence with continuous validation
4. Reliable - Ongoing visible consistency and public oversight
5. Genuine - Peak confidence from long-term transparency

---

## 📈 Current State Assessment

### ✅ What's Working

| Feature | Location | Status |
|---------|----------|--------|
| Core Bluesky functionality | Inherited from upstream | ✅ Functional |
| Posts, feeds, profiles, messaging | `src/view/`, `src/screens/` | ✅ Functional |
| TruAnon badge display | `src/components/truanon/TruAnonBadgeIcon.tsx` | ✅ Functional |
| Verification toggle | `src/components/truanon/TruAnonVerificationSwitch.tsx` | ✅ Functional |
| Custom branding | `assets/_tao/` | ✅ Complete |
| EAS build configuration | `eas.json` | ✅ Configured |
| iOS/Android builds | Via Expo | ✅ Functional |

### ⚠️ What's Partially Working

| Feature | Issue | Location |
|---------|-------|----------|
| TruAnon verification flow | Security issues (see below) | `src/lib/truanon/useTruAnonProfile.ts` |
| Web platform | Crash stubs for media operations | `src/lib/media/picker.web.tsx` |
| Preference system | Default conflicts between components | Multiple locations |

### ❌ What's Disabled/Broken

| Feature | Status | Location |
|---------|--------|----------|
| Sentry crash reporting | Commented out | `app.config.js:218-226` |
| OTA Updates | Disabled | `app.config.js:184-199` |
| Share Extensions (iOS) | Commented out | `app.config.js:266` |
| Notification Service Extension | Commented out | `app.config.js:267` |
| App Clips/Starter Packs | Disabled | `app.config.js:258` |
| Deep linking/Associated Domains | Commented out | `app.config.js:22-29` |
| Android Intent Filters | Commented out | `app.config.js:163-179` |
| Dynamic App Icons | Disabled | `app.config.js:312-378` |

---

## 🔴 Critical Issues

### 1. Upstream Divergence (HIGH RISK)

- **~1,098 upstream commits not integrated** since March 2025
- Fork has ~168 custom commits
- Merge base: `2025-03-13`

**Bluesky features added since fork diverged:**
- Chat reactions and emoji support
- Explore page with trending topics
- Find Friends (privacy-focused contact import)
- Enhanced content filtering
- Encryption tests

**High conflict zones:**
- Profile UI (`src/screens/Profile/Header/`)
- State queries (`src/state/queries/profile.ts`)
- Build configuration (`app.config.js`)

### 2. TruAnon Security Issues (PRODUCTION BLOCKER)

| Issue | Severity | Location |
|-------|----------|----------|
| Client-shipped bearer token | 🔴 Critical | `src/lib/truanon/useTruAnonProfile.ts:5-6` |
| Cross-user write attempts | 🔴 Critical | `src/state/queries/profile.ts:180` |
| Trust model weakness (forgeable) | 🔴 Critical | `src/state/queries/profile.ts:141` |
| Permissive WebView | 🟡 High | `src/components/truanon/TruAnonVerificationSwitch.tsx` |

**Details:**

1. **Client-shipped bearer token**: The TruAnon API token is embedded in `app.config.js` and exposed via Expo constants. In mobile apps, this is extractable and can be abused.

2. **Cross-user write attempts**: `useTruAnonProfile()` is called for any viewed profile but attempts to write ATProto records to that user's repo, which will fail for non-self profiles.

3. **Trust model weakness**: Verification status stored as `{rank, style}` in user-controlled records without cryptographic attestation - easily forgeable.

4. **Permissive WebView**: `originWhitelist={['*']}` increases attack surface if verification flow is compromised.

### 3. Web Platform Broken

```typescript
// src/lib/media/picker.web.tsx:11
throw new Error('TODO')

// src/lib/media/manip.web.ts:42-48
throw new Error('TODO')
```

Core media operations crash on web platform.

### 4. Technical Debt

- **~100 TODO/FIXME/HACK comments** throughout codebase
- Many inherited from upstream, some TAO-specific
- TypeCheck likely not enforced in CI (evidence of loose prop usage)

---

## 📁 Project Structure Overview

```
Pantheon/
├── assets/
│   └── _tao/                    # Custom TAO branding
│       ├── logo.png
│       ├── logo_white.png
│       ├── logo_nobg.png
│       ├── bg_splash.png
│       ├── bg_square.png
│       └── favicon.ico
├── src/
│   ├── components/
│   │   └── truanon/             # TruAnon UI components
│   │       ├── TruAnonBadgeIcon.tsx
│   │       └── TruAnonVerificationSwitch.tsx
│   ├── lib/
│   │   └── truanon/             # TruAnon business logic
│   │       └── useTruAnonProfile.ts
│   ├── state/
│   │   └── queries/
│   │       └── profile.ts       # TruAnon queries & mutations
│   ├── screens/                 # App screens
│   └── view/                    # UI components
├── app.config.js                # Expo configuration
├── eas.json                     # EAS Build configuration
├── package.json                 # Dependencies (v1.99.0)
└── tsconfig.json                # TypeScript configuration
```

---

## 🛠️ Effort to Resurrect & Finish

### Option A: Minimal "Production-Ready Mobile"
**Estimated: 12-20 person-weeks**

| Category | Effort | Work Items |
|----------|--------|------------|
| **Critical Fixes** | 4-7 pw | Fix TruAnon security, fix cross-user writes, add crash reporting |
| **Feature Completion** | 4-10 pw | Decide on extensions, deep linking, push notifications |
| **Testing & QA** | 3-6 pw | Regression testing, security review, e2e tests |
| **Infrastructure** | 2-5 pw | EAS hardening, secret management, monitoring |

### Option B: Full Upstream Sync + Feature Parity
**Estimated: 20-35 person-weeks**

All of Option A, plus:

| Category | Effort | Work Items |
|----------|--------|------------|
| **Upstream Sync** | 8-14 pw | Rebase ~1,098 commits, resolve conflicts, test |
| **Re-enable Features** | 4-8 pw | Share extensions, App Clips, OTA updates |

---

## 📋 Recommended Resurrection Roadmap

### Phase 1: Stabilize (Weeks 1-4)

**Goal:** Make the app safe to run and debug

- [ ] **Fix TruAnon security** - Move token to backend proxy, stop cross-user writes
- [ ] **Enable crash reporting** - Uncomment Sentry or use alternative
- [ ] **Establish CI gates** - Enforce `yarn typecheck` and `yarn test`
- [ ] **Fix web media or de-scope** - Decide if web is a supported platform

**Key Files:**
- `src/lib/truanon/useTruAnonProfile.ts`
- `src/state/queries/profile.ts`
- `app.config.js`
- `.github/workflows/`

### Phase 2: Secure the Differentiator (Weeks 5-8)

**Goal:** Make TruAnon verification trustworthy

- [ ] **Implement TruAnon labeler/signed attestations** - Cryptographically verifiable
- [ ] **Fix preference defaults** - Ensure consistent privacy behavior
- [ ] **Add proper caching/rate limiting** - For TruAnon API calls
- [ ] **Security review** - Verification flow, WebView, data disclosure

**Key Files:**
- `src/lib/truanon/useTruAnonProfile.ts`
- `src/components/truanon/TruAnonVerificationSwitch.tsx`
- `src/screens/Profile/Header/EditProfileDialog.tsx`

### Phase 3: Feature Completion (Weeks 9-12)

**Goal:** Restore critical platform features

- [ ] **Re-enable push notifications** - Critical for engagement
- [ ] **Re-enable deep linking** - For shareable links
- [ ] **Decide on other extensions** - Share, App Clips based on product needs

**Key Files:**
- `app.config.js`
- `plugins/notificationsExtension/`
- `plugins/shareExtension/`

### Phase 4: Upstream Alignment (Weeks 13-20+)

**Goal:** Catch up with Bluesky upstream

- [ ] **Plan rebase strategy** - Identify target upstream release
- [ ] **Isolate TAO changes** - Keep diff small and rebased
- [ ] **Execute merge** - Resolve conflicts, especially in profile UI
- [ ] **Regression test everything**

---

## 💡 Strategic Recommendations

### 1. Move Verification Trust Server-Side

The current client-side token model is not production-safe. Recommended approach:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  TAO App    │────▶│  TAO Proxy  │────▶│  TruAnon    │
│  (Client)   │     │  (Backend)  │     │  API        │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │  Signed     │
                    │  Attestation│
                    └─────────────┘
```

Or implement a **TruAnon labeler** that publishes verification status as AT Protocol labels - this would make verification work across ALL Bluesky clients, not just TAO.

### 2. Keep the Fork Diff Tiny

Isolate changes to:
- `assets/_tao/` - Branding assets
- `src/lib/truanon/` - TruAnon logic
- `src/components/truanon/` - TruAnon UI
- `app.config.js` - Configuration changes
- Minimal UI integration points

Everything else should track upstream closely.

### 3. Sync with Upstream Regularly

The 1,098-commit gap is unsustainable. Adopt a "patch set" mentality:
1. Rebase TAO changes onto upstream releases
2. Keep custom changes isolated and well-documented
3. Sync monthly at minimum

### 4. Make a Platform Decision

**Current state:** Web has crash stubs, effectively broken

**Options:**
1. **Fully support web** - Fix media stubs, test thoroughly (~2-4 pw)
2. **Drop web support** - Remove from builds, simplify testing
3. **Best effort** - Accept web limitations, document them

### 5. Re-enable Observability First

Before any production release:
- Enable Sentry or equivalent crash reporting
- Add analytics for verification flow
- Monitor TruAnon API health
- Set up alerting for critical failures

---

## 📊 Recent Commit History

```
094d17bbb Update build-submit-ios.yml
35ea6212d Adding env vars for truanon
33e6b3331 Merge branch 'truanon-env-vars'
2ddb1da8f Fixed incomplete app.config.js export for TruAnon env vars
2a42c6117 Nightly source-language update
d74773a9f Merge pull request #21 - tao-prefs-reset-fix
7321f9bbf Ensuring app storage re-initialized on startup/session updates
73b2f5f96 Merge pull request #19 - storage-fix
9e160ba14 Corrected accumulator ternary operator
1156d9f17 Fixed user preferences leak between users after logout/login
4bc72c4c0 Nightly source-language update
36e64dc16 Merge branch 'tru-post-release'
abf2dcfbb Commenting out unconverted Bluesky extensions
f76cad137 Reverting slug & scheme to match deployment profile
3ad321a19 Update app.config.js
effa934c3 Fix icon rendering for missing react-fontawesome icons
132794f12 Fix new user prefs sync
03f9da4c9 Removed imaginary bug fix for non-existent feature
bea576dc7 Handle EAS secret key
```

---

## 🔗 External Resources

### Bluesky/AT Protocol
- [AT Protocol Documentation](https://atproto.com/guides/overview)
- [Bluesky API Docs](https://docs.bsky.app/)
- [Upstream Repository](https://github.com/bluesky-social/social-app)

### TruAnon
- [TruAnon Website](https://truanon.com/)
- [Identity for AT Protocol Whitepaper](https://truanon.s3.us-east-1.amazonaws.com/whitepapers/Identity+For+The+AT+Protocol.pdf)

### Build & Deploy
- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)

---

## 📝 Appendix: Environment Variables Required

```bash
# TruAnon Integration (SECURITY: Move to backend proxy!)
TRUANON_AUTH_TOKEN=<token>
TRUANON_SERVICE=<service_id>

# Sentry (Currently disabled)
SENTRY_AUTH_TOKEN=<token>

# Bitdrift (Currently disabled)
BITDRIFT_API_KEY=<key>
```

---

## Bottom Line

This is a **viable project** with a **compelling differentiator** (identity verification on AT Protocol). However, it requires **significant investment** before production-ready:

| Metric | Value |
|--------|-------|
| **Minimum viable effort** | 12-20 person-weeks |
| **Full feature parity effort** | 20-35 person-weeks |
| **Key blocker** | TruAnon security issues |
| **Strategic opportunity** | TruAnon labeler for cross-client verification |

The core Bluesky functionality is solid (inherited from well-maintained upstream). The main work is: **security fixes**, **upstream sync**, and **operational readiness**.

---

*Report generated by CeeCee with Oracle technical review*
