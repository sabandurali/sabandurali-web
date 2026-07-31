import * as migration_20260731_034937_initial_postgres_schema from './20260731_034937_initial_postgres_schema';

export const migrations = [
  {
    up: migration_20260731_034937_initial_postgres_schema.up,
    down: migration_20260731_034937_initial_postgres_schema.down,
    name: '20260731_034937_initial_postgres_schema'
  },
];
