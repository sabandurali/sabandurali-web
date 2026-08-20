import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_navigation_en_header_children_link_type" AS ENUM('page', 'internal', 'external');
  CREATE TYPE "public"."enum_navigation_en_header_link_type" AS ENUM('page', 'internal', 'external');
  CREATE TYPE "public"."enum_navigation_en_footer_links_link_type" AS ENUM('page', 'internal', 'external');
  CREATE TYPE "public"."enum__navigation_v_version_en_header_children_link_type" AS ENUM('page', 'internal', 'external');
  CREATE TYPE "public"."enum__navigation_v_version_en_header_link_type" AS ENUM('page', 'internal', 'external');
  CREATE TYPE "public"."enum__navigation_v_version_en_footer_links_link_type" AS ENUM('page', 'internal', 'external');
  CREATE TABLE "navigation_en_header_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"active" boolean DEFAULT true,
  	"link_type" "enum_navigation_en_header_children_link_type" DEFAULT 'internal',
  	"page_id" uuid,
  	"internal_path" varchar,
  	"external_url" varchar,
  	"new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "navigation_en_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"active" boolean DEFAULT true,
  	"link_type" "enum_navigation_en_header_link_type" DEFAULT 'internal',
  	"page_id" uuid,
  	"internal_path" varchar,
  	"external_url" varchar,
  	"new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "navigation_en_footer_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"active" boolean DEFAULT true,
  	"link_type" "enum_navigation_en_footer_links_link_type" DEFAULT 'internal',
  	"page_id" uuid,
  	"internal_path" varchar,
  	"external_url" varchar,
  	"new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "navigation_en_footer" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"active" boolean DEFAULT true
  );
  
  CREATE TABLE "_navigation_v_version_en_header_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"label" varchar,
  	"active" boolean DEFAULT true,
  	"link_type" "enum__navigation_v_version_en_header_children_link_type" DEFAULT 'internal',
  	"page_id" uuid,
  	"internal_path" varchar,
  	"external_url" varchar,
  	"new_tab" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_navigation_v_version_en_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"label" varchar,
  	"active" boolean DEFAULT true,
  	"link_type" "enum__navigation_v_version_en_header_link_type" DEFAULT 'internal',
  	"page_id" uuid,
  	"internal_path" varchar,
  	"external_url" varchar,
  	"new_tab" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_navigation_v_version_en_footer_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"label" varchar,
  	"active" boolean DEFAULT true,
  	"link_type" "enum__navigation_v_version_en_footer_links_link_type" DEFAULT 'internal',
  	"page_id" uuid,
  	"internal_path" varchar,
  	"external_url" varchar,
  	"new_tab" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_navigation_v_version_en_footer" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"active" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  ALTER TABLE "navigation_en_header_children" ADD CONSTRAINT "navigation_en_header_children_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_en_header_children" ADD CONSTRAINT "navigation_en_header_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_en_header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_en_header" ADD CONSTRAINT "navigation_en_header_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_en_header" ADD CONSTRAINT "navigation_en_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_en_footer_links" ADD CONSTRAINT "navigation_en_footer_links_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_en_footer_links" ADD CONSTRAINT "navigation_en_footer_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_en_footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_en_footer" ADD CONSTRAINT "navigation_en_footer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_en_header_children" ADD CONSTRAINT "_navigation_v_version_en_header_children_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_en_header_children" ADD CONSTRAINT "_navigation_v_version_en_header_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v_version_en_header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_en_header" ADD CONSTRAINT "_navigation_v_version_en_header_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_en_header" ADD CONSTRAINT "_navigation_v_version_en_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_en_footer_links" ADD CONSTRAINT "_navigation_v_version_en_footer_links_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_en_footer_links" ADD CONSTRAINT "_navigation_v_version_en_footer_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v_version_en_footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_en_footer" ADD CONSTRAINT "_navigation_v_version_en_footer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "navigation_en_header_children_order_idx" ON "navigation_en_header_children" USING btree ("_order");
  CREATE INDEX "navigation_en_header_children_parent_id_idx" ON "navigation_en_header_children" USING btree ("_parent_id");
  CREATE INDEX "navigation_en_header_children_page_idx" ON "navigation_en_header_children" USING btree ("page_id");
  CREATE INDEX "navigation_en_header_order_idx" ON "navigation_en_header" USING btree ("_order");
  CREATE INDEX "navigation_en_header_parent_id_idx" ON "navigation_en_header" USING btree ("_parent_id");
  CREATE INDEX "navigation_en_header_page_idx" ON "navigation_en_header" USING btree ("page_id");
  CREATE INDEX "navigation_en_footer_links_order_idx" ON "navigation_en_footer_links" USING btree ("_order");
  CREATE INDEX "navigation_en_footer_links_parent_id_idx" ON "navigation_en_footer_links" USING btree ("_parent_id");
  CREATE INDEX "navigation_en_footer_links_page_idx" ON "navigation_en_footer_links" USING btree ("page_id");
  CREATE INDEX "navigation_en_footer_order_idx" ON "navigation_en_footer" USING btree ("_order");
  CREATE INDEX "navigation_en_footer_parent_id_idx" ON "navigation_en_footer" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_en_header_children_order_idx" ON "_navigation_v_version_en_header_children" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_en_header_children_parent_id_idx" ON "_navigation_v_version_en_header_children" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_en_header_children_page_idx" ON "_navigation_v_version_en_header_children" USING btree ("page_id");
  CREATE INDEX "_navigation_v_version_en_header_order_idx" ON "_navigation_v_version_en_header" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_en_header_parent_id_idx" ON "_navigation_v_version_en_header" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_en_header_page_idx" ON "_navigation_v_version_en_header" USING btree ("page_id");
  CREATE INDEX "_navigation_v_version_en_footer_links_order_idx" ON "_navigation_v_version_en_footer_links" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_en_footer_links_parent_id_idx" ON "_navigation_v_version_en_footer_links" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_en_footer_links_page_idx" ON "_navigation_v_version_en_footer_links" USING btree ("page_id");
  CREATE INDEX "_navigation_v_version_en_footer_order_idx" ON "_navigation_v_version_en_footer" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_en_footer_parent_id_idx" ON "_navigation_v_version_en_footer" USING btree ("_parent_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "navigation_en_header_children" CASCADE;
  DROP TABLE "navigation_en_header" CASCADE;
  DROP TABLE "navigation_en_footer_links" CASCADE;
  DROP TABLE "navigation_en_footer" CASCADE;
  DROP TABLE "_navigation_v_version_en_header_children" CASCADE;
  DROP TABLE "_navigation_v_version_en_header" CASCADE;
  DROP TABLE "_navigation_v_version_en_footer_links" CASCADE;
  DROP TABLE "_navigation_v_version_en_footer" CASCADE;
  DROP TYPE "public"."enum_navigation_en_header_children_link_type";
  DROP TYPE "public"."enum_navigation_en_header_link_type";
  DROP TYPE "public"."enum_navigation_en_footer_links_link_type";
  DROP TYPE "public"."enum__navigation_v_version_en_header_children_link_type";
  DROP TYPE "public"."enum__navigation_v_version_en_header_link_type";
  DROP TYPE "public"."enum__navigation_v_version_en_footer_links_link_type";`)
}
