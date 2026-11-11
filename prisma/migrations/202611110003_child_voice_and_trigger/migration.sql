CREATE TABLE "GuardianVoiceApproval" (
 "id" TEXT NOT NULL,
 "guardianAccountId" TEXT NOT NULL,
 "childPersonId" TEXT NOT NULL,
 "clipId" TEXT NOT NULL,
 "approved" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "GuardianVoiceApproval_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "guardian_voice_account_fk" FOREIGN KEY ("guardianAccountId") REFERENCES "Account"("id") ON DELETE CASCADE,
 CONSTRAINT "guardian_voice_child_fk" FOREIGN KEY ("childPersonId") REFERENCES "Person"("id") ON DELETE CASCADE,
 CONSTRAINT "guardian_voice_clip_fk" FOREIGN KEY ("clipId") REFERENCES "VoiceClip"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "GuardianVoiceApproval_guardianAccountId_childPersonId_clipId_key" ON "GuardianVoiceApproval"("guardianAccountId","childPersonId","clipId");
CREATE INDEX "guardian_voice_lookup" ON "GuardianVoiceApproval"("childPersonId","clipId","approved");
-- Trigger queries use the actual edge table's schema rather than an ambient search_path.
CREATE OR REPLACE FUNCTION reject_parent_cycle() RETURNS trigger AS $$
DECLARE cycle_found BOOLEAN;
BEGIN
 IF NEW."kind"='PARENT_CHILD' AND NEW."status"='APPROVED' THEN
  PERFORM pg_advisory_xact_lock(830119);
  EXECUTE format(
   'WITH RECURSIVE descendants(id) AS (SELECT $1 UNION SELECT e."targetId" FROM %I."RelationshipEdge" e JOIN descendants d ON e."sourceId"=d.id WHERE e."kind"=''PARENT_CHILD'' AND e."status"=''APPROVED'' AND e."id"<>$3) SELECT EXISTS(SELECT 1 FROM descendants WHERE id=$2)',
   TG_TABLE_SCHEMA
  ) INTO cycle_found USING NEW."targetId",NEW."sourceId",NEW."id";
  IF cycle_found THEN RAISE EXCEPTION 'Parenthood cycle is not permitted'; END IF;
 END IF;
 RETURN NEW;
END;
$$ LANGUAGE plpgsql;
