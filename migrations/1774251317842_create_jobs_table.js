/**
 * Create jobs table. Requires users table to exist (migration 1771879388542).
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createTable('jobs', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    title: { type: 'text' },
    company: { type: 'text' },
    location: { type: 'text' },
    requirements: { type: 'text[]', default: pgm.func("'{}'::text[]") },
    tech_stack: { type: 'text[]', default: pgm.func("'{}'::text[]") },
    salary_range: { type: 'text' },
    fit_score: { type: 'integer' },
    fit_explanation: { type: 'text' },
    status: {
      type: 'text',
      notNull: true,
      default: "'applied'",
      check:
        "status IN ('applied', 'interviewing', 'offer', 'rejected', 'saved')",
    },
    raw_description: { type: 'text' },
    source: { type: 'text' },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()') },
    updated_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  });

  pgm.sql(`
    CREATE TRIGGER set_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `);

  pgm.createIndex('jobs', 'user_id');
  pgm.createIndex('jobs', 'created_at');
};

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const down = (pgm) => {
  pgm.sql('DROP TRIGGER IF EXISTS set_jobs_updated_at ON jobs;');
  pgm.dropTable('jobs');
};
