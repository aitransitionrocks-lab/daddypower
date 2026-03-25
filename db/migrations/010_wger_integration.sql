-- 010: wger.de exercise integration
-- Adds columns for wger exercise IDs and structured exercises_data JSONB

ALTER TABLE workouts ADD COLUMN IF NOT EXISTS wger_exercise_ids INTEGER[] DEFAULT '{}';
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS exercises_data JSONB DEFAULT '[]';
