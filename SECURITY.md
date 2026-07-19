# Security policy

## Supported version

Security fixes are applied to the latest release on `main`.

| Version | Supported |
|---|---|
| 2.x | Yes |
| 1.x | Critical fixes only |

## Reporting a vulnerability

Do not disclose vulnerabilities, credentials, access tokens, private assets, or
user data in a public GitHub issue.

Report a vulnerability privately through the GitHub repository's
**Security → Report a vulnerability** workflow:

<https://github.com/ukexe/Storyops_studio/security/advisories/new>

Include:

- A concise description of the issue
- Affected route, component, or deployment
- Reproduction steps
- Expected and observed behavior
- Security impact
- Suggested remediation, if known
- Whether any production data may have been accessed

You should receive an acknowledgement within 72 hours. Please allow time to
validate and release a fix before public disclosure.

## Security architecture

StoryOps uses:

- Supabase Auth sessions and JWT validation
- Project ownership checks on authenticated resources
- RLS-enabled application tables
- Revoked browser-role table privileges
- Backend-only Supabase secret access
- Private Storage with expiring signed URLs
- Image magic-byte and size validation
- Bounded AI inputs and outputs
- OpenAI API storage disabled with `store: false`
- Explicit model and deterministic-fallback audit IDs
- Exact-origin CORS and browser security headers
- Git history secret scanning and dependency audits in CI

## Secrets

The following must never be committed or exposed through browser configuration:

- `SUPABASE_SECRET_KEY`
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `WATSONX_API_KEY`
- `WATSONX_PROJECT_ID`
- Session cookies, JWTs, or refresh tokens

Use:

- Cloudflare Worker secrets for production edge credentials
- Render secret environment variables for FastAPI
- Local `.env`, `.env.local`, and `.dev.vars` files for development

Only the Supabase URL, Supabase publishable key, and public API URL may use
`NEXT_PUBLIC_*`.

## Scope limitations

Current tenant isolation depends on backend ownership checks because privileged
API credentials bypass user-scoped RLS policies. New routes must establish the
owned project before querying or mutating child resources.

The product does not yet provide enterprise SSO, organization RBAC, data
residency controls, provider opt-out policy, or globally distributed usage
quotas. These are documented roadmap items and must not be represented as
implemented controls.
