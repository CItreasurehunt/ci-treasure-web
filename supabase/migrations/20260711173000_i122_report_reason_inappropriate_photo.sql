-- I-122: add 'inappropriate_photo' as a report reason, so a self-uploaded
-- profile photo has a direct complaint route instead of only "Other / illegal
-- content". Existing safety-net affordance (ReportButton) already covers
-- profiles; this just adds the missing specific reason.
alter table reports drop constraint reports_reason_check;
alter table reports add constraint reports_reason_check
  check (reason in ('incorrect_info', 'spam_fake', 'copyright', 'inappropriate_photo', 'illegal_other'));
