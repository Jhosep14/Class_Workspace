# Configure direct Google sign-in

> **Retained for later:** the current classroom version sets `AUTH_ENABLED=false`.
> Login routes and session middleware are inactive. To use this guide, set
> `AUTH_ENABLED=true`, fill the settings below and restart/redeploy. Google code
> and dependencies have been kept; they have not been removed.

The backend connects directly to Google using **OAuth 2.0 authorization code flow
with OpenID Connect (OIDC)**. OIDC verifies identity; application permissions stay
in our backend. Auth0 is not involved.

- Protocol client: `openid-client` 6.
- Encrypted cookie sessions: `iron-session` 9.
- Login endpoints: `/auth/login`, `/auth/callback`, `/auth/logout`.
- GraphQL remains `/graphql`, with the same schema, resolvers and services.

## 1. Create a Google Cloud project and configure Google Auth Platform

1. Open [Google Cloud Console](https://console.cloud.google.com/) and select or
   create a project, such as **Students GraphQL**.
2. Open **Google Auth Platform**. If prompted, select **Get started**.
3. Configure **Branding** with the app name, support email and developer contact.
4. Configure **Audience**. Choose **External** if users can have personal Google
   accounts. **Internal** is for eligible Google Workspace organization projects.
5. For an External app in Testing, add the Google accounts you will use under
   **Audience -> Test users**. Access depends on the audience/publishing settings.
6. Under **Data Access**, configure only the basic identity scopes used here:
   `openid`, `https://www.googleapis.com/auth/userinfo.email`, and
   `https://www.googleapis.com/auth/userinfo.profile` (the code requests the
   equivalent `openid profile email`). We do not request Drive, Gmail, offline
   access or refresh tokens.

The console may first ask for project/consent setup before the client page is
available. You do not need a service account for browser sign-in.

## 2. Create the Web application client

Go to **Google Auth Platform -> Clients -> Create client**:

| Setting | Local value |
|---|---|
| Application type | **Web application** |
| Name | `Students GraphQL local` |
| Authorized redirect URIs | `http://localhost:3000/auth/callback` |
| Authorized JavaScript origins | Leave empty for this server redirect flow |

The callback must match exactly, including scheme, hostname, port and path.
`localhost` and `127.0.0.1` are different hosts; use `localhost` consistently.
Google permits HTTP localhost redirect URIs for development. Production uses
HTTPS. There is no Auth0 Application Login URI or Allowed Logout URLs setting.

Save the client ID and client secret securely when they are issued. The browser
never receives the client secret. Do not place downloaded credential files inside
the repository or paste secrets into chat.

## 3. Fill the existing local `.env`

The project already has a private `.env`. Edit only the Google settings:

```env
AUTH_ENABLED=true
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Keep these existing settings:

```env
BASE_URL=http://localhost:3000
NODE_ENV=development
PORT=3000
TRUST_PROXY_HOPS=0
# Keep your existing credentialed MONGODB_URI selecting /Students-Data.
# Keep your existing random SESSION_SECRET (at least 32 characters).
```

The old `AUTH0_*` settings have been removed from the project's local environment.
They cannot be reused as Google credentials. Do not overwrite your `.env` with
`.env.example`, which intentionally contains no credentials.

For a fresh installation, copy `.env.example` to `.env`, fill the MongoDB and
Google settings, and generate a cookie password with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Store the generated value as `SESSION_SECRET`. Keep it private and stable across
restarts. Node's `--env-file` loads local configuration; no `dotenv` is used.

## 4. Prepare and run

```bash
npm ci
```

Review imported IDs, duplicates and relationships in Atlas before running
`npm run indexes` if the declared indexes have not already been created. The
index command changes database indexes; ordinary startup does not create indexes
or seed records. See [README](../README.md#database-selection-and-existing-data).

```bash
npm run dev
```

Open <http://localhost:3000>, then select **Sign in with Google**. Do not open the
callback URL yourself or paste an old callback URL into the browser.

```text
Browser -> GET /auth/login
        -> encrypted 10-minute login cookie (state + nonce + PKCE verifier)
        -> Google sign-in / requested consent
        -> GET /auth/callback?code=...&state=...
        -> validate transaction and exchange code with Google
        -> validate ID token, including signature, issuer, audience and expiry
        -> find/create users document by Google issuer + subject
        -> encrypted 8-hour application cookie (local user ID + expiry)
        -> redirect to /
        -> /graphql uses the same existing Apollo context and resolvers
```

`openid-client` performs the protocol/token checks. The application never stores
Google passwords, access tokens, ID tokens or refresh tokens. The local users
collection holds the verified identity's issuer, subject, name and email.

Use `/docs` for examples and `/graphql` for the development explorer. A later
same-origin browser request sends the app cookie automatically. Our middleware
checks that its local user still exists and passes that ID into Apollo context.
All signed-in users can manage the course's sample student and mark records;
Google sign-in does not itself assign staff privileges or student ownership.

## 5. Sessions and logout

- HttpOnly and SameSite Lax cookies; Secure with `__Host-` names in production.
- Login transaction expires after 10 minutes; app login expires after 8 hours
  without automatic renewal. Sign in again after expiry.
- Starting another login in the same browser replaces its pending transaction;
  finish the most recently started login.
- The home page submits `POST /auth/logout`, protected by the same-origin check.
  It clears both application and pending-login cookies and redirects home.
- **Logout does not sign out of Google, revoke Google's consent, or delete users.**
  The login flow offers account selection on the next sign-in.
- Cookies are stateless. Logout clears this browser's cookie; a previously copied
  cookie can remain usable until expiry. Removing the local user or rotating the
  session secret invalidates access (rotation affects every user).

## 6. Production on Render

1. Set `BASE_URL` to the actual service origin, for example
   `https://students-graphql.onrender.com`.
2. Register that origin plus `/auth/callback` as an Authorized redirect URI in
   your Google Web application client. Use a separate production client/project
   when isolating production from development.
3. Set `AUTH_ENABLED=true` and supply `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET` and
   `MONGODB_URI` through Render's secret environment settings.
4. Set `NODE_ENV=production` and `TRUST_PROXY_HOPS=1` as in `render.yaml`.
5. Configure Google's audience/publishing settings for the intended users. Review
   Google's branding/domain and verification requirements before a public launch;
   requirements depend on audience, branding and requested scopes. Deploying to
   Render alone does not publish the Google OAuth app.

See [deployment instructions](deployment.md) for build/start and Atlas settings.

## 7. Existing Auth0 users

Existing records are preserved. Google users are identified by the pair:

```text
issuer:  https://accounts.google.com
subject: Google's stable sub claim
```

An old Auth0 issuer/subject is a different identity, even for the same email.
There is no automatic account merging or reassignment of roles/ownership by email.
A first Google login creates its own local profile. If existing accounts must be
linked, design an explicit verified migration before relying on account ownership.
Old Auth0 sessions do not authenticate this implementation; users sign in again.

## Troubleshooting

| Symptom | Check |
|---|---|
| Startup names missing `GOOGLE_*` settings | Fill both keys in `.env`, then restart. |
| `redirect_uri_mismatch` | Register the exact `BASE_URL` plus `/auth/callback` on the same Google client used in `.env`. |
| Access blocked / `access_denied` | Check audience, publishing status, test users and Workspace organization policy. A cancelled login also fails without creating a session. |
| Invalid client | Use the Google Web application client's ID/secret pair, not Auth0 credentials or a service account. |
| Login expired / not started here | Start again at `/auth/login`; allow cookies and use the same browser/host. Finish the latest login within 10 minutes. |
| Google sign-in failed | Start again; confirm credentials, redirect URI, network access to Google and the server clock. Provider details and tokens are intentionally not exposed. |
| Cookie missing locally | Use HTTP localhost with `NODE_ENV=development`. Production cookies require HTTPS. |
| Cookie missing in production | Confirm HTTPS `BASE_URL` and preserve `SESSION_SECRET` across instances/deploys. |
| GraphQL `UNAUTHENTICATED` | Sign in and send the application cookie. A Google ID token is not a bearer credential for this API. |
| HTTP 403 on POST | Origin must match `BASE_URL`; use the home page logout form or same-origin GraphQL calls. |
| User creation fails | Check Atlas connectivity/permissions and prepare the unique `(issuer, subject)` users index. |

## Official references

- [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect)
- [Google web server OAuth flow](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google OAuth production policies](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance)
- [openid-client documentation and OIDC example](https://github.com/panva/openid-client)
- [iron-session documentation](https://github.com/vvo/iron-session)
