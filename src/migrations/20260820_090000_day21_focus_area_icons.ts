import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $check_enum$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_type AS type
        INNER JOIN pg_namespace AS namespace ON namespace.oid = type.typnamespace
        WHERE namespace.nspname = 'public'
          AND type.typname = 'enum_pages_blocks_home_focus_areas_cards_icon'
          AND type.typtype = 'e'
      ) THEN
        RAISE EXCEPTION 'Expected enum public.enum_pages_blocks_home_focus_areas_cards_icon was not found';
      END IF;
    END
    $check_enum$;

    ALTER TYPE "public"."enum_pages_blocks_home_focus_areas_cards_icon" ADD VALUE IF NOT EXISTS 'research';
    ALTER TYPE "public"."enum_pages_blocks_home_focus_areas_cards_icon" ADD VALUE IF NOT EXISTS 'technology';
  `)
}

export async function down({}: MigrateDownArgs): Promise<void> {
  // PostgreSQL cannot safely remove enum labels without reconstructing the type,
  // which could discard values already stored by newer code. Keep this reversible
  // deployment safe: older code remains compatible with the added labels.
}
