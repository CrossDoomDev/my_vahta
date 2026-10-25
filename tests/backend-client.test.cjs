"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "backend-client.js"), "utf8");

function boot({server = true, savedToken = ""} = {}) {
  const calls = [];
  const events = {};
  const session = {token: savedToken, getItem(){return this.token},setItem(_,value){this.token=value},removeItem(){this.token=""}};
  const app = {rendered: 0, refresh(){this.rendered++}};
  const window = {MV_APP_BRIDGE:app, location:{origin:"http://127.0.0.1:8000", pathname:"/"}};
  const document = {
    addEventListener(event, handler){events[event]=handler},
    getElementById(){return null}
  };
  const response = (payload, ok=true) => ({ok, status:ok?200:404, async json(){return payload}});
  async function fetch(url,options={}) {
    calls.push({url,method:options.method||"GET"});
    if(url==="/api/v1/health/")return response(server?{status:"ok",service:"my_vahta"}:{},server);
    if(url==="/api/v1/me/")return response({id:"a",handle:"worker",display_name:"Worker",discoverable:false});
    if(url==="/api/v1/sync/")return response({revision:0,shift:{start:"2026-10-01",end:"2026-10-31",vacation:false},payments:[],notes:[]});
    if(url==="/api/v1/notifications/unread-count/")return response({count:1});
    if(url==="/api/v1/friend-requests/")return response({results:[]});
    throw new Error("Unexpected network URL: "+url);
  }
  const sandbox = {window,document,fetch,sessionStorage:session,navigator:{},location:window.location,console,setTimeout,clearTimeout};
  vm.runInNewContext(source,sandbox,{filename:"backend-client.js"});
  return {window,calls,events,session,app};
}

const settle = () => new Promise(resolve=>setTimeout(resolve,10));

test("GitHub Pages prototype never silently uploads local financial data",async()=>{
 const run=boot({server:false});await settle();
 assert.equal(run.window.MVServerUI.available,false);
 assert.equal(run.window.MVServerUI.connected,false);
 assert.equal(run.calls.length,1);
 assert.equal(run.calls[0].url,"/api/v1/health/");
 assert.equal(run.calls.filter(x=>x.method!=="GET").length,0);
});

test("Local Django is detected but unauthenticated data stays local",async()=>{
 const run=boot({server:true});await settle();
 assert.equal(run.window.MVServerUI.available,true);
 assert.equal(run.window.MVServerUI.connected,false);
 assert.ok(run.app.rendered>=1);
 assert.ok(!run.calls.some(x=>x.url==="/api/v1/sync/"&&x.method==="PUT"));
});

test("Existing session retrieves only authenticated account and sync revision",async()=>{
 const run=boot({server:true,savedToken:"LOCAL_TEST_TOKEN"});await settle();
 assert.equal(run.window.MVServerUI.connected,true);
 assert.equal(run.window.MVServerUI.label().includes("worker"),true);
 assert.equal(run.calls.some(x=>x.url==="/api/v1/me/"),true);
 assert.equal(run.calls.some(x=>x.url==="/api/v1/sync/"&&x.method==="GET"),true);
 run.window.MVServerUI.onRender("friends");
 await settle();
 assert.equal(run.window.MVServerUI.notificationCount,1);
 assert.equal(run.calls.filter(x=>x.method!=="GET").length,0);
});
