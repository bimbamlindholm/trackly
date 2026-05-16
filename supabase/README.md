# Trackly Supabase Setup

Run `company-admin-setup.sql` in the Supabase SQL Editor to enable company/admin monitoring.

After running the SQL, mark your own account as admin:

```sql
update public.user_profiles
set role = 'admin', department = 'Management', position = 'Administrator'
where email = 'your-email@example.com';
```

Once your role is `admin`, Trackly shows the **Company Admin** page in the sidebar.
