## Project layout

```text
server.ts                           Startup, HTTP listener and graceful shutdown
apps/api/src/
  app.ts                            Middleware order and endpoint registration
  config/env.ts                     Validate environment; report names, not secrets
  db/mongoose.ts                    One shared Students-Data connection
  auth/auth.ts                      Google login/callback and application logout
  auth/session.ts                   Encrypted login transaction and app cookies
  auth/current-user.ts              Google identity -> local users; session restore
  middleware/origin.ts              Same-origin browser-write policy
  middleware/errors.ts              Safe HTTP errors
  routes/health.routes.ts           Public database readiness endpoint
  routes/documentation.routes.ts    Public API reference and generated SDL
  graphql/context.ts                Checked currentUser + shared services
  graphql/schema.ts                 Merge feature SDL and resolver maps
  graphql/errors.ts                 Expected errors and final error masking
  validators/student.ts             Student input rules
  validators/mark-record.ts          Score input rules
  modules/users/user.model.ts       Google issuer/subject identity mapping
  modules/students/
    student.model.ts                Explicit students collection and unique index
    student.typeDefs.ts             GraphQL fields/inputs
    student.resolvers.ts            Two queries and three mutations
    student.service.ts              Validation and application rules
    student.repository.ts           Mongoose database operations
  modules/mark-records/
    mark-record.model.ts            Explicit markRecords collection and unique index
    mark-record.typeDefs.ts         GraphQL fields/inputs
    mark-record.resolvers.ts        Two queries and three mutations
    mark-record.service.ts          Student relationship and score-write rules
    mark-record.repository.ts       Mongoose database operations
    mark-record.calculations.ts     Average from the four checked scores
scripts/create-indexes.ts           Explicit index maintenance, not normal startup
requests.rest                       Local and Render GraphQL HTTP requests
docs/                               Google, API, architecture and deployment guides
render.yaml                         Backend-only Render Blueprint
```

## Official references

- [Apollo Express 5 integration](https://www.apollographql.com/docs/apollo-server/api/express-middleware)
- [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect)
- [openid-client](https://github.com/panva/openid-client)
- [iron-session](https://github.com/vvo/iron-session)
- [Mongoose 9 migration](https://mongoosejs.com/docs/migrating_to_9.html)
- [Mongoose transactions](https://mongoosejs.com/docs/transactions.html)
- [Node 24 environment files](https://nodejs.org/download/release/latest-v24.x/docs/api/cli.html#--env-filefile)
