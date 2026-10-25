/* Optional same-origin Django API connector. GitHub Pages remains a local-only UI prototype.
 * No private localStorage data is sent without explicit user confirmation.
 * Session token is kept in sessionStorage, not in URLs or localStorage.
 */
(() => {
 "use strict";
 const BASE="/api/v1", STORAGE="mv-api-dev-token";
 let token=sessionStorage.getItem(STORAGE)||"",available=false,account=null,revision=null,dialog=null;
 const state={
  get available(){return available},
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
 function escape(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
 function message(text,bad=false){const el=dialog?.querySelector("#mvServerMessage");if(el){el.textContent=text;el.style.color=bad?"#ffaaa8":"#a8ebcc"}}
 function ensureDialog(){
  if(dialog)return dialog;
  dialog=document.createElement("dialog");dialog.className="app-dialog";dialog.id="mvServerDialog";
  dialog.style.maxWidth="440px";dialog.style.width="min(95vw,440px)";
  document.body.append(dialog);
  dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close()});
  dialog.addEventListener("submit",async e=>{
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
    token="";account=null;revision=null;sessionStorage.removeItem(STORAGE);
    showForm("login");refresh();return;
   }
   btn.disabled=true;
   try{
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
   try{account=await api("/me/");await updateRevision()}catch{token="";sessionStorage.removeItem(STORAGE);account=null}
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
