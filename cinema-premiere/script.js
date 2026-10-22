const el = (selector) => document.querySelector(selector);
function toast(message){const box=el('#toast');box.textContent=message;box.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>box.classList.remove('show'),1800)}
el('#calendar').addEventListener('click',()=>{const body=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//WedLink//Cinema Premiere//KO','BEGIN:VEVENT','DTSTART:20301015T020000Z','DTEND:20301015T030000Z','SUMMARY:프페 & 여왕 결혼식','LOCATION:달탐사기지1호','END:VEVENT','END:VCALENDAR'].join('\r\n');const url=URL.createObjectURL(new Blob([body],{type:'text/calendar;charset=utf-8'}));const link=Object.assign(document.createElement('a'),{href:url,download:'프페-여왕-시사회.ics'});link.click();URL.revokeObjectURL(url);toast('캘린더 초대장을 준비했어요')});
el('#copy-place').addEventListener('click',async()=>{try{await navigator.clipboard.writeText('달탐사기지1호')}catch{}toast('장소명을 복사했어요')});

const backend=window.WEDLINK_CONFIG||{};
const supabaseUrl=(backend.supabaseUrl||'').replace(/\/$/,'');
const supabaseKey=backend.supabasePublishableKey||'';
const sharedGuestbook=Boolean(supabaseUrl&&supabaseKey);
const guestbookUrl=`${supabaseUrl}/rest/v1/guestbook`;
const apiHeaders={apikey:supabaseKey,Authorization:`Bearer ${supabaseKey}`};
el('#guestbook-description').textContent=sharedGuestbook?'모든 방문자의 축하 메시지가 함께 표시됩니다.':'방명록 서버에 연결할 수 없어 메시지를 저장할 수 없습니다.';

function renderNotes(rows){
  el('#guest-list').replaceChildren(...rows.map(row=>{
    const node=document.createElement('article');node.className='guest-item';
    const author=document.createElement('b');author.textContent=row.name;
    const time=document.createElement('time');const createdAt=new Date(row.created_at||Date.now());time.dateTime=createdAt.toISOString();time.textContent=new Intl.DateTimeFormat('ko-KR',{dateStyle:'medium',timeStyle:'medium',hourCycle:'h23'}).format(createdAt);
    const note=document.createElement('p');note.textContent=row.note;
    node.append(author,time,note);return node;
  }));
}
async function loadNotes(){
  if(!sharedGuestbook)throw new Error('Guestbook configuration is missing');
  try{
    const response=await fetch(`${guestbookUrl}?select=name,note,created_at&order=created_at.desc&limit=40`,{headers:apiHeaders});
    if(!response.ok)throw new Error('Unable to load guestbook');
    renderNotes(await response.json());
    el('#guestbook-description').textContent='모든 방문자의 축하 메시지가 함께 표시됩니다.';
  }catch{el('#guestbook-description').textContent='방명록을 불러오지 못했습니다. 잠시 후 다시 확인해주세요.';throw new Error('Unable to load guestbook')}
}
el('#guest-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const name=el('#name').value.trim(),note=el('#message').value.trim();
  if(!name||!note)return;
  const submit=event.currentTarget.querySelector('button[type="submit"]');
  submit.disabled=true;
  try{
    if(!sharedGuestbook)throw new Error('Guestbook configuration is missing');
    const response=await fetch(guestbookUrl,{method:'POST',headers:{...apiHeaders,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({name,note})});
    if(!response.ok)throw new Error('Unable to save guestbook entry');
    event.currentTarget.reset();
    try{await loadNotes();toast('메시지를 저장했습니다.')}catch{toast('저장했습니다. 목록은 새로고침해 주세요.')}
  }catch{toast('저장하지 못했습니다. 잠시 후 다시 시도해주세요.')}
  finally{submit.disabled=false}
});
loadNotes().catch(()=>toast('방명록을 불러오지 못했습니다.'));
el('#share').addEventListener('click',async()=>{if(navigator.share){try{await navigator.share({title:document.title,text:'프페와 여왕의 결혼식, 첫 장면에 초대합니다.',url:location.href})}catch{}return}try{await navigator.clipboard.writeText(location.href)}catch{}toast('초대장 링크를 복사했어요')});
