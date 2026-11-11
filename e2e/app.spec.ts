import {test,expect,type BrowserContext} from "@playwright/test";
import {encodeWav} from "../src/lib/wav";
const origin="http://localhost:3001";
async function login(context:BrowserContext,persona="maya"){const r=await context.request.post("/api/demo",{headers:{Origin:origin},data:{persona}});expect(r.status()).toBe(200);}
async function action(context:BrowserContext,name:string,data:unknown){return context.request.post("/api/grove/"+name,{headers:{Origin:origin},data});}
test("public art, sign-in, private dashboard, 3D and accessible tree",async({page})=>{
 await page.goto("/");await expect(page.getByRole("heading",{name:/Your people/})).toBeVisible();await page.screenshot({path:"test-results/landing-desktop.png",fullPage:true});
 await page.getByRole("link",{name:/Come on in/}).click();await page.getByRole("button",{name:"Enter as Maya"}).click();await expect(page.getByRole("heading",{name:/Welcome home, Maya/})).toBeVisible();
 await page.screenshot({path:"test-results/dashboard-desktop.png",fullPage:true});await page.getByRole("button",{name:"Family tree",exact:true}).click();
 await expect(page.locator("canvas").or(page.getByRole("button",{name:"Open 2D & list"}))).toBeVisible();
 if(await page.locator("canvas").count()){await expect(page.getByRole("button",{name:"Select Nora Meadow",exact:true})).toBeVisible();await page.getByRole("button",{name:"Select Nora Meadow",exact:true}).click();}
 await page.screenshot({path:"test-results/explorer-desktop.png",fullPage:true});
 await page.getByRole("button",{name:"2D & list",exact:true}).click();await page.locator(".person-card").filter({hasText:"Nora Meadow"}).click();await expect(page.getByRole("complementary",{name:"Person details"}).getByRole("heading",{name:"Nora Meadow",exact:true})).toBeVisible();
 await page.getByRole("textbox",{name:"Search permitted family"}).fill("Iris");await expect(page.getByRole("heading",{name:"No matching branches."})).toBeVisible();
});
test("a new tree grows through three generations and persists",async({page,context})=>{
 await login(context);await page.goto("/grove");await page.getByRole("button",{name:"New grove",exact:true}).click();
 await page.getByLabel("Grove name").fill("The Cedar Grove");await page.getByLabel("Your name",{exact:true}).fill("Maya Meadow");await page.getByLabel("A parent’s name").fill("Olive Meadow");await page.getByRole("button",{name:/Plant my grove/}).click();
 await expect(page.getByRole("heading",{name:"The Cedar Grove",exact:true})).toBeVisible();await page.getByRole("button",{name:"Add relative",exact:true}).click();const dialog=page.getByRole("dialog");
 await dialog.getByLabel("Name",{exact:true}).fill("Eden Meadow");await dialog.getByLabel("Related to").selectOption({label:"Olive Meadow"});await dialog.getByLabel("The new person is their?").selectOption("parent");await dialog.getByLabel(/I have authority/).check();await dialog.getByRole("button",{name:"Add relative",exact:true}).click();await expect(dialog).not.toBeVisible();
 await page.getByRole("button",{name:"2D & list",exact:true}).click();await expect(page.locator(".generation-row")).toHaveCount(3);
});
test("mobile keyboard controls and child permissions",async({page,context})=>{
 await login(context);await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:"reduce"});await page.goto("/grove");await page.getByRole("button",{name:"Open navigation",exact:true}).click();await page.getByRole("button",{name:"Family care",exact:true}).click();await page.getByRole("button",{name:"Enter child-safe view",exact:true}).click();await expect(page.getByRole("heading",{name:/Hello, explorer/})).toBeVisible();
 await page.getByRole("button",{name:"Open navigation",exact:true}).click();await expect(page.getByRole("button",{name:"Connected groves",exact:true})).toHaveCount(0);await page.getByRole("button",{name:"Family tree",exact:true}).click();await page.getByRole("button",{name:"2D & list",exact:true}).click();await expect(page.locator(".person-card").filter({hasText:"Lila Willow"})).toHaveCount(0);await expect(page.getByRole("button",{name:"Add relative",exact:true})).toHaveCount(0);
 const state=await(await context.request.get("/api/grove/state")).json();expect(state.people.every((p:{date:unknown})=>p.date===null)).toBe(true);
 const forged=await action(context,"greet",{recipientId:"arun",templateId:"birthday_01",occasionId:"birthday_arun"});expect(forged.status()).toBe(403);
 await page.keyboard.press("Tab");await page.screenshot({path:"test-results/child-mobile.png",fullPage:true});
});
test("anonymous APIs, CSRF and forged greeting text are rejected",async({context,browser})=>{
 const anon=await browser.newContext();expect((await anon.request.get(origin+"/api/grove/state")).status()).toBe(401);expect((await anon.request.get(origin+"/api/voice/guessed-clip")).status()).toBe(401);await anon.close();
 await login(context);const csrf=await context.request.post("/api/grove/greet",{headers:{Origin:"https://untrusted.invalid"},data:{recipientId:"arun",templateId:"birthday_01",occasionId:"birthday_arun"}});expect(csrf.status()).toBe(403);
 expect((await action(context,"greet",{recipientId:"arun",templateId:"birthday_01",occasionId:"birthday_arun",text:"not allowlisted"})).status()).toBe(400);
 expect((await action(context,"greet",{recipientId:"arun",templateId:"birthday_01",occasionId:"birthday_arun"})).status()).toBe(200);
});
test("fixed wishes can only receive reviewed replies from the recipient",async({browser})=>{
 const sender=await browser.newContext();await login(sender);expect((await action(sender,"greet",{recipientId:"arun",templateId:"birthday_01",occasionId:"birthday_arun"})).status()).toBe(200);await sender.close();const arun=await browser.newContext();await login(arun,"arun");const state=await(await arun.request.get(origin+"/api/grove/state")).json();const wish=state.greetings.find((g:{recipientId:string;reply:unknown})=>g.recipientId==="arun"&&!g.reply);expect(wish).toBeTruthy();
 expect((await action(arun,"reply",{greetingId:wish.id,templateId:"thank_you",text:"custom reply"})).status()).toBe(400);
 expect((await action(arun,"reply",{greetingId:wish.id,templateId:"thank_you"})).status()).toBe(200);await arun.close();
});
test("browser microphone recording can be previewed and saved privately",async({page,context})=>{
 await login(context);await page.goto("/grove/voice");await page.getByRole("button",{name:"My recording studio",exact:true}).click();
 await page.getByLabel(/I am an authorized adult and freely consent/).check();await page.getByRole("button",{name:"Start recording",exact:true}).click();
 await expect.poll(async()=>page.getByRole("timer").textContent()).toMatch(/00:0[1-9]/);await page.getByRole("button",{name:"Stop recording",exact:true}).click();await expect(page.locator(".preview-audio audio")).toBeVisible();
 await page.getByRole("button",{name:"Save original recording",exact:true}).click();await expect(page.getByText("Your original recording was saved privately.",{exact:true})).toBeVisible();await expect(page.locator(".archive-player audio")).toBeVisible();
 page.once("dialog",d=>d.accept());await page.getByRole("button",{name:"Withdraw & delete",exact:true}).click();await expect(page.getByText("No recording was left for this choice.",{exact:true})).toBeVisible();
});
test("private original audio, memorial review, exact playback and revocation",async({browser})=>{
 const owner=await browser.newContext(),steward=await browser.newContext(),reviewer=await browser.newContext(),outside=await browser.newContext();
 await login(owner);await login(steward,"arun");await login(reviewer,"moderator");await login(outside,"outsider");
 // A non-speech PCM test fixture verifies exact byte preservation; no fictional person is given a fabricated voice.
 const buffer=Buffer.from(encodeWav(new Float32Array(16000),16000));
 const uploaded=await owner.request.post(origin+"/api/voice",{headers:{Origin:origin},multipart:{audio:{name:"test-fixture.wav",mimeType:"audio/wav",buffer},consent:JSON.stringify({promptKey:"birthday_greeting",transcript:"Test fixture: silence, not a person's voice.",nowAudience:["arun"],afterAudience:["arun"],allowMemorial:true,allowDownload:false,accepted:true})}});
 expect(uploaded.status(),await uploaded.text()).toBe(200);const clip=await uploaded.json();
 expect((await outside.request.get(origin+"/api/voice/"+clip.id)).status()).toBe(404);
 const playback=await steward.request.get(origin+"/api/voice/"+clip.id);expect(playback.status()).toBe(200);expect(await playback.body()).toEqual(buffer);expect(playback.headers()["cache-control"]).toContain("no-store");
 expect((await action(steward,"memorial-request",{ownerPersonId:"maya",evidenceCode:"family_attestation"})).status()).toBe(200);
 const state=await(await reviewer.request.get(origin+"/api/grove/state")).json(),review=state.reviews.find((r:{ownerPersonId:string;status:string})=>r.ownerPersonId==="maya"&&r.status==="PENDING");
 expect((await action(reviewer,"memorial-review",{reviewId:review.id,approve:true,humanReviewConfirmed:true})).status()).toBe(200);
 const page=await steward.newPage();await page.goto(origin+"/grove/voice");await page.getByLabel("Family member",{exact:true}).selectOption("maya");await expect(page.getByText(/Memorial recording\. This is not a live conversation/)).toBeVisible();await expect(page.locator("audio")).not.toHaveAttribute("autoplay");
 expect(await page.locator("audio").evaluate((a:HTMLAudioElement)=>a.paused)).toBe(true);
 expect(await(await steward.request.get(origin+"/api/voice/"+clip.id)).body()).toEqual(buffer);
 await page.getByRole("button",{name:"Play an anniversary blessing",exact:true}).click();await expect(page.getByText("No recording was left for this choice.",{exact:true})).toBeVisible();
 expect((await steward.request.delete(origin+"/api/voice/"+clip.id,{headers:{Origin:origin}})).status()).toBe(200);
 expect((await steward.request.get(origin+"/api/voice/"+clip.id)).status()).toBe(404);
 for(const ctx of [owner,steward,reviewer,outside])await ctx.close();
});
