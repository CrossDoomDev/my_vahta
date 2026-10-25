"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const organizations = fs.readFileSync(path.join(__dirname, "..", "data", "organizations.js"), "utf8");
const organizationUi = fs.readFileSync(path.join(__dirname, "..", "data", "organizations-ui.js"), "utf8");
const boundary = source.indexOf("document.addEventListener('click'");
assert.ok(boundary > 0, "Не найден участок отделения UI от DOM-обработчиков");

const harness = source.slice(0, boundary)
  .replace('"use strict";\n(() => {', '"use strict";\nreturn (() => {')
  + "return {state, ui, seed, accounts:()=>state.accounts, migrateSocial, accountById, friendByAccountId, avatarByAccountId, friendsPage, messagesPage, friendProfilePage, threadPage, openChat};})();";

function boot(snapshot) {
  const nodes = new Map();
  const doc = {
    getElementById(name) {
      if (!nodes.has(name)) nodes.set(name, {innerHTML:"", textContent:"", hidden:false, scrollTop:0, scrollHeight:0});
      return nodes.get(name);
    },
    querySelectorAll() {return [];}
  };
  const saved = snapshot ? JSON.stringify(snapshot) : null;
  const local = {getItem(){return saved;},setItem(){}};
  const location = {hash:""};
  const window = {location};
  const run = new Function("document", "localStorage", "location", "window", organizations + "\n" + organizationUi + "\n" + harness);
  return run(doc, local, location, window);
}

test("Профили хранятся один раз, отношения и чаты хранят только ссылки на аккаунт", () => {
  const app = boot();
  assert.equal(app.state.version, 2);
  assert.equal(Object.keys(app.state.accounts).length, 16);
  assert.ok(app.state.friends.every(f => f.accountId && !f.name && !f.avatarUrl));
  assert.ok(app.state.chats.every(c => c.participantAccountId && c.id !== c.participantAccountId && !c.name && !c.avatarUrl));
});

test("Один аватар во вкладках Друзья, Сообщения, в беседе и анкете", () => {
  const app = boot();
  app.ui.chatId = "chat-f1";
  app.ui.friendId = "f1";
  const avatar = 'src="assets/avatar-alexey.svg"';
  for (const view of ["friendsPage","messagesPage","threadPage","friendProfilePage"]) {
    assert.match(app[view](), new RegExp(avatar.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")), view);
    assert.ok(app[view]().includes("Алексей Петров"), view);
  }
});

test("Замена аватара в accounts автоматически меняет его на всех экранах", () => {
  const app = boot();
  app.state.accounts.f1.avatarUrl = "assets/avatar-maria.svg";
  app.ui.friendId = "f1";
  app.ui.chatId = "chat-f1";
  const screens = [app.friendsPage(), app.messagesPage(), app.friendProfilePage(), app.threadPage()];
  screens.forEach(markup => {
    assert.ok(markup.includes('src="assets/avatar-maria.svg"'));
    assert.ok(!markup.includes('src="assets/avatar-alexey.svg"'));
  });
});

test("Новый пользователь без фото получает одинаковый запасной аватар", () => {
  const app = boot();
  const accountId = "account-xyz-123";
  app.state.accounts[accountId] = {id:accountId,name:"Кирилл",role:"Оператор",company:"Работа",avatarUrl:"",letter:"К"};
  app.state.friends.push({accountId,state:"rest",days:7});
  app.state.chats.push({id:"conversation-xyz-123",participantAccountId:accountId,unread:0,messages:[{id:"message-123",text:"Тест",time:"18:30",out:false}]});
  const avatar = app.avatarByAccountId(accountId);
  assert.ok(app.friendsPage().includes(avatar));
  assert.ok(app.messagesPage().includes(avatar));
});

test("Существующий чат открывается по accountId и использует отдельный conversationId", () => {
  const app = boot();
  app.openChat("f2");
  assert.equal(app.ui.chatId, "chat-f2");
  assert.equal(app.state.chats.filter(c => c.participantAccountId === "f2").length,1);
});

test("Старые сохранения версии 1 переводятся без потери бесед и выплат", () => {
  const old = boot().seed();
  old.version = 1;
  delete old.accounts;
  old.friends = [{id:"f1",name:"Новое имя",role:"Механик",company:"Работодатель",skin:"alt2",state:"shift",days:3}];
  old.chats = [{id:"f1",name:"Новое имя",skin:"alt2",unread:1,messages:[{id:"msg-id",out:false,text:"Важное сообщение",time:"09:00"}]}];
  old.payments = [{id:"payment-id",date:"2026-10-10",type:"salary",amount:99999,description:""}];
  const app = boot(old);
  assert.equal(app.state.version, 2);
  assert.equal(app.state.accounts.f1.name, "Новое имя");
  assert.equal(app.state.friends[0].accountId,"f1");
  assert.equal(app.state.chats[0].participantAccountId,"f1");
  assert.equal(app.state.chats[0].messages[0].text,"Важное сообщение");
  assert.equal(app.state.payments[0].amount,99999);
  app.ui.chatId = "f1";
  assert.ok(app.threadPage().includes("Новое имя"));
  assert.ok(app.threadPage().includes("Важное сообщение"));
});

test("Финансовые сведения при первом запуске остаются скрыты", () => {
  assert.equal(boot().state.privacy.finance,"self");
});
