This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Documentation

- [Yönetim Paneli Kullanım Kılavuzu](docs/YONETIM-PANELI-KULLANIM-KILAVUZU.md)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Payload infrastructure providers

Development defaults to `PAYLOAD_DATABASE=sqlite` and
`PAYLOAD_STORAGE=local`. This preserves the existing `.data/payload.db`
database and `public/media` files. Production can use
`PAYLOAD_DATABASE=postgres` with a Neon `DATABASE_URL` and
`PAYLOAD_STORAGE=vercel-blob` with `BLOB_READ_WRITE_TOKEN`. Blob storage is
applied only to the `media` collection. Blob uploads continue through
Payload's server-side validation so the existing MIME restrictions and
10 MiB limit remain enforced. Hosting request limits may lower the practical
upload size without changing that application-level maximum.

If any public source is set to `payload` during a production build, all of
the following are required: PostgreSQL, Vercel Blob, `DATABASE_URL`,
`PAYLOAD_SECRET`, and `BLOB_READ_WRITE_TOKEN`. Missing configuration stops
the build instead of falling back to local persistence.

### PostgreSQL migrations

Do not run migrations until the Neon database and its credentials exist.
PostgreSQL schema push is disabled, so this migration flow is required.
SQLite data and local media are not migrated automatically.

1. Set `PAYLOAD_DATABASE=postgres`, `DATABASE_URL`, and `PAYLOAD_SECRET` in
   the command environment.
2. Generate and review a migration with
   `npm run payload:migrate:create`.
3. Check the target database with `npm run payload:migrate:status`.
4. Apply reviewed migrations with `npm run payload:migrate`.

The migration commands operate on the configured database. Copying existing
SQLite content and local media requires a separate, explicitly planned
data-migration step.

### Production content strategy

Production starts with an empty PostgreSQL database. The local SQLite test
data and files under `public/media` are not transferred to Production. Add
real content through the Production admin panel and upload real media there
to Vercel Blob. Static fixtures and test media are never Production content;
the Production migration command creates schema only and does not move
content or media.

### Production first administrator

With a clean Production database, visit `/admin` and use Payload's first-user
screen to create the initial administrator. After that user exists, anonymous
first-user registration is closed and creating additional users requires an
authenticated administrator. Never commit administrator credentials, tokens,
or secrets to Git.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
