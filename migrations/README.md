# Rhynia Database Migrations

Drop your `.sql` files here to automatically execute them on Supabase upon every deployment!

### How it works:
1. Create a new file with a numbered or dated prefix, for example: `002_add_analytics.sql`
2. Write your standard PostgreSQL statements inside (e.g. `CREATE TABLE IF NOT EXISTS ...;`).
3. Commit and push to GitHub (`git push origin main`).
4. Render automatically deploys, detects the new `.sql` file, executes it on Supabase, and logs the execution in the `schema_migrations` table so it runs exactly once!
