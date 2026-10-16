# Layout A architecture

## Startup

```text
Native Node env-file loading (development) / host environment (production)
  -> config/env.ts validates settings
  -> server.ts connects once to MongoDB Students-Data
  -> merge schema + resolver maps, start Apollo
  -> app.ts registers Express handlers
  -> listen on PORT at 0.0.0.0
```

Index creation is explicit maintenance through `scripts/create-indexes.ts`, not
part of ordinary startup. No server request opens a new MongoDB connection.

## Requests

```text
HTTP request
  -> Express app
     -> /health or /docs: public infrastructure handler -> response
     -> sameOriginWrites: reject untrusted write origin
     -> JSON parser: enforce 32 KB limit
     -> AUTH_ENABLED=false: skip auth routes/session, currentUser=null
     -> AUTH_ENABLED=true: use the retained authentication path below
     -> authentication router (only when enabled; matching routes run)
        |-- GET /auth/login -> transaction cookie -> Google redirect -> END
        |-- GET /auth/callback -> validate login -> users -> app cookie
        |                        -> redirect home -> END
        |-- POST /auth/logout -> clear cookies -> redirect home -> END
        '-- other paths continue
             -> current-user middleware: app cookie -> existing users document
             -> /graphql: Apollo middleware
                -> context: checked currentUser + shared services
                -> GraphQL parse/validation/variable checks
                -> resolver: require user only when AUTH_ENABLED=true
                -> service -> input validator -> application rules
                -> repository -> Mongoose model -> MongoDB
                <- record/result -> service -> resolver
                -> complete requested fields, format result/errors
             <- Apollo middleware -> HTTP response
  <- client reads GraphQL JSON
```

The current classroom version explicitly sets `AUTH_ENABLED=false`. It exposes
Sandbox/introspection on Render and bypasses only the login requirement, without
a fake user or changes to validation, CRUD and database integrity rules.

When enabled, login and callbacks run in the authentication router before user-restoration
middleware. `openid-client` handles the OIDC protocol; `iron-session` encrypts
cookies. GraphQL context receives the same local user ID as before. Other HTTP
failures reach the final Express error handler. GraphQL execution errors are
handled inside Apollo, including final masking of unexpected completion failures.
Some GraphQL errors use HTTP 200, so clients inspect the `errors` array.

## Responsibilities

| Layer | Responsibility |
|---|---|
| Type definitions | API fields, arguments, input and output shapes. |
| Resolver | Authorize the field and call the matching service. |
| Context | Request identity and already-created services. |
| Validator | Check permitted input values; it does not query the database. |
| Service | Coordinate CRUD, relationship checks, transactions and averages. |
| Repository | Database queries through the Mongoose model. |
| Model | MongoDB field types, storage rules and explicit collection/index definitions. |
| Calculation helper | Average of the four checked scores. |

Services and repositories are organizational choices in this layout, not requirements
imposed by GraphQL. The local users model supports Google issuer/subject identity
mapping and does not expose a separate users CRUD API.

## Relationship integrity

Creating/updating marks and deleting a student write the same student's internal
`relationVersion` field in a transaction. A student must exist before marks are
saved. If marks exist, student deletion returns CONFLICT. The shared parent write
causes competing transactions to conflict/retry rather than leaving an orphan.
The unique mark-record index enforces one mark record per student.

## Shutdown

The application owns signal handling. SIGINT/SIGTERM stops Apollo, drains the HTTP
server, then disconnects MongoDB. Apollo's automatic signal handler is disabled to
avoid competing shutdown paths. A deadline bounds cleanup time.
