import "dotenv/config";
import {PrismaClient} from "../src/generated/prisma/client";
import {PrismaPg} from "@prisma/adapter-pg";
import {hashPassword} from "better-auth/crypto";
import catalogue from "../data/occasion_templates.json";
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL!},{schema:new URL(process.env.DATABASE_URL!).searchParams.get("schema")??"public"})});
if(process.env.DEMO_MODE!=="true"||process.env.NODE_ENV==="production"||process.env.VERCEL)throw new Error("Fictional fixtures can only be seeded in explicit local demo mode.");
if(!["localhost","127.0.0.1"].includes(new URL(process.env.DATABASE_URL!).hostname))throw new Error("Fictional seed requires a loopback database.");
async function main(){
 for(const t of catalogue.greetings)await db.greetingTemplate.upsert({where:{id:t.id},create:{...t},update:{...t}});
 for(const t of catalogue.replies)await db.greetingReplyTemplate.upsert({where:{id:t.id},create:t,update:t});
 const password=await hashPassword("Fictional-demo-only!2026");
 for(const login of ["maya","arun","lila","moderator","outsider"]){
 await db.account.upsert({where:{id:login},create:{id:login,name:login==="moderator"?"Demo Reviewer":login,email:login+"@example.invalid",emailVerified:true,adultVerified:true,role:login==="moderator"?"MODERATOR":"ADULT"},update:{}});
 await db.authIdentity.upsert({where:{providerId_accountId:{providerId:"credential",accountId:login}},create:{id:"credential_"+login,accountId:login,userId:login,providerId:"credential",password},update:{password}});
 }
 for(const [id,name,inviteCode]of [["oak","The Meadow Grove","meadow-connection-demo"],["willow","The Willow Grove","willow-connection-demo"]])await db.familyTree.upsert({where:{id},create:{id,name,inviteCode},update:{}});
 const fixtures=[
 ["elias","Elias Meadow",0,"oak",false,true],["nora","Nora Meadow",0,"oak",false,false],
 ["dev","Dev Meadow",1,"oak",false,false],["mira","Mira Meadow",1,"oak",false,false],
 ["arun","Arun Meadow",1,"oak",false,false],["maya","Maya Meadow",1,"oak",false,false],
 ["priya","Priya Meadow",2,"oak",false,false],["jun","Jun Meadow",2,"oak",true,false],
 ["rowan","Rowan Meadow",2,"oak",false,false],["iris","Iris Willow",0,"willow",false,false],
 ["owen","Owen Willow",0,"willow",false,false],["lila","Lila Willow",1,"willow",false,false],
 ["theo","Theo Willow",1,"willow",false,false],["sage","Sage Willow",2,"willow",false,false]
 ]as const;
 const colors=["#e9d7b3","#dfd8ef","#cce3d8","#f1d0bd","#d3e5b6","#e6cfe8"];
 for(const [index,[id,displayName,generation,treeId,isMinor,deceased]]of fixtures.entries()){
 await db.person.upsert({where:{id},create:{id,displayName,generation,isMinor,deceased,accountId:["maya","arun","lila"].includes(id)?id:null,birthDate:isMinor?new Date("2016-05-12"):new Date("1985-11-20"),color:colors[index%colors.length],privacy:{create:{dateVisibility:isMinor?"PRIVATE":"MONTH_DAY",allowLinked:["maya","arun","lila"].includes(id)}},notification:{create:{}}},update:{}});
 await db.personTreeVisibility.upsert({where:{personId_treeId:{personId:id,treeId}},create:{personId:id,treeId},update:{}});
 if(!deceased)await db.occasion.upsert({where:{personId_kind:{personId:id,kind:"birthday"}},create:{id:"birthday_"+id,personId:id,kind:"birthday",month:11,day:id==="maya"?18:id==="arun"?22:25},update:{}});
 }
 for(const id of ["moderator","outsider"])await db.person.upsert({where:{id},create:{id,accountId:id,displayName:id==="moderator"?"Demo Reviewer":"Alex Outside",privacy:{create:{}},notification:{create:{}}},update:{}});
 for(const [accountId,treeId]of [["maya","oak"],["arun","oak"],["lila","willow"]])await db.treeMembership.upsert({where:{accountId_treeId:{accountId,treeId}},create:{accountId,treeId,role:"STEWARD"},update:{}});
 const edges=[
 ["elias","nora","PARTNER","married","oak"],["elias","dev","PARENT_CHILD","biological","oak"],["nora","dev","PARENT_CHILD","biological","oak"],
 ["elias","arun","PARENT_CHILD","biological","oak"],["nora","arun","PARENT_CHILD","biological","oak"],
 ["dev","mira","PARTNER","married","oak"],["dev","maya","PARENT_CHILD","biological","oak"],["mira","maya","PARENT_CHILD","biological","oak"],
 ["dev","priya","PARENT_CHILD","adoptive","oak"],["mira","priya","PARENT_CHILD","adoptive","oak"],["maya","jun","PARENT_CHILD","biological","oak"],
 ["maya","jun","GUARDIAN","guardian","oak"],["arun","rowan","PARENT_CHILD","biological","oak"],
 ["iris","owen","PARTNER","married","willow"],["iris","lila","PARENT_CHILD","biological","willow"],["owen","lila","PARENT_CHILD","biological","willow"],
 ["iris","theo","PARENT_CHILD","biological","willow"],["lila","sage","PARENT_CHILD","biological","willow"]
 ]as const;
 for(const [sourceId,targetId,kind,subtype,treeId]of edges)await db.relationshipEdge.upsert({where:{sourceId_targetId_kind:{sourceId,targetId,kind}},create:{sourceId,targetId,kind,subtype,treeId,assertedBy:"maya"},update:{}});
 await db.guardianConsent.upsert({where:{guardianAccountId_childPersonId:{guardianAccountId:"maya",childPersonId:"jun"}},create:{guardianAccountId:"maya",childPersonId:"jun",explore:true,greetings:false,voice:false},update:{}});
 await db.treeLinkRequest.upsert({where:{id:"verified-link"},create:{id:"verified-link",fromTreeId:"oak",toTreeId:"willow",fromPersonId:"arun",toPersonId:"lila",kind:"PARTNER",subtype:"married",requestedBy:"arun",status:"APPROVED",approvals:{create:[{treeId:"oak",accountId:"arun",approved:true},{treeId:"willow",accountId:"lila",approved:true}]}},update:{}});
 for(const [personId,treeId]of [["lila","oak"],["arun","willow"]])await db.personTreeVisibility.upsert({where:{personId_treeId:{personId,treeId}},create:{personId,treeId,sourceLinkId:"verified-link"},update:{}});
 await db.relationshipEdge.upsert({where:{sourceId_targetId_kind:{sourceId:"arun",targetId:"lila",kind:"PARTNER"}},create:{sourceId:"arun",targetId:"lila",kind:"PARTNER",subtype:"married",treeId:"oak",assertedBy:"arun",sourceLinkId:"verified-link"},update:{}});
 await db.treeLinkRequest.upsert({where:{id:"pending-link"},create:{id:"pending-link",fromTreeId:"oak",toTreeId:"willow",fromPersonId:"maya",toPersonId:"lila",kind:"GUARDIAN",subtype:"guardian",requestedBy:"maya"},update:{}});
 await db.legacySteward.upsert({where:{ownerPersonId:"maya"},create:{ownerPersonId:"maya",stewardPersonId:"arun",backupPersonId:"lila"},update:{}});
 await db.legacySteward.upsert({where:{ownerPersonId:"elias"},create:{ownerPersonId:"elias",stewardPersonId:"arun",backupPersonId:"maya"},update:{}});
 console.log("Seeded fictional groves, reviewed template catalogue, five demo accounts. No fabricated voice recordings.");
}
main().finally(()=>db.$disconnect());
