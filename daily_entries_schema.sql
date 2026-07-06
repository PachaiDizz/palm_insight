-- Fix daily_entries table schema
ALTER TABLE daily_entries 
  ALTER COLUMN team_leader_id SET NOT NULL,
  ALTER COLUMN plantation_id SET NOT NULL,
  ALTER COLUMN user_id SET NOT NULL;

-- Ensure work_status is TEXT
ALTER TABLE daily_entries 
  ALTER COLUMN work_status TYPE TEXT 
  USING work_status::TEXT;

-- Add proper foreign key constraints
ALTER TABLE daily_entries ADD CONSTRAINT daily_entries_team_leader_id_fkey 
  FOREIGN KEY (team_leader_id) REFERENCES team_leaders(id);

ALTER TABLE daily_entries ADD CONSTRAINT daily_entries_plantation_id_fkey 
  FOREIGN KEY (plantation_id) REFERENCES plantations(id);
