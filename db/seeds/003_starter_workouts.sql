-- Seed: 3 starter workouts with exercises_data JSONB
-- Uses real wger exercise names with placeholder IDs (admin can update via ExercisePicker)

INSERT INTO workouts (title_de, title_en, duration_minutes, difficulty, workout_type, equipment, exercises, exercises_data, wger_exercise_ids)
VALUES
-- Workout 1: 10-Minuten Vater-Reset (easy, no equipment)
(
  '10-Minuten Vater-Reset',
  '10-Minute Dad Reset',
  10,
  'easy',
  'mobility',
  '{}',
  '[
    {"name": "Jumping Jacks", "sets": 2, "reps": 20, "rest_seconds": 15},
    {"name": "Bodyweight Squats", "sets": 2, "reps": 15, "rest_seconds": 15},
    {"name": "Push Ups", "sets": 2, "reps": 10, "rest_seconds": 15},
    {"name": "Plank", "sets": 2, "reps": 30, "rest_seconds": 15},
    {"name": "Burpees", "sets": 1, "reps": 8, "rest_seconds": 0}
  ]'::jsonb,
  '[
    {"wger_id": 810, "name": "Jumping Jacks", "muscles": ["Cardio"], "muscles_secondary": [], "equipment": [], "image_url": "", "sets": 2, "reps": 20, "rest_seconds": 15},
    {"wger_id": 289, "name": "Bodyweight Squats", "muscles": ["Quadriceps", "Glutes"], "muscles_secondary": ["Hamstrings"], "equipment": [], "image_url": "", "sets": 2, "reps": 15, "rest_seconds": 15},
    {"wger_id": 182, "name": "Push Ups", "muscles": ["Chest", "Triceps"], "muscles_secondary": ["Anterior deltoid"], "equipment": [], "image_url": "", "sets": 2, "reps": 10, "rest_seconds": 15},
    {"wger_id": 238, "name": "Plank", "muscles": ["Abs"], "muscles_secondary": ["Glutes"], "equipment": [], "image_url": "", "sets": 2, "reps": 30, "rest_seconds": 15},
    {"wger_id": 354, "name": "Burpees", "muscles": ["Cardio", "Chest", "Quadriceps"], "muscles_secondary": [], "equipment": [], "image_url": "", "sets": 1, "reps": 8, "rest_seconds": 0}
  ]'::jsonb,
  '{810, 289, 182, 238, 354}'
),

-- Workout 2: 20-Minuten Kraft-Reserve (medium, no equipment)
(
  '20-Minuten Kraft-Reserve',
  '20-Minute Strength Reserve',
  20,
  'medium',
  'kraft',
  '{}',
  '[
    {"name": "Bodyweight Squats", "sets": 3, "reps": 15, "rest_seconds": 30},
    {"name": "Push Ups", "sets": 3, "reps": 12, "rest_seconds": 30},
    {"name": "Lunges", "sets": 3, "reps": 12, "rest_seconds": 30},
    {"name": "Dips", "sets": 3, "reps": 10, "rest_seconds": 30},
    {"name": "Plank", "sets": 3, "reps": 45, "rest_seconds": 20},
    {"name": "Mountain Climbers", "sets": 3, "reps": 20, "rest_seconds": 20},
    {"name": "Superman", "sets": 3, "reps": 12, "rest_seconds": 20}
  ]'::jsonb,
  '[
    {"wger_id": 289, "name": "Bodyweight Squats", "muscles": ["Quadriceps", "Glutes"], "muscles_secondary": ["Hamstrings"], "equipment": [], "image_url": "", "sets": 3, "reps": 15, "rest_seconds": 30},
    {"wger_id": 182, "name": "Push Ups", "muscles": ["Chest", "Triceps"], "muscles_secondary": ["Anterior deltoid"], "equipment": [], "image_url": "", "sets": 3, "reps": 12, "rest_seconds": 30},
    {"wger_id": 112, "name": "Lunges", "muscles": ["Quadriceps", "Glutes"], "muscles_secondary": ["Hamstrings"], "equipment": [], "image_url": "", "sets": 3, "reps": 12, "rest_seconds": 30},
    {"wger_id": 82, "name": "Dips", "muscles": ["Triceps", "Chest"], "muscles_secondary": ["Anterior deltoid"], "equipment": [], "image_url": "", "sets": 3, "reps": 10, "rest_seconds": 30},
    {"wger_id": 238, "name": "Plank", "muscles": ["Abs"], "muscles_secondary": ["Glutes"], "equipment": [], "image_url": "", "sets": 3, "reps": 45, "rest_seconds": 20},
    {"wger_id": 470, "name": "Mountain Climbers", "muscles": ["Abs", "Cardio"], "muscles_secondary": ["Quadriceps"], "equipment": [], "image_url": "", "sets": 3, "reps": 20, "rest_seconds": 20},
    {"wger_id": 389, "name": "Superman", "muscles": ["Lower back", "Glutes"], "muscles_secondary": [], "equipment": [], "image_url": "", "sets": 3, "reps": 12, "rest_seconds": 20}
  ]'::jsonb,
  '{289, 182, 112, 82, 238, 470, 389}'
),

