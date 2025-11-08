const fs = require('fs');
const path = require('path');

// Read the migration file
const migrationPath = path.join(__dirname, '../supabase/migrations/20240101000000_initial_schema.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Supabase configuration
const SUPABASE_URL = 'https://pttyfxgmmhuhzgwmwser.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dHlmeGdtbWh1aHpnd213c2VyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjU3NTc0MSwiZXhwIjoyMDc4MTUxNzQxfQ.BoPV0BVJRWdQPa7MArcHcNODS_cqT9BMaH_T8WY9ep0';

async function runMigration() {
  try {
    console.log('Starting database migration...');

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        query: migrationSQL
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Migration failed:', error);
      console.log('\n⚠️  Please run the migration manually:');
      console.log('1. Go to https://supabase.com/dashboard/project/pttyfxgmmhuhzgwmwser/sql/new');
      console.log('2. Copy the contents of supabase/migrations/20240101000000_initial_schema.sql');
      console.log('3. Paste and run the SQL\n');
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('Error running migration:', error.message);
    console.log('\n⚠️  Please run the migration manually:');
    console.log('1. Go to https://supabase.com/dashboard/project/pttyfxgmmhuhzgwmwser/sql/new');
    console.log('2. Copy the contents of supabase/migrations/20240101000000_initial_schema.sql');
    console.log('3. Paste and run the SQL\n');
    process.exit(1);
  }
}

runMigration();
