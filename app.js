"use strict";
(() => {
const STORAGE_KEY = "moya-vahta.prototype.v1";
const $ = id => document.getElementById(id);
const icon = (id, extra="") => `<svg class="${extra}" aria-hidden="true"><use href="#i-${id}"></use></svg>`;
const html = value => String(value ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const id = () => (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const localISO = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const parseISO = iso => {const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso||""));return m?new Date(+m[1],+m[2]-1,+m[3],12):new Date()};
const today = () => localISO(new Date());
const shiftDate = (iso, days) => {const d=parseISO(iso);d.setDate(d.getDate()+days);return localISO(d)};
const daysBetween = (a,b) => Math.round((Date.UTC(parseISO(b).getFullYear(),parseISO(b).getMonth(),parseISO(b).getDate())-Date.UTC(parseISO(a).getFullYear(),parseISO(a).getMonth(),parseISO(a).getDate()))/86400000);
const monthKey = iso => iso.slice(0,7);
const currentMonth = () => today().slice(0,7);
const addMonth = (key,diff) => {const [y,m]=key.split('-').map(Number);const d=new Date(y,m-1+diff,1,12);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`};
const longMonth = key => {const [y,m]=key.split('-').map(Number);const s=new Date(y,m-1,1).toLocaleDateString('ru-RU',{month:'long',year:'numeric'});return s.charAt(0).toUpperCase()+s.slice(1)};
const dateFull = iso => parseISO(iso).toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
const dateShort = iso => parseISO(iso).toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
const dateNumeric = iso => parseISO(iso).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'});
const weekday = iso => parseISO(iso).toLocaleDateString('ru-RU',{weekday:'long'});
const money = num => `${Math.round(Number(num)||0).toLocaleString('ru-RU')} ₽`;
const COLORS = ["orange","green","blue","purple","red"];
const NOTIFICATION_DEFAULTS = Object.freeze({enabled:true,shift:true,payments:true,holidays:true,friend_request:true,friend_accepted:true,message:true,shift_days:3,holiday_days:1});
const NOTIFICATION_DAY_OPTIONS = {shift_days:[0,1,3,7,14],holiday_days:[0,1,3,7]};
function normalizedNotificationSettings(raw){
 const data=raw&&typeof raw==="object"&&!Array.isArray(raw)?raw:{};
 const prefs={...NOTIFICATION_DEFAULTS};
 for(const key of Object.keys(prefs)){
  if(key in NOTIFICATION_DAY_OPTIONS){
   if(Number.isInteger(data[key])&&NOTIFICATION_DAY_OPTIONS[key].includes(data[key]))prefs[key]=data[key];
  }else if(typeof data[key]==="boolean")prefs[key]=data[key];
 }
 return prefs;
}
function categoryForNotification(kind){return kind==="holiday"?"holidays":kind==="payment"?"payments":kind}
function notificationsEnabled(kind){return Boolean(state.notificationSettings.enabled&&state.notificationSettings[categoryForNotification(kind)])}

function seed(){const now=today(),old=shiftDate(now,-11),end=shiftDate(now,18),previous=addMonth(currentMonth(),-1);
 return {version:2,profile:{name:"Мой профиль",profession:"Машинист экскаватора",sector:"Строительство"},shift:{start:old,end},vacation:false,
 org:{name:"ООО «СеверСтрой»",description:"Строительство и обслуживание объектов",region:"Северный регион",ratings:{"Зарплата":4,"Бытовые условия":4,"Руководство":3,"График вахты":5},comment:"В целом устраивают условия работы. Есть нюансы с графиком, но коллектив хороший."},
 privacy:{status:"friends",countdown:"friends",calendar:"self",org:"friends",rating:"friends",comment:"self",finance:"self"},
 payments:[{id:id(),date:shiftDate(now,-2),type:"advance",amount:60000,description:""},{id:id(),date:`${previous}-20`,type:"salary",amount:68000,description:""}],
 notes:[{id:id(),title:"На следующую вахту",category:"Сборы",text:"",tasks:[{text:"Рабочая одежда",done:true},{text:"Термобельё",done:false},{text:"Документы",done:false},{text:"Зарядные устройства",done:false}],updated:now},{id:id(),title:"Идеи и планы",category:"Личное",text:"Не забыть про новые идеи для проекта.\nПозвонить домой в выходной.",tasks:[],updated:now}],
 accounts:{
   f1:{id:"f1",name:"Алексей Петров",role:"Бурильщик",company:"Северное бурение",avatarUrl:"assets/avatar-alexey.svg",letter:"А",skin:"alt1"},
   f2:{id:"f2",name:"Иван Соколов",role:"Электромонтажник",company:"Строймонтаж",avatarUrl:"assets/avatar-ivan.svg",letter:"И",skin:"alt4"},
   f3:{id:"f3",name:"Мария Соколова",role:"Геолог",company:"Георазведка",avatarUrl:"assets/avatar-maria.svg",letter:"М",skin:"alt2"},
   f4:{id:"f4",name:"Сергей Кузнецов",role:"Механик",company:"Северная база",avatarUrl:"assets/avatar-sergey.svg",letter:"С",skin:"alt3"}
 },
 friends:[{accountId:"f1",state:"shift",days:12},{accountId:"f2",state:"rest",days:8},{accountId:"f3",state:"vacation",days:5},{accountId:"f4",state:"shift",days:27}],
 friendRequests:[],
 chats:[{id:"chat-f1",participantAccountId:"f1",unread:2,messages:[{id:id(),out:false,text:"Привет! Как там на объекте?",time:"09:12"},{id:id(),out:false,text:"Всё нормально? Когда домой?",time:"09:24"}]},{id:"chat-f2",participantAccountId:"f2",unread:1,messages:[{id:id(),out:false,text:"Увидимся на межвахте!",time:"Вчера"}]},{id:"chat-f3",participantAccountId:"f3",unread:0,messages:[{id:id(),out:true,text:"Привет! Как отпуск?",time:"Вчера"},{id:id(),out:false,text:"Отлично, отдыхаю 😊",time:"Вчера"}]}],
 notifications:[{id:id(),title:"Вахта скоро закончится",body:"Осталось менее 3 недель до возвращения домой.",date:now,read:false,kind:"shift"},{id:id(),title:"Профессиональные праздники",body:"В календаре появились праздники разных профессий.",date:now,read:false,kind:"holiday"},{id:id(),title:"Новые сообщения",body:"У вас есть непрочитанные сообщения.",date:now,read:false,kind:"message"}]
 };}
function migratePrivacy(x) {
  // Preserve old installations while keeping pay history private unless explicitly enabled.
  x.privacy = x.privacy && typeof x.privacy === "object" && !Array.isArray(x.privacy) ? x.privacy : {};
  x.notificationSettings = normalizedNotificationSettings(x.notificationSettings);
  if (!["self","friends","all"].includes(x.privacy.finance)) x.privacy.finance = "self";
  // Tidy labels from the earliest sample data while preserving user-entered notes.
  if (Array.isArray(x.payments)) for (const payment of x.payments) {
    if (payment.description === "Демонстрационная запись") payment.description = "";
  }
  if (Array.isArray(x.notifications)) for (const notice of x.notifications) {
    if (notice.body === "В демонстрационных чатах есть непрочитанные сообщения.") notice.body = "У вас есть непрочитанные сообщения.";
  }
  return x;
}

// Identity is stored once in accounts; friendships and conversations reference immutable accountId.
// These objects mirror entities that a server API will return when authentication is added.
function migrateSocial(x) {
  if (!x || typeof x !== "object") return x;
  const accounts = x.accounts && typeof x.accounts === "object" && !Array.isArray(x.accounts) ? {...x.accounts} : {};
  const defaultAvatar = {f1:"alexey",f2:"ivan",f3:"maria",f4:"sergey"};
  const adoptAccount = (raw, accountId) => {
    if (!accountId) return;
    const old = accounts[accountId] && typeof accounts[accountId] === "object" ? accounts[accountId] : {};
    const name = String(old.name || raw?.name || "Пользователь").slice(0,80);
    const preset = defaultAvatar[accountId] ? "assets/avatar-" + defaultAvatar[accountId] + ".svg" : "";
    accounts[accountId] = {
      id: accountId,
      name,
      role: String(old.role || raw?.role || "").slice(0,100),
      company: String(old.company || raw?.company || "").slice(0,100),
      avatarUrl: String(old.avatarUrl || raw?.avatarUrl || preset),
      letter: String(old.letter || raw?.letter || name.slice(0,1)).slice(0,2),
      skin: String(old.skin || raw?.skin || "alt1").slice(0,12),
      isDemo:Boolean(old.isDemo || /^f[1-4]$/.test(accountId) || accountId.startsWith("demo-")),
      currentOrganizationId:String(old.currentOrganizationId || raw?.currentOrganizationId || ""),
      workHistory:Array.isArray(old.workHistory)?old.workHistory:(Array.isArray(raw?.workHistory)?raw.workHistory:[])
    };
  };
  const friends = Array.isArray(x.friends) ? x.friends : [];
  const links = [];
  const linked = new Set();
  for (const raw of friends) {
    if (!raw || typeof raw !== "object") continue;
    const accountId = String(raw.accountId || raw.id || "");
    if (!accountId || linked.has(accountId)) continue;
    adoptAccount(raw, accountId);
    links.push({accountId, state:["shift","rest","vacation","offline"].includes(raw.state)?raw.state:"offline", days:Math.max(0,Math.min(9999,Number(raw.days)||0))});
    linked.add(accountId);
  }
  x.friends = links;
  x.chats = (Array.isArray(x.chats)?x.chats:[]).filter(ch=>ch && typeof ch==="object").map((ch,i)=>{
    const accountId = String(ch.participantAccountId || ch.accountId || ch.id || "");
    if(!accountId) return null;
    adoptAccount(ch,accountId);
    return {
      id:String(ch.id || "conversation-"+i),
      participantAccountId:accountId,
      unread:Math.max(0,Number(ch.unread)||0),
      messages:Array.isArray(ch.messages)?ch.messages:[]
    };
  }).filter(Boolean);
  x.accounts = accounts;
  x.friendRequests = (Array.isArray(x.friendRequests)?x.friendRequests:[]).filter(r=>r&&typeof r==="object"&&typeof r.id==="string"&&typeof r.accountId==="string"&&accounts[r.accountId]&&["incoming","outgoing"].includes(r.direction)&&["pending","accepted","declined","cancelled"].includes(r.status)).slice(0,300).map(r=>({id:r.id,accountId:r.accountId,direction:r.direction,status:r.status,createdAt:String(r.createdAt||today()).slice(0,10),demo:Boolean(r.demo||accounts[r.accountId]?.isDemo)}));
  x.version = 2;
  return x;
}
function accountById(accountId) {return state.accounts?.[String(accountId)] || null}
function friendByAccountId(accountId) {
 const link = state.friends.find(f=>f.accountId===accountId);
 const account = accountById(accountId);
 return link && account ? {...account,company:window.MV_ORG?.byId(account.currentOrganizationId)?.name||account.company,state:link.state,days:link.days} : null;
}
function avatarByAccountId(accountId, size="") {
 const account=accountById(accountId);
 const name=account?.name || "Пользователь";
 const src=String(account?.avatarUrl||"");
 // Only safe HTTPS or own asset/media paths are accepted in generated HTML.
 const allowed=/^(?:assets\/[\w./-]+\.(?:svg|png|jpg|jpeg|webp)|\/media\/[\w./-]+\.(?:svg|png|jpg|jpeg|webp)|https:\/\/[^\s"'<>]+)$/i.test(src)&&!src.includes("..");
 if (allowed) return `<img class="friend-portrait ${html(size)}" src="${html(src)}" alt="" loading="lazy">`;
 const skins=["alt1","alt2","alt3","alt4"];
 const hash=[...String(accountId)].reduce((sum,ch)=>sum+ch.charCodeAt(0),0);
 return `<span class="avatar ${skins[hash%skins.length]} ${html(size)}">${html(account?.letter || name.slice(0,1))}</span>`;
}
function load(){try{const x=JSON.parse(localStorage.getItem(STORAGE_KEY));if(!x||![1,2].includes(x.version)||!x.shift||!Array.isArray(x.payments)||!Array.isArray(x.notes)||!Array.isArray(x.chats))return migrateSocial(migratePrivacy(seed()));return migrateSocial(migratePrivacy(x))}catch{return migrateSocial(migratePrivacy(seed()))}}
let state=window.MV_ORG.enrichState(load());
const ui={view:"home",calendarMonth:currentMonth(),financeMonth:currentMonth(),selectedDate:today(),filter:"all",friendSearch:"",friendDiscoverySearch:"",chatId:null,notificationOpen:false,notificationsTab:"inbox",holidaySector:"all",statsYear:new Date().getFullYear(),noteSearch:"",financeFilter:"all",friendFilter:"all",friendId:null,orgSearch:"",orgLimit:20,orgId:null};
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));return true}catch{toast("Не удалось сохранить данные. Проверьте свободное место.");return false}}
function toast(message){const e=$('toast');e.textContent=message;e.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>e.hidden=true,3400)}
const button = (label,action,variant='secondary',attrs='') => `<button type="button" class="btn ${variant}" data-action="${action}" ${attrs}>${label}</button>`;
const title = (head,sub="",right="") => `<header class="page-title"><div><h1>${html(head)}</h1>${sub?`<p>${html(sub)}</p>`:''}</div>${right}</header>`;
const section=(head,act='',label='Все')=>`<div class="section-head"><h2>${html(head)}</h2>${act?`<button type="button" data-nav="${act}">${html(label)} ›</button>`:''}</div>`;
const tile=(symbol,color='')=>`<span class="icon-tile ${color}">${icon(symbol)}</span>`;
// One shift period is used across the calendar, home, finance and statistics.
function shiftPeriod(day=today()){
 const {start,end}=state.shift;
 const len=Math.max(1,daysBetween(start,end)+1);
 const elapsed=Math.min(len,Math.max(0,daysBetween(start,day)+1));
 const upcoming=day<start,completed=day>end;
 return {start,end,len,elapsed,percent:Math.round(elapsed/len*100),remaining:Math.max(0,daysBetween(day,end)),untilStart:Math.max(0,daysBetween(day,start)),active:!upcoming&&!completed,upcoming,completed};
}
function inShift(day){const {start,end}=state.shift;return day>=start&&day<=end}
function dayType(day){return state.vacation&&day===today()?'vacation':inShift(day)?'shift':'rest'}
function status(){const type=dayType(today());return type==='vacation'?{id:'vacation',label:'В отпуске',color:'purple'}:type==='shift'?{id:'shift',label:'На вахте',color:'green'}:{id:'rest',label:'На межвахте',color:'orange'}}
function shiftProgress(){return shiftPeriod()}
const STATUS_LABEL={shift:'На вахте',rest:'На межвахте',vacation:'В отпуске',offline:'Статус скрыт'};
function unreadMessages(){return state.chats.reduce((n,c)=>n+(Number(c.unread)||0),0)}
function unreadNotifications(){return state.notifications.filter(n=>!n.read&&notificationsEnabled(n.kind)).length}
function appendNotification(kind,title,body,eventKey=""){
 if(!notificationsEnabled(kind))return false;
 if(eventKey&&state.notifications.some(n=>n.eventKey===eventKey))return false;
 state.notifications.unshift({id:id(),title,body,date:today(),read:false,kind,eventKey});
 state.notifications=state.notifications.slice(0,250);
 return true;
}
function generateDueNotifications(){
 const prefs=state.notificationSettings,day=today();
 if(!prefs.enabled)return;
 let changed=false;
 const shift=state.shift;
 for(const [type,date,label] of [["start",shift.start,"Начало вахты"],["end",shift.end,"Окончание вахты"]]){
  const days=daysBetween(day,date);
  if(days>=0&&days<=prefs.shift_days){
   const body=days===0?(type==="start"?"Сегодня начинается вахта.":"Сегодня последний день вахты."):
    "До события осталось "+days+" "+plural(days,["день","дня","дней"])+".";
   changed=appendNotification("shift",label,body+" Дата: "+dateFull(date)+".","shift:"+type+":"+date)||changed;
  }
 }
 const holidays=[...holidaysForYear(new Date().getFullYear()),...holidaysForYear(new Date().getFullYear()+1)];
 for(const event of holidays){
  if(event.sector!==state.profile.sector)continue;
  const days=daysBetween(day,event.date);
  if(days>=0&&days<=prefs.holiday_days){
   const body=days===0?"Сегодня профессиональный праздник.":"Через "+days+" "+plural(days,["день","дня","дней"])+".";
   changed=appendNotification("holidays",event.name,body+" "+dateFull(event.date)+".","holiday:"+event.name+":"+event.date)||changed;
  }
 }
 if(changed)persist();
}
function pendingFriendRequests(direction="incoming"){return (state.friendRequests||[]).filter(r=>r.status==="pending"&&r.direction===direction)}
function unreadFriendRequests(){return pendingFriendRequests().length}
function nav(view){ui.view=view;ui.chatId=view==='thread'?ui.chatId:null;render();$('appMain').scrollTop=0;window.location.hash=view==='home'?'':view==='organizationDetail'&&ui.orgId?'organizationDetail/'+ui.orgId:view}
function updateBadges(){const online=Boolean(window.MVServerUI?.connected),m=online?0:unreadMessages(),n=online?window.MVServerUI.notificationCount:unreadNotifications(),f=online?window.MVServerUI.requestCount:unreadFriendRequests();$('messagesBadge').hidden=m===0;$('messagesBadge').textContent=m>9?'9+':m;$('notificationBadge').hidden=n===0;$('notificationBadge').textContent=n>9?'9+':n;const friendsBadge=$('friendsBadge');if(friendsBadge){friendsBadge.hidden=f===0;friendsBadge.textContent=f>9?'9+':f}const selected=['thread','messages'].includes(ui.view)?'messages':['friendProfile','friendDiscovery'].includes(ui.view)?'friends':['organizations','organizationDetail','organization','privacy','statistics','notes','holidays','profile','notifications','settings'].includes(ui.view)?'more':ui.view;document.querySelectorAll('.bottom-nav button').forEach(b=>{const a=b.dataset.nav===selected;b.classList.toggle('active',a);if(a)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')})}
function render(){generateDueNotifications();updateBadges();const renderers={home:homePage,calendar:calendarPage,finance:financePage,messages:messagesPage,thread:threadPage,friends:friendsPage,friendProfile:friendProfilePage,friendDiscovery:friendDiscoveryPage,more:morePage,organization:organizationPage,privacy:privacyPage,statistics:statsPage,notes:notesPage,holidays:holidaysPage,profile:profilePage,notifications:notificationsPage,settings:settingsPage,organizations:()=>window.MV_ORG.catalogPage(state,ui),organizationDetail:()=>window.MV_ORG.detailPage(state,ui)};try{$('appMain').innerHTML=(renderers[ui.view]||homePage)();window.MVServerUI?.onRender?.(ui.view)}catch(e){console.error('Render error',e);$('appMain').innerHTML='<div class="card"><h2>Не удалось открыть раздел</h2><p class="note-text">Попробуйте вернуться на главную страницу.</p>'+button('На главную','go-home','primary')+'</div>'}}
function nextEvents(){const p=state.payments.filter(p=>p.date>=today()).slice().sort((a,b)=>a.date.localeCompare(b.date)).map(p=>({date:p.date,title:p.type==='advance'?'Аванс':p.type==='salary'?'Зарплата':'Выплата',desc:money(p.amount),kind:'coins',color:'green'}));const events=[{date:state.shift.end,title:'Конец вахты',desc:'Возвращение на межвахтовый отдых',kind:'flag',color:'orange'}].concat(p).concat(holidaysForYear(parseISO(today()).getFullYear()).filter(h=>h.date>=today()).map(h=>({date:h.date,title:h.name,desc:h.sector,kind:'holiday',color:'red'}))).filter(x=>x.date>=today()).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4);return events}
function homePage(){const st=status(),p=shiftProgress();let heroText=st.id==='shift'?`${p.elapsed}-й день из ${p.len}`:st.id==='vacation'?'Отдых по вашему выбору':p.upcoming?'Вахта ещё не началась':'Текущая вахта завершена';const remaining=st.id==='shift'?`${p.remaining} ${plural(p.remaining,['день','дня','дней'])}`:st.id==='vacation'?'Время для себя':p.upcoming?`${p.untilStart} ${plural(p.untilStart,['день','дня','дней'])}`:'Вахта завершена';
return `<section class="hero-card"><div class="hero-photo"></div><div class="hero-body"><span class="hero-eyebrow">Текущий статус</span><div class="hero-status ${st.id}"><span class="status-dot"></span>${html(st.label)}</div><div class="hero-day">${html(heroText)}</div><div class="progress ${st.id==='shift'?'':'orange'}"><span style="--percent:${st.id==='shift'?p.percent:0}%"></span></div><div class="hero-meta"><div><span>Начало вахты</span><strong>${dateNumeric(p.start)}</strong></div><div><span>Конец вахты</span><strong>${dateNumeric(p.end)}</strong></div></div></div></section>
<div class="card countdown-card"><span class="countdown-icon">${icon('clock')}</span><div class="grow"><p class="small muted">${st.id==='shift'?'До межвахтового отдыха':st.id==='vacation'?'Ваш отдых':p.upcoming?'До начала вахты':'Текущий график'}</p><div class="countdown-large">${remaining}</div><p class="tiny muted">${st.id==='shift'?'Окончание вахты '+dateFull(p.end):st.id==='vacation'?'Статус отпуска задан вручную':p.upcoming?'Начало вахты '+dateFull(p.start):'Вахта завершилась '+dateFull(p.end)}</p></div></div>
${section('Быстрый доступ')}<div class="quick-grid">${[['calendar','calendar','Календарь','blue'],['finance','coins','Финансы','orange'],['notes','note','Заметки','purple'],['organizations','building','Организации','purple'],['friends','friends','Друзья','green'],['statistics','chart','Статистика','green']].map(([v,i,l,c])=>`<button class="quick-card" type="button" data-nav="${v}"><span class="${c}">${icon(i)}</span><span>${l}</span></button>`).join('')}</div>
${section('Ближайшие события','calendar','Календарь')}
<div class="card compact">${nextEvents().length?nextEvents().map(ev=>`<div class="event-row"><div class="event-date"><strong>${parseISO(ev.date).getDate()}</strong><small>${parseISO(ev.date).toLocaleDateString('ru-RU',{month:'short'})}</small></div><div class="mini-circle ${ev.color}">${icon(ev.kind)}</div><div class="event-body"><strong>${html(ev.title)}</strong><p>${html(ev.desc)}</p></div></div>`).join(''):'<div class="empty">Пока нет событий. Отмечайте выплаты и планы в календаре.</div>'}</div>
`}
function plural(n,v){const a=Math.abs(n)%100,b=a%10;return a>10&&a<20?v[2]:b===1?v[0]:b>=2&&b<=4?v[1]:v[2]}
function nthWeekday(year,month,weekDay,n){const first=new Date(year,month-1,1,12),offset=(weekDay-first.getDay()+7)%7;return localISO(new Date(year,month-1,1+offset+(n-1)*7,12))}
function lastWeekday(year,month,weekday){const last=new Date(year,month,0,12);return localISO(new Date(year,month-1,last.getDate()-(last.getDay()-weekday+7)%7,12))}
function holidaysForYear(year){return [
 {date:nthWeekday(year,4,0,1),name:'День геолога',sector:'Геология'},
 {date:nthWeekday(year,8,0,2),name:'День строителя',sector:'Строительство'},
 {date:lastWeekday(year,8,0),name:'День шахтёра',sector:'Горная промышленность'},
 {date:nthWeekday(year,9,0,1),name:'День работников нефтяной и газовой промышленности',sector:'Нефтегаз'},
 {date:lastWeekday(year,9,0),name:'День машиностроителя',sector:'Машиностроение'},
 {date:nthWeekday(year,10,0,3),name:'День работников дорожного хозяйства',sector:'Строительство'},
 {date:lastWeekday(year,10,0),name:'День автомобилиста',sector:'Транспорт'},
 {date:`${year}-12-22`,name:'День энергетика',sector:'Энергетика'},
 ].sort((a,b)=>a.date.localeCompare(b.date))}
const holidaysOn=date=>holidaysForYear(+date.slice(0,4)).filter(x=>x.date===date);
function calendarPage(){const shift=shiftPeriod();const [year,mon]=ui.calendarMonth.split('-').map(Number),first=new Date(year,mon-1,1,12),daysInMonth=new Date(year,mon,0,12).getDate(),pad=(first.getDay()+6)%7,count=Math.ceil((daysInMonth+pad)/7)*7;let grid='';for(let i=0;i<count;i++){const date=localISO(new Date(year,mon-1,1-pad+i,12)),d=parseISO(date),other=d.getMonth()!==mon-1,holiday=holidaysOn(date).length,pay=state.payments.some(p=>p.date===date),note=state.notes.some(n=>n.updated===date),type=dayType(date);grid+=`<button type="button" data-date="${date}" class="day ${other?'other':''} ${type} ${date===ui.selectedDate?'selected':''} ${date===today()?'today':''}" aria-label="${html(dateFull(date))}, ${type==='shift'?'вахта':type==='vacation'?'отпуск':'межвахта'}${holiday?', праздник':''}${pay?', выплата':''}${note?', заметка':''}"><span class="number">${d.getDate()}</span><span class="calendar-markers">${holiday?'<img src="assets/calendar-holiday.svg" alt="" aria-hidden="true">':''}${pay?'<img src="assets/calendar-payment.svg" alt="" aria-hidden="true">':''}${note?'<img src="assets/calendar-note.svg" alt="" aria-hidden="true">':''}</span></button>`}
const d=ui.selectedDate,selectedType=dayType(d),workday=inShift(d);
const dayHeading=selectedType==='vacation'?'Отпуск (вручную)':workday?'Вахтовый день':'Межвахтовый отдых';
const dayDescription=selectedType==='vacation'?(workday?'По графику это вахтовый день; включён ручной статус отпуска':'Ручной статус отпуска на сегодня'):workday?'День '+(daysBetween(shift.start,d)+1)+' из '+shift.len+' по графику':'Вне диапазона текущей вахты';
const pay=state.payments.filter(p=>p.date===d),holiday=holidaysOn(d);return `${title('Календарь','Вахты, межвахта, выплаты и профессиональные праздники')}
<div class="card calendar-card"><div class="shift-period-strip"><div><span class="shift-period-label">Сроки текущей вахты</span><strong>${dateNumeric(shift.start)} — ${dateNumeric(shift.end)}</strong><small>${shift.len} ${plural(shift.len,['день','дня','дней'])} по графику</small></div><button type="button" class="btn small secondary shift-end-jump" data-action="calendar-show-end" aria-label="Перейти к месяцу окончания вахты">К концу ›</button></div><div class="month-header"><button data-action="calendar-prev" aria-label="Предыдущий месяц">${icon('arrow-left')}</button><strong>${longMonth(ui.calendarMonth)}</strong><button data-action="calendar-next" aria-label="Следующий месяц">${icon('chevron')}</button></div><div class="calendar-grid">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(x=>`<div class="weekday">${x}</div>`).join('')}${grid}</div><div class="calendar-legend"><span class="legend"><b style="background:#a7652a"></b>Вахта</span><span class="legend"><b style="background:#277b57"></b>Межвахта</span><span class="legend"><b style="background:#b884fb"></b>Отпуск (фон)</span><span class="legend"><img src="assets/calendar-note.svg" alt="" aria-hidden="true">Заметка</span><span class="legend"><img src="assets/calendar-payment.svg" alt="" aria-hidden="true">Выплата</span><span class="legend"><img src="assets/calendar-holiday.svg" alt="" aria-hidden="true">Праздник</span></div></div>
<div class="card calendar-day-detail"><div class="row between"><h3 class="calendar-detail-title">${html(dateFull(d))}</h3><button class="btn small ghost" data-action="add-note" data-prefill-date="${d}">${icon('plus')} Заметка</button></div><p class="tiny muted">${html(weekday(d))}</p><div class="detail-entry">${tile(selectedType==='vacation'?'sun':workday?'helmet':'home',selectedType==='vacation'?'purple':workday?'orange':'green')}<div class="grow"><strong>${html(dayHeading)}</strong><small>${html(dayDescription)}</small></div></div>${pay.map(p=>`<div class="detail-entry">${tile('coins','green')}<div class="grow"><strong>${paymentType(p.type)} · ${money(p.amount)}</strong><small>${html(p.description||'Ручная запись')}</small></div></div>`).join('')}${holiday.map(h=>`<div class="detail-entry">${tile('holiday','red')}<div><strong>${html(h.name)}</strong><small>${html(h.sector)} · профессиональный праздник</small></div></div>`).join('')}<div class="calendar-actions">${button(icon('calendar')+' Вахта','edit-shift','secondary')}</div></div>
${section('Профессиональные праздники','holidays','Все праздники')}`+holidayList(holidaysForYear(year).filter(x=>x.date.startsWith(ui.calendarMonth)).slice(0,5))}
function holidayList(items){return `<div class="card compact">${items.length?items.map(h=>`<div class="holiday-item"><div class="holiday-date">${parseISO(h.date).getDate()}<small>${parseISO(h.date).toLocaleDateString('ru-RU',{month:'short'})}</small></div>${tile('holiday','red')}<div><strong>${html(h.name)}</strong><p>${html(h.sector)}</p></div></div>`).join(''):'<div class="empty">В этом месяце праздников из справочника нет.</div>'}</div>`}
function paymentType(type){return ({advance:'Аванс',salary:'Зарплата',bonus:'Премия',other:'Другая выплата'})[type]||'Выплата'}
function paymentsInMonth(key){return state.payments.filter(p=>monthKey(p.date)===key).sort((a,b)=>b.date.localeCompare(a.date))}
function financePage(){const shift=shiftPeriod(),shiftPayments=state.payments.filter(p=>inShift(p.date)),shiftTotal=shiftPayments.reduce((sum,p)=>sum+(Number(p.amount)||0),0);const items=paymentsInMonth(ui.financeMonth),tot=items.reduce((sum,p)=>sum+(Number(p.amount)||0),0),advance=items.filter(p=>p.type==='advance').reduce((sum,p)=>sum+p.amount,0),salary=items.filter(p=>p.type==='salary').reduce((sum,p)=>sum+p.amount,0);const weeks=[0,0,0,0,0];items.forEach(p=>{const w=Math.min(4,Math.floor((parseISO(p.date).getDate()-1)/7));weeks[w]+=p.amount});const max=Math.max(1,...weeks);return `${title('Финансы','Ручной учёт авансов, зарплат и других выплат',`<button class="icon-button" data-action="add-payment" aria-label="Добавить выплату">${icon('plus')}</button>`)}
<section class="card shift-earnings-card" aria-label="Итог выплат за текущую вахту">
  <div class="shift-earnings-heading"><span class="shift-earnings-icon">${icon('coins')}</span><span>Всего получено за вахту</span></div>
  <div class="shift-earnings-value">${money(shiftTotal)}</div>
  <div class="shift-earnings-dates">${dateNumeric(shift.start)} — ${dateNumeric(shift.end)}</div>
  <p class="shift-earnings-info">${shiftPayments.length? `${shiftPayments.length} ${plural(shiftPayments.length,['выплата','выплаты','выплат'])} за весь период вахты` : 'Выплат за эту вахту пока не записано'}</p>
  <p class="shift-earnings-hint">Сумма внесённых авансов, зарплат, премий и других выплат. Не включает ещё не полученные начисления.</p>
</section>
<div class="card"><div class="month-header"><button data-action="finance-prev" aria-label="Предыдущий месяц">${icon('arrow-left')}</button><strong>${longMonth(ui.financeMonth)}</strong><button data-action="finance-next" aria-label="Следующий месяц">${icon('chevron')}</button></div><p class="small muted">Получено за месяц</p><div class="amount">${money(tot)}</div><p class="tiny muted">Записывайте фактические поступления, а не прогноз.</p><div class="chart-wrap"><div class="chart">${weeks.map((num,i)=>`<div class="chart-item" title="${money(num)}"><i style="--bar-height:${Math.round(num/max*83)}px"></i><span>${i+1} нед.</span></div>`).join('')}</div></div><div class="money-tiles"><div class="money-tile">${tile('coins','green')}<div class="amount-sm">${money(advance)}</div><p>Авансы</p></div><div class="money-tile">${tile('briefcase','purple')}<div class="amount-sm">${money(salary)}</div><p>Зарплаты</p></div></div>${button(icon('plus')+' Добавить выплату','add-payment','primary full')}</div>
${section('История выплат')}<div class="card compact">${items.length?items.map(p=>`<div class="payment-row">${tile(p.type==='advance'?'coins':'briefcase',p.type==='advance'?'green':'purple')}<div class="grow"><strong>${paymentType(p.type)}</strong><small>${dateFull(p.date)}${p.description?' · '+html(p.description):''}</small></div><div class="value">+ ${money(p.amount)}</div><button type="button" class="btn-round" data-action="edit-payment" data-id="${p.id}" aria-label="Изменить выплату">${icon('edit')}</button></div>`).join(''):'<div class="empty">Пока нет записей за этот месяц. Добавьте аванс или зарплату.</div>'}</div>`}

const DEMO_INCOMING={id:"demo-invite-colleague",name:"Учебный коллега",role:"Демонстрационный аккаунт",company:"Тестовый профиль"};
const DEMO_OUTGOING={id:"demo-directory-colleague",name:"Тестовый пользователь",role:"Демонстрационный аккаунт",company:"Тестовый профиль"};
function demoAccount(info){
 if(!state.accounts[info.id])state.accounts[info.id]={id:info.id,name:info.name,role:info.role,company:info.company,avatarUrl:"",letter:info.name.slice(0,1),skin:"alt3",isDemo:true,currentOrganizationId:"",workHistory:[]};
 return state.accounts[info.id];
}
function addFriendNotice(title,body,kind,request){
 if(!notificationsEnabled(kind))return;
 state.notifications.unshift({id:id(),title,body,date:today(),read:false,kind,requestId:request?.id||"",accountId:request?.accountId||""});
}
function demoIncomingRequest(){
 const acc=demoAccount(DEMO_INCOMING);
 if(friendByAccountId(acc.id)||pendingFriendRequests().some(r=>r.accountId===acc.id)){toast("Тестовая заявка уже есть или принята");return}
 const request={id:"request-"+id(),accountId:acc.id,direction:"incoming",status:"pending",createdAt:today(),demo:true};
 state.friendRequests.unshift(request);
 addFriendNotice("Тестовая заявка в друзья","Учебный коллега отправил демонстрационную заявку.","friend_request",request);
 persist();render();toast("Поступила тестовая заявка в друзья");
}
function sendDemoFriendRequest(accountId){
 if(accountId!==DEMO_OUTGOING.id)return;
 const acc=demoAccount(DEMO_OUTGOING);
 if(friendByAccountId(accountId)){toast("Этот профиль уже в друзьях");return}
 if(pendingFriendRequests("outgoing").some(r=>r.accountId===accountId)){toast("Тестовая заявка уже отправлена");return}
 state.friendRequests.unshift({id:"request-"+id(),accountId,direction:"outgoing",status:"pending",createdAt:today(),demo:true});
 persist();render();toast("Тестовая заявка создана только на вашем устройстве");
}
function finishFriendRequest(requestId,decision){
 const r=state.friendRequests.find(r=>r.id===requestId&&r.status==="pending");
 if(!r||!state.accounts[r.accountId]||!["accepted","declined","cancelled"].includes(decision))return;
 if(r.direction==="incoming"&&!["accepted","declined"].includes(decision))return;
 if(r.direction==="outgoing"&&(!r.demo||!["accepted","cancelled"].includes(decision)))return;
 r.status=decision;
 if(decision==="accepted"){
  if(!friendByAccountId(r.accountId))state.friends.push({accountId:r.accountId,state:"offline",days:0});
  const person=accountById(r.accountId);
  addFriendNotice("Добавлен друг: демонстрация",person.name+" теперь в списке друзей (локальный тест).","friend_accepted",r);
 }
 state.notifications.filter(n=>n.kind==="friend_request"&&n.requestId===r.id).forEach(n=>n.read=true);
 persist();render();
 toast(decision==="accepted"?"Демонстрационный профиль добавлен в друзья":decision==="declined"?"Заявка отклонена":"Заявка отменена");
}
function friendRequestItem(r){
 const a=accountById(r.accountId);if(!a)return "";
 const incoming=r.direction==="incoming",rid=html(r.id);
 return `<article class="friend-request-row">
   <span class="friend-request-avatar">${avatarByAccountId(r.accountId)}</span>
   <div class="friend-request-main"><strong>${html(a.name)}</strong><small>Тестовый аккаунт · заявка только на этом устройстве</small>
    <div class="friend-request-actions">${incoming?
      `<button type="button" class="btn primary small" data-action="accept-friend-request" data-id="${rid}">Принять</button><button type="button" class="btn secondary small" data-action="decline-friend-request" data-id="${rid}">Отклонить</button>`:
      `<span class="friend-pending-label">Ожидает ответа · демо</span><button type="button" class="btn secondary small" data-action="cancel-friend-request" data-id="${rid}">Отменить</button><button type="button" class="btn ghost small" data-action="demo-accept-sent" data-id="${rid}">Проверить принятие</button>`}
    </div>
   </div>
 </article>`;
}
function friendDiscoveryResults(){
 const query=ui.friendDiscoverySearch.trim().toLocaleLowerCase("ru"),a=DEMO_OUTGOING;
 if(query&&![a.name,a.id,a.role].some(t=>t.toLocaleLowerCase("ru").includes(query)))return '<div class="empty">Реальный поиск появится после подключения сервера. Для проверки введите «Тестовый».</div>';
 const friend=state.friends.some(f=>f.accountId===a.id);
 const pending=pendingFriendRequests("outgoing").some(r=>r.accountId===a.id);
 return `<div class="friend-request-row"><span class="friend-request-avatar">${avatarByAccountId(a.id)}</span><div class="friend-request-main"><strong>${html(a.name)}</strong><small>ID: ${html(a.id)} · учебная запись</small></div><button type="button" class="btn small ${friend||pending?'secondary':'primary'}" ${friend||pending?'disabled':''} data-action="send-demo-request" data-id="${html(a.id)}">${friend?'В друзьях':pending?'Отправлена':'Заявка'}</button></div>`;
}
function friendDiscoveryPage(){
 if(window.MVServerUI?.connected)return `${title("Найти друзей","Зарегистрированные аккаунты",`<button class="btn secondary small" type="button" data-action="back-to-friends">Назад</button>`)}
  <div class="card"><p class="note-text">Показаны только пользователи, включившие поиск по ID или имени в настройках аккаунта.</p>
  <label class="searchbox">${icon('search')}<input type="search" id="mvServerSearch" placeholder="Имя или ID (от 3 символов)" autocomplete="off" maxlength="60" aria-label="Поиск пользователей"></label>
  <div id="mvServerResults" class="server-social-results"><p class="note-text">Введите не менее 3 символов.</p></div></div>
  <div class="friend-action-grid"><button class="friend-method" type="button" data-action="find-contacts"><span>${icon('friends')}</span><strong>Контакты</strong><small>Выбрать из телефона</small></button><button class="friend-method" type="button" data-action="invite-friend"><span>${icon('send')}</span><strong>Пригласить</strong><small>Поделиться прототипом</small></button></div>`;
 return `${title("Найти друзей","Поиск аккаунтов, контакты и приглашения",'<button type="button" class="btn secondary small" data-action="back-to-friends">Назад</button>')}
 <div class="card friend-discovery-card">
  <div class="friend-discovery-intro"><strong>${icon('search')} Поиск пользователей</strong><p>После запуска сервера здесь будут отображаться только зарегистрированные аккаунты. Номер телефона не показывается другим пользователям.</p></div>
  <label class="searchbox">${icon('search')}<input id="friendDiscoverySearch" type="search" value="${html(ui.friendDiscoverySearch)}" maxlength="80" placeholder="ID или имя пользователя" autocomplete="off" aria-label="Поиск зарегистрированного пользователя"></label>
  <div class="friend-demo-label">Пример результата для проверки интерфейса</div><div id="friendDiscoveryResults">${friendDiscoveryResults()}</div>
 </div>
 <div class="friend-action-grid">
  <button class="friend-method" type="button" data-action="find-contacts"><span>${icon('friends')}</span><strong>Контакты</strong><small>Выбрать из телефона</small></button>
  <button class="friend-method" type="button" data-action="invite-friend"><span>${icon('send')}</span><strong>Пригласить</strong><small>Поделиться ссылкой</small></button>
 </div>
 <div class="card friend-discovery-card"><h3>Проверка заявок</h3><p class="note-text">Сервер ещё не подключён. Здесь можно проверить получение заявки, уведомление, принятие и появление человека в друзьях.</p>
  ${button(icon('plus')+' Создать тестовую входящую заявку','demo-incoming-request','secondary full')}
 </div>
 <p class="friend-demo-notice">${icon('shield')} Телефонная книга не загружается автоматически. Поиск аккаунта по номеру станет возможным после запуска сервера и подтверждения телефона.</p>`;
}

function friendAvatar(f,size=""){return avatarByAccountId(f?.accountId||f?.id,size)}
function friendStatus(f){
 const config={
  shift:{label:"На вахте",detail:`Осталось ${f.days} ${plural(f.days,["день","дня","дней"])}`,color:"green",image:"shift"},
  rest:{label:"Межвахта",detail:`До вахты ${f.days} ${plural(f.days,["день","дня","дней"])}`,color:"orange",image:"rest"},
  vacation:{label:"Отпуск",detail:`Ещё ${f.days} ${plural(f.days,["день","дня","дней"])}`,color:"blue",image:"vacation"},
  offline:{label:"Не в сети",detail:"Статус не указан",color:"gray",image:"offline"}
 };
 const info=config[f.state]||config.offline;
 return `<span class="friend-status-panel"><span class="friend-status ${info.color}"><img src="assets/status-${info.image}.svg" alt="" aria-hidden="true"><span>${html(info.label)}</span></span><small>${html(info.detail)}</small></span>`;
}

function friendsPage(){
 if(window.MVServerUI?.connected)return `${title("Друзья","Заявки и подтверждённые друзья",`<button class="icon-button" type="button" data-action="add-friend" aria-label="Найти друга">${icon("plus")}</button>`)}<div id="mvServerFriends" class="card"><p class="note-text">Загружаем друзей с сервера…</p></div>`;
 const count=state.friends.length,incoming=pendingFriendRequests(),outgoing=pendingFriendRequests("outgoing");
 return `${title("Друзья","Коллеги, связь и планы",`<button class="icon-button" data-action="add-friend" aria-label="Найти и добавить друга">${icon("plus")}</button>`)}
 <div class="card friends-intro"><span class="friend-group-icon">${icon("friends")}</span><div class="grow"><h3>Найти знакомых</h3><p>По аккаунту, через контакты или приглашение</p></div>${button("Найти","add-friend","primary small")}</div>
 ${incoming.length?`<div class="section-head friends-heading"><h2>${icon('friends')} Заявки в друзья <span class="list-count">${incoming.length}</span></h2></div><div class="card compact friend-request-list">${incoming.map(friendRequestItem).join('')}</div>`:""}
 ${outgoing.length?`<div class="section-head friends-heading"><h2>Отправленные заявки <span class="small muted">${outgoing.length}</span></h2></div><div class="card compact friend-request-list">${outgoing.map(friendRequestItem).join('')}</div>`:""}
 <div class="friend-tools"><label class="searchbox">${icon("search")}<input id="friendSearch" type="search" placeholder="Поиск среди друзей" value="${html(ui.friendSearch)}" aria-label="Поиск среди друзей"></label></div>
 <div class="section-head friends-heading"><h2>${icon("friends")} Мои друзья <span class="small muted">${count}</span></h2><select id="friendFilter" aria-label="Фильтр по статусу"><option value="all" ${ui.friendFilter==="all"?"selected":""}>Все статусы</option><option value="shift" ${ui.friendFilter==="shift"?"selected":""}>На вахте</option><option value="rest" ${ui.friendFilter==="rest"?"selected":""}>Межвахта</option><option value="vacation" ${ui.friendFilter==="vacation"?"selected":""}>Отпуск</option><option value="offline" ${ui.friendFilter==="offline"?"selected":""}>Не в сети</option></select></div>
 <div id="friendResults" class="card compact friend-list">${friendsMarkup()}</div>
 ${state.friends.some(f=>accountById(f.accountId)?.isDemo)?`<p class="friend-demo-notice">${icon('shield')} Отмеченные как «Демо» анкеты — примеры из прототипа, не подтверждённые аккаунты. Реальные друзья появятся после подключения авторизации и сервера.</p>`:""}
 `;
}
function friendsMarkup(){
 const q=ui.friendSearch.trim().toLocaleLowerCase("ru");
 const list=state.friends.map(link=>friendByAccountId(link.accountId)).filter(f=>f&&(ui.friendFilter==="all"||f.state===ui.friendFilter)&&[f.name,f.role,f.company].some(x=>String(x).toLocaleLowerCase("ru").includes(q)));
 return list.map(f=>`<button class="person-row friend-list-row" type="button" data-action="friend-detail" data-id="${html(f.id)}" aria-label="Открыть анкету: ${html(f.name)}">
 <span class="friend-picture">${friendAvatar(f)}<i class="friend-presence ${f.state==="offline"?"away":"available"}"></i></span>
 <span class="friend-bio"><strong class="friend-name">${html(f.name)}</strong><small>${html(f.company||"Компания не указана")} · ${html(f.role||"Профессия не указана")}</small>${accountById(f.id)?.isDemo?'<span class="friend-demo-pill">Демо</span>':''}</span>
 ${friendStatus(f)}<span class="friend-chevron">${icon("chevron")}</span></button>`).join("")||`<div class="empty">По выбранному фильтру друзей нет.</div>`;
}
function friendOrganizationSection(demo){
 const ratings=demo.ratings;
 if(!ratings || demo.ratingAccess==="self"){
   return `<article class="card friend-profile-section"><h3>${icon("star")} Оценка организации</h3><div class="friend-sharing-note">${icon("lock")} Пользователь не открыл доступ к своим оценкам.</div></article>`;
 }
 const scores=Object.values(ratings).map(Number);
 const avg=scores.length? (scores.reduce((sum,val)=>sum+val,0)/scores.length).toFixed(1):"—";
 return `<article class="card friend-profile-section">
 <div class="row between"><h3>${icon("star")} Оценка организации</h3></div>
 <div class="friend-rating-overview"><span class="friend-rating-number">${avg}</span><span class="friend-rating-stars" aria-label="Средняя оценка ${avg} из 5">★ <span>${html("из 5")}</span></span></div>
 <div class="friend-rating-breakdown">
 ${Object.entries(ratings).map(([name,value])=>{
   const safe=Math.max(0,Math.min(5,Number(value)||0));
   return `<div class="friend-rating-criterion"><span class="friend-rating-label">${html(name)}</span><span class="friend-rating-icons" aria-label="${html(name)}: ${safe} из 5">${[1,2,3,4,5].map(i=>`<span aria-hidden="true" class="${i<=safe?'lit':''}">★</span>`).join("")}</span><b>${safe.toFixed(1)}</b></div>`;
 }).join("")}
 </div>
 ${demo.reviewAccess==="self"?`<div class="friend-sharing-note">${icon("lock")} Комментарий об организации скрыт.</div>`:demo.review?`<p class="friend-about friend-org-review">«${html(demo.review)}»</p>`:""}
 </article>`;
}
function friendFinancialSection(demo){
 const visible=demo.financeAccess==="friends"||demo.financeAccess==="all";
 if(!visible)return `<article class="card friend-profile-section"><h3>${icon("coins")} Финансы</h3><div class="friend-sharing-note">${icon("lock")} Друг не разрешил просматривать суммы и историю выплат.</div></article>`;
 const payments=Array.isArray(demo.payments)?demo.payments:[];
 const total=payments.reduce((sum,p)=>sum+(Number(p.amount)||0),0);
 return `<article class="card friend-profile-section">
 <div class="row between"><h3>${icon("coins")} Финансы</h3><span class="friend-shared-pill">${icon("eye")} Доступно друзьям</span></div>
 <div class="friend-finance-total"><small>Получено за отмеченный период</small><strong>${money(total)}</strong></div>
 ${payments.length?`<div class="friend-finance-items">${payments.map(p=>`<div class="friend-finance-row"><span><b>${html(paymentType(p.type))}</b><small>${html(dateFull(p.date))}</small></span><strong>+ ${money(p.amount)}</strong></div>`).join("")}</div>`:'<p class="friend-about">Выплаты пока не добавлены.</p>'}
 
 </article>`;
}
function friendProfilePage(){
 const f=friendByAccountId(ui.friendId);
 if(!f)return `${title("Анкета друга")}${button("К списку друзей","back-to-friends","primary")}`;
 const demo={"f1":{"location":"ЯНАО, Новопортовское месторождение","schedule":"60/30","experience":"5 лет","about":"Работаю вахтовым методом. Люблю технику и надёжных людей.","ratings":{"Зарплата":4,"Бытовые условия":5,"Руководство":4,"График вахты":5},"review":"Хорошие условия на объекте, выплаты по графику.","ratingAccess":"friends","reviewAccess":"friends","financeAccess":"friends","payments":[{"date":"2026-10-10","type":"advance","amount":55000},{"date":"2026-09-25","type":"salary","amount":73000}]},"f2":{"location":"Тюменская область","schedule":"30/30","experience":"3 года","about":"Электромонтаж, работа на промышленных объектах.","ratings":{"Зарплата":4,"Бытовые условия":4,"Руководство":3,"График вахты":4},"review":"Команда отличная, условия нормальные.","ratingAccess":"friends","reviewAccess":"friends","financeAccess":"self","payments":[]},"f3":{"location":"Красноярский край","schedule":"45/45","experience":"6 лет","about":"Исследую новые места и люблю путешествия.","ratings":{"Зарплата":5,"Бытовые условия":4,"Руководство":4,"График вахты":5},"review":"Интересные проекты и дружный коллектив.","ratingAccess":"friends","reviewAccess":"friends","financeAccess":"self","payments":[]},"f4":{"location":"Республика Коми","schedule":"30/30","experience":"4 года","about":"Ремонт и обслуживание промышленного оборудования.","ratings":{"Зарплата":4,"Бытовые условия":3,"Руководство":4,"График вахты":4},"review":"Стабильная работа и понятные задачи.","ratingAccess":"friends","reviewAccess":"friends","financeAccess":"friends","payments":[{"date":"2026-10-15","type":"advance","amount":48000},{"date":"2026-09-30","type":"salary","amount":62000}]}}[f.id]||{location:"Не указано",schedule:"Не указан",experience:"Не указан",about:"Информация о себе пока не заполнена.",ratings:null,review:"",ratingAccess:"self",reviewAccess:"self",financeAccess:"self",payments:[]};
 const safeId=html(f.id);
 const isVisible=f.state!=="offline";
 return `${accountById(f.id)?.isDemo?'<div class="friend-demo-banner">Демонстрационный профиль, не подтверждённый пользователь</div>':''}<div class="friend-profile-header"><button type="button" class="friend-back" data-action="back-to-friends" aria-label="Назад к друзьям">${icon("arrow-left")}</button><h1>Профиль друга</h1><button type="button" class="friend-message-icon" data-action="chat-friend" data-id="${safeId}" aria-label="Написать другу">${icon("chat")}</button></div>
 <article class="card friend-profile-main"><div class="friend-profile-head">${friendAvatar(f,"profile-avatar-xl")}<div class="friend-profile-info"><h2>${html(f.name)}</h2><p>${html(f.company||"Организация не указана")}</p><p>${html(f.role||"Профессия не указана")}</p>${friendStatus(f)}</div></div></article>
 <article class="card friend-profile-section"><h3>${icon("friends")} О человеке</h3><p class="friend-about">${html(demo.about)}</p><dl class="friend-profile-facts"><div><dt>Организация</dt><dd>${html(f.company||"Не указана")}</dd></div><div><dt>Должность</dt><dd>${html(f.role||"Не указана")}</dd></div><div><dt>График</dt><dd>${html(demo.schedule)}</dd></div><div><dt>Регион</dt><dd>${html(demo.location)}</dd></div><div><dt>Стаж</dt><dd>${html(demo.experience)}</dd></div></dl></article>
 ${window.MV_ORG.reviewsForFriend(state,f.id).length?
  `<section class="friend-org-samples"><h3 class="friend-org-reviews-title">${icon("star")} Отзывы о местах работы</h3>${window.MV_ORG.reviewsForFriend(state,f.id).map(r=>{
   const company=window.MV_ORG.byId(r.organizationId);
   return `<div class="friend-org-review-entry"><button type="button" class="org-employment-link" data-action="open-org" data-id="${html(r.organizationId)}"><span>${html(company?.name||"Организация")}</span>${icon("chevron")}</button>${window.MV_ORG.reviewCard(r,state)}</div>`;
  }).join("")}</section>`:
  friendOrganizationSection(demo)}
 ${friendFinancialSection(demo)}
 <article class="card friend-profile-section"><h3>${icon("building")} Опыт работы</h3>${(f.workHistory||[]).map(h=>{const o=window.MV_ORG.byId(h.organizationId);return o?`<button class="org-employment-link" type="button" data-action="open-org" data-id="${html(o.id)}"><span>${html(o.name)}</span><small>${html(h.since||"")} — ${html(h.until||"сейчас")}</small>${icon("chevron")}</button>`:""}).join("")||'<p class="friend-about">Нет записей об организациях.</p>'}</article>
 <article class="card friend-profile-section"><h3>${icon("calendar")} Текущий статус</h3><div class="friend-shift-card">${friendStatus(f)}${isVisible?`<div class="friend-shift-track"><span style="width:${Math.max(9,100-Math.min(90,Math.max(0,Number(f.days)||0)))}%"></span></div>`:""}</div>
 </article>
 <article class="card friend-profile-section"><h3>${icon("lock")} Конфиденциальность</h3><p class="friend-about">Анкета показывает только разрешённые владельцем сведения. Точные даты и календарь вахт могут быть скрыты.</p></article>
 <div class="friend-profile-actions">${button(`${icon("chat")} Написать`,"chat-friend","primary",`data-id="${safeId}"`)}${button(`${icon("arrow-left")} К друзьям`,"back-to-friends","secondary")}</div>
 `;
}
function messagesPage(){if(window.MVServerUI?.connected)return `${title('Сообщения','Личные беседы с подтверждёнными друзьями')}<div id="mvServerMessages" class="card"><p class="note-text">Загрузка списка друзей…</p></div>`;const chats=state.chats;return `${title('Сообщения','Личные и групповые беседы',`<button class="icon-button" data-action="start-chat" aria-label="Новый чат">${icon('plus')}</button>`)}<div class="row between" style="margin:14px 0 6px"><h3>Все беседы</h3><span class="pill orange">${unreadMessages()} непрочитано</span></div><div class="card compact">${chats.length?chats.map(c=>{const m=c.messages[c.messages.length-1],account=accountById(c.participantAccountId);return `<button class="chat-row" type="button" data-action="open-chat" data-id="${html(c.id)}">${avatarByAccountId(c.participantAccountId)}<span class="grow"><strong class="friend-name">${html(account?.name||'Пользователь')}</strong><small>${m?html(m.text):'Начните диалог'}</small></span><span class="trailing"><time>${html(m?.time||'')}</time>${c.unread?`<span class="list-count">${c.unread}</span>`:''}</span></button>`}).join(''):'<div class="empty">Пока нет чатов. Выберите друга, чтобы начать переписку.</div>'}</div>`}
function threadPage(){const chat=state.chats.find(x=>x.id===ui.chatId);if(!chat)return `${title('Сообщения')}${button('К списку чатов','back-to-messages','secondary')}`;const account=accountById(chat.participantAccountId);return `<header class="page-title" style="align-items:center"><div class="row"><button type="button" class="btn-round" data-action="back-to-messages" aria-label="Назад">${icon('arrow-left')}</button><button type="button" class="chat-profile-trigger" data-action="friend-detail" data-id="${html(chat.participantAccountId)}" aria-label="Открыть анкету">${avatarByAccountId(chat.participantAccountId,"chat-header-avatar")}</button><div><h1 style="font-size:17px;margin:0">${html(account?.name||'Пользователь')}</h1></div></div></header><div class="chat-thread">${chat.messages.map(m=>`<div class="bubble ${m.out?'out':''}">${html(m.text)}<time>${html(m.time)}</time></div>`).join('')}</div><div class="composer"><input id="messageInput" type="text" maxlength="1000" autocomplete="off" placeholder="Написать сообщение…" aria-label="Написать сообщение"><button type="button" data-action="send-message" aria-label="Отправить сообщение">${icon('send')}</button></div>`}
function morePage(){return `${title('Ещё','Профиль, организация и личные инструменты')}${window.MVServerUI?.available?`<div class="card compact server-account-card"><div class="card-title">${icon('server')} Локальный сервер</div><p class="note-text">${html(window.MVServerUI.label())}</p><div style="margin-top:10px">${button('Управление аккаунтом и синхронизацией','server-account','secondary full')}</div></div>`:''}<div class="card compact"><button class="more-item" data-nav="profile">${tile('friends','orange')}<span class="grow"><strong>Мой профиль</strong><small>Имя, профессия, статус</small></span>${icon('chevron','chev')}</button><button class="more-item" data-nav="organization">${tile('building','purple')}<span class="grow"><strong>Моя организация</strong><small>Рейтинг и отзыв работодателя</small></span>${icon('chevron','chev')}</button><button class="more-item" data-nav="organizations">${tile('building','orange')}<span class="grow"><strong>Каталог организаций</strong><small>Оценки работников и знакомые в компаниях</small></span>${icon('chevron','chev')}</button><button class="more-item" data-nav="privacy">${tile('lock','blue')}<span class="grow"><strong>Конфиденциальность</strong><small>Что видят друзья и другие люди</small></span>${icon('chevron','chev')}</button><button class="more-item" data-nav="notifications">${tile('bell','orange')}<span class="grow"><strong>Уведомления</strong><small>События и настройки оповещений</small></span>${unreadNotifications()?`<span class="list-count">${unreadNotifications()}</span>`:''}${icon('chevron','chev')}</button></div><div class="card compact"><button class="more-item" data-nav="notes">${tile('note','orange')}<span class="grow"><strong>Мои заметки</strong><small>Записи и списки дел</small></span>${icon('chevron','chev')}</button><button class="more-item" data-nav="statistics">${tile('chart','green')}<span class="grow"><strong>Статистика</strong><small>Дни на вахте, выплаты и история</small></span>${icon('chevron','chev')}</button><button class="more-item" data-nav="holidays">${tile('holiday','red')}<span class="grow"><strong>Профессиональные праздники</strong><small>Календарь для разных профессий</small></span>${icon('chevron','chev')}</button><button class="more-item" data-nav="settings">${tile('settings','blue')}<span class="grow"><strong>Настройки и данные</strong><small>Резервная копия, импорт и режим работы</small></span>${icon('chevron','chev')}</button></div>`}
function notesPage(){const list=state.notes.filter(n=>[n.title,n.category,n.text].join(' ').toLocaleLowerCase('ru').includes(ui.noteSearch.toLocaleLowerCase('ru')));return `${title('Заметки','Списки для сборов и личные записи',`<button class="icon-button" data-action="add-note" aria-label="Новая заметка">${icon('plus')}</button>`)}<label class="searchbox">${icon('search')}<input id="noteSearch" value="${html(ui.noteSearch)}" placeholder="Поиск по заметкам" aria-label="Поиск заметок"></label><div class="row" style="margin-bottom:15px">${button(icon('plus')+' Новая заметка','add-note','primary full')}${button(icon('backpack')+' Список дел','add-checklist','secondary full')}</div><div id="notesResults">${notesMarkup(list)}</div>`}
function notesMarkup(list){return list.map(n=>`<article class="card notes-card"><div class="row between"><div><strong>${html(n.title)}</strong><p class="tiny muted">${html(n.category)} · ${dateShort(n.updated)}</p></div><button class="btn-round" data-action="edit-note" data-id="${n.id}" aria-label="Изменить заметку">${icon('edit')}</button></div>${n.text?`<p class="notes-content">${html(n.text)}</p>`:''}${n.tasks.map((t,i)=>`<label class="task-item ${t.done?'completed':''}"><input type="checkbox" data-task-note="${n.id}" data-task-index="${i}" ${t.done?'checked':''}><span>${html(t.text)}</span></label>`).join('')}${!n.text&&!n.tasks.length?'<p class="note-text">Пустая заметка</p>':''}</article>`).join('')||'<div class="empty">Заметок пока нет.</div>'}
function ratingAverage(){const x=Object.values(state.org.ratings||{});return x.length?(x.reduce((a,b)=>a+Number(b),0)/x.length).toFixed(1):'0.0'}
function organizationPage(){
 const organization=window.MV_ORG.byId(state.org.organizationId);
 const myReview=state.organizationReviews.find(r=>r.organizationId===state.org.organizationId&&r.authorAccountId==='me');
 return `${title('Моя организация','Работодатель и мой отзыв',`<button class="icon-button" data-action="edit-organization" aria-label="Изменить организацию">${icon('edit')}</button>`)}
 <article class="card"><div class="profile-cover"></div><div class="row between" style="align-items:start">
 <div><h2 class="company-title">${html(organization?.name||state.org.name||'Организация не выбрана')}</h2><p class="small muted">${html(state.org.description||organization?.industry||'')}${state.org.region?' · '+html(state.org.region):''}</p></div>
 </div><div class="row" style="margin-top:11px">${button(icon('building')+' Карточка организации','open-my-org','secondary full')}</div></article>
 ${myReview?`<div class="org-title-line org-review-section-title"><h2>Мой отзыв</h2></div>${window.MV_ORG.reviewCard(myReview,state)}`:
 `<article class="card"><div class="card-title">${icon('star')} Мой отзыв</div><p class="note-text">Поставьте оценки по условиям работы, добавьте комментарии и фотографии.</p>${button(icon('edit')+' Оценить условия работы','review-my-org','primary full')}</article>`}
 `;
}
function reviewScopeName(s){return ({all:'Всем',friends:'Друзьям',selected:'Избранным друзьям',self:'Только мне'})[s]||'Только мне'}
const privacyFields=[['status','Статус','Вахта, межвахта или отпуск'],['countdown','Обратный отсчёт','Через сколько дней домой'],['calendar','Календарь вахт','Рабочие и свободные даты'],['org','Моя организация','Название работодателя'],['finance','Финансы','Суммы и история полученных выплат']];
function reviewPrivacyMarkup(){
 const reviews=state.organizationReviews.filter(r=>r.authorAccountId==='me');
 if(!reviews.length)return '<p class="note-text">Пока нет ваших отзывов. После публикации отзыв по умолчанию виден только вам; изменить его видимость можно здесь.</p>';
 return reviews.map(r=>{
  const name=window.MV_ORG.byId(r.organizationId)?.name||'Организация';
  const scope=['all','friends','selected','self'].includes(r.scope)?r.scope:'self';
  const allowed=Array.isArray(r.allowedAccountIds)?r.allowedAccountIds:[];
  return `<div class="privacy-review-item" style="padding:12px 0;border-top:1px solid var(--line)">
   <strong>${html(name)}</strong>
   <label class="privacy-row"><span>Кто видит отзыв</span><select data-review-privacy="scope" data-review-id="${html(r.id)}" aria-label="Видимость отзыва: ${html(name)}">
   ${[['self','Только мне'],['selected','Избранным друзьям'],['friends','Всем друзьям'],['all','Всем']].map(([value,label])=>`<option value="${value}" ${scope===value?'selected':''}>${label}</option>`).join('')}
   </select></label>
   ${scope==='selected'?`<div class="org-selected-friends"><strong>Разрешённые друзья</strong>${state.friends.map(f=>{const a=accountById(f.accountId);return a?`<label style="display:block;margin-top:8px"><input type="checkbox" data-review-allowed="1" data-review-id="${html(r.id)}" value="${html(a.id)}" ${allowed.includes(a.id)?'checked':''}> ${html(a.name)}</label>`:""}).join('')||'<p class="tiny muted">Пока нет друзей. Отзыв останется скрытым.</p>'}</div>`:""}
   <label class="privacy-row"><span>Скрывать моё имя в каталоге</span><input type="checkbox" data-review-anonymous="1" data-review-id="${html(r.id)}" ${r.anonymous?'checked':''}></label>
  </div>`;
 }).join('');
}
function privacyPage(){return `${title('Конфиденциальность','Вы решаете, что смогут увидеть другие')}<div class="card"><div class="card-title">${icon('shield')} Видимость данных</div>${privacyFields.map(([key,label,desc])=>`<label class="privacy-row"><div><strong>${html(label)}</strong><small>${html(desc)}</small></div><select data-privacy="${key}" aria-label="${html(label)}"><option value="all" ${state.privacy[key]==='all'?'selected':''}>Всем</option><option value="friends" ${state.privacy[key]==='friends'?'selected':''}>Друзьям</option><option value="self" ${state.privacy[key]==='self'?'selected':''}>Только мне</option></select></label>`).join('')}<div class="finance-privacy-warning">${icon('shield')} Финансовые данные по умолчанию скрыты. Открыв доступ, вы разрешите выбранной аудитории видеть суммы и даты выплат.</div></div><div class="card"><div class="card-title">${icon('star')} Конфиденциальность отзывов</div>${reviewPrivacyMarkup()}</div><div class="card"><div class="card-title">${icon('eye')} Предпросмотр для друга</div>${previewForFriend()}</div>`}
function sharedFinancePreview(){
 const recent = state.payments.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,4);
 const total = state.payments.reduce((sum,p)=>sum+(Number(p.amount)||0),0);
 return `<div class="shared-finance-preview"><strong>Доступные другу финансы</strong><p class="muted tiny">Всего записано: ${money(total)}</p>
 ${recent.length?recent.map(p=>`<div class="shared-payment-row"><span>${html(dateShort(p.date))} · ${html(paymentType(p.type))}</span><b>+${money(p.amount)}</b></div>`).join(''):'<p class="small muted">Пока нет записей о выплатах</p>'}
 </div>`;
}
function previewForFriend(){const can = k=>['all','friends'].includes(state.privacy[k]);const st=status(),p=shiftProgress(),review=state.organizationReviews.find(r=>r.authorAccountId==='me'&&r.organizationId===state.org.organizationId);
const showReview=review&&['all','friends'].includes(review.scope);
const valid=showReview?window.MV_ORG.CRITERIA.map(x=>Number(review.sections?.[x.id]?.rating)||0).filter(x=>x>=1&&x<=5):[];
const reviewScore=valid.length?(valid.reduce((a,b)=>a+b,0)/valid.length).toFixed(1):null;
return `<p class="note-text">Друг увидит примерно такую карточку:</p><div class="card compact" style="margin-top:10px"><strong>${html(state.profile.name)}</strong><div style="margin-top:7px">${can('status')?`<span class="pill ${st.color}">${st.label}</span>`:'<span class="pill gray">Статус скрыт</span>'}</div>${can('countdown')?`<p class="small muted" style="margin-top:8px">${st.id==='shift'?'Домой через '+p.remaining+' дней':'На отдыхе'}</p>`:''}${can('org')?`<p class="small muted" style="margin-top:7px">Работает в ${html(state.org.name)}</p>`:''}${reviewScore?`<p class="small muted" style="margin-top:7px">Отзыв об организации: ★ ${reviewScore}</p>`:''}<div class="tiny muted" style="margin-top:10px">Календарь: ${can('calendar')?'доступен':'скрыт'} · Финансы: ${can('finance')?'доступны':'скрыты'}</div>${can('finance') ? sharedFinancePreview() : '<div class="finance-private-note">🔒 Финансовая история не видна друзьям</div>'}</div>`}
function profilePage(){const st=status();return `${title('Мой профиль','Информация, которая относится к вам',`<button class="icon-button" data-action="edit-profile" aria-label="Изменить профиль">${icon('edit')}</button>`)}<div class="card"><div class="row"><span class="avatar alt1" style="width:62px;height:62px;font-size:23px">${html(state.profile.name.slice(0,1).toUpperCase())}</span><div><h2>${html(state.profile.name)}</h2><p class="small muted" style="margin-top:5px">${html(state.profile.profession)}</p><span class="pill ${st.color}" style="margin-top:8px">${st.label}</span></div></div></div><div class="card"><div class="card-title">${icon('calendar')} Мой график</div><p class="small muted">Начало: ${dateFull(state.shift.start)}</p><p class="small muted" style="margin-top:6px">Конец: ${dateFull(state.shift.end)}</p><p class="tiny muted" style="margin-top:12px">Изменить даты можно в разделе «Календарь» → «Вахта».</p><div style="margin-top:9px">${button('Статус: '+(state.vacation?'отпуск':'автоматически'),'edit-status','secondary full')}</div></div>`}
function statsPage(){const year=ui.statsYear;let days=0;let months=[],amount=0;for(let m=1;m<=12;m++){let count=0;const max=new Date(year,m,0).getDate();for(let d=1;d<=max;d++){const iso=`${year}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;if(inShift(iso))count++}days+=count;months.push(count)}const pays=state.payments.filter(p=>p.date.startsWith(String(year)));amount=pays.reduce((s,p)=>s+p.amount,0);const mx=Math.max(...months,1);return `${title('Статистика','Рабочее время и история за выбранный год')}<div class="card"><div class="month-header"><button data-action="stats-prev">${icon('arrow-left')}</button><strong>${year} год</strong><button data-action="stats-next">${icon('chevron')}</button></div><div class="stat-grid"><div class="money-tile">${tile('helmet','orange')}<div class="stat-number">${days}</div><div class="stat-label">Дней на вахте</div></div><div class="money-tile">${tile('home','green')}<div class="stat-number">${Math.max(0,daysInYear(year)-days)}</div><div class="stat-label">Дней вне этой вахты</div></div><div class="money-tile">${tile('coins','green')}<div class="stat-number" style="font-size:18px">${money(amount)}</div><div class="stat-label">Записано выплат</div></div><div class="money-tile">${tile('calendar','blue')}<div class="stat-number">${pays.length}</div><div class="stat-label">Финансовых записей</div></div></div></div><div class="card"><div class="card-title">Дни по текущему графику</div><div class="chart-wrap"><div class="chart">${months.map((n,i)=>`<div class="chart-item"><i style="--bar-height:${Math.round(n/mx*84)}px;background:linear-gradient(180deg,#ffb36e,#de6822)"></i><span>${['Я','Ф','М','А','М','И','И','А','С','О','Н','Д'][i]}</span></div>`).join('')}</div></div><p class="note-text" style="margin-top:14px">Статистика рассчитана по выбранному графику.</p></div>${button('Перейти к выплатам','go-finance','primary full')}`}
function daysInYear(y){return (new Date(y+1,0,1)-new Date(y,0,1))/86400000}
function holidaysPage(){const yr=parseISO(today()).getFullYear(), all=[...holidaysForYear(yr),...holidaysForYear(yr+1)];const sectors=['all',...new Set(all.map(x=>x.sector))];const selected=all.filter(h=>ui.holidaySector==='all'||ui.holidaySector===h.sector);return `${title('Профессиональные праздники','Справочник дат для разных рабочих специальностей')}<label class="field"><span>Фильтр по сфере работы</span><select id="holidayFilter">${sectors.map(s=>`<option value="${html(s)}" ${s===ui.holidaySector?'selected':''}>${s==='all'?'Все профессии':html(s)}</option>`).join('')}</select></label>${holidayList(selected)}<p class="note-text">Показаны наиболее известные профессиональные праздники. Даты переходящих праздников рассчитываются для каждого года. </p>`}
function shiftNotificationDetails(n){
 if(n.kind!=='shift')return n;
 const p=shiftPeriod();
 const title=p.upcoming?'Вахта скоро начнётся':p.completed?'Вахта завершена':p.remaining<=21?'Вахта скоро закончится':'Текущая вахта';
 const body=p.upcoming?`Начало ${dateFull(p.start)}. До начала ${p.untilStart} ${plural(p.untilStart,['день','дня','дней'])}.`:p.completed?`Вахта завершилась ${dateFull(p.end)}.`:`Окончание ${dateFull(p.end)}. Осталось ${p.remaining} ${plural(p.remaining,['день','дня','дней'])}.`;
 return {...n,title,body};
}

