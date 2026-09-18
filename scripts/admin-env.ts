import './load-env';

// This connection belongs only to local operator commands, never to the deployed app.
if (process.env.DATABASE_ADMIN_URL) process.env.DATABASE_URL = process.env.DATABASE_ADMIN_URL;
