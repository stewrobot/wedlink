const $ = (selector) => document.querySelector(selector);
const venue = '달탐사기지1호';
const config = window.WEDLINK_CONFIG || {};
const apiUrl = (config.supabaseUrl || '').replace(/\/$/, '');
const apiKey = config.supabasePublishableKey || '';
const shared = Boolean(apiUrl && apiKey);
const endpoint = `${apiUrl}/rest/v1/guestbook`;
const headers = { apikey: apiKey, Authorization: `Bearer ${apiKey}` };

function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove('show'), 2200);
}

function displayDateTime(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium', timeStyle: 'medium', hourCycle: 'h23'
  }).format(date);
}

function renderNotes(rows) {
  $('#guest-list').replaceChildren(...rows.map((row) => {
    const article = document.createElement('article');
    article.className = 'guest-item';
    const meta = document.createElement('div');
    meta.className = 'guest-item__meta';
    const author = document.createElement('b');
    author.textContent = row.name;
    const time = document.createElement('time');
    const createdAt = new Date(row.created_at || Date.now());
    time.dateTime = createdAt.toISOString();
    time.textContent = displayDateTime(createdAt);
    const note = document.createElement('p');
    note.textContent = row.note;
    meta.append(author, time);
    article.append(meta, note);
    return article;
  }));
}

async function loadNotes() {
  if (!shared) {
    $('#guestbook-description').textContent = '방명록 서버에 연결할 수 없어 메시지를 저장할 수 없습니다.';
    throw new Error('Guestbook configuration is missing');
  }

  try {
    const response = await fetch(`${endpoint}?select=name,note,created_at&order=created_at.desc&limit=40`, { headers });
    if (!response.ok) throw new Error('Could not load guestbook');
    const rows = await response.json();
    renderNotes(rows);
    if (!rows.length) $('#guest-list').textContent = '첫 번째 축하의 마음을 남겨주세요.';
    $('#guestbook-description').textContent = '모든 방문자의 축하 메시지가 함께 표시됩니다.';
  } catch {
    $('#guestbook-description').textContent = '방명록을 불러오지 못했습니다. 잠시 후 다시 확인해주세요.';
    throw new Error('Could not load guestbook');
  }
}

$('#calendar').addEventListener('click', () => {
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//WedLink//Invitation//KO',
    'BEGIN:VEVENT', 'UID:wedlink-20301015@gyeol.net', `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`, 'DTSTART:20301015T020000Z', 'DTEND:20301015T030000Z',
    'SUMMARY:프페 & 여왕 결혼식', `LOCATION:${venue}`, 'END:VEVENT', 'END:VCALENDAR'
  ];
  const file = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(file);
  const link = Object.assign(document.createElement('a'), { href: url, download: '프페-여왕-결혼식.ics' });
  link.click();
  URL.revokeObjectURL(url);
  toast('캘린더 초대장을 준비했어요');
});

$('#copy-place').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(venue); toast('장소명을 복사했어요'); }
  catch { toast('장소명: 달탐사기지1호'); }
});

$('#guest-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const name = $('#name').value.trim();
  const note = $('#message').value.trim();
  if (!name || !note) return;

  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    if (!shared) throw new Error('Guestbook configuration is missing');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ name, note })
    });
    if (!response.ok) throw new Error('Could not save guestbook');
    form.reset();
    try {
      await loadNotes();
      toast('메시지를 저장했습니다.');
    } catch {
      toast('저장했습니다. 목록은 새로고침해 주세요.');
    }
  } catch {
    toast('저장하지 못했습니다. 잠시 후 다시 시도해주세요.');
  } finally {
    submit.disabled = false;
  }
});

$('#share').addEventListener('click', async () => {
  if (navigator.share) {
    try { await navigator.share({ title: document.title, text: '프페와 여왕의 결혼식에 초대합니다.', url: location.href }); }
    catch { /* dismissed by visitor */ }
    return;
  }
  try { await navigator.clipboard.writeText(location.href); toast('초대장 링크를 복사했어요'); }
  catch { toast('주소창의 링크를 복사해주세요'); }
});

loadNotes().catch(() => toast('방명록을 불러오지 못했습니다.'));

$('#reload').addEventListener('click', () => loadNotes().then(() => toast('목록을 새로 불러왔습니다.')).catch(() => toast('연결을 확인하고 다시 시도해주세요.')));
const remaining = Math.ceil((new Date('2030-10-15T11:00:00+09:00') - Date.now()) / 86400000);
$('#countdown').textContent = remaining > 0 ? 'D−' + remaining : remaining === 0 ? '오늘' : '함께한 지 ' + Math.abs(remaining) + '일';