function notificationRow(key,label,description,iconName){
 const p=state.notificationSettings;
 return '<label class="notice-setting-row"><span class="notice-setting-icon">'+icon(iconName)+'</span>'+
  '<span class="notice-setting-copy"><strong>'+html(label)+'</strong><small>'+html(description)+'</small></span>'+
  '<input type="checkbox" data-notification-setting="'+key+'" aria-label="'+html(label)+'" '+(p[key]?'checked':'')+
  (!p.enabled&&key!=='enabled'?' disabled':'')+'><span class="notice-switch" aria-hidden="true"></span></label>';
}
function notificationDays(key,label){
 const p=state.notificationSettings,category=key==='shift_days'?'shift':'holidays';
 return '<label class="notice-days-row"><span>'+html(label)+'</span><select data-notification-setting="'+key+'"'+(!p.enabled||!p[category]?' disabled':'')+'>'+
 NOTIFICATION_DAY_OPTIONS[key].map(n=>'<option value="'+n+'"'+(p[key]===n?' selected':'')+'>'+(n===0?'В день события':'За '+n+' '+plural(n,['день','дня','дней']))+'</option>').join('')+'</select></label>';
}
function notificationSettingsMarkup(){
 return '<div class="card notice-settings-card"><div class="card-title">'+icon('bell')+' Основные настройки</div>'+
   notificationRow('enabled','Уведомления в приложении','Общий переключатель уведомлений и счётчика','bell')+
   '<p class="notice-help">Выключенные категории не создают новые уведомления. Старые записи сохраняются.</p></div>'+
  '<div class="card notice-settings-card"><div class="card-title">'+icon('calendar')+' График и события</div>'+
   notificationRow('shift','Начало и окончание вахты','Напоминать о датах моего графика','calendar')+
   notificationDays('shift_days','Предупреждать о вахте')+
   notificationRow('payments','Финансы','Оповещать о добавленных выплатах','coins')+
   notificationRow('holidays','Профессиональные праздники','Для сферы работы, указанной в профиле','holiday')+
   notificationDays('holiday_days','Предупреждать о празднике')+'</div>'+
  '<div class="card notice-settings-card"><div class="card-title">'+icon('friends')+' Общение</div>'+
   notificationRow('message','Новые сообщения','Когда друг отправляет сообщение','chat')+
   notificationRow('friend_request','Заявки в друзья','Когда меня хотят добавить в друзья','friends')+
   notificationRow('friend_accepted','Заявка принята','Когда мою заявку принимают','check')+'</div>'+
  '<p class="note-text notice-disclaimer">Это уведомления внутри приложения: календарные напоминания создаются при открытии сайта. Push при закрытом приложении пока не поддерживается. '+
  (window.MVServerUI?.connected?'Настройки категорий также сохраняются на сервере.':'Без входа настройки сохраняются в этом браузере.')+'</p>';
}
function notificationsPage(){
 const online=Boolean(window.MVServerUI?.connected),tab=ui.notificationsTab;
 const tabs='<div class="notice-tabs" role="group" aria-label="Разделы уведомлений">'+
  '<button type="button" class="'+(tab==='inbox'?'active':'')+'" data-action="notification-tab" data-tab="inbox" aria-pressed="'+(tab==='inbox')+'">'+icon('bell')+' Входящие</button>'+
  '<button type="button" class="'+(tab==='settings'?'active':'')+'" data-action="notification-tab" data-tab="settings" aria-pressed="'+(tab==='settings')+'">'+icon('settings')+' Настроить</button></div>';
 const header=title('Уведомления',tab==='settings'?'Выберите нужные оповещения':'История событий и оповещений');
 if(tab==='settings')return header+tabs+notificationSettingsMarkup();
 if(online)return header+tabs+
   '<div class="notice-actions"><button type="button" class="btn secondary small" data-mv-action="read-all">Прочитать все</button></div>'+
   '<div id="mvServerNotifications" class="card compact"><p class="note-text">Загружаем уведомления с сервера…</p></div>';
 const records=state.notifications.filter(n=>notificationsEnabled(n.kind)).map(n=>{
  const request=n.kind==='friend_request'?state.friendRequests.find(r=>r.id===n.requestId&&r.status==='pending'&&r.direction==='incoming'):null;
  if(request)return '<article class="friend-notification"><div class="friend-notification-title">'+icon('friends')+' <strong>'+html(n.title)+'</strong><span class="friend-demo-pill">Демо</span></div>'+
     '<p class="small muted">'+html(n.body)+'</p><div class="friend-request-actions"><button type="button" class="btn primary small" data-action="accept-friend-request" data-id="'+html(request.id)+'">Принять</button>'+
     '<button type="button" class="btn secondary small" data-action="decline-friend-request" data-id="'+html(request.id)+'">Отклонить</button></div></article>';
  const kind=categoryForNotification(n.kind);
  return '<button type="button" class="chat-row" data-action="read-notification" data-id="'+html(n.id)+'">'+
    tile(kind==='message'?'chat':kind==='holidays'?'holiday':kind==='payments'?'coins':kind.startsWith('friend_')?'friends':'bell',n.read?'blue':'orange')+
    '<div class="grow"><strong class="friend-name">'+html(n.title)+'</strong><small style="white-space:normal">'+html(n.body)+'</small><small>'+dateShort(n.date)+'</small></div>'+
    (!n.read?'<span class="list-count">1</span>':'')+'</button>';
 }).join('');
 return header+tabs+'<div class="notice-actions">'+button('Прочитать все','read-all','secondary small')+'</div>'+
   '<div class="card compact">'+(records||'<div class="empty">Нет уведомлений по выбранным категориям.</div>')+'</div>';
}
function settingsPage(){return `${title('Настройки и данные','Резервные копии и управление данными')}<div class="card"><div class="card-title">${icon('shield')} Резервное копирование</div><div class="row" style="margin-top:13px">${button(icon('download')+' Экспорт JSON','export','primary full')}${button(icon('upload')+' Импорт','import','secondary full')}</div></div><div class="card"><div class="card-title">Управление данными</div><div style="margin-top:14px">${button('Сбросить данные','reset','danger full')}</div></div>`}
let onModalSave=null;
let editingPayment=null;
function openDialog(heading,body,onSave=null,saveLabel='Сохранить',additional=''){
 onModalSave=onSave;const dialog=$('appDialog');$('dialogTitle').textContent=heading;$('dialogBody').innerHTML=body;$('dialogActions').innerHTML=additional+`<button class="btn secondary" type="button" data-action="close-dialog">Отмена</button>`+(onSave?`<button class="btn primary" type="submit">${html(saveLabel)}</button>`:'');
 if(!dialog.open)dialog.showModal();
}
function closeDialog(){$('appDialog').close();onModalSave=null;editingPayment=null}
const inputField=(label,name,value,type='text',extra='')=>`<label class="field"><span>${html(label)}</span><input name="${name}" type="${type}" value="${html(value)}" ${extra}></label>`;
const selectField=(label,name,values,value)=>`<label class="field"><span>${html(label)}</span><select name="${name}">${values.map(([v,text])=>`<option value="${html(v)}" ${v===value?'selected':''}>${html(text)}</option>`).join('')}</select></label>`;
const textareaField=(label,name,value,placeholder='')=>`<label class="field"><span>${html(label)}</span><textarea name="${name}" placeholder="${html(placeholder)}">${html(value)}</textarea></label>`;
function validShiftDate(value){
 const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value||''));
 if(!m)return false;
 return localISO(new Date(+m[1],+m[2]-1,+m[3],12))===value;
}
// Only mutation point for the shift period. Future server storage can replace local persist().
function saveShiftDates(start,end){
 if(!validShiftDate(start)||!validShiftDate(end)||start>end){toast('Проверьте даты: окончание не может быть раньше начала.');return false}
 const previous=state.shift;state.shift={start,end};
 if(!persist()){state.shift=previous;return false}
 return true;
}
function editShift(){openDialog('Даты вахты',`<p class="note-text" style="margin-bottom:13px">Продлите вахту, изменив дату окончания. Календарь, главная страница, финансы и статистика пересчитаются автоматически.</p>${inputField('Начало вахты','start',state.shift.start,'date','required')}${inputField('Конец вахты','end',state.shift.end,'date','required')}`,form=>{
 if(!saveShiftDates(String(form.get('start')||''),String(form.get('end')||'')))return false;
 // Preserve the month the user is inspecting rather than jumping to the original start.
 toast('Сроки вахты обновлены во всех разделах');return true;
})}
function editStatus(){openDialog('Статус',`<p class="note-text" style="margin-bottom:15px">«На вахте» и «На межвахте» рассчитываются автоматически. Отпуск можно включить вручную.</p>${selectField('Режим статуса','status',[['auto','Автоматически по датам'],['vacation','Отпуск (вручную)']],state.vacation?'vacation':'auto')}`,form=>{state.vacation=form.get('status')==='vacation';persist();toast('Статус обновлён');return true})}
function paymentDialog(existing=null,date=today()){
 editingPayment=existing?.id||null;
 openDialog(existing?'Изменить выплату':'Добавить выплату',`${selectField('Вид выплаты','type',[['advance','Аванс'],['salary','Зарплата'],['bonus','Премия'],['other','Другая выплата']],existing?.type||'advance')}${inputField('Сумма в рублях','amount',existing?.amount||'','number','required min="1" step="1" placeholder="Например, 60000"')}${inputField('Дата поступления','date',existing?.date||date,'date','required')}${textareaField('Комментарий (необязательно)','description',existing?.description||'','За какой период получено')}`,form=>{
 const type=form.get('type'),date=form.get('date'),amount=Number(form.get('amount')),description=String(form.get('description')||'').trim().slice(0,300);
 if(!['advance','salary','bonus','other'].includes(type)||!Number.isSafeInteger(amount)||amount<=0||amount>1000000000||!/^\d{4}-\d{2}-\d{2}$/.test(date)){toast('Укажите корректную дату и сумму в рублях.');return false}
 if(existing){existing.type=type;existing.date=date;existing.amount=amount;existing.description=description}
  else{state.payments.push({id:id(),type,date,amount,description});appendNotification("payments","Добавлена выплата",paymentType(type)+": "+money(amount)+".","payment:"+state.payments.at(-1).id);}
 ui.financeMonth=monthKey(date);persist();toast(existing?'Выплата обновлена':'Выплата добавлена');return true
 },'Сохранить',existing?`<button class="btn danger" type="button" data-action="delete-payment" data-id="${existing.id}">Удалить</button>`:'')
}
function noteDialog(existing=null,type='note',date=today()){
 const isChecklist=type==='checklist'||(existing&&existing.tasks.length>0);
 const category=existing?.category||(isChecklist?'Сборы':'Личное');
 openDialog(existing?'Изменить заметку':isChecklist?'Новый список дел':'Новая заметка',`${inputField('Название','title',existing?.title||'','text','maxlength="100" required')}${selectField('Категория','category',[['Сборы','Сборы'],['Работа','Работа'],['Личное','Личное'],['Идеи','Идеи']],category)}${textareaField('Текст заметки','text',existing?.text||'','Короткая запись, мысль или напоминание')}${textareaField('Пункты списка — каждый с новой строки','tasks',existing?.tasks.map(x=>x.text).join('\n')||'','Документы\nЗарядка\nСредства защиты')}`,form=>{
 const title=String(form.get('title')||'').trim(),text=String(form.get('text')||'').slice(0,5000),category=String(form.get('category')||'Личное'),raw=String(form.get('tasks')||'');
 if(!title){toast('Введите название заметки.');return false}
 const previous=existing?.tasks||[];
 const tasks=raw.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,70).map((text,i)=>({text:text.slice(0,200),done:previous[i]?.text===text?Boolean(previous[i].done):false}));
 if(existing){Object.assign(existing,{title:title.slice(0,100),text,category,tasks,updated:date})}else state.notes.unshift({id:id(),title:title.slice(0,100),text,category,tasks,updated:date});
 persist();toast('Заметка сохранена');return true
 },'Сохранить',existing?`<button class="btn danger" type="button" data-action="delete-note" data-id="${existing.id}">Удалить</button>`:'')
}
function editProfile(){
 const org=state.org||{};
 openDialog('Мой профиль',
 `${inputField('Имя или псевдоним','name',state.profile.name,'text','required maxlength="70"')}${inputField('Профессия','profession',state.profile.profession,'text','maxlength="90"')}${selectField('Сфера работы','sector',[['Строительство','Строительство'],['Нефтегаз','Нефтегаз'],['Горная промышленность','Горная промышленность'],['Транспорт','Транспорт'],['Энергетика','Энергетика'],['Геология','Геология'],['Машиностроение','Машиностроение'],['Другое','Другое']],state.profile.sector)}${window.MV_ORG.picker(org.organizationId,org.name)}`,
 form=>{
  const name=String(form.get('name')||'').trim();if(!name){toast('Укажите имя или псевдоним.');return false}
  const selection=window.MV_ORG.byId(form.get('organizationId'))||window.MV_ORG.byName(form.get('organizationName'));
  if(!selection){toast('Выберите организацию из предложенного списка');return false}
  state.profile.name=name.slice(0,70);state.profile.profession=String(form.get('profession')||'').slice(0,90);
  state.profile.sector=String(form.get('sector')||'Другое');
  state.org.organizationId=selection.id;state.org.name=selection.name;
  persist();return true
 });
}
function editOrganization(){
 openDialog('Моя организация',
 `${window.MV_ORG.picker(state.org.organizationId,state.org.name)}${inputField('Род деятельности','description',state.org.description,'text','maxlength="200"')}${inputField('Регион / объект','region',state.org.region,'text','maxlength="140"')}`,
 form=>{
  const selection=window.MV_ORG.byId(form.get('organizationId'))||window.MV_ORG.byName(form.get('organizationName'));
  if(!selection){toast('Выберите организацию из каталога');return false}
  state.org.organizationId=selection.id;state.org.name=selection.name;
  state.org.description=String(form.get('description')||'').slice(0,200);
  state.org.region=String(form.get('region')||'').slice(0,140);
  persist();return true;
 });
}
function openReviewDialog(orgId){
 const org=window.MV_ORG.byId(orgId);if(!org){toast('Организация не найдена');return}
 const old=state.organizationReviews.find(r=>r.authorAccountId==='me'&&r.organizationId===orgId);
 openDialog(old?'Изменить отзыв':'Оставить отзыв',window.MV_ORG.reviewEditor(state,orgId,old),async form=>{
   const backup=JSON.stringify(state.organizationReviews);
   try{
     await window.MV_ORG.saveReview(state,orgId,old,form);
     if(!persist()){state.organizationReviews=JSON.parse(backup);return false}
     toast('Отзыв сохранён');return true;
   }catch(err){state.organizationReviews=JSON.parse(backup);toast(err.message||'Не удалось сохранить отзыв');return false}
 },'Сохранить отзыв');
}
function editComment(){openDialog('Мой отзыв',`${textareaField('Комментарий','comment',state.org.comment,'Что нравится? Что можно улучшить?')}`,form=>{state.org.comment=String(form.get('comment')||'').trim().slice(0,1000);persist();toast('Отзыв обновлён');return true})}

