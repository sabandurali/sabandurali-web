import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_photos_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__photos_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__photos_v_published_locale" AS ENUM('tr', 'en');
  CREATE TABLE "photo_collections" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "parent_id" uuid,
    "sort_order" numeric DEFAULT 0,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "photo_collections_locales" (
    "title" varchar NOT NULL,
    "slug" varchar NOT NULL,
    "description" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" uuid NOT NULL
  );

  CREATE TABLE "tags" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "tags_locales" (
    "title" varchar NOT NULL,
    "slug" varchar NOT NULL,
    "description" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" uuid NOT NULL
  );

  CREATE TABLE "photos" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "image_id" uuid,
    "taken_at" timestamp(3) with time zone,
    "photographer" varchar DEFAULT 'Şaban Durali',
    "credit_license" varchar,
    "featured" boolean DEFAULT false,
    "exif_camera" varchar,
    "exif_lens" varchar,
    "exif_focal_length" varchar,
    "exif_aperture" varchar,
    "exif_shutter_speed" varchar,
    "exif_iso" varchar,
    "published_at" timestamp(3) with time zone,
    "seo_open_graph_image_id" uuid,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_photos_status" DEFAULT 'draft'
  );

  CREATE TABLE "photos_locales" (
    "title" varchar,
    "slug" varchar,
    "description" varchar,
    "alt_text" varchar,
    "location_name" varchar,
    "seo_meta_title" varchar,
    "seo_meta_description" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" uuid NOT NULL
  );

  CREATE TABLE "photos_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" uuid NOT NULL,
    "path" varchar NOT NULL,
    "photo_collections_id" uuid,
    "tags_id" uuid
  );

  CREATE TABLE "_photos_v" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "parent_id" uuid,
    "version_image_id" uuid,
    "version_taken_at" timestamp(3) with time zone,
    "version_photographer" varchar DEFAULT 'Şaban Durali',
    "version_credit_license" varchar,
    "version_featured" boolean DEFAULT false,
    "version_exif_camera" varchar,
    "version_exif_lens" varchar,
    "version_exif_focal_length" varchar,
    "version_exif_aperture" varchar,
    "version_exif_shutter_speed" varchar,
    "version_exif_iso" varchar,
    "version_published_at" timestamp(3) with time zone,
    "version_seo_open_graph_image_id" uuid,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__photos_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "snapshot" boolean,
    "published_locale" "enum__photos_v_published_locale",
    "latest" boolean
  );

  CREATE TABLE "_photos_v_locales" (
    "version_title" varchar,
    "version_slug" varchar,
    "version_description" varchar,
    "version_alt_text" varchar,
    "version_location_name" varchar,
    "version_seo_meta_title" varchar,
    "version_seo_meta_description" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" uuid NOT NULL
  );

  CREATE TABLE "_photos_v_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" uuid NOT NULL,
    "path" varchar NOT NULL,
    "photo_collections_id" uuid,
    "tags_id" uuid
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "photo_collections_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tags_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "photos_id" uuid;
  ALTER TABLE "photo_collections" ADD CONSTRAINT "photo_collections_parent_id_photo_collections_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."photo_collections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "photo_collections_locales" ADD CONSTRAINT "photo_collections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."photo_collections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tags_locales" ADD CONSTRAINT "tags_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "photos" ADD CONSTRAINT "photos_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "photos" ADD CONSTRAINT "photos_seo_open_graph_image_id_media_id_fk" FOREIGN KEY ("seo_open_graph_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "photos_locales" ADD CONSTRAINT "photos_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "photos_rels" ADD CONSTRAINT "photos_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "photos_rels" ADD CONSTRAINT "photos_rels_photo_collections_fk" FOREIGN KEY ("photo_collections_id") REFERENCES "public"."photo_collections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "photos_rels" ADD CONSTRAINT "photos_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_photos_v" ADD CONSTRAINT "_photos_v_parent_id_photos_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."photos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_photos_v" ADD CONSTRAINT "_photos_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_photos_v" ADD CONSTRAINT "_photos_v_version_seo_open_graph_image_id_media_id_fk" FOREIGN KEY ("version_seo_open_graph_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_photos_v_locales" ADD CONSTRAINT "_photos_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_photos_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_photos_v_rels" ADD CONSTRAINT "_photos_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_photos_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_photos_v_rels" ADD CONSTRAINT "_photos_v_rels_photo_collections_fk" FOREIGN KEY ("photo_collections_id") REFERENCES "public"."photo_collections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_photos_v_rels" ADD CONSTRAINT "_photos_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "photo_collections_parent_idx" ON "photo_collections" USING btree ("parent_id");
  CREATE INDEX "photo_collections_updated_at_idx" ON "photo_collections" USING btree ("updated_at");
  CREATE INDEX "photo_collections_created_at_idx" ON "photo_collections" USING btree ("created_at");
  CREATE UNIQUE INDEX "photo_collections_slug_idx" ON "photo_collections_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "photo_collections_locales_locale_parent_id_unique" ON "photo_collections_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  CREATE UNIQUE INDEX "tags_slug_idx" ON "tags_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "tags_locales_locale_parent_id_unique" ON "tags_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "photos_image_idx" ON "photos" USING btree ("image_id");
  CREATE INDEX "photos_seo_seo_open_graph_image_idx" ON "photos" USING btree ("seo_open_graph_image_id");
  CREATE INDEX "photos_updated_at_idx" ON "photos" USING btree ("updated_at");
  CREATE INDEX "photos_created_at_idx" ON "photos" USING btree ("created_at");
  CREATE INDEX "photos__status_idx" ON "photos" USING btree ("_status");
  CREATE UNIQUE INDEX "photos_slug_idx" ON "photos_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "photos_locales_locale_parent_id_unique" ON "photos_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "photos_rels_order_idx" ON "photos_rels" USING btree ("order");
  CREATE INDEX "photos_rels_parent_idx" ON "photos_rels" USING btree ("parent_id");
  CREATE INDEX "photos_rels_path_idx" ON "photos_rels" USING btree ("path");
  CREATE INDEX "photos_rels_photo_collections_id_idx" ON "photos_rels" USING btree ("photo_collections_id");
  CREATE INDEX "photos_rels_tags_id_idx" ON "photos_rels" USING btree ("tags_id");
  CREATE INDEX "_photos_v_parent_idx" ON "_photos_v" USING btree ("parent_id");
  CREATE INDEX "_photos_v_version_version_image_idx" ON "_photos_v" USING btree ("version_image_id");
  CREATE INDEX "_photos_v_version_seo_version_seo_open_graph_image_idx" ON "_photos_v" USING btree ("version_seo_open_graph_image_id");
  CREATE INDEX "_photos_v_version_version_updated_at_idx" ON "_photos_v" USING btree ("version_updated_at");
  CREATE INDEX "_photos_v_version_version_created_at_idx" ON "_photos_v" USING btree ("version_created_at");
  CREATE INDEX "_photos_v_version_version__status_idx" ON "_photos_v" USING btree ("version__status");
  CREATE INDEX "_photos_v_created_at_idx" ON "_photos_v" USING btree ("created_at");
  CREATE INDEX "_photos_v_updated_at_idx" ON "_photos_v" USING btree ("updated_at");
  CREATE INDEX "_photos_v_snapshot_idx" ON "_photos_v" USING btree ("snapshot");
  CREATE INDEX "_photos_v_published_locale_idx" ON "_photos_v" USING btree ("published_locale");
  CREATE INDEX "_photos_v_latest_idx" ON "_photos_v" USING btree ("latest");
  CREATE INDEX "_photos_v_version_version_slug_idx" ON "_photos_v_locales" USING btree ("version_slug","_locale");
  CREATE UNIQUE INDEX "_photos_v_locales_locale_parent_id_unique" ON "_photos_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_photos_v_rels_order_idx" ON "_photos_v_rels" USING btree ("order");
  CREATE INDEX "_photos_v_rels_parent_idx" ON "_photos_v_rels" USING btree ("parent_id");
  CREATE INDEX "_photos_v_rels_path_idx" ON "_photos_v_rels" USING btree ("path");
  CREATE INDEX "_photos_v_rels_photo_collections_id_idx" ON "_photos_v_rels" USING btree ("photo_collections_id");
  CREATE INDEX "_photos_v_rels_tags_id_idx" ON "_photos_v_rels" USING btree ("tags_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_photo_collections_fk" FOREIGN KEY ("photo_collections_id") REFERENCES "public"."photo_collections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_photos_fk" FOREIGN KEY ("photos_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_photo_collections_id_idx" ON "payload_locked_documents_rels" USING btree ("photo_collections_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");
  CREATE INDEX "payload_locked_documents_rels_photos_id_idx" ON "payload_locked_documents_rels" USING btree ("photos_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "photo_collections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "photo_collections_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tags_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "photos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "photos_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "photos_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_photos_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_photos_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_photos_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "photo_collections" CASCADE;
  DROP TABLE "photo_collections_locales" CASCADE;
  DROP TABLE "tags" CASCADE;
  DROP TABLE "tags_locales" CASCADE;
  DROP TABLE "photos" CASCADE;
  DROP TABLE "photos_locales" CASCADE;
  DROP TABLE "photos_rels" CASCADE;
  DROP TABLE "_photos_v" CASCADE;
  DROP TABLE "_photos_v_locales" CASCADE;
  DROP TABLE "_photos_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_photo_collections_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tags_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_photos_fk";

  DROP INDEX "payload_locked_documents_rels_photo_collections_id_idx";
  DROP INDEX "payload_locked_documents_rels_tags_id_idx";
  DROP INDEX "payload_locked_documents_rels_photos_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "photo_collections_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tags_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "photos_id";
  DROP TYPE "public"."enum_photos_status";
  DROP TYPE "public"."enum__photos_v_version_status";
  DROP TYPE "public"."enum__photos_v_published_locale";`)
}
