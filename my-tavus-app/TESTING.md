Manual testing and deploy notes
===============================

Quick manual checks for the inactivity / reopen feature

- Start the dev server:

```bash
cd my-tavus-app
npm install --legacy-peer-deps --no-audit --no-fund
npm run dev
```

- Set env (optional):

```
VITE_INACTIVITY_LIMIT=120
```

- Steps:
  - Click `Start Conversation` to open the `Conversation` UI.
  - Interact (move mouse / press keys / click) and verify the call stays open.
  - Stop interacting for 2 minutes (or set `VITE_INACTIVITY_LIMIT` lower for quicker tests).
  - Confirm the call automatically leaves and a banner appears: "Conversation closed due to inactivity" with a `Re-open` button.
  - Click `Re-open` and confirm the call rejoins using the same `conversationUrl` and the avatar receives the `backendReply` message.
  - Test microphone speech: speak for a few seconds and ensure the conversation does NOT close while voice activity occurs.

Notes and recommendations before pushing

- `inactivityLimitSeconds` can be passed to the `Conversation` component or set via `VITE_INACTIVITY_LIMIT`.
- Ensure API keys remain server-side (do not commit secrets). Use the backend to create Tavus conversations and return signed urls to the client.
- Verify the app cleans up `AudioContext` and MediaStream tracks (the component already stops tracks; double-check in production builds).
- Monitor and tune the voice-activity threshold if you see false positives/negatives in production devices.

Deploy / push checklist

1. Run lint and unit tests locally. (Note: inactivity unit test was deferred.)

```bash
cd my-tavus-app
npm run lint
npm run test
```

2. Build production assets and verify locally:

```bash
npm run build
npm run preview
```

3. Commit and push your branch, then open a PR for review:

```bash
git checkout -b feat/inactivity-timeout
git add .
git commit -m "feat: inactivity timeout + reopen UI (2m default); add voice-activity detection"
git push origin feat/inactivity-timeout
```

4. (Optional) Deploy a container or static site depending on hosting:
  - Static: deploy Vite build to Netlify / Vercel / S3.
  - Container: build Docker image and push to registry, then deploy.

If you'd like, I can open the PR and/or prepare a minimal Playwright E2E test for idle+reopen.
