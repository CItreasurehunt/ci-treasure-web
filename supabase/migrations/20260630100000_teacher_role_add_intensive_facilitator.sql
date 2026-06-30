-- Extend teacher_role enum with intensive and facilitator
ALTER TYPE teacher_role ADD VALUE IF NOT EXISTS 'intensive';
ALTER TYPE teacher_role ADD VALUE IF NOT EXISTS 'facilitator';
