# RezNet Website

Canonical source for the production RezNet Headless website at `https://www.reznetllc.com/`.

- Production Wix site: `c662787c-d2df-4eae-8c80-0b2301f670bd`
- Production frontend: `site/`
- Frontend source: `frontend-src/reznet.js`
- Deployment configuration: `wix.config.json`
- Production assessment form: `abfab16b-5544-490a-b726-487924a7c964`
- Customer receipt Triggered Email: `VU7gXuR`
- Default public sender/contact: `hello@reznetllc.com`
- Public voice/text: `336-347-8466`

## Build and verify

```powershell
npm.cmd install
npm.cmd run build
npm.cmd run verify
```

The build bundles the official Wix SDK packages into `site/assets/js/reznet.js` and refreshes `PRODUCTION_SHA256SUMS.txt`. The form submission and customer receipt share the same Wix visitor session so the published Triggered Email is sent to the contact created by the production assessment request.

## Publish

From the repository root, after a clean build and verification:

```powershell
wix.cmd release
```

`assessments@reznetllc.com` is reserved for the assessment workflow. The old Netlify/editor-era source is retained in Git history and is no longer the active source tree.
