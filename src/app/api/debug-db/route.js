import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return NextResponse.json({ error: 'DATABASE_URL not set' }, { status: 500 });
  }
  try {
    const pool = new Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 5000, ssl: { rejectUnauthorized: false } });
    const client = await pool.connect();
    const { rows } = await client.query('SELECT NOW() AS time, (SELECT COUNT(*) FROM "User") AS user_count');
    client.release();
    await pool.end();
    return NextResponse.json({ ok: true, time: rows[0].time, user_count: rows[0].user_count });
  } catch (err) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: 500 });
  }
}
