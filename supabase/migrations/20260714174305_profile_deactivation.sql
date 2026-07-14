-- Self-service profile deactivation + permanent-deletion request.
-- 'deactivated' is distinct from the existing 'suspended' value: deactivated is a
-- reversible, user-chosen state (toggled from /dashboard/profile/edit); suspended is
-- reserved for a future admin-imposed moderation action, kept unused for now.
alter type profile_visibility add value 'deactivated';

alter table profiles add column deletion_requested_at timestamptz;
