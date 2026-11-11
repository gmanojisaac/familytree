-- Additional relational guarantees for polymorphic service references.
ALTER TABLE "TreeLinkRequest" ADD CONSTRAINT "link_from_tree_fk" FOREIGN KEY ("fromTreeId") REFERENCES "FamilyTree"("id") ON DELETE CASCADE;
ALTER TABLE "TreeLinkRequest" ADD CONSTRAINT "link_to_tree_fk" FOREIGN KEY ("toTreeId") REFERENCES "FamilyTree"("id") ON DELETE CASCADE;
ALTER TABLE "TreeLinkRequest" ADD CONSTRAINT "link_from_person_fk" FOREIGN KEY ("fromPersonId") REFERENCES "Person"("id") ON DELETE CASCADE;
ALTER TABLE "TreeLinkRequest" ADD CONSTRAINT "link_to_person_fk" FOREIGN KEY ("toPersonId") REFERENCES "Person"("id") ON DELETE CASCADE;
ALTER TABLE "TreeLinkRequest" ADD CONSTRAINT "link_requester_fk" FOREIGN KEY ("requestedBy") REFERENCES "Account"("id");
ALTER TABLE "TreeLinkRequest" ADD CONSTRAINT "different_trees" CHECK ("fromTreeId" <> "toTreeId");
ALTER TABLE "TreeLinkRequest" ADD CONSTRAINT "different_link_people" CHECK ("fromPersonId" <> "toPersonId");
ALTER TABLE "RelationshipEdge" ADD CONSTRAINT "different_edge_people" CHECK ("sourceId" <> "targetId");
ALTER TABLE "RelationshipEdge" ADD CONSTRAINT "edge_assertion_account_fk" FOREIGN KEY ("assertedBy") REFERENCES "Account"("id");
ALTER TABLE "RelationshipEdge" ADD CONSTRAINT "edge_subtype_matches_kind" CHECK (
 ("kind"='PARENT_CHILD' AND "subtype" IN ('biological','adoptive','step')) OR
 ("kind"='PARTNER' AND "subtype" IN ('married','partner','former')) OR
 ("kind"='GUARDIAN' AND "subtype"='guardian'));
ALTER TABLE "RelationshipApproval" ADD CONSTRAINT "approval_account_fk" FOREIGN KEY ("accountId") REFERENCES "Account"("id");
ALTER TABLE "RelationshipApproval" ADD CONSTRAINT "approval_tree_fk" FOREIGN KEY ("treeId") REFERENCES "FamilyTree"("id") ON DELETE CASCADE;
ALTER TABLE "Invitation" ADD CONSTRAINT "invite_person_fk" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE;
ALTER TABLE "Invitation" ADD CONSTRAINT "invite_creator_fk" FOREIGN KEY ("createdBy") REFERENCES "Account"("id");
ALTER TABLE "Greeting" ADD CONSTRAINT "greeting_sender_fk" FOREIGN KEY ("senderId") REFERENCES "Person"("id") ON DELETE CASCADE;
ALTER TABLE "Greeting" ADD CONSTRAINT "greeting_recipient_fk" FOREIGN KEY ("recipientId") REFERENCES "Person"("id") ON DELETE CASCADE;
ALTER TABLE "VoiceConsent" ADD CONSTRAINT "consent_owner_fk" FOREIGN KEY ("ownerPersonId") REFERENCES "Person"("id") ON DELETE CASCADE;
ALTER TABLE "VoiceAudience" ADD CONSTRAINT "audience_person_fk" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE;
ALTER TABLE "LegacySteward" ADD CONSTRAINT "steward_owner_fk" FOREIGN KEY ("ownerPersonId") REFERENCES "Person"("id") ON DELETE CASCADE;
ALTER TABLE "LegacySteward" ADD CONSTRAINT "steward_person_fk" FOREIGN KEY ("stewardPersonId") REFERENCES "Person"("id");
ALTER TABLE "LegacySteward" ADD CONSTRAINT "steward_backup_fk" FOREIGN KEY ("backupPersonId") REFERENCES "Person"("id");
ALTER TABLE "LegacySteward" ADD CONSTRAINT "steward_not_self" CHECK ("ownerPersonId" <> "stewardPersonId");
ALTER TABLE "MemorialStatusReview" ADD CONSTRAINT "review_owner_fk" FOREIGN KEY ("ownerPersonId") REFERENCES "Person"("id") ON DELETE CASCADE;
ALTER TABLE "MemorialStatusReview" ADD CONSTRAINT "review_requester_fk" FOREIGN KEY ("requestedBy") REFERENCES "Account"("id");
ALTER TABLE "MemorialStatusReview" ADD CONSTRAINT "reviewer_fk" FOREIGN KEY ("reviewedBy") REFERENCES "Account"("id");
ALTER TABLE "MemorialStatusReview" ADD CONSTRAINT "independent_reviewer" CHECK ("reviewedBy" IS NULL OR "requestedBy" <> "reviewedBy");
ALTER TABLE "VoicePlaybackAudit" ADD CONSTRAINT "playback_viewer_fk" FOREIGN KEY ("viewerPersonId") REFERENCES "Person"("id") ON DELETE CASCADE;
ALTER TABLE "ModerationReport" ADD CONSTRAINT "reporter_fk" FOREIGN KEY ("reporterAccountId") REFERENCES "Account"("id");
ALTER TABLE "ErasureRequest" ADD CONSTRAINT "erasure_account_fk" FOREIGN KEY ("accountId") REFERENCES "Account"("id");
ALTER TABLE "Occasion" ADD CONSTRAINT "occasion_calendar_bounds" CHECK ("month" BETWEEN 1 AND 12 AND "day" BETWEEN 1 AND 31);
ALTER TABLE "VoiceClip" ADD CONSTRAINT "audio_duration_bounds" CHECK ("duration">0 AND "duration"<=90);
CREATE INDEX "link_from_person" ON "TreeLinkRequest"("fromPersonId");
CREATE INDEX "link_to_person" ON "TreeLinkRequest"("toPersonId");
CREATE INDEX "voice_audience_lookup" ON "VoiceAudience"("personId","period");
CREATE INDEX "invitation_email" ON "Invitation"("email");
CREATE OR REPLACE FUNCTION reject_parent_cycle() RETURNS trigger AS $$
BEGIN
 IF NEW."kind"='PARENT_CHILD' AND NEW."status"='APPROVED' THEN
  PERFORM pg_advisory_xact_lock(830119);
  IF EXISTS (
   WITH RECURSIVE descendants(id) AS (
    SELECT NEW."targetId"
    UNION
    SELECT e."targetId" FROM "RelationshipEdge" e JOIN descendants d ON e."sourceId"=d.id
     WHERE e."kind"='PARENT_CHILD' AND e."status"='APPROVED' AND e."id"<>NEW."id"
   ) SELECT 1 FROM descendants WHERE id=NEW."sourceId"
  ) THEN RAISE EXCEPTION 'Parenthood cycle is not permitted'; END IF;
 END IF;
 RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER parent_cycle_guard BEFORE INSERT OR UPDATE ON "RelationshipEdge" FOR EACH ROW EXECUTE FUNCTION reject_parent_cycle();
