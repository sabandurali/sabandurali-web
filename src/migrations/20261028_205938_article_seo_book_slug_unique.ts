import { MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'editor';
  ALTER TABLE "media" ADD COLUMN "focal_x" numeric;
  ALTER TABLE "media" ADD COLUMN "focal_y" numeric;
  ALTER TABLE "articles" ADD COLUMN "author_name" varchar DEFAULT 'Şaban Durali';
  ALTER TABLE "articles" ADD COLUMN "seo_index" boolean DEFAULT true;
  ALTER TABLE "articles" ADD COLUMN "seo_follow" boolean DEFAULT true;
  ALTER TABLE "articles_locales" ADD COLUMN "seo_canonical" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_author_name" varchar DEFAULT 'Şaban Durali';
  ALTER TABLE "_articles_v" ADD COLUMN "version_seo_index" boolean DEFAULT true;
  ALTER TABLE "_articles_v" ADD COLUMN "version_seo_follow" boolean DEFAULT true;
  ALTER TABLE "_articles_v_locales" ADD COLUMN "version_seo_canonical" varchar;
  CREATE UNIQUE INDEX "language_slug_1_idx" ON "books" USING btree ("language","slug");
  CREATE INDEX "version_language_version_slug_1_idx" ON "_books_v" USING btree ("version_language","version_slug");`)
}

export async function down(): Promise<void> {
  throw new Error('Automatic rollback is disabled to preserve article SEO settings and authors. Keep this additive schema (and the book language/slug unique index) when rolling application code back.');
}
