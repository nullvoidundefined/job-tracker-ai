/**
 * Create resume_profiles table. Requires users table to exist (migration 1771879388542).
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createTable('resume_profiles', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      unique: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    skills: { type: 'text[]', default: pgm.func("'{}'::text[]") },
    experience_summary: { type: 'text' },
    education: { type: 'text' },
    job_title: { type: 'text' },
    years_of_experience: { type: 'integer' },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()') },
    updated_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  });

  pgm.sql(`
      CREATE TRIGGER set_resume_profiles_updated_at BEFORE UPDATE ON resume_profiles
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);
};

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const down = (pgm) => {
  pgm.sql(
    'DROP TRIGGER IF EXISTS set_resume_profiles_updated_at ON resume_profiles;',
  );
  pgm.dropTable('resume_profiles');
};
