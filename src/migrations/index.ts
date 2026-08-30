import * as migration_20260731_034937_initial_postgres_schema from './20260731_034937_initial_postgres_schema';
import * as migration_20260807_205132_day19_photography from './20260807_205132_day19_photography';
import * as migration_20260820_090000_day21_focus_area_icons from './20260820_090000_day21_focus_area_icons';
import * as migration_20260820_100000_day21_versioned_focus_area_icons from './20260820_100000_day21_versioned_focus_area_icons';
import * as migration_20260820_103626_day22_bilingual_navigation from './20260820_103626_day22_bilingual_navigation';
import * as migration_20260830_151918_istanbul_district_guides from './20260830_151918_istanbul_district_guides';

export const migrations = [
  {
    up: migration_20260731_034937_initial_postgres_schema.up,
    down: migration_20260731_034937_initial_postgres_schema.down,
    name: '20260731_034937_initial_postgres_schema',
  },
  {
    up: migration_20260807_205132_day19_photography.up,
    down: migration_20260807_205132_day19_photography.down,
    name: '20260807_205132_day19_photography',
  },
  {
    up: migration_20260820_090000_day21_focus_area_icons.up,
    down: migration_20260820_090000_day21_focus_area_icons.down,
    name: '20260820_090000_day21_focus_area_icons',
  },
  {
    up: migration_20260820_100000_day21_versioned_focus_area_icons.up,
    down: migration_20260820_100000_day21_versioned_focus_area_icons.down,
    name: '20260820_100000_day21_versioned_focus_area_icons',
  },
  {
    up: migration_20260820_103626_day22_bilingual_navigation.up,
    down: migration_20260820_103626_day22_bilingual_navigation.down,
    name: '20260820_103626_day22_bilingual_navigation',
  },
  {
    up: migration_20260830_151918_istanbul_district_guides.up,
    down: migration_20260830_151918_istanbul_district_guides.down,
    name: '20260830_151918_istanbul_district_guides',
  },
];
