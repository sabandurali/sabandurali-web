import { MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN "reset_password_requested_at" timestamp(3) with time zone;
  ALTER TABLE "media" ADD COLUMN "_objectkey" varchar;
  CREATE INDEX "categories_locales_parent_id_idx" ON "categories_locales" USING btree ("_parent_id");
  CREATE INDEX "district_guides_neighborhoods_locales_parent_id_idx" ON "district_guides_neighborhoods_locales" USING btree ("_parent_id");
  CREATE INDEX "district_guides_planning_developments_locales_parent_id_idx" ON "district_guides_planning_developments_locales" USING btree ("_parent_id");
  CREATE INDEX "district_guides_locales_parent_id_idx" ON "district_guides_locales" USING btree ("_parent_id");
  CREATE INDEX "_district_guides_v_version_neighborhoods_locales_parent__idx" ON "_district_guides_v_version_neighborhoods_locales" USING btree ("_parent_id");
  CREATE INDEX "_district_guides_v_version_planning_developments_locales_idx" ON "_district_guides_v_version_planning_developments_locales" USING btree ("_parent_id");
  CREATE INDEX "_district_guides_v_locales_parent_id_idx" ON "_district_guides_v_locales" USING btree ("_parent_id");
  CREATE INDEX "articles_locales_parent_id_idx" ON "articles_locales" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_locales_parent_id_idx" ON "_articles_v_locales" USING btree ("_parent_id");
  CREATE INDEX "photo_collections_locales_parent_id_idx" ON "photo_collections_locales" USING btree ("_parent_id");
  CREATE INDEX "tags_locales_parent_id_idx" ON "tags_locales" USING btree ("_parent_id");
  CREATE INDEX "photos_locales_parent_id_idx" ON "photos_locales" USING btree ("_parent_id");
  CREATE INDEX "_photos_v_locales_parent_id_idx" ON "_photos_v_locales" USING btree ("_parent_id");`)
}

export async function down(): Promise<void> {
  throw new Error('Automatic rollback is disabled to preserve password reset metadata and media object keys. Keep this additive schema when rolling application code back.');
}
