"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const catalogScript = fs.readFileSync(path.join(root, "data/organizations.js"), "utf8");
const orgScript = fs.readFileSync(path.join(root, "data/organizations-ui.js"), "utf8");
const appScript = fs.readFileSync(path.join(root, "app.js"), "utf8");
const end = appScript.indexOf("document.addEventListener('click'");
assert.ok(end > 0, "No app event boundary");
const harness = appScript.slice(0, end)
  .replace('"use strict";\n(() => {','"use strict";\nreturn (() => {')
  + "return {state,ui,seed,friendProfilePage,organizationPage,homePage,morePage,privacyPage,openReviewDialog,getModal:()=>onModalSave};})();";

function boot(snapshot) {
  const nodes = new Map();
  const doc = {
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id,{
        innerHTML:"", textContent:"", hidden:false, open:false,
        showModal(){this.open=true;},close(){this.open=false;},
        scrollTop:0,scrollHeight:0
      });
      return nodes.get(id);
    },
    querySelectorAll(){return [];}
  };
  const store = {
    value:snapshot?JSON.stringify(snapshot):null,
    getItem(){return this.value;},
    setItem(_key,value){this.value=value;}
  };
  const win={location:{hash:""}};
  const compiled = new Function("window","document","localStorage","location",catalogScript+"\n"+orgScript+"\n"+harness);
  const app=compiled(win,doc,store,win.location);
  return {app,org:win.MV_ORG,store,nodes};
}

test("50 unique sourced organizations including main shift employers",()=>{
  const {org}=boot();
  assert.equal(org.CATALOG.length,50);
  assert.equal(new Set(org.CATALOG.map(o=>o.id)).size,50);
  assert.ok(org.CATALOG.every(o=>o.name&&o.source?.startsWith("https://")));
  for(const name of ["Газстройпром","Ленгазспецстрой","Стройтранснефтегаз","Газпром","Транснефть","СибПромСтрой","СибТрансСтрой"]){
    assert.ok(org.byName(name),name);
  }
});

test("Autocomplete finds company name and alias",()=>{
  const {org}=boot();
  assert.ok(org.matches("ленгаз").some(o=>o.name==="Ленгазспецстрой"));
  assert.ok(org.matches("СИП-Пром").some(o=>o.name==="СибПромСтрой"));
  assert.ok(org.matches("сип-транс").some(o=>o.name==="СибТрансСтрой"));
  assert.ok(org.matches("гсп").length>=5);
});

test("Expanded friends and workplace associations appear on company card",()=>{
  const {app,org}=boot();
  assert.equal(app.state.friends.length,16);
  assert.equal(Object.keys(app.state.accounts).length,16);
  const id=org.byName("Газстройпром").id;
  app.ui.orgId=id;
  const detail=org.detailPage(app.state,app.ui);
  assert.ok(detail.includes("Кто из друзей здесь работал"));
  assert.ok(detail.includes("Алексей Петров"));
  assert.ok(detail.includes("Дмитрий Орлов"));
  assert.ok(app.homePage().includes('data-nav="organizations"'));
  assert.ok(app.morePage().includes('data-nav="organizations"'));
});

test("Review exposes seven separate star, comment and photo fields",()=>{
  const {app,org}=boot();
  const id=org.byName("Газстройпром").id;
  const markup=org.reviewEditor(app.state,id,null);
  assert.equal((markup.match(/role="radiogroup"/g)||[]).length,7);
  assert.equal((markup.match(/type="file"/g)||[]).length,7);
  assert.equal((markup.match(/name="reviewComment_/g)||[]).length,7);
  assert.ok(markup.includes("Питание"));
  assert.ok(markup.includes("Бытовые условия"));
  assert.ok(markup.includes("Техника и безопасность"));
  assert.ok(!markup.includes('name="reviewScope"'), "Editor must not set review confidentiality");
  assert.ok(app.privacyPage().includes("Избранным друзьям"), "Privacy is configured in More → Privacy");
});

test("Demo reviews in company catalogue and friends' profiles link to same records",()=>{
  const {app,org}=boot();
  const id=org.byName("Газстройпром").id;
  app.ui.orgId=id;app.ui.friendId="f1";
  const detail=org.detailPage(app.state,app.ui);
  const profile=app.friendProfilePage();
  assert.ok(detail.includes("sample-review-0")===false); // internal IDs stay hidden
  assert.ok(detail.includes("Иллюстрация к отзыву"));
  assert.ok(detail.includes("assets/review-canteen.svg"));
  assert.ok(profile.includes("Отзывы о местах работы"));
  assert.ok(profile.includes("Питание"));
  assert.ok(profile.includes("Газстройпром"));
});

test("Nonpublic reviews cannot change public rating",()=>{
  const {app,org}=boot();
  const id=org.byName("Газстройпром").id;
  const before=org.publicRating(app.state,id);
  app.state.organizationReviews.push({id:"private",organizationId:id,authorAccountId:"me",scope:"self",sections:Object.fromEntries(org.CRITERIA.map(c=>[c.id,{rating:1,comment:"",photo:""}]))});
  assert.equal(org.publicRating(app.state,id),before);
  assert.ok(org.detailPage(app.state,{orgId:id}).includes("★ 1.0")); // owner sees own private review
  assert.ok(!org.reviewVisible({...app.state.organizationReviews.at(-1),authorAccountId:"f1"},app.state));
});

test("Review saving preserves values across reload without duplicating seed data",async()=>{
  const {app,org,store}=boot();
  const id=org.byName("Газстройпром").id;
  app.openReviewDialog(id);
  const callback=app.getModal();
  assert.equal(typeof callback,"function");
  const values={reviewScope:"friends",reviewWorksite:"Участок №1",reviewOverall:"Описание условий"};
  for(const c of org.CRITERIA)values["reviewRate_"+c.id]="4";
  const mockForm={get(key){return values[key]??null},getAll(){return []}};
  assert.equal(await callback(mockForm),true);
  assert.equal(app.state.organizationReviews.filter(r=>r.authorAccountId==="me").length,1);
  const reloaded=boot(JSON.parse(store.value)).app;
  assert.equal(reloaded.state.organizationReviews.filter(r=>r.authorAccountId==="me").length,1);
  assert.equal(reloaded.state.organizationReviews.filter(r=>r.id==="sample-review-0").length,1);
  assert.equal(reloaded.state.accounts.f1.workHistory.length,2);
});
