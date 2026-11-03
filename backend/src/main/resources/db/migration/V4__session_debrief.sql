-- Add debrief column to session table for storing AI post-lesson analysis
ALTER TABLE session
ADD COLUMN debrief JSONB;