-- Workout 3: 30-Minuten Full-Body (medium, optional dumbbells)
(
  '30-Minuten Full-Body',
  '30-Minute Full-Body',
  30,
  'medium',
  'kraft',
  '{"Kurzhanteln"}',
  '[
    {"name": "Goblet Squats", "sets": 3, "reps": 12, "rest_seconds": 45},
    {"name": "Dumbbell Rows", "sets": 3, "reps": 12, "rest_seconds": 45},
    {"name": "Push Ups", "sets": 3, "reps": 15, "rest_seconds": 30},
    {"name": "Lunges", "sets": 3, "reps": 12, "rest_seconds": 30},
    {"name": "Dumbbell Shoulder Press", "sets": 3, "reps": 10, "rest_seconds": 45},
    {"name": "Plank", "sets": 3, "reps": 60, "rest_seconds": 20},
    {"name": "Bicep Curls", "sets": 3, "reps": 12, "rest_seconds": 30},
    {"name": "Burpees", "sets": 2, "reps": 10, "rest_seconds": 30},
    {"name": "Crunches", "sets": 3, "reps": 20, "rest_seconds": 20}
  ]'::jsonb,
  '[
    {"wger_id": 300, "name": "Goblet Squats", "muscles": ["Quadriceps", "Glutes"], "muscles_secondary": ["Abs"], "equipment": ["Dumbbell"], "image_url": "", "sets": 3, "reps": 12, "rest_seconds": 45},
    {"wger_id": 344, "name": "Dumbbell Rows", "muscles": ["Latissimus dorsi"], "muscles_secondary": ["Biceps"], "equipment": ["Dumbbell"], "image_url": "", "sets": 3, "reps": 12, "rest_seconds": 45},
    {"wger_id": 182, "name": "Push Ups", "muscles": ["Chest", "Triceps"], "muscles_secondary": ["Anterior deltoid"], "equipment": [], "image_url": "", "sets": 3, "reps": 15, "rest_seconds": 30},
    {"wger_id": 112, "name": "Lunges", "muscles": ["Quadriceps", "Glutes"], "muscles_secondary": ["Hamstrings"], "equipment": [], "image_url": "", "sets": 3, "reps": 12, "rest_seconds": 30},
    {"wger_id": 123, "name": "Dumbbell Shoulder Press", "muscles": ["Anterior deltoid"], "muscles_secondary": ["Triceps"], "equipment": ["Dumbbell"], "image_url": "", "sets": 3, "reps": 10, "rest_seconds": 45},
    {"wger_id": 238, "name": "Plank", "muscles": ["Abs"], "muscles_secondary": ["Glutes"], "equipment": [], "image_url": "", "sets": 3, "reps": 60, "rest_seconds": 20},
    {"wger_id": 81, "name": "Bicep Curls", "muscles": ["Biceps"], "muscles_secondary": [], "equipment": ["Dumbbell"], "image_url": "", "sets": 3, "reps": 12, "rest_seconds": 30},
    {"wger_id": 354, "name": "Burpees", "muscles": ["Cardio", "Chest", "Quadriceps"], "muscles_secondary": [], "equipment": [], "image_url": "", "sets": 2, "reps": 10, "rest_seconds": 30},
    {"wger_id": 91, "name": "Crunches", "muscles": ["Abs"], "muscles_secondary": [], "equipment": [], "image_url": "", "sets": 3, "reps": 20, "rest_seconds": 20}
  ]'::jsonb,
  '{300, 344, 182, 112, 123, 238, 81, 354, 91}'
)
ON CONFLICT DO NOTHING;
