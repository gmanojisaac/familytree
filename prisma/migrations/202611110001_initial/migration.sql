-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('ADULT', 'MODERATOR');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('MEMBER', 'STEWARD');

-- CreateEnum
CREATE TYPE "EdgeKind" AS ENUM ('PARENT_CHILD', 'PARTNER', 'GUARDIAN');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'REVOKED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "DateVisibility" AS ENUM ('PRIVATE', 'MONTH_DAY', 'FULL');

-- CreateEnum
CREATE TYPE "VoicePeriod" AS ENUM ('NOW', 'AFTER');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "AccountRole" NOT NULL DEFAULT 'ADULT',
    "adultVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "activeChildId" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthIdentity" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "accountId" TEXT,
    "isMinor" BOOLEAN NOT NULL DEFAULT false,
    "deceased" BOOLEAN NOT NULL DEFAULT false,
    "birthDate" TIMESTAMP(3),
    "generation" INTEGER NOT NULL DEFAULT 1,
    "color" TEXT NOT NULL DEFAULT '#DDEEE2',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyTree" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyTree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreeMembership" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreeMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonTreeVisibility" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "sourceLinkId" TEXT,

    CONSTRAINT "PersonTreeVisibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacyPreference" (
    "personId" TEXT NOT NULL,
    "dateVisibility" "DateVisibility" NOT NULL DEFAULT 'PRIVATE',
    "showPhoto" BOOLEAN NOT NULL DEFAULT false,
    "allowLinked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PrivacyPreference_pkey" PRIMARY KEY ("personId")
);

