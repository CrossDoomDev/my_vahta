/* Optional same-origin Django API connector. GitHub Pages remains a local-only UI prototype.
 * No private localStorage data is sent without explicit user confirmation.
 * Session token is kept in sessionStorage, not in URLs or localStorage.
 */
(() => {
 "use strict";
 const BASE="/api/v1", STORAGE="mv-api-dev-token";
 let token=sessionStorage.getItem(STORAGE)||"",available=false,account=null,revision=null,dialog=null;
 let notificationCount=0,requestCount=0,searchTimer=null,chatPeer=null,socialLoadId=0;
 const state={
  get available(){return available},
  get connected(){return Boolean(available&&token&&account)},
  get notificationCount(){return notificationCount},
  get requestCount(){return requestCount},
  saveNotificationSettings:updateNotificationSettings,
  onRender,
  label(){return account?"Вход выполнен: "+account.handle+". Синхронизация запускается вручную.":"Django доступен. Войдите или создайте тестовый аккаунт."},
  open
 };
 window.MVServerUI=state;
 function refresh(){window.MV_APP_BRIDGE?.refresh()}
 async function api(path,method="GET",body=null,anonymous=false){
  const headers={"Accept":"application/json"};
  if(body!==null)headers["Content-Type"]="application/json";
  if(!anonymous&&token)headers["Authorization"]="Token "+token;
  const res=await fetch(BASE+path,{method,headers,body:body===null?undefined:JSON.stringify(body),credentials:"omit"});
  let payload={};
  try{payload=await res.json()}catch{}
  if(!res.ok){
   const summary=typeof payload.detail==="string"?payload.detail:JSON.stringify(payload).slice(0,400);
   const error=new Error(summary||"HTTP "+res.status);error.status=res.status;throw error;
  }
  return payload;
 }
 async function loadNotificationSettings(){
  if(!state.connected)return;
  try{
   const prefs=await api("/me/notification-preferences/");
   window.MV_APP_BRIDGE?.setNotificationPreferences?.(prefs);
  }catch{/* Keep local settings when this endpoint is unavailable. */}
 }
 async function updateNotificationSettings(partial){
  if(!state.connected)throw Error("Войдите на локальный сервер.");
  return api("/me/notification-preferences/","PATCH",partial);
 }
 function escape(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
 function message(text,bad=false){const el=dialog?.querySelector("#mvServerMessage");if(el){el.textContent=text;el.style.color=bad?"#ffaaa8":"#a8ebcc"}}

 function socialCard(user,actions=""){
  return '<div class="server-social-row"><span class="server-social-avatar">'+escape((user.display_name||user.handle||"?").slice(0,1).toUpperCase())+'</span>'+
   '<div class="server-social-person"><strong>'+escape(user.display_name||user.handle)+'</strong><small>@'+escape(user.handle||'')+'</small></div>'+actions+'</div>';
 }
 function requestRow(request){
  const incoming=request.recipient===account.id,name=incoming?request.sender_name:request.recipient_name;
  const action=incoming?
   '<button class="btn primary small" data-mv-action="accept" data-id="'+escape(request.id)+'">Принять</button><button class="btn secondary small" data-mv-action="decline" data-id="'+escape(request.id)+'">Отклонить</button>':
   '<button class="btn secondary small" data-mv-action="cancel" data-id="'+escape(request.id)+'">Отменить</button>';
  return '<div class="server-social-row"><span class="server-social-avatar">👤</span><div class="server-social-person"><strong>'+escape(name||"Пользователь")+'</strong><small>'+(incoming?'Хочет добавить вас в друзья':'Заявка ожидает ответа')+'</small><div class="server-social-actions">'+action+'</div></div></div>';
 }
 async function loadCounts(){
  if(!state.connected)return;
  try{
   const [notifications,requests]=await Promise.all([api("/notifications/unread-count/"),api("/friend-requests/")]);
   notificationCount=notifications.count||0;requestCount=(requests.results||[]).filter(x=>x.status==="pending"&&x.recipient===account.id).length;
   const nb=document.getElementById("notificationBadge"),fb=document.getElementById("friendsBadge");
   if(nb){nb.hidden=notificationCount===0;nb.textContent=notificationCount>9?"9+":String(notificationCount)}
   if(fb){fb.hidden=requestCount===0;fb.textContent=requestCount>9?"9+":String(requestCount)}
  }catch{/* Show cached counts while offline. */}
 }
 async function loadFriends(loadId){
  const target=document.getElementById("mvServerFriends");if(!target)return;
  try{
   const [list,requests]=await Promise.all([api("/friends/"),api("/friend-requests/")]);
   if(loadId!==socialLoadId||!document.getElementById("mvServerFriends"))return;
   const incoming=(requests.results||[]).filter(x=>x.status==="pending"&&x.recipient===account.id);
   const outgoing=(requests.results||[]).filter(x=>x.status==="pending"&&x.sender===account.id);
   const people=list.results||[];
   target.innerHTML=
    (incoming.length?'<h3>Входящие заявки ('+incoming.length+')</h3>'+incoming.map(requestRow).join(''):'')+
    (outgoing.length?'<h3 class="server-section-heading">Отправленные заявки</h3>'+outgoing.map(requestRow).join(''):'')+
    '<h3 class="server-section-heading">Мои друзья ('+people.length+')</h3>'+
    (people.length?people.map(p=>socialCard(p,
     '<button class="btn small secondary" data-mv-action="chat" data-id="'+escape(p.id)+'" data-name="'+escape(p.display_name)+'">Написать</button>'+
     '<button class="btn small ghost" data-mv-action="remove" data-id="'+escape(p.id)+'">Удалить</button>')).join(''):
     '<p class="note-text">Пока нет подтверждённых друзей. Найдите аккаунт и отправьте заявку.</p>');
  }catch(err){if(target)target.textContent="Ошибка загрузки: "+err.message}
 }
 async function loadNotifications(loadId){
  const target=document.getElementById("mvServerNotifications");if(!target)return;
  try{
   const data=await api("/notifications/");
   if(loadId!==socialLoadId||!document.getElementById("mvServerNotifications"))return;
   const rows=data.results||[];
   target.innerHTML=rows.length?rows.map(n=>{
    const action=n.kind==="friend_request"&&!n.read_at&&n.request_id?
     '<div class="server-social-actions"><button class="btn primary small" data-mv-action="accept" data-id="'+escape(n.request_id)+'">Принять</button><button class="btn secondary small" data-mv-action="decline" data-id="'+escape(n.request_id)+'">Отклонить</button></div>':'';
    return '<div class="server-notice"><strong>'+escape(n.title)+'</strong><p>'+escape(n.body)+'</p>'+
     action+(n.read_at?'':'<button class="btn ghost small" data-mv-action="read" data-id="'+escape(n.id)+'">Прочитано</button>')+'</div>';
   }).join(''):'<p class="note-text">Новых уведомлений нет.</p>';
  }catch(err){target.textContent="Ошибка загрузки: "+err.message}
 }
 async function loadMessages(loadId){
  const target=document.getElementById("mvServerMessages");if(!target)return;
  try{
   const data=await api("/friends/");
   if(loadId!==socialLoadId||!document.getElementById("mvServerMessages"))return;
   target.innerHTML=data.results.length?data.results.map(p=>socialCard(p,
    '<button class="btn primary small" data-mv-action="chat" data-id="'+escape(p.id)+'" data-name="'+escape(p.display_name)+'">Диалог</button>')).join(''):
    '<p class="note-text">Чтобы начать переписку, сначала добавьте человека в друзья.</p>';
  }catch(err){target.textContent="Ошибка загрузки: "+err.message}
 }
 function onRender(view){
  if(!state.connected)return;
  const loadId=++socialLoadId;
  if(view==="friends")loadFriends(loadId);
  else if(view==="notifications")loadNotifications(loadId);
  else if(view==="messages")loadMessages(loadId);
  loadCounts();
 }
 async function searchAccounts(value){
  const target=document.getElementById("mvServerResults");if(!target)return;
  if(value.trim().length<3){target.innerHTML='<p class="note-text">Введите не менее 3 символов.</p>';return}
  try{
   const payload=await api("/users/?q="+encodeURIComponent(value.trim()));
   if(!document.getElementById("mvServerResults"))return;
   target.innerHTML=payload.results.length?payload.results.map(p=>socialCard(p,
    '<button class="btn primary small" data-mv-action="request" data-id="'+escape(p.id)+'">Заявка</button>')).join(''):
    '<p class="note-text">Совпадений нет. Человек мог запретить поиск в настройках аккаунта.</p>';
  }catch(err){target.textContent="Ошибка поиска: "+err.message}
 }
 async function showChat(peerId,peerName){
  chatPeer={id:peerId,name:peerName};
  ensureDialog();shell("Диалог с "+escape(peerName),'<p class="note-text">Загружаем переписку…</p>');
  if(!dialog.open)dialog.showModal();
  try{
   const data=await api("/messages/?peer="+encodeURIComponent(peerId));
   if(chatPeer?.id!==peerId)return;
   const messages=(data.results||[]).slice().reverse();
   const markup=messages.length?messages.map(m=>
    '<div class="server-chat-message '+(m.sender_id===account.id?'mine':'theirs')+'">'+escape(m.text)+'</div>').join(''):
    '<p class="note-text">Переписки пока нет.</p>';
   shell("Диалог с "+escape(peerName),
    '<div class="server-chat-history">'+markup+'</div>'+
    '<form id="mvChatSend" style="display:flex;gap:7px;margin-top:12px"><input name="text" required maxlength="1000" autocomplete="off" placeholder="Написать сообщение" style="flex:1;min-width:0"><button class="btn primary small" type="submit">Отправить</button></form>');
  }catch(err){message("Ошибка: "+err.message,true)}
 }
 document.addEventListener("input",event=>{
  if(event.target.id!=="mvServerSearch")return;
  clearTimeout(searchTimer);
  const value=event.target.value;
  searchTimer=setTimeout(()=>searchAccounts(value),350);
 });
 document.addEventListener("click",async event=>{
  const btn=event.target.closest("button[data-mv-action]");
  if(!btn||!state.connected)return;
  const action=btn.dataset.mvAction;
  if(action==="chat"){showChat(btn.dataset.id,btn.dataset.name||"Друг");return}
  btn.disabled=true;
  try{
   if(action==="request")await api("/friend-requests/","POST",{recipient_id:btn.dataset.id});
   if(["accept","decline","cancel"].includes(action))await api("/friend-requests/"+encodeURIComponent(btn.dataset.id)+"/"+action+"/","POST");
   if(action==="remove"){
    if(!confirm("Удалить человека из друзей?"))return;
    await api("/friends/"+encodeURIComponent(btn.dataset.id)+"/","DELETE");
   }
   if(action==="read")await api("/notifications/"+encodeURIComponent(btn.dataset.id)+"/read/","POST");
    if(action==="read-all")await api("/notifications/read-all/","POST");
   if(action==="request")btn.textContent="Отправлена";
   refresh();
   await loadCounts();
  }catch(err){alert("Сервер: "+err.message)}
  finally{btn.disabled=false}
 });
 function ensureDialog(){
  if(dialog)return dialog;
  dialog=document.createElement("dialog");dialog.className="app-dialog";dialog.id="mvServerDialog";
  dialog.style.maxWidth="440px";dialog.style.width="min(95vw,440px)";
  document.body.append(dialog);
  dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close()});
  dialog.addEventListener("submit",async e=>{
   if(e.target.id==="mvChatSend"){
    e.preventDefault();const text=String(new FormData(e.target).get("text")||"").trim();
    if(!text||!chatPeer)return;
    const submit=e.target.querySelector("button[type=submit]");submit.disabled=true;
    try{await api("/messages/","POST",{recipient_id:chatPeer.id,text});await showChat(chatPeer.id,chatPeer.name)}
    catch(err){message(err.message,true);submit.disabled=false}
    return;
   }
   if(e.target.id!=="mvLogin"&&e.target.id!=="mvRegister")return;
   e.preventDefault();const form=e.target,mode=form.id==="mvRegister"?"register":"login";
   const data=new FormData(form);
   const body={username:String(data.get("username")||""),password:String(data.get("password")||"")};
   if(mode==="register")body.display_name=String(data.get("display_name")||"");
   const submit=form.querySelector("button[type=submit]");submit.disabled=true;
   try{
    const response=await api("/auth/"+mode+"/","POST",body,true);
    token=response.token;sessionStorage.setItem(STORAGE,token);
    account=response.account;
    await updateRevision();
    await loadNotificationSettings();
    showAccount();refresh();message("Подключено. Данные можно загрузить или отправить вручную.");
   }catch(err){message(err.message,true)}
   finally{submit.disabled=false}
  });
  dialog.addEventListener("click",async e=>{
   const btn=e.target.closest("button[data-server-action]");if(!btn)return;
   const action=btn.dataset.serverAction;
   if(action==="close"){dialog.close();return}
   if(action==="login"||action==="register"){showForm(action);return}
   if(action==="logout"){
    try{await api("/auth/logout/","POST")}catch{}
    token="";account=null;revision=null;notificationCount=0;requestCount=0;sessionStorage.removeItem(STORAGE);
    showForm("login");refresh();return;
   }
   btn.disabled=true;
   try{
    if(action==="toggle-discovery"){
     const value=!Boolean(account.discoverable);
     account=await api("/me/","PATCH",{discoverable:value});
     showAccount();message(value?"Поиск по вашему ID включён.":"Поиск вашего аккаунта отключён.");refresh();return;
    }
    if(action==="refresh"){await updateRevision();message("Состояние сервера обновлено.");return}
    if(action==="download"){
     if(!confirm("Заменить локальные график, выплаты и заметки данными с сервера?"))return;
     const payload=await api("/sync/");
     window.MV_APP_BRIDGE.apply(payload);revision=payload.revision;
     message("Данные загружены с сервера.");return;
    }
    if(action==="upload"){
     if(!confirm("Полностью заменить на сервере график, выплаты и заметки локальными данными? Это удалит прежние серверные записи этих разделов."))return;
     const payload=window.MV_APP_BRIDGE.snapshot();
     const result=await api("/sync/","PUT",{revision,...payload});
     revision=result.revision;message("Ваши данные сохранены на сервере.");return;
    }
   }catch(err){
    message(err.status===409?"Конфликт версий. Загрузите актуальные данные с сервера или обновите версию и повторите отправку после проверки.":err.message,true);
   }finally{btn.disabled=false}
  });
  return dialog;
 }
 function shell(title,content){
  dialog.innerHTML='<div class="dialog-heading"><h2>'+title+'</h2><button type="button" class="dialog-close" data-server-action="close" aria-label="Закрыть">×</button></div>'+
   '<div style="padding:15px">'+content+'<p id="mvServerMessage" role="status" style="font-size:12px;margin-top:12px;line-height:1.5"></p></div>';
 }
 function showForm(mode="login"){
  const register=mode==="register";
  shell(register?"Создать аккаунт":"Вход на локальный сервер",
   '<p class="note-text">Тестовый Django-сервер. Не используйте настоящий номер телефона или рабочие персональные данные.</p>'+
   '<form id="'+(register?"mvRegister":"mvLogin")+'" style="display:grid;gap:10px;margin-top:13px">'+
    (register?'<label class="field"><span>Имя в профиле</span><input name="display_name" required maxlength="80" autocomplete="nickname"></label>':'')+
    '<label class="field"><span>ID аккаунта (латиницей)</span><input name="username" required minlength="3" maxlength="40" autocomplete="username"></label>'+
    '<label class="field"><span>Пароль (от 10 символов)</span><input name="password" type="password" required minlength="10" autocomplete="'+(register?"new-password":"current-password")+'"></label>'+
    '<button class="btn primary full" type="submit">'+(register?"Зарегистрироваться":"Войти")+'</button></form>'+
    '<button class="btn ghost full" style="margin-top:9px" data-server-action="'+(register?"login":"register")+'">'+(register?"Есть аккаунт? Войти":"Создать тестовый аккаунт")+'</button>');
 }
 function showAccount(){
  shell("Мой серверный аккаунт",
   '<p class="note-text">Аккаунт: <strong>'+escape(account?.handle)+'</strong>. Доступ только к собственным финансовым записям и графику.</p>'+
   '<p class="note-text" style="margin-top:7px">Ваш ID: '+escape(account?.id)+'</p>'+
   '<button class="btn secondary full" style="margin:12px 0" data-server-action="toggle-discovery">'+(account?.discoverable?'Выключить поиск моего аккаунта':'Разрешить находить меня по ID и имени')+'</button>'+
   '<p class="note-text" style="margin:9px 0">Версия данных на сервере: <b>'+escape(revision)+'</b>.</p>'+
   '<p class="note-text" style="margin-bottom:13px">Пока синхронизация ручная. Выберите направление передачи данных — ничего не перезаписывается автоматически.</p>'+
   '<div style="display:grid;gap:8px">'+
   '<button class="btn primary full" data-server-action="upload">Сохранить локальные данные на сервер</button>'+
   '<button class="btn secondary full" data-server-action="download">Получить данные с сервера</button>'+
   '<button class="btn ghost full" data-server-action="refresh">Обновить номер версии сервера</button>'+
   '<button class="btn danger full" data-server-action="logout">Выйти из аккаунта</button></div>');
 }
 async function updateRevision(){
  const body=await api("/sync/");revision=body.revision;return body;
 }
 async function open(){
  if(!available){return}
  ensureDialog();
  if(token&&!account){
   try{account=await api("/me/");await updateRevision();await loadNotificationSettings()}catch{token="";sessionStorage.removeItem(STORAGE);account=null}
  }
  if(account)showAccount();else showForm();
  if(!dialog.open)dialog.showModal();
 }
 async function detect(){
  try{
   const response=await fetch(BASE+"/health/",{headers:{"Accept":"application/json"},credentials:"omit"});
   const data=await response.json();
   if(response.ok&&data.status==="ok"&&data.service==="my_vahta"){
    available=true;
    if(token){try{account=await api("/me/");await updateRevision()}catch{token="";account=null;sessionStorage.removeItem(STORAGE)}}
    refresh();
   }
  }catch{/* Pages or offline: remain in UI-only mode. */}
 }
 detect();
})();
