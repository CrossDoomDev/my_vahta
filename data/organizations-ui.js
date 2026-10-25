"use strict";
(function organizationFeatureModule(){
  const CATALOG=window.MV_ORGANIZATIONS||[];
  const BY_ID=new Map(CATALOG.map(org=>[org.id,org]));
  const CRITERIA=[
    {id:"salary",label:"Зарплата",tip:"Размер, своевременность и прозрачность выплат"},
    {id:"living",label:"Бытовые условия",tip:"Общежитие, душевые, тепло и уборка"},
    {id:"food",label:"Питание",tip:"Столовая, качество питания и очереди"},
    {id:"management",label:"Руководство",tip:"Отношение к работникам и организация смен"},
    {id:"schedule",label:"График вахты",tip:"Продолжительность вахты и соблюдение графика"},
    {id:"equipment",label:"Техника и безопасность",tip:"Состояние оборудования и безопасность"},
    {id:"transport",label:"Проезд и логистика",tip:"Дорога, транспорт и организация выезда"}
  ];
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const norm=s=>String(s||"").toLocaleLowerCase("ru").replace(/ё/g,"е").replace(/[^а-яa-z0-9]+/g," ").trim();
  const byId=id=>BY_ID.get(String(id||""))||null;
  const byName=name=>CATALOG.find(o=>norm(o.name)===norm(name)||o.aliases?.some(a=>norm(a)===norm(name)))||null;
  const matches=(query,limit=50)=>{
    const q=norm(query);
    if(!q)return CATALOG.slice(0,limit);
    return CATALOG.map(o=>{
      const names=[o.name,...(o.aliases||[])].map(norm);
      const starts=names.some(n=>n.startsWith(q));
      const within=names.some(n=>n.includes(q));
      return within?{o,score:starts?0:1}:null;
    }).filter(Boolean).sort((a,b)=>a.score-b.score||a.o.name.localeCompare(b.o.name,"ru")).slice(0,limit).map(x=>x.o);
  };
  const newFriends=[
    ["f5","Андрей Кузьмин","Машинист бульдозера","Ленгазспецстрой","shift",19,["Ленгазспецстрой","Газстройпром"]],
    ["f6","Дмитрий Орлов","Машинист экскаватора","Газстройпром","rest",9,["Газстройпром","Стройтранснефтегаз"]],
    ["f7","Павел Белов","Водитель самосвала","ГСП-Механизация","shift",32,["ГСП-Механизация"]],
    ["f8","Николай Захаров","Сварщик НАКС","Стройтранснефтегаз","shift",14,["Стройтранснефтегаз","Ленгазспецстрой"]],
    ["f9","Виктор Фролов","Автогрейдерист","СибТрансСтрой","rest",6,["СибТрансСтрой"]],
    ["f10","Елена Морозова","Инженер ПТО","СибПромСтрой","vacation",12,["СибПромСтрой","Газстройпром"]],
    ["f11","Артём Новиков","Механик","Транснефть","shift",11,["Транснефть"]],
    ["f12","Роман Сергеев","Машинист трубоукладчика","Ленгазспецстрой","rest",21,["Ленгазспецстрой"]],
    ["f13","Александр Волков","Машинист бульдозера","Сибдорстрой","shift",8,["Сибдорстрой","СибТрансАвто"]],
    ["f14","Ирина Ковалева","Геолог","Газпром нефть","rest",16,["Газпром нефть","Газпром"]],
    ["f15","Евгений Данилов","Водитель вездехода","ГСП-7","shift",34,["ГСП-7","Газстройпром"]],
    ["f16","Светлана Никитина","Инженер-эколог","Газпром","vacation",4,["Газпром","Газстройпром"]]
  ];
  const samples=[
    ["f1","Газстройпром",[4,4,4,4,4,4,4],{
      food:["В столовой кормят по расписанию, к обеду иногда собирается очередь.","assets/review-canteen.svg"],
      living:["Комнаты общие, есть место для хранения вещей.","assets/review-dorm.svg"],
      equipment:["Технику осматриваем перед сменой.","assets/review-equipment.svg"]}],
    ["f2","Стройтранснефтегаз",[4,4,4,3,4,4,3],{
      food:["Обычное горячее питание на вахтовом участке.",""],
      schedule:["График удобнее планировать заранее.",""]}],
    ["f3","Газпром",[5,4,4,4,5,4,4],{
      living:["Жильё оборудовано необходимыми бытовыми вещами.","assets/review-dorm.svg"]}],
    ["f4","ГСП-Механизация",[4,4,4,4,4,5,4],{
      equipment:["В моей смене технику обслуживали регулярно.","assets/review-equipment.svg"]}],
    ["f5","Ленгазспецстрой",[4,4,4,4,4,4,4],{
      food:["По моему опыту, питание стандартное для вахтового посёлка.","assets/review-canteen.svg"]}],
    ["f6","Газстройпром",[4,4,4,4,3,4,4],{
      living:["Быт многое зависит от конкретного объекта и соседей.","assets/review-dorm.svg"]}],
    ["f8","Стройтранснефтегаз",[4,4,4,4,4,4,4],{
      transport:["Перед выездом важно уточнить точку сбора и маршрут.",""]}],
    ["f10","СибПромСтрой",[4,4,4,4,4,4,4],{
      food:["Столовая рассчитана на большой поток работников.","assets/review-canteen.svg"]}],
    ["f12","Ленгазспецстрой",[4,4,4,4,4,4,4],{
      equipment:["На участке использовали землеройную и трубоукладочную технику.","assets/review-equipment.svg"]}],
    ["f14","Газпром нефть",[4,4,4,4,4,4,4],{
      living:["На объекте были оборудованы места для отдыха.","assets/review-dorm.svg"]}]
  ];
  function sectionObject(scores,details={}){
    return Object.fromEntries(CRITERIA.map((k,i)=>{
      const [comment,photo]=details[k.id]||["",""];
      return [k.id,{rating:scores[i]||0,comment,photo}];
    }));
  }
  function addExperience(account,history){
    if(!Array.isArray(account.workHistory)||!account.workHistory.length){
      account.workHistory=history.map((name,i)=>({organizationId:byName(name)?.id||"",since:String(2020+i),until:i===history.length-1?"сейчас":String(2022+i)})).filter(x=>x.organizationId);
    }
    if(!account.currentOrganizationId && history.length)account.currentOrganizationId=byName(history[0])?.id||"";
  }
  function enrichState(x){
    if(!x || typeof x!=="object")return x;
    x.accounts ||= {};
    x.friends ||= [];
    x.organizationReviews ||= [];
    if(!x.org || typeof x.org!=="object") x.org={name:"",ratings:{},comment:""};
    if(!x.org.organizationId)x.org.organizationId=byName(x.org.name)?.id||"";
    const initialHistory={
      f1:["Газстройпром","Ленгазспецстрой"],f2:["Стройтранснефтегаз"],f3:["Газпром","Транснефть"],f4:["ГСП-Механизация"]
    };
    for(const [fid,names] of Object.entries(initialHistory)){
      if(x.accounts[fid])addExperience(x.accounts[fid],names);
    }
    if(!x.sampleFriendsExpanded){
      for(const [fid,name,role,company,work,days,history] of newFriends){
        if(!x.accounts[fid])x.accounts[fid]={id:fid,name,role,company,avatarUrl:"",letter:name[0],skin:"alt"+((Number(fid.slice(1))%4)+1)};
        addExperience(x.accounts[fid],history);
        if(!x.friends.some(f=>f.accountId===fid))x.friends.push({accountId:fid,state:work,days});
      }
      x.sampleFriendsExpanded=true;
    }
    if(!x.sampleReviewsExpanded){
      const existing=new Set(x.organizationReviews.map(r=>r.id));
      samples.forEach(([accountId,name,scores,details],i)=>{
        const organizationId=byName(name)?.id;
        if(!organizationId||existing.has("sample-review-"+i))return;
        x.organizationReviews.push({
          id:"sample-review-"+i,organizationId,authorAccountId:accountId,
          createdAt:"2026-10-"+String(10+i).padStart(2,"0"),
          scope:i%5===3?"friends":"all",
          allowedAccountIds:[],worksite:"",
          sections:sectionObject(scores,details),overall:""
        });
      });
      x.sampleReviewsExpanded=true;
    }
    return x;
  }
  function friendHistory(x,organizationId){
    return (x.friends||[]).map(l=>x.accounts?.[l.accountId]).filter(a=>a?.workHistory?.some(h=>h.organizationId===organizationId));
  }
  function reviewVisible(r,state){
    if(r.authorAccountId==="me")return true;
    if(r.scope==="all")return true;
    const isFriend=state.friends.some(f=>f.accountId===r.authorAccountId);
    if(r.scope==="friends")return isFriend;
    if(r.scope==="selected")return Array.isArray(r.allowedAccountIds)&&r.allowedAccountIds.includes("me");
    return false;
  }
  function reviewsForOrg(state,orgId){return (state.organizationReviews||[]).filter(r=>r.organizationId===orgId&&reviewVisible(r,state))}
  function reviewsForFriend(state,accountId){return (state.organizationReviews||[]).filter(r=>r.authorAccountId===accountId&&reviewVisible(r,state))}
  const avgReview=r=>{const values=CRITERIA.map(c=>Number(r.sections?.[c.id]?.rating)||0).filter(v=>v>=1&&v<=5);return values.length?(values.reduce((a,b)=>a+b,0)/values.length).toFixed(1):null};
  function publicRating(state,organizationId){
    // Only public reviews enter the public aggregate; private/friends-only ratings do not.
    const ratings=(state.organizationReviews||[]).filter(r=>r.organizationId===organizationId&&r.scope==="all").map(r=>Number(avgReview(r))).filter(Number.isFinite);
    return ratings.length?(ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1):null;
  }
  function summary(state,orgId){
    const all=reviewsForOrg(state,orgId);
    const rating=publicRating(state,orgId);
    const friends=friendHistory(state,orgId);
    return {all,rating,friends};
  }
  function orgCard(o,state){
    const {all,rating,friends}=summary(state,o.id);
    return `<button class="org-search-result" type="button" data-action="open-org" data-id="${esc(o.id)}">
      <span class="org-logo">🏭</span><span class="org-result-body"><strong>${esc(o.name)}</strong><small>${esc(o.industry)}</small><span class="org-result-meta">${rating?`<span>★ ${rating}</span>`:"<span>Нет публичной оценки</span>"}<span>${all.length} ${all.length===1?"отзыв":"отзывов"}</span>${friends.length?`<span>● ${friends.length} из друзей</span>`:""}</span></span><span class="org-arrow">›</span>
    </button>`;
  }
  function searchMarkup(state,query,limit=50){
    const found=matches(query,limit);
    return found.length?found.map(o=>orgCard(o,state)).join(""):`<div class="org-empty">Организации не найдены. Попробуйте другое название.</div>`;
  }
  function catalogPage(state,ui){
    const total=CATALOG.length;
    const shown=Number(ui.orgLimit)||20;
    const matched=matches(ui.orgSearch||"",total);
    return `<header class="page-title"><div><h1>Организации</h1><p>Условия работы и отзывы работников</p></div><span class="org-counter">${total}</span></header>
      <label class="org-searchbox"><span class="org-search-icon">⌕</span><input id="organizationSearch" type="search" value="${esc(ui.orgSearch||"")}" placeholder="Название компании или сокращение" autocomplete="off" aria-label="Найти организацию"></label>
      <div class="org-filter-note">Каталог нефтегазовых и строительных организаций</div>
      <div class="card compact org-results" id="organizationResults">${matched.slice(0,shown).map(o=>orgCard(o,state)).join("")||'<div class="org-empty">Совпадений нет</div>'}</div>
      <div class="org-result-count" id="organizationResultCount">Показано ${Math.min(shown,matched.length)} из ${matched.length}</div>
      ${shown<matched.length?`<button class="btn secondary full org-show-more" type="button" data-action="more-orgs">Показать ещё</button>`:""}`;
  }
  function picture(p){
    const src=String(p||"");
    if(!/^(?:assets\/review-[a-z-]+\.svg|data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+)$/i.test(src))return "";
    return `<figure class="org-review-photo"><img loading="lazy" alt="Иллюстрация к пункту отзыва" src="${esc(src)}"><figcaption>${src.startsWith("assets/")?"Иллюстрация к отзыву":"Фото к отзыву"}</figcaption></figure>`;
  }
  function reviewCard(r,state){
    const author=r.authorAccountId==="me"?{name:state.profile?.name||"Мой профиль"}:state.accounts?.[r.authorAccountId];
    const friend=r.authorAccountId!=="me"&&state.friends.some(f=>f.accountId===r.authorAccountId);
    const who=r.anonymous?"Участник сообщества":(author?.name||"Участник сообщества");
    return `<article class="org-review-card">
      <div class="org-review-header">
        <div><strong>${esc(who)}</strong><small>${esc(r.createdAt||"")}${friend?" · ваш друг":""}</small></div>
        <strong class="org-review-score">★ ${esc(avgReview(r)||"—")}</strong>
      </div>
      ${r.worksite?`<p class="org-worksite">Объект: ${esc(r.worksite)}</p>`:""}
      ${CRITERIA.map(c=>{
        const s=r.sections?.[c.id]||{};
        const val=Number(s.rating)||0;
        return val||s.comment||s.photo?`<div class="org-review-section"><div class="org-review-line"><b>${esc(c.label)}</b><span aria-label="${val} из 5">${"★".repeat(val)}<span class="unfilled">${"★".repeat(Math.max(0,5-val))}</span></span></div>${s.comment?`<p>${esc(s.comment)}</p>`:""}${picture(s.photo)}</div>`:"";
      }).join("")}
      ${r.overall?`<p class="org-overall">${esc(r.overall)}</p>`:""}
      ${r.authorAccountId==="me"?`<button type="button" class="btn small secondary" data-action="edit-review" data-id="${esc(r.id)}">Изменить мой отзыв</button>`:""}
    </article>`;
  }
  function detailPage(state,ui){
    const o=byId(ui.orgId);
    if(!o)return `<header class="page-title"><h1>Организация не найдена</h1></header><button class="btn secondary" data-action="back-orgs">К каталогу</button>`;
    const s=summary(state,o.id);
    const myReview=state.organizationReviews.find(r=>r.organizationId===o.id&&r.authorAccountId==="me");
    return `<div class="org-detail-top"><button class="org-back" type="button" data-action="back-orgs">← Организации</button></div>
      <article class="card org-company-card">
        <div class="org-company-heading"><span class="org-company-logo">🏭</span><div><h1>${esc(o.name)}</h1><p>${esc(o.industry)}</p></div></div>
        <div class="org-company-stats"><span>${s.rating?`★ ${s.rating}`:"Без оценки"}<small>Публичный рейтинг</small></span><span>${s.all.length}<small>Доступных отзывов</small></span><span>${s.friends.length}<small>Друзей работали</small></span></div>
        <p class="org-source">Справочник организаций · <a href="${esc(o.source)}" target="_blank" rel="noopener noreferrer">Источник названия ↗</a></p>
      </article>
      <article class="card org-friends-section">
        <div class="org-title-line"><h2>Кто из друзей здесь работал</h2><span class="org-counter">${s.friends.length}</span></div>
        ${s.friends.length?s.friends.map(a=>`<button type="button" class="org-friend-item" data-action="friend-detail" data-id="${esc(a.id)}"><span class="org-friend-initial">${esc(a.name.slice(0,1))}</span><span><strong>${esc(a.name)}</strong><small>${esc(a.role||"")}</small></span><span class="org-arrow">›</span></button>`).join(""):'<p class="org-empty">Пока никто из ваших друзей не указал опыт работы здесь.</p>'}
      </article>
      <div class="org-title-line org-review-section-title"><h2>Отзывы работников</h2><span>${s.all.length}</span></div>
      <div class="org-review-actions"><button class="btn primary full" data-action="add-org-review" data-id="${esc(o.id)}">${myReview?"Изменить мой отзыв":"Написать отзыв"}</button></div>
      <div class="org-review-list">${s.all.length?s.all.slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).map(r=>reviewCard(r,state)).join(""):'<div class="card org-empty">Пока нет отзывов. Вы можете оставить первый.</div>'}</div>`;
  }
  function pickMarkup(query,current=""){
    const found=matches(query,8);
    return found.length?found.map(o=>`<button type="button" class="org-option ${o.id===current?"active":""}" data-action="choose-org" data-id="${esc(o.id)}" data-name="${esc(o.name)}"><strong>${esc(o.name)}</strong><small>${esc(o.industry)}</small></button>`).join(""):`<div class="org-empty">Не нашли? Уточните название организации.</div>`;
  }
  function picker(selectedOrgId="",fallbackName=""){
    const org=byId(selectedOrgId);
    return `<div class="field org-picker"><span>Организация из каталога</span>
      <input id="orgPickerSearch" type="search" name="organizationName" placeholder="Начните вводить название…" value="${esc(org?.name||fallbackName)}" autocomplete="off" required>
      <input id="orgPickerId" type="hidden" name="organizationId" value="${esc(org?.id||"")}">
      <div class="org-options" id="orgPickerOptions" role="listbox" aria-label="Подходящие организации">${pickMarkup(org?.name||fallbackName,org?.id)}</div>
      </div>`;
  }
  function starsInput(criterion,rating){
    const current=Math.max(0,Math.min(5,Number(rating)||0));
    return `<div class="org-rating-input" role="radiogroup" aria-label="${esc(criterion.label)}">
      ${[1,2,3,4,5].map(score=>`<label class="org-star-choice"><input type="radio" name="reviewRate_${criterion.id}" value="${score}" ${current===score?"checked":""} required><span title="${score} из 5">★</span></label>`).join("")}
    </div>`;
  }
  function reviewEditor(state,orgId,old){
    const o=byId(orgId);
    if(!o)return "<p>Выберите организацию.</p>";
    return `<div class="org-editor"><div class="org-editor-caption"><strong>${esc(o.name)}</strong><small>Оцените каждое условие отдельно</small></div>
      <label class="field"><span>Объект / месторождение (необязательно)</span><input name="reviewWorksite" maxlength="120" value="${esc(old?.worksite||"")}" placeholder="Например, участок строительства"></label>
      ${CRITERIA.map(c=>{
        const section=old?.sections?.[c.id]||{};
        return `<section class="org-editor-criterion"><div><strong>${esc(c.label)}</strong><p>${esc(c.tip)}</p></div>
          ${starsInput(c,section.rating||0)}
          <label class="field"><span>Комментарий</span><textarea name="reviewComment_${c.id}" maxlength="600" rows="2" placeholder="Ваш опыт по этому пункту">${esc(section.comment||"")}</textarea></label>
          ${section.photo?`<div class="org-existing-photo">${picture(section.photo)}<label><input type="checkbox" name="reviewRemove_${c.id}" value="1"> Убрать изображение</label></div>`:""}
          <label class="org-upload-label"><span>📷 Добавить одну фотографию</span><input type="file" name="reviewPhoto_${c.id}" accept="image/jpeg,image/png,image/webp"></label>
        </section>`;
      }).join("")}
      <label class="field"><span>Общий комментарий</span><textarea name="reviewOverall" maxlength="1200" rows="3" placeholder="Дополнительные подробности">${esc(old?.overall||"")}</textarea></label>
      <label class="field"><span>Кто видит мой отзыв</span><select id="reviewScope" name="reviewScope">
        ${[["all","Все пользователи"],["friends","Все друзья"],["selected","Избранные друзья"],["self","Только я"]].map(([v,t])=>`<option value="${v}" ${old?.scope===v?"selected":""}>${t}</option>`).join("")}
      </select></label>
      <fieldset class="org-selected-friends" id="reviewSelectedFriends" ${old?.scope==="selected"?"":"hidden"}><legend>Разрешённые друзья</legend>${(state.friends||[]).map(f=>{const a=state.accounts[f.accountId];return a?`<label><input type="checkbox" name="reviewAllowed" value="${esc(a.id)}" ${old?.allowedAccountIds?.includes(a.id)?"checked":""}> ${esc(a.name)}</label>`:""}).join("")}</fieldset>
      <label class="org-anonymous"><input type="checkbox" name="reviewAnonymous" value="yes" ${old?.anonymous?"checked":""}> Не показывать моё имя в каталоге</label>
    </div>`;
  }
  function compressFile(file){
    if(!file||!file.size)return Promise.resolve("");
    if(file.size>6*1024*1024)return Promise.reject(new Error("Фотография превышает 6 МБ"));
    if(!["image/jpeg","image/png","image/webp"].includes(file.type))return Promise.reject(new Error("Допустимы JPG, PNG или WebP"));
    return new Promise((resolve,reject)=>{
      const url=URL.createObjectURL(file);
      const img=new Image();
      img.onload=()=>{
        URL.revokeObjectURL(url);
        try{
          const canvas=document.createElement("canvas");
          const scale=Math.min(1,1000/Math.max(img.width,img.height));
          canvas.width=Math.max(1,Math.round(img.width*scale));
          canvas.height=Math.max(1,Math.round(img.height*scale));
          canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
          let result="";
          for(const quality of [0.78,0.62,0.47,0.32]){
            result=canvas.toDataURL("image/jpeg",quality);
            if(result.length<230000)break;
          }
          if(result.length>=230000)throw new Error("Не удалось уменьшить изображение. Выберите другое.");
          resolve(result);
        }catch(e){reject(e)}
      };
      img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("Не удалось прочитать фотографию"))};
      img.src=url;
    });
  }
  async function saveReview(state,orgId,old,form){
    if(!byId(orgId))throw Error("Организация не найдена");
    const sections={};
    for(const c of CRITERIA){
      const rating=Number(form.get("reviewRate_"+c.id));
      if(!Number.isInteger(rating)||rating<1||rating>5)throw Error("Поставьте оценки по всем пунктам");
      const comment=String(form.get("reviewComment_"+c.id)||"").trim().slice(0,600);
      let photo=String(old?.sections?.[c.id]?.photo||"");
      if(form.get("reviewRemove_"+c.id)==="1")photo="";
      const upload=form.get("reviewPhoto_"+c.id);
      if(upload&&upload.size)photo=await compressFile(upload);
      sections[c.id]={rating,comment,photo};
    }
    const scope=String(form.get("reviewScope")||"all");
    if(!["all","friends","selected","self"].includes(scope))throw Error("Некорректная видимость");
    const newReview={
      id:old?.id||"my-review-"+Date.now(),organizationId:orgId,authorAccountId:"me",
      createdAt:new Date().toISOString().slice(0,10),scope,
      allowedAccountIds:scope==="selected"?form.getAll("reviewAllowed").map(String).slice(0,100):[],
      anonymous:form.get("reviewAnonymous")==="yes",
      worksite:String(form.get("reviewWorksite")||"").trim().slice(0,120),
      overall:String(form.get("reviewOverall")||"").trim().slice(0,1200),
      sections
    };
    if(old)Object.assign(old,newReview);
    else state.organizationReviews.push(newReview);
    return newReview;
  }
  window.MV_ORG={
    CATALOG,CRITERIA,byId,byName,matches,orgCard,searchMarkup,catalogPage,detailPage,pickMarkup,picker,reviewEditor,
    reviewCard,reviewVisible,reviewsForFriend,friendHistory,enrichState,saveReview,summary,publicRating
  };
})();
