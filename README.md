## Setup

```bash
npm i
```

Then, create a `.env` file with the following example data

```bash
PORT=3000
SIWE_DOMAIN=localhost
SIWE_ORIGIN=https://localhost/login
SESSION_SECRET=example-secret
CORS_ORIGIN=http://localhost:5173


# This was inserted by `prisma init`:
# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema

# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

DATABASE_URL="file:./dev.db"
```

Initialize the database

```bash
npx prisma migrate dev
```

Start the server

```bash
npm run dev
```

## Design choices

Using `express` as a webserver with basic extensions like `cors` and `session` gives a great fundation for a Node.js webserver.

Handling database models with `prisma` makes it easy to handle data using an ORM.

`siwe` and `ethers` make it possible to link accounts with Ethereum ecosystem.

Using `/current-user` as an API endpoint makes it convenient for the client to fetch the current user based on cookies rather than the actual id.