-- CreateTable
CREATE TABLE "RelationshipEdge" (
    "id" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "kind" "EdgeKind" NOT NULL,
    "subtype" TEXT NOT NULL DEFAULT 'biological',
    "assertedBy" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'APPROVED',
    "sourceLinkId" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'members',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "evidence" TEXT NOT NULL DEFAULT 'Family assertion; no identity documents collected',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelationshipEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreeLinkRequest" (
    "id" TEXT NOT NULL,
    "fromTreeId" TEXT NOT NULL,
    "toTreeId" TEXT NOT NULL,
    "fromPersonId" TEXT NOT NULL,
    "toPersonId" TEXT NOT NULL,
    "kind" "EdgeKind" NOT NULL,
    "subtype" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreeLinkRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationshipApproval" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelationshipApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "personId" TEXT,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianConsent" (
    "id" TEXT NOT NULL,
    "guardianAccountId" TEXT NOT NULL,
    "childPersonId" TEXT NOT NULL,
    "explore" BOOLEAN NOT NULL DEFAULT true,
    "greetings" BOOLEAN NOT NULL DEFAULT false,
    "voice" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardianConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Occasion" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Occasion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GreetingTemplate" (
    "id" TEXT NOT NULL,
    "occasion" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "allowedReplies" TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "locale" TEXT NOT NULL DEFAULT 'en',

    CONSTRAINT "GreetingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GreetingReplyTemplate" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GreetingReplyTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Greeting" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "occasionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Greeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GreetingReply" (
    "id" TEXT NOT NULL,
    "greetingId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GreetingReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "personId" TEXT NOT NULL,
    "doNotDisturb" BOOLEAN NOT NULL DEFAULT false,
    "hideLegacy" BOOLEAN NOT NULL DEFAULT false,
    "mutedPersonIds" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("personId")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceConsent" (
    "id" TEXT NOT NULL,
    "ownerPersonId" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '2026-11-v1',
    "syntheticSpeechProhibited" BOOLEAN NOT NULL DEFAULT true,
    "allowDownload" BOOLEAN NOT NULL DEFAULT false,
    "allowMemorial" BOOLEAN NOT NULL DEFAULT false,
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoiceConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceAudience" (
    "id" TEXT NOT NULL,
    "consentId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "period" "VoicePeriod" NOT NULL,

    CONSTRAINT "VoiceAudience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceClip" (
    "id" TEXT NOT NULL,
    "ownerPersonId" TEXT NOT NULL,
    "promptKey" TEXT NOT NULL,
    "transcript" TEXT NOT NULL DEFAULT '',
    "duration" DOUBLE PRECISION NOT NULL,
    "consentRecordId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoiceClip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegacySteward" (
    "id" TEXT NOT NULL,
    "ownerPersonId" TEXT NOT NULL,
    "stewardPersonId" TEXT NOT NULL,
    "backupPersonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegacySteward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemorialStatusReview" (
    "id" TEXT NOT NULL,
    "ownerPersonId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "evidenceCode" TEXT NOT NULL,
    "frozen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemorialStatusReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoicePlaybackAudit" (
    "id" TEXT NOT NULL,
    "clipId" TEXT NOT NULL,
    "viewerPersonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoicePlaybackAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationReport" (
    "id" TEXT NOT NULL,
    "reporterAccountId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErasureRequest" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErasureRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorAccountId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionLimit" (
    "key" TEXT NOT NULL,
    "window" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ActionLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "AuthIdentity_userId_idx" ON "AuthIdentity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthIdentity_providerId_accountId_key" ON "AuthIdentity"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_key_key" ON "RateLimit"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Person_accountId_key" ON "Person"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyTree_inviteCode_key" ON "FamilyTree"("inviteCode");

-- CreateIndex
CREATE INDEX "TreeMembership_treeId_idx" ON "TreeMembership"("treeId");

-- CreateIndex
CREATE UNIQUE INDEX "TreeMembership_accountId_treeId_key" ON "TreeMembership"("accountId", "treeId");

-- CreateIndex
CREATE INDEX "PersonTreeVisibility_treeId_sourceLinkId_idx" ON "PersonTreeVisibility"("treeId", "sourceLinkId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonTreeVisibility_personId_treeId_key" ON "PersonTreeVisibility"("personId", "treeId");

-- CreateIndex
CREATE INDEX "RelationshipEdge_treeId_status_idx" ON "RelationshipEdge"("treeId", "status");

-- CreateIndex
CREATE INDEX "RelationshipEdge_targetId_kind_idx" ON "RelationshipEdge"("targetId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipEdge_sourceId_targetId_kind_key" ON "RelationshipEdge"("sourceId", "targetId", "kind");

-- CreateIndex
CREATE INDEX "TreeLinkRequest_fromTreeId_status_idx" ON "TreeLinkRequest"("fromTreeId", "status");

-- CreateIndex
CREATE INDEX "TreeLinkRequest_toTreeId_status_idx" ON "TreeLinkRequest"("toTreeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipApproval_linkId_treeId_key" ON "RelationshipApproval"("linkId", "treeId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");

-- CreateIndex
CREATE INDEX "Invitation_treeId_idx" ON "Invitation"("treeId");

-- CreateIndex
CREATE UNIQUE INDEX "GuardianConsent_guardianAccountId_childPersonId_key" ON "GuardianConsent"("guardianAccountId", "childPersonId");

-- CreateIndex
CREATE UNIQUE INDEX "Occasion_personId_kind_key" ON "Occasion"("personId", "kind");

-- CreateIndex
CREATE INDEX "Greeting_senderId_createdAt_idx" ON "Greeting"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "Greeting_recipientId_createdAt_idx" ON "Greeting"("recipientId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GreetingReply_greetingId_key" ON "GreetingReply"("greetingId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "VoiceAudience_consentId_personId_period_key" ON "VoiceAudience"("consentId", "personId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "VoiceClip_mediaId_key" ON "VoiceClip"("mediaId");

-- CreateIndex
CREATE INDEX "VoiceClip_ownerPersonId_promptKey_status_idx" ON "VoiceClip"("ownerPersonId", "promptKey", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LegacySteward_ownerPersonId_key" ON "LegacySteward"("ownerPersonId");

-- CreateIndex
CREATE INDEX "MemorialStatusReview_ownerPersonId_status_idx" ON "MemorialStatusReview"("ownerPersonId", "status");

-- CreateIndex
CREATE INDEX "AuditLog_actorAccountId_createdAt_idx" ON "AuditLog"("actorAccountId", "createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthIdentity" ADD CONSTRAINT "AuthIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreeMembership" ADD CONSTRAINT "TreeMembership_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreeMembership" ADD CONSTRAINT "TreeMembership_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "FamilyTree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonTreeVisibility" ADD CONSTRAINT "PersonTreeVisibility_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonTreeVisibility" ADD CONSTRAINT "PersonTreeVisibility_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "FamilyTree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonTreeVisibility" ADD CONSTRAINT "PersonTreeVisibility_sourceLinkId_fkey" FOREIGN KEY ("sourceLinkId") REFERENCES "TreeLinkRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivacyPreference" ADD CONSTRAINT "PrivacyPreference_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipEdge" ADD CONSTRAINT "RelationshipEdge_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipEdge" ADD CONSTRAINT "RelationshipEdge_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipEdge" ADD CONSTRAINT "RelationshipEdge_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "FamilyTree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipEdge" ADD CONSTRAINT "RelationshipEdge_sourceLinkId_fkey" FOREIGN KEY ("sourceLinkId") REFERENCES "TreeLinkRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipApproval" ADD CONSTRAINT "RelationshipApproval_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "TreeLinkRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "FamilyTree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianConsent" ADD CONSTRAINT "GuardianConsent_guardianAccountId_fkey" FOREIGN KEY ("guardianAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianConsent" ADD CONSTRAINT "GuardianConsent_childPersonId_fkey" FOREIGN KEY ("childPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Occasion" ADD CONSTRAINT "Occasion_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Greeting" ADD CONSTRAINT "Greeting_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "GreetingTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Greeting" ADD CONSTRAINT "Greeting_occasionId_fkey" FOREIGN KEY ("occasionId") REFERENCES "Occasion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GreetingReply" ADD CONSTRAINT "GreetingReply_greetingId_fkey" FOREIGN KEY ("greetingId") REFERENCES "Greeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GreetingReply" ADD CONSTRAINT "GreetingReply_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "GreetingReplyTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceAudience" ADD CONSTRAINT "VoiceAudience_consentId_fkey" FOREIGN KEY ("consentId") REFERENCES "VoiceConsent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceClip" ADD CONSTRAINT "VoiceClip_ownerPersonId_fkey" FOREIGN KEY ("ownerPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceClip" ADD CONSTRAINT "VoiceClip_consentRecordId_fkey" FOREIGN KEY ("consentRecordId") REFERENCES "VoiceConsent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceClip" ADD CONSTRAINT "VoiceClip_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoicePlaybackAudit" ADD CONSTRAINT "VoicePlaybackAudit_clipId_fkey" FOREIGN KEY ("clipId") REFERENCES "VoiceClip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
