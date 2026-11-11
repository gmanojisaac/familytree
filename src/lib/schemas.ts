import { z } from "zod";
const id=z.string().min(1).max(100), name=z.string().trim().min(2).max(50).regex(/^[\p{L}\p{M} .\u2019'\-]+$/u);
const kind=z.enum(["PARENT_CHILD","PARTNER","GUARDIAN"]), subtype=z.enum(["biological","adoptive","step","married","partner","former","guardian"]);
export const schemas={
"edit-person":z.object({personId:id,displayName:name,birthDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()}).strict(),
"add-edge":z.object({treeId:id,sourceId:id,targetId:id,kind,subtype}).strict(),
"create-tree":z.object({name,displayName:name,relativeName:name,kind,subtype}).strict(),
"add-person":z.object({treeId:id,displayName:name,relatedTo:id,kind,subtype,direction:z.enum(["parent","child","partner","guardian"]),isMinor:z.boolean()}).strict(),
"invite":z.object({treeId:id,email:z.email().max(254),personId:id.optional()}).strict(),
"revoke-invite":z.object({invitationId:id}).strict(),
"accept-invite":z.object({token:z.string().min(30).max(500),consent:z.literal(true)}).strict(),
"preview-link":z.object({code:id,personId:id}).strict(),
"link":z.object({treeId:id,code:id,fromPersonId:id,toPersonId:id,kind,subtype}).strict(),
"review-link":z.object({linkId:id,approve:z.boolean()}).strict(),
"unlink":z.object({linkId:id,reason:z.enum(["incorrect","privacy","dispute"])}).strict(),
"greet":z.object({recipientId:id,templateId:id,occasionId:id}).strict(),
"reply":z.object({greetingId:id,templateId:id}).strict(),
"privacy":z.object({dateVisibility:z.enum(["PRIVATE","MONTH_DAY","FULL"]),showPhoto:z.boolean(),allowLinked:z.boolean(),doNotDisturb:z.boolean(),hideLegacy:z.boolean()}).strict(),
"occasion":z.object({kind:z.enum(["birthday","anniversary","wedding","new_baby","festival","graduation","congratulations","get_well","thank_you","remembrance","general"]),month:z.number().int().min(1).max(12),day:z.number().int().min(1).max(31),enabled:z.boolean()}).strict(),
"mute":z.object({personId:id,muted:z.boolean()}).strict(),
"guardian":z.object({childId:id,explore:z.boolean(),greetings:z.boolean(),voice:z.boolean()}).strict(),
"approve-child-clip":z.object({childId:id,clipId:id,approved:z.boolean()}).strict(),
"child-mode":z.object({childId:id}).strict(),
"steward":z.object({stewardPersonId:id,backupPersonId:id.optional()}).strict(),
"memorial-request":z.object({ownerPersonId:id,evidenceCode:z.enum(["family_attestation","verified_registry","steward_document_review"])}).strict(),
"memorial-review":z.object({reviewId:id,approve:z.boolean(),humanReviewConfirmed:z.literal(true)}).strict(),
"memorial-freeze":z.object({ownerPersonId:id}).strict(),
"report":z.object({subjectId:id,category:z.enum(["incorrect_relationship","unsafe_name","privacy_concern","memorial_dispute","other_safety"])}).strict(),
"resolve-report":z.object({reportId:id}).strict(),
"template-toggle":z.object({templateId:id,enabled:z.boolean()}).strict(),
"verify-adult":z.object({accountEmail:z.email(),humanReviewConfirmed:z.literal(true)}).strict(),
"erasure":z.object({confirm:z.literal(true)}).strict(),
"revoke-sessions":z.object({confirm:z.literal(true)}).strict(),
"dissolve-tree":z.object({treeId:id,confirm:z.literal(true)}).strict()
};
export type Action=keyof typeof schemas;
export function validAction(action:string):action is Action {return Object.hasOwn(schemas,action);}
