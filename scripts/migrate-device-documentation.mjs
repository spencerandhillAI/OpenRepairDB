import pg from "pg";
if(!process.env.DATABASE_URL)throw Error("DATABASE_URL missing");
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
try{
 await pool.query(`CREATE TABLE IF NOT EXISTS device_documentation (
 device_id BIGINT PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
 overview TEXT NOT NULL,
 capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
 specifications JSONB NOT NULL DEFAULT '[]'::jsonb,
 pin_groups JSONB NOT NULL DEFAULT '[]'::jsonb,
 safety_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
 documentation_links JSONB NOT NULL DEFAULT '[]'::jsonb,
 source_url TEXT NOT NULL,
 review_status TEXT NOT NULL DEFAULT 'pending' CHECK(review_status IN ('pending','approved','rejected')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 )`);
 console.log("SUCCESS: device_documentation table ready. No existing records changed.");
}finally{await pool.end();}
