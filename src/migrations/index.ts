import * as migration_20260731_034937_initial_postgres_schema from './20260731_034937_initial_postgres_schema';
import * as migration_20260807_205132_day19_photography from './20260807_205132_day19_photography';

export const migrations = [
  {
    up: migration_20260731_034937_initial_postgres_schema.up,
    down: migration_20260731_034937_initial_postgres_schema.down,
    name: '20260731_034937_initial_postgres_schema',
  },
  {
    up: migration_20260807_205132_day19_photography.up,
    down: migration_20260807_205132_day19_photography.down,
    name: '20260807_205132_day19_photography'
  },
];
