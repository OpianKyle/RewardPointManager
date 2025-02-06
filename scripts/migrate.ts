import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "../db";
import { sql } from "drizzle-orm";

// This script runs migrations programmatically
const main = async () => {
  try {
    await db.execute(sql`
      DO $$ 
      BEGIN 
        -- Drop existing enum type with CASCADE to remove dependencies
        DROP TYPE IF EXISTS activity_type CASCADE;

        -- Create new enum type with updated values
        CREATE TYPE activity_type AS ENUM (
          'ACTIVATE', 
          'PAYMENT', 
          'CARD_BALANCE', 
          'RENEWAL', 
          'UPGRADE'
        );

        -- Recreate the product_activities table with the new enum type
        CREATE TABLE IF NOT EXISTS product_activities (
          id SERIAL PRIMARY KEY,
          product_id INTEGER REFERENCES products(id) ON DELETE CASCADE NOT NULL,
          type activity_type NOT NULL,
          points_value INTEGER DEFAULT 0 NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      EXCEPTION 
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
};

main();