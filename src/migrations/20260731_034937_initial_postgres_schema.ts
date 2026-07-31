import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('tr', 'en');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');
  CREATE TYPE "public"."enum_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__articles_v_published_locale" AS ENUM('tr', 'en');
  CREATE TYPE "public"."enum_books_language" AS ENUM('tr', 'en');
  CREATE TYPE "public"."enum_books_category" AS ENUM('business_and_management', 'psychology_and_behavior', 'sales_and_negotiation', 'learning_and_education', 'artificial_intelligence_and_technology', 'real_estate_and_investment', 'personal_development', 'biography_and_history', 'economics_and_finance', 'other');
  CREATE TYPE "public"."enum_books_reading_status" AS ENUM('planned', 'reading', 'completed', 'paused', 'abandoned');
  CREATE TYPE "public"."enum_books_review_status" AS ENUM('draft', 'in_review', 'scheduled', 'published', 'archived');
  CREATE TYPE "public"."enum_books_translation_status" AS ENUM('none', 'pending', 'in_progress', 'completed', 'outdated');
  CREATE TYPE "public"."enum_books_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__books_v_version_language" AS ENUM('tr', 'en');
  CREATE TYPE "public"."enum__books_v_version_category" AS ENUM('business_and_management', 'psychology_and_behavior', 'sales_and_negotiation', 'learning_and_education', 'artificial_intelligence_and_technology', 'real_estate_and_investment', 'personal_development', 'biography_and_history', 'economics_and_finance', 'other');
  CREATE TYPE "public"."enum__books_v_version_reading_status" AS ENUM('planned', 'reading', 'completed', 'paused', 'abandoned');
  CREATE TYPE "public"."enum__books_v_version_review_status" AS ENUM('draft', 'in_review', 'scheduled', 'published', 'archived');
  CREATE TYPE "public"."enum__books_v_version_translation_status" AS ENUM('none', 'pending', 'in_progress', 'completed', 'outdated');
  CREATE TYPE "public"."enum__books_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__books_v_published_locale" AS ENUM('tr', 'en');
  CREATE TYPE "public"."enum_pages_blocks_home_focus_areas_cards_icon" AS ENUM('book', 'city', 'network', 'handshake');
  CREATE TYPE "public"."enum_pages_blocks_card_group_cards_icon" AS ENUM('book', 'city', 'network', 'handshake');
  CREATE TYPE "public"."enum_pages_blocks_image_text_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum_pages_language" AS ENUM('tr', 'en');
  CREATE TYPE "public"."enum_pages_page_type" AS ENUM('home', 'standard');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_blocks_home_focus_areas_cards_icon" AS ENUM('book', 'city', 'network', 'handshake');
  CREATE TYPE "public"."enum__pages_v_blocks_card_group_cards_icon" AS ENUM('book', 'city', 'network', 'handshake');
  CREATE TYPE "public"."enum__pages_v_blocks_image_text_image_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum__pages_v_version_language" AS ENUM('tr', 'en');
  CREATE TYPE "public"."enum__pages_v_version_page_type" AS ENUM('home', 'standard');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_published_locale" AS ENUM('tr', 'en');
  CREATE TYPE "public"."enum_navigation_header_items_children_link_type" AS ENUM('page', 'internal', 'external');
  CREATE TYPE "public"."enum_navigation_header_items_link_type" AS ENUM('page', 'internal', 'external');
  CREATE TYPE "public"."enum_navigation_footer_groups_links_link_type" AS ENUM('page', 'internal', 'external');
  CREATE TYPE "public"."enum_navigation_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__navigation_v_version_header_items_children_link_type" AS ENUM('page', 'internal', 'external');
  CREATE TYPE "public"."enum__navigation_v_version_header_items_link_type" AS ENUM('page', 'internal', 'external');
  CREATE TYPE "public"."enum__navigation_v_version_footer_groups_links_link_type" AS ENUM('page', 'internal', 'external');
  CREATE TYPE "public"."enum__navigation_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__navigation_v_published_locale" AS ENUM('tr', 'en');
  CREATE TABLE "users_sessions" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "created_at" timestamp(3) with time zone,
    "expires_at" timestamp(3) with time zone NOT NULL
  );

  CREATE TABLE "users" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "role" "enum_users_role" DEFAULT 'admin' NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "email" varchar NOT NULL,
    "reset_password_token" varchar,
    "reset_password_expiration" timestamp(3) with time zone,
    "salt" varchar,
    "hash" varchar,
    "login_attempts" numeric DEFAULT 0,
    "lock_until" timestamp(3) with time zone
  );

  CREATE TABLE "media" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "alt" varchar NOT NULL,
    "description" varchar,
    "source_copyright" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "url" varchar,
    "thumbnail_u_r_l" varchar,
    "filename" varchar,
    "mime_type" varchar,
    "filesize" numeric,
    "width" numeric,
    "height" numeric
  );

  CREATE TABLE "categories" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "sort_order" numeric DEFAULT 0,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "categories_locales" (
    "name" varchar NOT NULL,
    "slug" varchar NOT NULL,
    "description" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" uuid NOT NULL
  );

  CREATE TABLE "articles" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "featured_image_id" uuid,
    "featured" boolean DEFAULT false,
    "published_at" timestamp(3) with time zone,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_articles_status" DEFAULT 'draft'
  );

  CREATE TABLE "articles_locales" (
    "title" varchar,
    "slug" varchar,
    "excerpt" varchar,
    "content" jsonb,
    "featured_image_alt" varchar,
    "seo_meta_title" varchar,
    "seo_meta_description" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" uuid NOT NULL
  );

  CREATE TABLE "articles_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" uuid NOT NULL,
    "path" varchar NOT NULL,
    "categories_id" uuid
  );

  CREATE TABLE "_articles_v" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "parent_id" uuid,
    "version_featured_image_id" uuid,
    "version_featured" boolean DEFAULT false,
    "version_published_at" timestamp(3) with time zone,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__articles_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "snapshot" boolean,
    "published_locale" "enum__articles_v_published_locale",
    "latest" boolean
  );

  CREATE TABLE "_articles_v_locales" (
    "version_title" varchar,
    "version_slug" varchar,
    "version_excerpt" varchar,
    "version_content" jsonb,
    "version_featured_image_alt" varchar,
    "version_seo_meta_title" varchar,
    "version_seo_meta_description" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" uuid NOT NULL
  );

  CREATE TABLE "_articles_v_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" uuid NOT NULL,
    "path" varchar NOT NULL,
    "categories_id" uuid
  );

  CREATE TABLE "books_authors" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "name" varchar,
    "slug" varchar
  );

  CREATE TABLE "books_tags_aliases" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "value" varchar
  );

  CREATE TABLE "books_tags" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "slug" varchar,
    "label_tr" varchar,
    "label_en" varchar
  );

  CREATE TABLE "books_key_ideas" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "title" varchar,
    "description" varchar,
    "order" numeric DEFAULT 0
  );

  CREATE TABLE "books_strengths" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "value" varchar
  );

  CREATE TABLE "books_weaknesses" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "value" varchar
  );

  CREATE TABLE "books_who_should_read" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "value" varchar
  );

  CREATE TABLE "books_who_should_not_read" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "value" varchar
  );

  CREATE TABLE "books_application_notes" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "title" varchar,
    "description" varchar,
    "action" varchar,
    "order" numeric DEFAULT 0
  );

  CREATE TABLE "books_quotes" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar,
    "page" numeric,
    "note" varchar,
    "order" numeric DEFAULT 0
  );

  CREATE TABLE "books" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "title" varchar,
    "slug" varchar,
    "language" "enum_books_language" DEFAULT 'tr',
    "original_title" varchar,
    "translator" varchar,
    "publisher" varchar,
    "original_publisher" varchar,
    "publication_year" numeric,
    "original_publication_year" numeric,
    "edition" varchar,
    "page_count" numeric,
    "isbn10" varchar,
    "isbn13" varchar,
    "cover_image_id" uuid,
    "cover_image_alt" varchar,
    "category" "enum_books_category",
    "reading_status" "enum_books_reading_status" DEFAULT 'planned',
    "review_status" "enum_books_review_status" DEFAULT 'draft',
    "started_at" timestamp(3) with time zone,
    "completed_at" timestamp(3) with time zone,
    "published_at" timestamp(3) with time zone,
    "summary" varchar,
    "personal_evaluation" varchar,
    "rating" numeric,
    "translation_id" uuid,
    "translation_status" "enum_books_translation_status" DEFAULT 'none',
    "author_id_id" uuid,
    "editor_id_id" uuid,
    "featured" boolean DEFAULT false,
    "show_on_homepage" boolean DEFAULT false,
    "seo_title" varchar,
    "seo_description" varchar,
    "seo_canonical" varchar,
    "seo_index" boolean DEFAULT false,
    "seo_follow" boolean DEFAULT true,
    "seo_open_graph_title" varchar,
    "seo_open_graph_description" varchar,
    "seo_open_graph_image_id" uuid,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_books_status" DEFAULT 'draft'
  );

  CREATE TABLE "books_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" uuid NOT NULL,
    "path" varchar NOT NULL,
    "books_id" uuid
  );

  CREATE TABLE "_books_v_version_authors" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" varchar,
    "slug" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_books_v_version_tags_aliases" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "value" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_books_v_version_tags" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "slug" varchar,
    "label_tr" varchar,
    "label_en" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_books_v_version_key_ideas" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "title" varchar,
    "description" varchar,
    "order" numeric DEFAULT 0,
    "_uuid" varchar
  );

  CREATE TABLE "_books_v_version_strengths" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "value" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_books_v_version_weaknesses" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "value" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_books_v_version_who_should_read" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "value" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_books_v_version_who_should_not_read" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "value" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_books_v_version_application_notes" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "title" varchar,
    "description" varchar,
    "action" varchar,
    "order" numeric DEFAULT 0,
    "_uuid" varchar
  );

  CREATE TABLE "_books_v_version_quotes" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "text" varchar,
    "page" numeric,
    "note" varchar,
    "order" numeric DEFAULT 0,
    "_uuid" varchar
  );

  CREATE TABLE "_books_v" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "parent_id" uuid,
    "version_title" varchar,
    "version_slug" varchar,
    "version_language" "enum__books_v_version_language" DEFAULT 'tr',
    "version_original_title" varchar,
    "version_translator" varchar,
    "version_publisher" varchar,
    "version_original_publisher" varchar,
    "version_publication_year" numeric,
    "version_original_publication_year" numeric,
    "version_edition" varchar,
    "version_page_count" numeric,
    "version_isbn10" varchar,
    "version_isbn13" varchar,
    "version_cover_image_id" uuid,
    "version_cover_image_alt" varchar,
    "version_category" "enum__books_v_version_category",
    "version_reading_status" "enum__books_v_version_reading_status" DEFAULT 'planned',
    "version_review_status" "enum__books_v_version_review_status" DEFAULT 'draft',
    "version_started_at" timestamp(3) with time zone,
    "version_completed_at" timestamp(3) with time zone,
    "version_published_at" timestamp(3) with time zone,
    "version_summary" varchar,
    "version_personal_evaluation" varchar,
    "version_rating" numeric,
    "version_translation_id" uuid,
    "version_translation_status" "enum__books_v_version_translation_status" DEFAULT 'none',
    "version_author_id_id" uuid,
    "version_editor_id_id" uuid,
    "version_featured" boolean DEFAULT false,
    "version_show_on_homepage" boolean DEFAULT false,
    "version_seo_title" varchar,
    "version_seo_description" varchar,
    "version_seo_canonical" varchar,
    "version_seo_index" boolean DEFAULT false,
    "version_seo_follow" boolean DEFAULT true,
    "version_seo_open_graph_title" varchar,
    "version_seo_open_graph_description" varchar,
    "version_seo_open_graph_image_id" uuid,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__books_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "snapshot" boolean,
    "published_locale" "enum__books_v_published_locale",
    "latest" boolean
  );

  CREATE TABLE "_books_v_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" uuid NOT NULL,
    "path" varchar NOT NULL,
    "books_id" uuid
  );

  CREATE TABLE "pages_blocks_hero_title_lines" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar,
    "accent" boolean DEFAULT false
  );

  CREATE TABLE "pages_blocks_hero_highlights" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "value" varchar,
    "label" varchar
  );

  CREATE TABLE "pages_blocks_hero" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "visible" boolean DEFAULT true,
    "anchor" varchar,
    "eyebrow" varchar,
    "description" varchar,
    "primary_action_label" varchar,
    "primary_action_href" varchar,
    "secondary_action_label" varchar,
    "secondary_action_href" varchar,
    "block_name" varchar
  );

  CREATE TABLE "pages_blocks_home_about_title_lines" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar
  );

  CREATE TABLE "pages_blocks_home_about_paragraphs" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "text" varchar
  );

  CREATE TABLE "pages_blocks_home_about" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "visible" boolean DEFAULT true,
    "anchor" varchar,
    "eyebrow" varchar,
    "link_label" varchar,
    "link_href" varchar,
    "image_id" uuid,
    "image_alt" varchar,
    "block_name" varchar
  );

  CREATE TABLE "pages_blocks_home_focus_areas_cards" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "icon" "enum_pages_blocks_home_focus_areas_cards_icon" DEFAULT 'book',
    "title" varchar,
    "description" varchar,
    "link_label" varchar,
    "link_href" varchar
  );

  CREATE TABLE "pages_blocks_home_focus_areas" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "visible" boolean DEFAULT true,
    "anchor" varchar,
    "eyebrow" varchar,
    "title" varchar,
    "description" varchar,
    "block_name" varchar
  );

  CREATE TABLE "pages_blocks_rich_text" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "visible" boolean DEFAULT true,
    "anchor" varchar,
    "eyebrow" varchar,
    "title" varchar,
    "content" jsonb,
    "block_name" varchar
  );

  CREATE TABLE "pages_blocks_card_group_cards" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "icon" "enum_pages_blocks_card_group_cards_icon" DEFAULT 'book',
    "image_id" uuid,
    "image_alt" varchar,
    "title" varchar,
    "description" varchar,
    "link_label" varchar,
    "link_href" varchar
  );

  CREATE TABLE "pages_blocks_card_group" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "visible" boolean DEFAULT true,
    "anchor" varchar,
    "eyebrow" varchar,
    "title" varchar,
    "block_name" varchar
  );

  CREATE TABLE "pages_blocks_image_text" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "visible" boolean DEFAULT true,
    "anchor" varchar,
    "eyebrow" varchar,
    "title" varchar,
    "content" jsonb,
    "image_id" uuid,
    "image_alt" varchar,
    "image_position" "enum_pages_blocks_image_text_image_position" DEFAULT 'right',
    "block_name" varchar
  );

  CREATE TABLE "pages_blocks_cta" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "visible" boolean DEFAULT true,
    "anchor" varchar,
    "title" varchar,
    "description" varchar,
    "action_label" varchar,
    "action_href" varchar,
    "block_name" varchar
  );

  CREATE TABLE "pages" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "title" varchar,
    "slug" varchar,
    "language" "enum_pages_language" DEFAULT 'tr',
    "page_type" "enum_pages_page_type" DEFAULT 'standard',
    "summary" varchar,
    "published_at" timestamp(3) with time zone,
    "seo_title" varchar,
    "seo_description" varchar,
    "seo_index" boolean DEFAULT true,
    "seo_follow" boolean DEFAULT true,
    "seo_social_image_id" uuid,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_pages_status" DEFAULT 'draft'
  );

  CREATE TABLE "_pages_v_blocks_hero_title_lines" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "text" varchar,
    "accent" boolean DEFAULT false,
    "_uuid" varchar
  );

  CREATE TABLE "_pages_v_blocks_hero_highlights" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "value" varchar,
    "label" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_pages_v_blocks_hero" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "_path" text NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "visible" boolean DEFAULT true,
    "anchor" varchar,
    "eyebrow" varchar,
    "description" varchar,
    "primary_action_label" varchar,
    "primary_action_href" varchar,
    "secondary_action_label" varchar,
    "secondary_action_href" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_home_about_title_lines" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "text" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_pages_v_blocks_home_about_paragraphs" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "text" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_pages_v_blocks_home_about" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "_path" text NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "visible" boolean DEFAULT true,
    "anchor" varchar,
    "eyebrow" varchar,
    "link_label" varchar,
    "link_href" varchar,
    "image_id" uuid,
    "image_alt" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_home_focus_areas_cards" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "icon" "enum__pages_v_blocks_home_focus_areas_cards_icon" DEFAULT 'book',
    "title" varchar,
    "description" varchar,
    "link_label" varchar,
    "link_href" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_pages_v_blocks_home_focus_areas" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "_path" text NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "visible" boolean DEFAULT true,
    "anchor" varchar,
    "eyebrow" varchar,
    "title" varchar,
    "description" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_rich_text" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "_path" text NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "visible" boolean DEFAULT true,
    "anchor" varchar,
    "eyebrow" varchar,
    "title" varchar,
    "content" jsonb,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_card_group_cards" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "icon" "enum__pages_v_blocks_card_group_cards_icon" DEFAULT 'book',
    "image_id" uuid,
    "image_alt" varchar,
    "title" varchar,
    "description" varchar,
    "link_label" varchar,
    "link_href" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_pages_v_blocks_card_group" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "_path" text NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "visible" boolean DEFAULT true,
    "anchor" varchar,
    "eyebrow" varchar,
    "title" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_image_text" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "_path" text NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "visible" boolean DEFAULT true,
    "anchor" varchar,
    "eyebrow" varchar,
    "title" varchar,
    "content" jsonb,
    "image_id" uuid,
    "image_alt" varchar,
    "image_position" "enum__pages_v_blocks_image_text_image_position" DEFAULT 'right',
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_cta" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "_path" text NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "visible" boolean DEFAULT true,
    "anchor" varchar,
    "title" varchar,
    "description" varchar,
    "action_label" varchar,
    "action_href" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_pages_v" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "parent_id" uuid,
    "version_title" varchar,
    "version_slug" varchar,
    "version_language" "enum__pages_v_version_language" DEFAULT 'tr',
    "version_page_type" "enum__pages_v_version_page_type" DEFAULT 'standard',
    "version_summary" varchar,
    "version_published_at" timestamp(3) with time zone,
    "version_seo_title" varchar,
    "version_seo_description" varchar,
    "version_seo_index" boolean DEFAULT true,
    "version_seo_follow" boolean DEFAULT true,
    "version_seo_social_image_id" uuid,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__pages_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "snapshot" boolean,
    "published_locale" "enum__pages_v_published_locale",
    "latest" boolean
  );

  CREATE TABLE "payload_kv" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "key" varchar NOT NULL,
    "data" jsonb NOT NULL
  );

  CREATE TABLE "payload_locked_documents" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "global_slug" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload_locked_documents_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" uuid NOT NULL,
    "path" varchar NOT NULL,
    "users_id" uuid,
    "media_id" uuid,
    "categories_id" uuid,
    "articles_id" uuid
  );

  CREATE TABLE "payload_preferences" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "key" varchar,
    "value" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload_preferences_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" uuid NOT NULL,
    "path" varchar NOT NULL,
    "users_id" uuid
  );

  CREATE TABLE "payload_migrations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" varchar,
    "batch" numeric,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "navigation_header_items_children" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "active" boolean DEFAULT true,
    "link_type" "enum_navigation_header_items_children_link_type" DEFAULT 'internal',
    "page_id" uuid,
    "internal_path" varchar,
    "external_url" varchar,
    "new_tab" boolean DEFAULT false
  );

  CREATE TABLE "navigation_header_items" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "active" boolean DEFAULT true,
    "link_type" "enum_navigation_header_items_link_type" DEFAULT 'internal',
    "page_id" uuid,
    "internal_path" varchar,
    "external_url" varchar,
    "new_tab" boolean DEFAULT false
  );

  CREATE TABLE "navigation_footer_groups_links" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "active" boolean DEFAULT true,
    "link_type" "enum_navigation_footer_groups_links_link_type" DEFAULT 'internal',
    "page_id" uuid,
    "internal_path" varchar,
    "external_url" varchar,
    "new_tab" boolean DEFAULT false
  );

  CREATE TABLE "navigation_footer_groups" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "title" varchar,
    "active" boolean DEFAULT true
  );

  CREATE TABLE "navigation" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "_status" "enum_navigation_status" DEFAULT 'draft',
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );

  CREATE TABLE "_navigation_v_version_header_items_children" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "label" varchar,
    "active" boolean DEFAULT true,
    "link_type" "enum__navigation_v_version_header_items_children_link_type" DEFAULT 'internal',
    "page_id" uuid,
    "internal_path" varchar,
    "external_url" varchar,
    "new_tab" boolean DEFAULT false,
    "_uuid" varchar
  );

  CREATE TABLE "_navigation_v_version_header_items" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "label" varchar,
    "active" boolean DEFAULT true,
    "link_type" "enum__navigation_v_version_header_items_link_type" DEFAULT 'internal',
    "page_id" uuid,
    "internal_path" varchar,
    "external_url" varchar,
    "new_tab" boolean DEFAULT false,
    "_uuid" varchar
  );

  CREATE TABLE "_navigation_v_version_footer_groups_links" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "label" varchar,
    "active" boolean DEFAULT true,
    "link_type" "enum__navigation_v_version_footer_groups_links_link_type" DEFAULT 'internal',
    "page_id" uuid,
    "internal_path" varchar,
    "external_url" varchar,
    "new_tab" boolean DEFAULT false,
    "_uuid" varchar
  );

  CREATE TABLE "_navigation_v_version_footer_groups" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "title" varchar,
    "active" boolean DEFAULT true,
    "_uuid" varchar
  );

  CREATE TABLE "_navigation_v" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "version__status" "enum__navigation_v_version_status" DEFAULT 'draft',
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "snapshot" boolean,
    "published_locale" "enum__navigation_v_published_locale",
    "latest" boolean
  );

  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories_locales" ADD CONSTRAINT "categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_locales" ADD CONSTRAINT "articles_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v_locales" ADD CONSTRAINT "_articles_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "books_authors" ADD CONSTRAINT "books_authors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "books_tags_aliases" ADD CONSTRAINT "books_tags_aliases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."books_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "books_tags" ADD CONSTRAINT "books_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "books_key_ideas" ADD CONSTRAINT "books_key_ideas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "books_strengths" ADD CONSTRAINT "books_strengths_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "books_weaknesses" ADD CONSTRAINT "books_weaknesses_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "books_who_should_read" ADD CONSTRAINT "books_who_should_read_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "books_who_should_not_read" ADD CONSTRAINT "books_who_should_not_read_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "books_application_notes" ADD CONSTRAINT "books_application_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "books_quotes" ADD CONSTRAINT "books_quotes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "books" ADD CONSTRAINT "books_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "books" ADD CONSTRAINT "books_translation_id_books_id_fk" FOREIGN KEY ("translation_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "books" ADD CONSTRAINT "books_author_id_id_users_id_fk" FOREIGN KEY ("author_id_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "books" ADD CONSTRAINT "books_editor_id_id_users_id_fk" FOREIGN KEY ("editor_id_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "books" ADD CONSTRAINT "books_seo_open_graph_image_id_media_id_fk" FOREIGN KEY ("seo_open_graph_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "books_rels" ADD CONSTRAINT "books_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "books_rels" ADD CONSTRAINT "books_rels_books_fk" FOREIGN KEY ("books_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_books_v_version_authors" ADD CONSTRAINT "_books_v_version_authors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_books_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_books_v_version_tags_aliases" ADD CONSTRAINT "_books_v_version_tags_aliases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_books_v_version_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_books_v_version_tags" ADD CONSTRAINT "_books_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_books_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_books_v_version_key_ideas" ADD CONSTRAINT "_books_v_version_key_ideas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_books_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_books_v_version_strengths" ADD CONSTRAINT "_books_v_version_strengths_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_books_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_books_v_version_weaknesses" ADD CONSTRAINT "_books_v_version_weaknesses_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_books_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_books_v_version_who_should_read" ADD CONSTRAINT "_books_v_version_who_should_read_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_books_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_books_v_version_who_should_not_read" ADD CONSTRAINT "_books_v_version_who_should_not_read_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_books_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_books_v_version_application_notes" ADD CONSTRAINT "_books_v_version_application_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_books_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_books_v_version_quotes" ADD CONSTRAINT "_books_v_version_quotes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_books_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_books_v" ADD CONSTRAINT "_books_v_parent_id_books_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_books_v" ADD CONSTRAINT "_books_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_books_v" ADD CONSTRAINT "_books_v_version_translation_id_books_id_fk" FOREIGN KEY ("version_translation_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_books_v" ADD CONSTRAINT "_books_v_version_author_id_id_users_id_fk" FOREIGN KEY ("version_author_id_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_books_v" ADD CONSTRAINT "_books_v_version_editor_id_id_users_id_fk" FOREIGN KEY ("version_editor_id_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_books_v" ADD CONSTRAINT "_books_v_version_seo_open_graph_image_id_media_id_fk" FOREIGN KEY ("version_seo_open_graph_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_books_v_rels" ADD CONSTRAINT "_books_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_books_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_books_v_rels" ADD CONSTRAINT "_books_v_rels_books_fk" FOREIGN KEY ("books_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero_title_lines" ADD CONSTRAINT "pages_blocks_hero_title_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero_highlights" ADD CONSTRAINT "pages_blocks_hero_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_about_title_lines" ADD CONSTRAINT "pages_blocks_home_about_title_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_home_about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_about_paragraphs" ADD CONSTRAINT "pages_blocks_home_about_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_home_about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_about" ADD CONSTRAINT "pages_blocks_home_about_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_about" ADD CONSTRAINT "pages_blocks_home_about_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_focus_areas_cards" ADD CONSTRAINT "pages_blocks_home_focus_areas_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_home_focus_areas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_focus_areas" ADD CONSTRAINT "pages_blocks_home_focus_areas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rich_text" ADD CONSTRAINT "pages_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_card_group_cards" ADD CONSTRAINT "pages_blocks_card_group_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_card_group_cards" ADD CONSTRAINT "pages_blocks_card_group_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_card_group"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_card_group" ADD CONSTRAINT "pages_blocks_card_group_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_image_text" ADD CONSTRAINT "pages_blocks_image_text_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_image_text" ADD CONSTRAINT "pages_blocks_image_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_seo_social_image_id_media_id_fk" FOREIGN KEY ("seo_social_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_title_lines" ADD CONSTRAINT "_pages_v_blocks_hero_title_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_highlights" ADD CONSTRAINT "_pages_v_blocks_hero_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_home_about_title_lines" ADD CONSTRAINT "_pages_v_blocks_home_about_title_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_home_about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_home_about_paragraphs" ADD CONSTRAINT "_pages_v_blocks_home_about_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_home_about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_home_about" ADD CONSTRAINT "_pages_v_blocks_home_about_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_home_about" ADD CONSTRAINT "_pages_v_blocks_home_about_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_home_focus_areas_cards" ADD CONSTRAINT "_pages_v_blocks_home_focus_areas_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_home_focus_areas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_home_focus_areas" ADD CONSTRAINT "_pages_v_blocks_home_focus_areas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rich_text" ADD CONSTRAINT "_pages_v_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_card_group_cards" ADD CONSTRAINT "_pages_v_blocks_card_group_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_card_group_cards" ADD CONSTRAINT "_pages_v_blocks_card_group_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_card_group"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_card_group" ADD CONSTRAINT "_pages_v_blocks_card_group_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_image_text" ADD CONSTRAINT "_pages_v_blocks_image_text_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_image_text" ADD CONSTRAINT "_pages_v_blocks_image_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_seo_social_image_id_media_id_fk" FOREIGN KEY ("version_seo_social_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_header_items_children" ADD CONSTRAINT "navigation_header_items_children_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_header_items_children" ADD CONSTRAINT "navigation_header_items_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_header_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_header_items" ADD CONSTRAINT "navigation_header_items_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_header_items" ADD CONSTRAINT "navigation_header_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_groups_links" ADD CONSTRAINT "navigation_footer_groups_links_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_footer_groups_links" ADD CONSTRAINT "navigation_footer_groups_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_footer_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_groups" ADD CONSTRAINT "navigation_footer_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_header_items_children" ADD CONSTRAINT "_navigation_v_version_header_items_children_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_header_items_children" ADD CONSTRAINT "_navigation_v_version_header_items_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v_version_header_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_header_items" ADD CONSTRAINT "_navigation_v_version_header_items_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_header_items" ADD CONSTRAINT "_navigation_v_version_header_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_footer_groups_links" ADD CONSTRAINT "_navigation_v_version_footer_groups_links_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_footer_groups_links" ADD CONSTRAINT "_navigation_v_version_footer_groups_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v_version_footer_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_footer_groups" ADD CONSTRAINT "_navigation_v_version_footer_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "categories_locales_locale_parent_id_unique" ON "categories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "articles_featured_image_idx" ON "articles" USING btree ("featured_image_id");
  CREATE INDEX "articles_updated_at_idx" ON "articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "articles" USING btree ("created_at");
  CREATE INDEX "articles__status_idx" ON "articles" USING btree ("_status");
  CREATE UNIQUE INDEX "articles_slug_idx" ON "articles_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "articles_locales_locale_parent_id_unique" ON "articles_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "articles_rels_order_idx" ON "articles_rels" USING btree ("order");
  CREATE INDEX "articles_rels_parent_idx" ON "articles_rels" USING btree ("parent_id");
  CREATE INDEX "articles_rels_path_idx" ON "articles_rels" USING btree ("path");
  CREATE INDEX "articles_rels_categories_id_idx" ON "articles_rels" USING btree ("categories_id");
  CREATE INDEX "_articles_v_parent_idx" ON "_articles_v" USING btree ("parent_id");
  CREATE INDEX "_articles_v_version_version_featured_image_idx" ON "_articles_v" USING btree ("version_featured_image_id");
  CREATE INDEX "_articles_v_version_version_updated_at_idx" ON "_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_articles_v_version_version_created_at_idx" ON "_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_articles_v_version_version__status_idx" ON "_articles_v" USING btree ("version__status");
  CREATE INDEX "_articles_v_created_at_idx" ON "_articles_v" USING btree ("created_at");
  CREATE INDEX "_articles_v_updated_at_idx" ON "_articles_v" USING btree ("updated_at");
  CREATE INDEX "_articles_v_snapshot_idx" ON "_articles_v" USING btree ("snapshot");
  CREATE INDEX "_articles_v_published_locale_idx" ON "_articles_v" USING btree ("published_locale");
  CREATE INDEX "_articles_v_latest_idx" ON "_articles_v" USING btree ("latest");
  CREATE INDEX "_articles_v_version_version_slug_idx" ON "_articles_v_locales" USING btree ("version_slug","_locale");
  CREATE UNIQUE INDEX "_articles_v_locales_locale_parent_id_unique" ON "_articles_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_articles_v_rels_order_idx" ON "_articles_v_rels" USING btree ("order");
  CREATE INDEX "_articles_v_rels_parent_idx" ON "_articles_v_rels" USING btree ("parent_id");
  CREATE INDEX "_articles_v_rels_path_idx" ON "_articles_v_rels" USING btree ("path");
  CREATE INDEX "_articles_v_rels_categories_id_idx" ON "_articles_v_rels" USING btree ("categories_id");
  CREATE INDEX "books_authors_order_idx" ON "books_authors" USING btree ("_order");
  CREATE INDEX "books_authors_parent_id_idx" ON "books_authors" USING btree ("_parent_id");
  CREATE INDEX "books_tags_aliases_order_idx" ON "books_tags_aliases" USING btree ("_order");
  CREATE INDEX "books_tags_aliases_parent_id_idx" ON "books_tags_aliases" USING btree ("_parent_id");
  CREATE INDEX "books_tags_order_idx" ON "books_tags" USING btree ("_order");
  CREATE INDEX "books_tags_parent_id_idx" ON "books_tags" USING btree ("_parent_id");
  CREATE INDEX "books_key_ideas_order_idx" ON "books_key_ideas" USING btree ("_order");
  CREATE INDEX "books_key_ideas_parent_id_idx" ON "books_key_ideas" USING btree ("_parent_id");
  CREATE INDEX "books_strengths_order_idx" ON "books_strengths" USING btree ("_order");
  CREATE INDEX "books_strengths_parent_id_idx" ON "books_strengths" USING btree ("_parent_id");
  CREATE INDEX "books_weaknesses_order_idx" ON "books_weaknesses" USING btree ("_order");
  CREATE INDEX "books_weaknesses_parent_id_idx" ON "books_weaknesses" USING btree ("_parent_id");
  CREATE INDEX "books_who_should_read_order_idx" ON "books_who_should_read" USING btree ("_order");
  CREATE INDEX "books_who_should_read_parent_id_idx" ON "books_who_should_read" USING btree ("_parent_id");
  CREATE INDEX "books_who_should_not_read_order_idx" ON "books_who_should_not_read" USING btree ("_order");
  CREATE INDEX "books_who_should_not_read_parent_id_idx" ON "books_who_should_not_read" USING btree ("_parent_id");
  CREATE INDEX "books_application_notes_order_idx" ON "books_application_notes" USING btree ("_order");
  CREATE INDEX "books_application_notes_parent_id_idx" ON "books_application_notes" USING btree ("_parent_id");
  CREATE INDEX "books_quotes_order_idx" ON "books_quotes" USING btree ("_order");
  CREATE INDEX "books_quotes_parent_id_idx" ON "books_quotes" USING btree ("_parent_id");
  CREATE INDEX "books_slug_idx" ON "books" USING btree ("slug");
  CREATE INDEX "books_language_idx" ON "books" USING btree ("language");
  CREATE INDEX "books_isbn10_idx" ON "books" USING btree ("isbn10");
  CREATE INDEX "books_isbn13_idx" ON "books" USING btree ("isbn13");
  CREATE INDEX "books_cover_image_idx" ON "books" USING btree ("cover_image_id");
  CREATE INDEX "books_review_status_idx" ON "books" USING btree ("review_status");
  CREATE INDEX "books_published_at_idx" ON "books" USING btree ("published_at");
  CREATE INDEX "books_translation_idx" ON "books" USING btree ("translation_id");
  CREATE INDEX "books_author_id_idx" ON "books" USING btree ("author_id_id");
  CREATE INDEX "books_editor_id_idx" ON "books" USING btree ("editor_id_id");
  CREATE INDEX "books_seo_seo_index_idx" ON "books" USING btree ("seo_index");
  CREATE INDEX "books_seo_seo_open_graph_image_idx" ON "books" USING btree ("seo_open_graph_image_id");
  CREATE INDEX "books_updated_at_idx" ON "books" USING btree ("updated_at");
  CREATE INDEX "books_created_at_idx" ON "books" USING btree ("created_at");
  CREATE INDEX "books__status_idx" ON "books" USING btree ("_status");
  CREATE INDEX "books_rels_order_idx" ON "books_rels" USING btree ("order");
  CREATE INDEX "books_rels_parent_idx" ON "books_rels" USING btree ("parent_id");
  CREATE INDEX "books_rels_path_idx" ON "books_rels" USING btree ("path");
  CREATE INDEX "books_rels_books_id_idx" ON "books_rels" USING btree ("books_id");
  CREATE INDEX "_books_v_version_authors_order_idx" ON "_books_v_version_authors" USING btree ("_order");
  CREATE INDEX "_books_v_version_authors_parent_id_idx" ON "_books_v_version_authors" USING btree ("_parent_id");
  CREATE INDEX "_books_v_version_tags_aliases_order_idx" ON "_books_v_version_tags_aliases" USING btree ("_order");
  CREATE INDEX "_books_v_version_tags_aliases_parent_id_idx" ON "_books_v_version_tags_aliases" USING btree ("_parent_id");
  CREATE INDEX "_books_v_version_tags_order_idx" ON "_books_v_version_tags" USING btree ("_order");
  CREATE INDEX "_books_v_version_tags_parent_id_idx" ON "_books_v_version_tags" USING btree ("_parent_id");
  CREATE INDEX "_books_v_version_key_ideas_order_idx" ON "_books_v_version_key_ideas" USING btree ("_order");
  CREATE INDEX "_books_v_version_key_ideas_parent_id_idx" ON "_books_v_version_key_ideas" USING btree ("_parent_id");
  CREATE INDEX "_books_v_version_strengths_order_idx" ON "_books_v_version_strengths" USING btree ("_order");
  CREATE INDEX "_books_v_version_strengths_parent_id_idx" ON "_books_v_version_strengths" USING btree ("_parent_id");
  CREATE INDEX "_books_v_version_weaknesses_order_idx" ON "_books_v_version_weaknesses" USING btree ("_order");
  CREATE INDEX "_books_v_version_weaknesses_parent_id_idx" ON "_books_v_version_weaknesses" USING btree ("_parent_id");
  CREATE INDEX "_books_v_version_who_should_read_order_idx" ON "_books_v_version_who_should_read" USING btree ("_order");
  CREATE INDEX "_books_v_version_who_should_read_parent_id_idx" ON "_books_v_version_who_should_read" USING btree ("_parent_id");
  CREATE INDEX "_books_v_version_who_should_not_read_order_idx" ON "_books_v_version_who_should_not_read" USING btree ("_order");
  CREATE INDEX "_books_v_version_who_should_not_read_parent_id_idx" ON "_books_v_version_who_should_not_read" USING btree ("_parent_id");
  CREATE INDEX "_books_v_version_application_notes_order_idx" ON "_books_v_version_application_notes" USING btree ("_order");
  CREATE INDEX "_books_v_version_application_notes_parent_id_idx" ON "_books_v_version_application_notes" USING btree ("_parent_id");
  CREATE INDEX "_books_v_version_quotes_order_idx" ON "_books_v_version_quotes" USING btree ("_order");
  CREATE INDEX "_books_v_version_quotes_parent_id_idx" ON "_books_v_version_quotes" USING btree ("_parent_id");
  CREATE INDEX "_books_v_parent_idx" ON "_books_v" USING btree ("parent_id");
  CREATE INDEX "_books_v_version_version_slug_idx" ON "_books_v" USING btree ("version_slug");
  CREATE INDEX "_books_v_version_version_language_idx" ON "_books_v" USING btree ("version_language");
  CREATE INDEX "_books_v_version_version_isbn10_idx" ON "_books_v" USING btree ("version_isbn10");
  CREATE INDEX "_books_v_version_version_isbn13_idx" ON "_books_v" USING btree ("version_isbn13");
  CREATE INDEX "_books_v_version_version_cover_image_idx" ON "_books_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_books_v_version_version_review_status_idx" ON "_books_v" USING btree ("version_review_status");
  CREATE INDEX "_books_v_version_version_published_at_idx" ON "_books_v" USING btree ("version_published_at");
  CREATE INDEX "_books_v_version_version_translation_idx" ON "_books_v" USING btree ("version_translation_id");
  CREATE INDEX "_books_v_version_version_author_id_idx" ON "_books_v" USING btree ("version_author_id_id");
  CREATE INDEX "_books_v_version_version_editor_id_idx" ON "_books_v" USING btree ("version_editor_id_id");
  CREATE INDEX "_books_v_version_seo_version_seo_index_idx" ON "_books_v" USING btree ("version_seo_index");
  CREATE INDEX "_books_v_version_seo_version_seo_open_graph_image_idx" ON "_books_v" USING btree ("version_seo_open_graph_image_id");
  CREATE INDEX "_books_v_version_version_updated_at_idx" ON "_books_v" USING btree ("version_updated_at");
  CREATE INDEX "_books_v_version_version_created_at_idx" ON "_books_v" USING btree ("version_created_at");
  CREATE INDEX "_books_v_version_version__status_idx" ON "_books_v" USING btree ("version__status");
  CREATE INDEX "_books_v_created_at_idx" ON "_books_v" USING btree ("created_at");
  CREATE INDEX "_books_v_updated_at_idx" ON "_books_v" USING btree ("updated_at");
  CREATE INDEX "_books_v_snapshot_idx" ON "_books_v" USING btree ("snapshot");
  CREATE INDEX "_books_v_published_locale_idx" ON "_books_v" USING btree ("published_locale");
  CREATE INDEX "_books_v_latest_idx" ON "_books_v" USING btree ("latest");
  CREATE INDEX "_books_v_rels_order_idx" ON "_books_v_rels" USING btree ("order");
  CREATE INDEX "_books_v_rels_parent_idx" ON "_books_v_rels" USING btree ("parent_id");
  CREATE INDEX "_books_v_rels_path_idx" ON "_books_v_rels" USING btree ("path");
  CREATE INDEX "_books_v_rels_books_id_idx" ON "_books_v_rels" USING btree ("books_id");
  CREATE INDEX "pages_blocks_hero_title_lines_order_idx" ON "pages_blocks_hero_title_lines" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_title_lines_parent_id_idx" ON "pages_blocks_hero_title_lines" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_highlights_order_idx" ON "pages_blocks_hero_highlights" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_highlights_parent_id_idx" ON "pages_blocks_hero_highlights" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_order_idx" ON "pages_blocks_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_parent_id_idx" ON "pages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_path_idx" ON "pages_blocks_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_home_about_title_lines_order_idx" ON "pages_blocks_home_about_title_lines" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_about_title_lines_parent_id_idx" ON "pages_blocks_home_about_title_lines" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_about_paragraphs_order_idx" ON "pages_blocks_home_about_paragraphs" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_about_paragraphs_parent_id_idx" ON "pages_blocks_home_about_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_about_order_idx" ON "pages_blocks_home_about" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_about_parent_id_idx" ON "pages_blocks_home_about" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_about_path_idx" ON "pages_blocks_home_about" USING btree ("_path");
  CREATE INDEX "pages_blocks_home_about_image_idx" ON "pages_blocks_home_about" USING btree ("image_id");
  CREATE INDEX "pages_blocks_home_focus_areas_cards_order_idx" ON "pages_blocks_home_focus_areas_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_focus_areas_cards_parent_id_idx" ON "pages_blocks_home_focus_areas_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_focus_areas_order_idx" ON "pages_blocks_home_focus_areas" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_focus_areas_parent_id_idx" ON "pages_blocks_home_focus_areas" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_focus_areas_path_idx" ON "pages_blocks_home_focus_areas" USING btree ("_path");
  CREATE INDEX "pages_blocks_rich_text_order_idx" ON "pages_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_rich_text_parent_id_idx" ON "pages_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rich_text_path_idx" ON "pages_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "pages_blocks_card_group_cards_order_idx" ON "pages_blocks_card_group_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_card_group_cards_parent_id_idx" ON "pages_blocks_card_group_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_card_group_cards_image_idx" ON "pages_blocks_card_group_cards" USING btree ("image_id");
  CREATE INDEX "pages_blocks_card_group_order_idx" ON "pages_blocks_card_group" USING btree ("_order");
  CREATE INDEX "pages_blocks_card_group_parent_id_idx" ON "pages_blocks_card_group" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_card_group_path_idx" ON "pages_blocks_card_group" USING btree ("_path");
  CREATE INDEX "pages_blocks_image_text_order_idx" ON "pages_blocks_image_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_image_text_parent_id_idx" ON "pages_blocks_image_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_image_text_path_idx" ON "pages_blocks_image_text" USING btree ("_path");
  CREATE INDEX "pages_blocks_image_text_image_idx" ON "pages_blocks_image_text" USING btree ("image_id");
  CREATE INDEX "pages_blocks_cta_order_idx" ON "pages_blocks_cta" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_parent_id_idx" ON "pages_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_path_idx" ON "pages_blocks_cta" USING btree ("_path");
  CREATE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_language_idx" ON "pages" USING btree ("language");
  CREATE INDEX "pages_page_type_idx" ON "pages" USING btree ("page_type");
  CREATE INDEX "pages_seo_seo_social_image_idx" ON "pages" USING btree ("seo_social_image_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE UNIQUE INDEX "language_slug_idx" ON "pages" USING btree ("language","slug");
  CREATE INDEX "_pages_v_blocks_hero_title_lines_order_idx" ON "_pages_v_blocks_hero_title_lines" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_title_lines_parent_id_idx" ON "_pages_v_blocks_hero_title_lines" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_highlights_order_idx" ON "_pages_v_blocks_hero_highlights" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_highlights_parent_id_idx" ON "_pages_v_blocks_hero_highlights" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_order_idx" ON "_pages_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_parent_id_idx" ON "_pages_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_path_idx" ON "_pages_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_home_about_title_lines_order_idx" ON "_pages_v_blocks_home_about_title_lines" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_home_about_title_lines_parent_id_idx" ON "_pages_v_blocks_home_about_title_lines" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_home_about_paragraphs_order_idx" ON "_pages_v_blocks_home_about_paragraphs" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_home_about_paragraphs_parent_id_idx" ON "_pages_v_blocks_home_about_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_home_about_order_idx" ON "_pages_v_blocks_home_about" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_home_about_parent_id_idx" ON "_pages_v_blocks_home_about" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_home_about_path_idx" ON "_pages_v_blocks_home_about" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_home_about_image_idx" ON "_pages_v_blocks_home_about" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_home_focus_areas_cards_order_idx" ON "_pages_v_blocks_home_focus_areas_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_home_focus_areas_cards_parent_id_idx" ON "_pages_v_blocks_home_focus_areas_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_home_focus_areas_order_idx" ON "_pages_v_blocks_home_focus_areas" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_home_focus_areas_parent_id_idx" ON "_pages_v_blocks_home_focus_areas" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_home_focus_areas_path_idx" ON "_pages_v_blocks_home_focus_areas" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_rich_text_order_idx" ON "_pages_v_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_rich_text_parent_id_idx" ON "_pages_v_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rich_text_path_idx" ON "_pages_v_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_card_group_cards_order_idx" ON "_pages_v_blocks_card_group_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_card_group_cards_parent_id_idx" ON "_pages_v_blocks_card_group_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_card_group_cards_image_idx" ON "_pages_v_blocks_card_group_cards" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_card_group_order_idx" ON "_pages_v_blocks_card_group" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_card_group_parent_id_idx" ON "_pages_v_blocks_card_group" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_card_group_path_idx" ON "_pages_v_blocks_card_group" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_image_text_order_idx" ON "_pages_v_blocks_image_text" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_image_text_parent_id_idx" ON "_pages_v_blocks_image_text" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_image_text_path_idx" ON "_pages_v_blocks_image_text" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_image_text_image_idx" ON "_pages_v_blocks_image_text" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_cta_order_idx" ON "_pages_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_parent_id_idx" ON "_pages_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_path_idx" ON "_pages_v_blocks_cta" USING btree ("_path");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_version_language_idx" ON "_pages_v" USING btree ("version_language");
  CREATE INDEX "_pages_v_version_version_page_type_idx" ON "_pages_v" USING btree ("version_page_type");
  CREATE INDEX "_pages_v_version_seo_version_seo_social_image_idx" ON "_pages_v" USING btree ("version_seo_social_image_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_snapshot_idx" ON "_pages_v" USING btree ("snapshot");
  CREATE INDEX "_pages_v_published_locale_idx" ON "_pages_v" USING btree ("published_locale");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "version_language_version_slug_idx" ON "_pages_v" USING btree ("version_language","version_slug");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("articles_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "navigation_header_items_children_order_idx" ON "navigation_header_items_children" USING btree ("_order");
  CREATE INDEX "navigation_header_items_children_parent_id_idx" ON "navigation_header_items_children" USING btree ("_parent_id");
  CREATE INDEX "navigation_header_items_children_page_idx" ON "navigation_header_items_children" USING btree ("page_id");
  CREATE INDEX "navigation_header_items_order_idx" ON "navigation_header_items" USING btree ("_order");
  CREATE INDEX "navigation_header_items_parent_id_idx" ON "navigation_header_items" USING btree ("_parent_id");
  CREATE INDEX "navigation_header_items_page_idx" ON "navigation_header_items" USING btree ("page_id");
  CREATE INDEX "navigation_footer_groups_links_order_idx" ON "navigation_footer_groups_links" USING btree ("_order");
  CREATE INDEX "navigation_footer_groups_links_parent_id_idx" ON "navigation_footer_groups_links" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_groups_links_page_idx" ON "navigation_footer_groups_links" USING btree ("page_id");
  CREATE INDEX "navigation_footer_groups_order_idx" ON "navigation_footer_groups" USING btree ("_order");
  CREATE INDEX "navigation_footer_groups_parent_id_idx" ON "navigation_footer_groups" USING btree ("_parent_id");
  CREATE INDEX "navigation__status_idx" ON "navigation" USING btree ("_status");
  CREATE INDEX "_navigation_v_version_header_items_children_order_idx" ON "_navigation_v_version_header_items_children" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_header_items_children_parent_id_idx" ON "_navigation_v_version_header_items_children" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_header_items_children_page_idx" ON "_navigation_v_version_header_items_children" USING btree ("page_id");
  CREATE INDEX "_navigation_v_version_header_items_order_idx" ON "_navigation_v_version_header_items" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_header_items_parent_id_idx" ON "_navigation_v_version_header_items" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_header_items_page_idx" ON "_navigation_v_version_header_items" USING btree ("page_id");
  CREATE INDEX "_navigation_v_version_footer_groups_links_order_idx" ON "_navigation_v_version_footer_groups_links" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_footer_groups_links_parent_id_idx" ON "_navigation_v_version_footer_groups_links" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_footer_groups_links_page_idx" ON "_navigation_v_version_footer_groups_links" USING btree ("page_id");
  CREATE INDEX "_navigation_v_version_footer_groups_order_idx" ON "_navigation_v_version_footer_groups" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_footer_groups_parent_id_idx" ON "_navigation_v_version_footer_groups" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_version__status_idx" ON "_navigation_v" USING btree ("version__status");
  CREATE INDEX "_navigation_v_created_at_idx" ON "_navigation_v" USING btree ("created_at");
  CREATE INDEX "_navigation_v_updated_at_idx" ON "_navigation_v" USING btree ("updated_at");
  CREATE INDEX "_navigation_v_snapshot_idx" ON "_navigation_v" USING btree ("snapshot");
  CREATE INDEX "_navigation_v_published_locale_idx" ON "_navigation_v" USING btree ("published_locale");
  CREATE INDEX "_navigation_v_latest_idx" ON "_navigation_v" USING btree ("latest");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "categories_locales" CASCADE;
  DROP TABLE "articles" CASCADE;
  DROP TABLE "articles_locales" CASCADE;
  DROP TABLE "articles_rels" CASCADE;
  DROP TABLE "_articles_v" CASCADE;
  DROP TABLE "_articles_v_locales" CASCADE;
  DROP TABLE "_articles_v_rels" CASCADE;
  DROP TABLE "books_authors" CASCADE;
  DROP TABLE "books_tags_aliases" CASCADE;
  DROP TABLE "books_tags" CASCADE;
  DROP TABLE "books_key_ideas" CASCADE;
  DROP TABLE "books_strengths" CASCADE;
  DROP TABLE "books_weaknesses" CASCADE;
  DROP TABLE "books_who_should_read" CASCADE;
  DROP TABLE "books_who_should_not_read" CASCADE;
  DROP TABLE "books_application_notes" CASCADE;
  DROP TABLE "books_quotes" CASCADE;
  DROP TABLE "books" CASCADE;
  DROP TABLE "books_rels" CASCADE;
  DROP TABLE "_books_v_version_authors" CASCADE;
  DROP TABLE "_books_v_version_tags_aliases" CASCADE;
  DROP TABLE "_books_v_version_tags" CASCADE;
  DROP TABLE "_books_v_version_key_ideas" CASCADE;
  DROP TABLE "_books_v_version_strengths" CASCADE;
  DROP TABLE "_books_v_version_weaknesses" CASCADE;
  DROP TABLE "_books_v_version_who_should_read" CASCADE;
  DROP TABLE "_books_v_version_who_should_not_read" CASCADE;
  DROP TABLE "_books_v_version_application_notes" CASCADE;
  DROP TABLE "_books_v_version_quotes" CASCADE;
  DROP TABLE "_books_v" CASCADE;
  DROP TABLE "_books_v_rels" CASCADE;
  DROP TABLE "pages_blocks_hero_title_lines" CASCADE;
  DROP TABLE "pages_blocks_hero_highlights" CASCADE;
  DROP TABLE "pages_blocks_hero" CASCADE;
  DROP TABLE "pages_blocks_home_about_title_lines" CASCADE;
  DROP TABLE "pages_blocks_home_about_paragraphs" CASCADE;
  DROP TABLE "pages_blocks_home_about" CASCADE;
  DROP TABLE "pages_blocks_home_focus_areas_cards" CASCADE;
  DROP TABLE "pages_blocks_home_focus_areas" CASCADE;
  DROP TABLE "pages_blocks_rich_text" CASCADE;
  DROP TABLE "pages_blocks_card_group_cards" CASCADE;
  DROP TABLE "pages_blocks_card_group" CASCADE;
  DROP TABLE "pages_blocks_image_text" CASCADE;
  DROP TABLE "pages_blocks_cta" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "_pages_v_blocks_hero_title_lines" CASCADE;
  DROP TABLE "_pages_v_blocks_hero_highlights" CASCADE;
  DROP TABLE "_pages_v_blocks_hero" CASCADE;
  DROP TABLE "_pages_v_blocks_home_about_title_lines" CASCADE;
  DROP TABLE "_pages_v_blocks_home_about_paragraphs" CASCADE;
  DROP TABLE "_pages_v_blocks_home_about" CASCADE;
  DROP TABLE "_pages_v_blocks_home_focus_areas_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_home_focus_areas" CASCADE;
  DROP TABLE "_pages_v_blocks_rich_text" CASCADE;
  DROP TABLE "_pages_v_blocks_card_group_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_card_group" CASCADE;
  DROP TABLE "_pages_v_blocks_image_text" CASCADE;
  DROP TABLE "_pages_v_blocks_cta" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "navigation_header_items_children" CASCADE;
  DROP TABLE "navigation_header_items" CASCADE;
  DROP TABLE "navigation_footer_groups_links" CASCADE;
  DROP TABLE "navigation_footer_groups" CASCADE;
  DROP TABLE "navigation" CASCADE;
  DROP TABLE "_navigation_v_version_header_items_children" CASCADE;
  DROP TABLE "_navigation_v_version_header_items" CASCADE;
  DROP TABLE "_navigation_v_version_footer_groups_links" CASCADE;
  DROP TABLE "_navigation_v_version_footer_groups" CASCADE;
  DROP TABLE "_navigation_v" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_articles_status";
  DROP TYPE "public"."enum__articles_v_version_status";
  DROP TYPE "public"."enum__articles_v_published_locale";
  DROP TYPE "public"."enum_books_language";
  DROP TYPE "public"."enum_books_category";
  DROP TYPE "public"."enum_books_reading_status";
  DROP TYPE "public"."enum_books_review_status";
  DROP TYPE "public"."enum_books_translation_status";
  DROP TYPE "public"."enum_books_status";
  DROP TYPE "public"."enum__books_v_version_language";
  DROP TYPE "public"."enum__books_v_version_category";
  DROP TYPE "public"."enum__books_v_version_reading_status";
  DROP TYPE "public"."enum__books_v_version_review_status";
  DROP TYPE "public"."enum__books_v_version_translation_status";
  DROP TYPE "public"."enum__books_v_version_status";
  DROP TYPE "public"."enum__books_v_published_locale";
  DROP TYPE "public"."enum_pages_blocks_home_focus_areas_cards_icon";
  DROP TYPE "public"."enum_pages_blocks_card_group_cards_icon";
  DROP TYPE "public"."enum_pages_blocks_image_text_image_position";
  DROP TYPE "public"."enum_pages_language";
  DROP TYPE "public"."enum_pages_page_type";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_blocks_home_focus_areas_cards_icon";
  DROP TYPE "public"."enum__pages_v_blocks_card_group_cards_icon";
  DROP TYPE "public"."enum__pages_v_blocks_image_text_image_position";
  DROP TYPE "public"."enum__pages_v_version_language";
  DROP TYPE "public"."enum__pages_v_version_page_type";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum__pages_v_published_locale";
  DROP TYPE "public"."enum_navigation_header_items_children_link_type";
  DROP TYPE "public"."enum_navigation_header_items_link_type";
  DROP TYPE "public"."enum_navigation_footer_groups_links_link_type";
  DROP TYPE "public"."enum_navigation_status";
  DROP TYPE "public"."enum__navigation_v_version_header_items_children_link_type";
  DROP TYPE "public"."enum__navigation_v_version_header_items_link_type";
  DROP TYPE "public"."enum__navigation_v_version_footer_groups_links_link_type";
  DROP TYPE "public"."enum__navigation_v_version_status";
  DROP TYPE "public"."enum__navigation_v_published_locale";`)
}