async function shareFriendInvite(){
 const url=location.origin+location.pathname;
 const details={title:"Моя вахта",text:"Посмотри прототип приложения «Моя вахта». Персональные приглашения появятся после запуска сервера.",url};
 try{
  if(navigator.share){await navigator.share(details);return}
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);toast("Ссылка на прототип скопирована");return}
  openDialog("Приглашение",`<p class="note-text">Это ссылка на прототип, а не персональная заявка в друзья. После запуска сервера появятся персональные ссылки и QR-коды.</p>${inputField('Ссылка','link',url,'text','readonly')}`);
 }catch(error){if(error?.name!=="AbortError")toast("Не удалось поделиться ссылкой")}
}
async function pickFriendContact(){
 let selection=null;
 try{
  // Optional Android bridge for Codex. Browser fallback is the user-invoked Contact Picker API.
  if(window.MVNativeContacts?.pickSingle)selection=await window.MVNativeContacts.pickSingle();
  else if(navigator.contacts?.select){
    const items=await navigator.contacts.select(["name","tel"],{multiple:false});
    selection=items?.[0]||null;
  }else{
    openDialog("Контакты",'<p class="note-text">Системный выбор контактов недоступен в этом браузере. В будущей Android-версии откроется телефонная книга. Никакие номера не загружаются на сервер.</p>');
    return;
  }
  if(!selection)return;
  const name=String(Array.isArray(selection.name)?selection.name[0]:selection.name||"Выбранный контакт").slice(0,100);
  // Never store a phone number in localStorage, account records or logs.
  openDialog("Контакт выбран",`<p class="note-text">Выбран: <strong>${html(name)}</strong>.</p><p class="note-text" style="margin-top:9px">Сейчас нет сервера для проверки регистрации этого человека. Можно отправить ему ссылку на прототип. Номер телефона никуда не передаётся.</p>`,()=>{shareFriendInvite();return true},"Поделиться ссылкой");
 }catch(error){if(error?.name!=="AbortError")toast("Не удалось открыть контакты")}
}
function friendDetail(accountId){if(!friendByAccountId(accountId))return;ui.friendId=accountId;nav("friendProfile")}
function startChat(){
 if(!state.friends.length){toast('Сначала добавьте друга.');return}
 const options=state.friends.map(link=>{const a=accountById(link.accountId);return a?[link.accountId,a.name]:null}).filter(Boolean);
 openDialog('Новый разговор',`${selectField('Друг','friendId',options,options[0][0])}`,form=>{
   const accountId=String(form.get('friendId')||'');
   if(!friendByAccountId(accountId))return false;
   setTimeout(()=>openChat(accountId),0);return true;
 },'Открыть чат');
}
function openChat(targetId){
 let chat=state.chats.find(ch=>ch.id===targetId);
 const accountId=chat?.participantAccountId||targetId;
 if(!friendByAccountId(accountId)){toast('Друг не найден.');return}
 if(!chat)chat=state.chats.find(ch=>ch.participantAccountId===accountId);
 if(!chat){chat={id:"conversation-"+id(),participantAccountId:accountId,unread:0,messages:[]};state.chats.unshift(chat)}
 chat.unread=0;persist();ui.chatId=chat.id;nav('thread');
}
function sendMessage(){const input=$('messageInput');if(!input)return;const value=input.value.trim();if(!value)return;const chat=state.chats.find(c=>c.id===ui.chatId);if(!chat)return;chat.messages.push({id:id(),out:true,text:value.slice(0,1000),time:new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})});persist();render();$('appMain').scrollTop=$('appMain').scrollHeight;/* Сообщение отображается в беседе */}
function dataExport(){const blob=new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`moya-vahta-${today()}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);toast('Резервная копия сохранена')}
function validateBackup(x){if(!x||![1,2].includes(x.version)||typeof x.profile?.name!=='string'||typeof x.shift?.start!=='string'||typeof x.shift?.end!=='string'||!Array.isArray(x.payments)||!Array.isArray(x.notes)||!Array.isArray(x.friends)||!Array.isArray(x.chats)||!Array.isArray(x.notifications)||!x.privacy||!x.org)throw Error('Некорректный формат резервной копии');if(x.payments.length>20000||x.notes.length>5000||x.friends.length>5000||x.chats.length>2000)throw Error('Слишком большой архив');if(!/^\d{4}-\d{2}-\d{2}$/.test(x.shift.start)||!/^\d{4}-\d{2}-\d{2}$/.test(x.shift.end)||x.shift.start>x.shift.end)throw Error('Неверные даты вахты');return x}
function handleAction(action,el){switch(action){
case 'close-dialog':closeDialog();return;
case 'go-home':nav('home');return;
case 'server-account':window.MVServerUI?.open();return;
case 'go-finance':nav('finance');return;
case 'open-notifications':ui.notificationsTab='inbox';nav('notifications');return;
case 'notification-tab':if(['inbox','settings'].includes(el.dataset.tab)){ui.notificationsTab=el.dataset.tab;render()}return;
case 'calendar-prev':case 'calendar-next':ui.calendarMonth=addMonth(ui.calendarMonth,action==='calendar-prev'?-1:1);ui.selectedDate=ui.calendarMonth+'-01';render();return;
case 'calendar-show-end':ui.calendarMonth=monthKey(state.shift.end);ui.selectedDate=state.shift.end;render();return;
case 'finance-prev':case 'finance-next':ui.financeMonth=addMonth(ui.financeMonth,action==='finance-prev'?-1:1);render();return;
case 'stats-prev':case 'stats-next':ui.statsYear+=action==='stats-prev'?-1:1;render();return;
case 'edit-shift':editShift();return;
case 'edit-status':editStatus();return;
case 'add-payment':if(ui.view!=='finance')return;paymentDialog(null,today());return;
case 'edit-payment':if(ui.view!=='finance')return;paymentDialog(state.payments.find(p=>p.id===el.dataset.id));return;
case 'delete-payment':if(ui.view!=='finance')return;if(confirm('Удалить запись о выплате?')){state.payments=state.payments.filter(p=>p.id!==el.dataset.id);closeDialog();persist();render();toast('Выплата удалена')}return;
case 'add-note':noteDialog(null,'note',el.dataset.prefillDate||today());return;
case 'add-checklist':noteDialog(null,'checklist');return;
case 'edit-note':noteDialog(state.notes.find(n=>n.id===el.dataset.id));return;
case 'delete-note':if(confirm('Удалить заметку?')){state.notes=state.notes.filter(n=>n.id!==el.dataset.id);closeDialog();persist();render();toast('Заметка удалена')}return;
case 'open-org':ui.orgId=el.dataset.id;nav('organizationDetail');return;
 case 'back-orgs':nav('organizations');return;
 case 'open-my-org':if(state.org.organizationId){ui.orgId=state.org.organizationId;nav('organizationDetail')}else editOrganization();return;
 case 'review-my-org':if(state.org.organizationId)openReviewDialog(state.org.organizationId);else editOrganization();return;
 case 'add-org-review':openReviewDialog(el.dataset.id);return;
 case 'edit-review':{const r=state.organizationReviews.find(x=>x.id===el.dataset.id&&x.authorAccountId==='me');if(r)openReviewDialog(r.organizationId);return}
 case 'more-orgs':ui.orgLimit+=20;render();return;
 case 'choose-org':{
   const choice=window.MV_ORG.byId(el.dataset.id);
   if(!choice)return;
   const target=$('orgPickerId'),input=$('orgPickerSearch');
   if(target&&input){target.value=choice.id;input.value=choice.name;$('orgPickerOptions').innerHTML=window.MV_ORG.pickMarkup(choice.name,choice.id)}
   return;
 }
 case 'edit-profile':editProfile();return;
case 'edit-organization':editOrganization();return;
case 'edit-comment':editComment();return;
case 'add-friend':nav('friendDiscovery');return;
case 'send-demo-request':sendDemoFriendRequest(el.dataset.id);return;
case 'demo-incoming-request':demoIncomingRequest();nav('friends');return;
case 'accept-friend-request':finishFriendRequest(el.dataset.id,'accepted');return;
case 'decline-friend-request':finishFriendRequest(el.dataset.id,'declined');return;
case 'cancel-friend-request':finishFriendRequest(el.dataset.id,'cancelled');return;
case 'demo-accept-sent':finishFriendRequest(el.dataset.id,'accepted');return;
case 'find-contacts':pickFriendContact();return;
case 'invite-friend':shareFriendInvite();return;
case 'friend-detail':friendDetail(el.dataset.id);return;
case 'back-to-friends':nav('friends');return;
case 'chat-friend':{const fid=el.dataset.id;if($('appDialog').open)closeDialog();openChat(fid);return}
case 'start-chat':startChat();return;
case 'open-chat':openChat(el.dataset.id);return;
case 'back-to-messages':nav('messages');return;
case 'send-message':sendMessage();return;
case 'read-all':state.notifications.filter(n=>notificationsEnabled(n.kind)).forEach(n=>n.read=true);persist();render();return;
case 'read-notification':{const n=state.notifications.find(x=>x.id===el.dataset.id);if(n)n.read=true;persist();if(n?.kind==='friend_request'||n?.kind==='friend_accepted')nav('friends');else render();return}
case 'export':dataExport();return;
case 'import':$('importFile').click();return;
case 'reset':if(confirm('Удалить все данные, включая выплаты, заметки и сообщения? Перед сбросом можно создать резервную копию.')){state=window.MV_ORG.enrichState(seed());persist();ui.view='home';render();toast('Данные сброшены')}return;
}}
document.addEventListener('click',event=>{const el=event.target.closest('button,[data-date]');if(!el)return;const action=el.dataset.action;if(action){handleAction(action,el);return}if(el.dataset.nav){nav(el.dataset.nav);return}if(el.dataset.date){ui.selectedDate=el.dataset.date;render();return}if(el.dataset.ratingLabel){const key=el.dataset.ratingLabel,val=Number(el.dataset.ratingValue);if(Object.hasOwn(state.org.ratings,key)&&val>=1&&val<=5){state.org.ratings[key]=val;persist();render()}return}});
// Rating stars and date cells are buttons and are handled in one delegated click listener.
document.addEventListener('change',event=>{const t=event.target;
 if(t.dataset.notificationSetting){
  const key=t.dataset.notificationSetting;
  if(!Object.hasOwn(NOTIFICATION_DEFAULTS,key))return;
  const value=key in NOTIFICATION_DAY_OPTIONS?Number(t.value):Boolean(t.checked);
  if(key in NOTIFICATION_DAY_OPTIONS&&!NOTIFICATION_DAY_OPTIONS[key].includes(value))return;
  const before=state.notificationSettings[key];
  state.notificationSettings[key]=value;
  persist();render();toast('Настройки уведомлений сохранены');
  if(window.MVServerUI?.connected&&window.MVServerUI.saveNotificationSettings){
   window.MVServerUI.saveNotificationSettings({[key]:value}).catch(err=>{
    if(state.notificationSettings[key]===value){state.notificationSettings[key]=before;persist();render()}
    toast('Не удалось сохранить на сервере: '+err.message);
   });
  }
  return;
 }
 if(t.dataset.reviewPrivacy==='scope'){
  const r=state.organizationReviews.find(x=>x.id===t.dataset.reviewId&&x.authorAccountId==='me');
  if(!r)return;
  const val=t.value, previous=r.scope||'self';
  if(!['all','friends','selected','self'].includes(val))return;
  const rank={self:0,selected:1,friends:2,all:3};
  if(rank[val]>rank[previous]&&!confirm('Открыть доступ к отзыву: '+reviewScopeName(val)+'?')){t.value=previous;return}
  r.scope=val;persist();render();toast('Видимость отзыва сохранена');return;
 }
 if(t.dataset.reviewAllowed==='1'){
  const r=state.organizationReviews.find(x=>x.id===t.dataset.reviewId&&x.authorAccountId==='me');
  if(!r||!state.friends.some(f=>f.accountId===t.value))return;
  const ids=new Set(Array.isArray(r.allowedAccountIds)?r.allowedAccountIds:[]);
  if(t.checked)ids.add(t.value);else ids.delete(t.value);
  r.allowedAccountIds=[...ids].slice(0,100);persist();toast('Список разрешённых друзей сохранён');return;
 }
 if(t.dataset.reviewAnonymous==='1'){
  const r=state.organizationReviews.find(x=>x.id===t.dataset.reviewId&&x.authorAccountId==='me');
  if(!r)return;
  r.anonymous=t.checked;persist();toast('Анонимность отзыва сохранена');return;
 }
 if(t.dataset.privacy){
 const key=t.dataset.privacy, val=t.value;
 if(!Object.hasOwn(state.privacy,key)||!['all','friends','self'].includes(val))return;
 const previous=state.privacy[key];
 const exposure={self:0,friends:1,all:2};
 if(key==='finance' && exposure[val]>exposure[previous]){
   const message=val==='all'?'Разрешить всем пользователям видеть суммы и историю ваших выплат?':'Разрешить друзьям видеть суммы и историю ваших выплат?';
   if(!confirm(message)){t.value=previous;return}
 }
 state.privacy[key]=val;persist();render();toast('Настройки видимости сохранены');return;
}if(t.dataset.taskNote){const note=state.notes.find(n=>n.id===t.dataset.taskNote),task=note?.tasks[Number(t.dataset.taskIndex)];if(task){task.done=t.checked;persist();const l=t.closest('.task-item');l?.classList.toggle('completed',t.checked)}return}if(t.id==='holidayFilter'){ui.holidaySector=t.value;render();return}if(t.id==='friendFilter'){ui.friendFilter=t.value;$('friendResults').innerHTML=friendsMarkup();return}});
document.addEventListener('input',event=>{
 const t=event.target;
 if(t.id==='organizationSearch'){
  ui.orgSearch=t.value;ui.orgLimit=20;
  const matching=window.MV_ORG.matches(ui.orgSearch);
  const results=$('organizationResults'),count=$('organizationResultCount');
  if(results)results.innerHTML=matching.slice(0,20).map(o=>window.MV_ORG.orgCard(o,state)).join('')||'<div class="org-empty">Совпадений нет.</div>';
  if(count)count.textContent='Показано '+Math.min(20,matching.length)+' из '+matching.length;
  const moreButton=document.querySelector('.org-show-more');if(moreButton)moreButton.hidden=matching.length<=20;
  return;
 }
 if(t.id==='orgPickerSearch'){
  const hidden=$('orgPickerId'),options=$('orgPickerOptions');if(hidden)hidden.value='';
  if(options)options.innerHTML=window.MV_ORG.pickMarkup(t.value);return;
 }
 if(t.id==='friendSearch'){ui.friendSearch=t.value;$('friendResults').innerHTML=friendsMarkup()}
 if(t.id==='friendDiscoverySearch'){ui.friendDiscoverySearch=t.value;$('friendDiscoveryResults').innerHTML=friendDiscoveryResults();return}
 if(t.id==='noteSearch'){ui.noteSearch=t.value;const list=state.notes.filter(n=>[n.title,n.category,n.text].join(' ').toLocaleLowerCase('ru').includes(ui.noteSearch.toLocaleLowerCase('ru')));$('notesResults').innerHTML=notesMarkup(list)}
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='messageInput'){e.preventDefault();sendMessage()}});
$('dialogForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!onModalSave)return;
 const submit=e.currentTarget.querySelector('button[type="submit"]'),callback=onModalSave;
 if(submit?.disabled)return;
 if(submit)submit.disabled=true;
 try{const success=await callback(new FormData(e.currentTarget));if(success!==false){closeDialog();render()}}
 catch(err){toast(err.message||'Ошибка сохранения');console.error(err)}
 finally{if(submit)submit.disabled=false}
});
$('importFile').addEventListener('change',async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(file.size>3*1024*1024){toast('Файл больше 3 МБ.');return}try{const incoming=migrateSocial(migratePrivacy(validateBackup(JSON.parse(await file.text()))));if(!confirm('Импорт заменит текущие данные. Продолжить?'))return;state=window.MV_ORG.enrichState(incoming);persist();nav('home');toast('Данные восстановлены')}catch(err){toast('Ошибка импорта: '+err.message)}});
$('appDialog').addEventListener('click',e=>{if(e.target===$('appDialog'))closeDialog()});
window.addEventListener('focus',()=>{render()});
// Until a server stores the period, updates from another open tab are also reflected.
window.addEventListener('storage',event=>{
 if(event.key!==STORAGE_KEY)return;
 state=window.MV_ORG.enrichState(load());
 render();
});
// Explicit local-server import/export bridge; no automatic upload of demo or private data.
window.MV_APP_BRIDGE={
 refresh:()=>render(),
 setNotificationPreferences:raw=>{
  state.notificationSettings=normalizedNotificationSettings(raw);
  persist();render();
 },
 snapshot:()=>({
  shift:{start:state.shift.start,end:state.shift.end,vacation:Boolean(state.vacation)},
  payments:state.payments.map(p=>({client_id:String(p.id).slice(0,100),date:p.date,type:p.type,amount:Number(p.amount),description:String(p.description||"")})),
  notes:state.notes.map(n=>({client_id:String(n.id).slice(0,100),title:n.title,category:n.category,text:n.text,tasks:n.tasks,updated:n.updated}))
 }),
 apply(remote){
  if(!remote?.shift||!Array.isArray(remote.payments)||!Array.isArray(remote.notes))throw Error("Неверный формат ответа сервера");
  if(!validShiftDate(remote.shift.start)||!validShiftDate(remote.shift.end)||remote.shift.end<remote.shift.start)throw Error("Неверные даты с сервера");
  // Only user-owned shift/payments/notes are synchronized in this first iteration.
  state.shift={start:remote.shift.start,end:remote.shift.end};
  state.vacation=Boolean(remote.shift.vacation);
  state.payments=remote.payments.map(p=>({id:String(p.client_id||p.id),date:p.date,type:p.type,amount:Number(p.amount),description:String(p.description||"")}));
  state.notes=remote.notes.map(n=>({id:String(n.client_id||n.id),title:n.title,category:n.category,text:n.text,tasks:Array.isArray(n.tasks)?n.tasks:[],updated:n.updated}));
  ui.calendarMonth=monthKey(state.shift.start);
  ui.financeMonth=currentMonth();
  ui.selectedDate=state.shift.start;
  persist();render();
 }
};
// Use hash navigation only for known top-level views. Never interpolate it into HTML.
const hash=location.hash.replace(/^#/, '');
if(hash.startsWith('organizationDetail/')){
 const organizationId=hash.slice('organizationDetail/'.length);
 if(window.MV_ORG.byId(organizationId)){ui.orgId=organizationId;ui.view='organizationDetail'}
} else if(['home','calendar','finance','messages','friends','more','organizations','organizationDetail','organization','privacy','statistics','notes','holidays','profile','friendDiscovery','notifications','settings'].includes(hash))ui.view=hash;
render();
})();
