// ═══════════════════════════════════════════════
// 爬山2 · 完百計畫 — 單頁 App（hash 路由）
//   #trips  #trip/ID  #routes[/small|/mine]  #route/CODE
//   #map/big  #map/small[/名稱]  #builder  #go  #done  #coef
// ═══════════════════════════════════════════════

// ── 儲存 ──
const LS = {
  get(k, d) { try { const v = localStorage.getItem('h2.' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('h2.' + k, JSON.stringify(v)); } catch {} },
};
const DEFAULT_COEF = { heavy: 1, light: 1, same: true, rest: 10, fatigue: 0 };
const st = {
  trips: LS.get('trips', []),
  coef: LS.get('coef', DEFAULT_COEF),
  records: LS.get('records', []),
  custom: LS.get('custom', []),
  q: '', tag: null, smallTag: null, dayFilter: 'all', undone: false,
};
const save = k => LS.set(k, st[k]);

// ── 完登紀錄：跟原本「爬山」頁共用同一份資料 ──
//   百岳：hikeRecords（原本爬山頁的登山紀錄，sync.js 會同步到雲端）
//   小百岳：peaksSmallDone（原本小百岳地圖的勾選清單）
const readJson = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; } catch { return d; } };
const hikeRecords = () => readJson('hikeRecords', []);
Object.defineProperty(st, 'done', { get: () => [...completedPeakSet(hikeRecords())] });
Object.defineProperty(st, 'doneSmall', {
  get: () => readJson('peaksSmallDone', []),
  set: v => { try { localStorage.setItem('peaksSmallDone', JSON.stringify([...new Set(v)])); } catch {} },
});
function markDone(names) {
  const done = st.done, add = [...new Set(names)].filter(n => !done.includes(n) && peakByName(n));
  if (!add.length) return add;
  const records = hikeRecords(), today = new Date().toISOString().slice(0, 10);
  add.forEach((n, i) => records.unshift({
    id: Date.now() + i, name: n, date: today, category: '百岳', peaks: [n],
    days: '', location: '', weight: '', distance: '', gain: '', note: '由爬山2 標記完登', photos: [], emoji: '🏔',
  }));
  localStorage.setItem('hikeRecords', JSON.stringify(records));
  warnNoToken();
  return add;
}
// 取消完登：只刪「單座山」的紀錄；多座山的行程紀錄要到原本的紀錄頁編輯，避免誤刪
function unmarkDone(name) {
  const records = hikeRecords();
  const hits = records.filter(r => recordMatchesPeak(r, name));
  const single = r => !(Array.isArray(r.peaks) && r.peaks.some(x => x !== name)) && completedPeakSet([r]).size <= 1;
  const multi = hits.filter(r => !single(r));
  if (multi.length) {
    alert(`「${name}」記在這些紀錄裡：${multi.map(r => r.name).join('、')}
請到原本「爬山 → 紀錄列表」編輯。`);
    return false;
  }
  if (!confirm(`取消「${name}」的完登？會刪除 ${hits.length} 筆登山紀錄（原本爬山頁也會同步刪除）。`)) return false;
  localStorage.setItem('hikeRecords', JSON.stringify(records.filter(r => !hits.includes(r))));
  warnNoToken();
  return true;
}
// sync.js 每次開頁都會用雲端 records.json 蓋掉本機，沒有 Token 的修改在換頁後會消失
function warnNoToken() {
  if (window.HikeSync && !HikeSync.hasToken()) setTimeout(() => toast('⚠ 未設定雲端 Token，這筆完登換頁後會被雲端資料蓋掉，請按右下「☁ 同步設定」'), 50);
}
const toggleDone = n => st.done.includes(n) ? unmarkDone(n) : markDone([n]).length > 0;

// 舊版爬山2 存在 h2.done / h2.doneSmall 的資料，併入共用紀錄後移除
// 要等 sync.js 把雲端紀錄讀回來之後再併，否則會被雲端資料蓋掉
function migrate() {
  const oldBig = LS.get('done', null), oldSmall = LS.get('doneSmall', null);
  if (oldBig?.length) markDone(oldBig);
  if (oldSmall?.length) st.doneSmall = [...st.doneSmall, ...oldSmall];
  try { localStorage.removeItem('h2.done'); localStorage.removeItem('h2.doneSmall'); } catch {}
}

// ── 工具 ──
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const hhmm = m => { m = Math.round(m); const d = Math.floor(m / 1440); m = ((m % 1440) + 1440) % 1440; return `${pad(Math.floor(m / 60))}:${pad(m % 60)}` + (d > 0 ? '⁺¹' : ''); };
const dur = m => { m = Math.round(m); const h = Math.floor(m / 60), r = m % 60; return h ? `${h}h${pad(r)}m` : `${r}m`; };
const km = v => (v >= 10 ? v.toFixed(1) : v.toFixed(1)) + 'k';
const DAY_COLORS = ['#22406b', '#3d8b5a', '#d89a1e', '#7a49a8', '#2a9d8f', '#c8417a', '#8a8a2e', '#b4552d'];
const peakByName = n => PEAKS.find(p => p.name === n);
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), msg.length > 30 ? 4500 : 1800); }
function haversine(a, b, c, d) {
  const R = 6371000, r = Math.PI / 180, dLa = (c - a) * r, dLo = (d - b) * r;
  const x = Math.sin(dLa / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
function nearestPeak(lat, lng) {
  let best = null, bd = Infinity;
  PEAKS.forEach(p => { const d = haversine(lat, lng, p.lat, p.lng); if (d < bd) { bd = d; best = p; } });
  return { peak: best, dist: bd };
}
function modal(html) {
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="box">${html}<button class="btn block" style="margin-top:10px" data-close>關閉</button></div>`;
  m.addEventListener('click', e => { if (e.target === m || e.target.hasAttribute('data-close')) m.remove(); });
  document.body.appendChild(m);
  return m;
}
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); toast('已複製'); } catch { toast('無法複製，請手動選取'); }
}
function showHelp() {
  modal(`<h3 style="font-family:var(--serif);margin-bottom:8px">怎麼用</h3>
  <p class="small muted" style="line-height:1.8">
  ・<b>路線</b>：挑一條百岳路線或自己建，按「加入我的行程」。<br>
  ・<b>行程</b>：用你的上河係數、休息比例、每日掉速，自動算出每個點的抵達時間，超過天黑會變紅。<br>
  ・<b>上河係數</b>：實際行進時間 ÷ 上河步程。1.0 = 跟上河地圖一樣快，0.8 = 快兩成。<br>
  ・<b>行進</b>：用手機 GPS 記錄軌跡，結束後可下載 GPX。<br>
  ・<b>完百</b>：勾選完登的山，用照片 GPS 自動補登。<br>
  ・<b>我的係數</b>：用過去的紀錄算出自己的係數，套用到新行程。<br><br>
  資料都存在這台裝置的瀏覽器裡。路線步程為示範資料，出發前請再查證。</p>`);
}

// ── 路線 ──
const allRoutes = () => [...ROUTES, ...st.custom];
const getRoute = code => allRoutes().find(r => r.code === code);
function routeStats(r) {
  let sh = 0, dist = 0, up = 0, down = 0;
  r.days.forEach(d => d.forEach((p, i) => { if (i) { sh += p[1]; dist += p[2]; up += p[3]; down += p[4]; } }));
  return { days: r.days.length, sh, dist, up, down };
}
const routeHasTag = (r, k) => k === 'single' ? r.days.length === 1 : (r.tags || []).includes(k);
const routeDone = r => r.peaks.length && r.peaks.every(n => st.done.includes(n));
function routeMatches(r, q) {
  if (!q) return true;
  const hay = [r.code, r.name, r.desc, ...r.peaks, ...r.days.flat().map(p => p[0])].join(' ');
  return hay.includes(q);
}

// ── 行程計算 ──
function duskFor(dateStr, dayIdx, manual) {
  if (!dateStr) return manual;
  const d = new Date(dateStr + 'T00:00:00'); d.setDate(d.getDate() + dayIdx);
  const doy = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
  // 台灣中部近似日落（分鐘），再加 25 分鐘民用曙暮光 = 天黑
  return 1078 + 52 * Math.sin(2 * Math.PI * (doy - 80) / 365) + 25;
}
function plan(route, s) {
  return route.days.map((day, i) => {
    const start = s.starts?.[i] ?? 300;
    const fat = 1 + (s.fatigue / 100) * i;
    let t = start, walk = 0, rest = 0, sh = 0, dist = 0, up = 0, down = 0;
    const rows = day.map((p, j) => {
      const flags = p[5] || '';
      if (!j) return { name: p[0], arrive: start, first: true, flags };
      const light = flags.includes('light');
      const coef = light && !s.same ? s.light : s.heavy;
      const w = p[1] * coef * fat, r = w * s.rest / 60;
      t += w + r; walk += w; rest += r; sh += p[1]; dist += p[2]; up += p[3]; down += p[4];
      return { name: p[0], sh: p[1], km: p[2], up: p[3], down: p[4], arrive: t, seg: w + r, flags, light };
    });
    const dusk = duskFor(s.date, i, s.dusk ?? 1040);
    return { i, start, end: t, walk, rest, sh, dist, up, down, rows, dusk, from: day[0][0], to: day[day.length - 1][0] };
  });
}
function dateLabel(s, i) {
  if (!s.date) return '';
  const d = new Date(s.date + 'T00:00:00'); d.setDate(d.getDate() + i);
  return `${d.getMonth() + 1}/${d.getDate()}（${'日一二三四五六'[d.getDay()]}）`;
}

// ═══════════════ 畫面 ═══════════════
const view = () => $('#view');
let mapObj = null;

function render() {
  const h = location.hash.slice(1) || 'trips';
  const [a, b, c] = h.split('/').map(decodeURIComponent);
  const tab = { trips: 'trips', trip: 'trips', routes: 'routes', route: 'routes', map: 'routes', builder: 'routes', go: 'go', done: 'done', coef: 'coef' }[a] || 'trips';
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === tab));
  if (mapObj) { mapObj.remove(); mapObj = null; }
  ({
    trips: renderTrips, trip: () => renderTrip(b), routes: () => renderRoutes(b || 'big'),
    route: () => renderRoute(b), map: () => renderMap(b, c), builder: renderBuilder,
    go: renderGo, done: renderDone, coef: renderCoef,
  }[a] || renderTrips)();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', render);

// ── 行程列表 ──
function renderTrips() {
  const items = st.trips.map(t => {
    const r = getRoute(t.code); if (!r) return '';
    const s = routeStats(r);
    return `<div class="card pad row">
      <a class="grow" href="#trip/${t.id}" style="text-decoration:none">
        <div style="font-weight:700;line-height:1.5"><span class="code">${esc(r.code)}</span> ${esc(r.name)}</div>
        <div class="small muted" style="margin-top:4px">${t.settings.date ? '出發 ' + t.settings.date : '還沒設定出發日期'}</div>
        <div class="small" style="margin-top:2px">${s.days} 天 · 上河 ${s.sh} 分</div>
      </a>
      <button class="muted" data-del="${t.id}" style="font-size:1.1rem;padding:6px">×</button>
      <a href="#trip/${t.id}" class="chev" style="text-decoration:none">›</a>
    </div>`;
  }).join('');
  view().innerHTML = `<div class="page-head"><div><h1 class="page">我的行程</h1>
      <p>挑一條路線，用自己的上河係數算出每個點的抵達時間。</p></div>
      <a class="btn dark" href="#routes">📍 從 ${ROUTES.length} 條百岳路線挑選</a></div>
    ${items ? `<div class="list cards">${items}</div>` : '<div class="card empty">還沒有行程，先去挑一條路線吧。</div>'}`;
  view().querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    if (!confirm('刪除這個行程？')) return;
    st.trips = st.trips.filter(t => t.id != b.dataset.del); save('trips'); render();
  });
}

function addTrip(code) {
  const t = { id: Date.now(), code, settings: { ...st.coef, date: '', dusk: 1040, starts: [] } };
  st.trips.unshift(t); save('trips');
  location.hash = '#trip/' + t.id;
}

// ── 行程規劃 ──
function renderTrip(id) {
  const trip = st.trips.find(t => t.id == id);
  const r = trip && getRoute(trip.code);
  if (!r) { view().innerHTML = '<div class="empty">找不到這個行程。<br><a href="#trips">回我的行程</a></div>'; return; }
  const s = trip.settings;
  const persist = () => { save('trips'); drawPlan(); };
  const slider = (key, label, min, max, step, chips) => `
    <div class="ctl"><label>${label}</label>
      <div class="r"><input type="range" min="${min}" max="${max}" step="${step}" value="${s[key]}" data-k="${key}"><span class="v" id="v-${key}">${fmtVal(key, s[key])}</span></div>
      ${chips ? `<div class="chips">${chips.map(c => `<button data-chip="${key}" data-v="${c}">${c.toFixed(1)}</button>`).join('')}</div>` : ''}
    </div>`;
  view().innerHTML = `
    <a class="crumb" href="#trips">‹ 我的行程</a>
    <div class="page-head"><div>
      <div class="trip-title"><span class="code lg">${esc(r.code)}</span> ${esc(r.name)}</div>
      <div class="small muted">${esc(r.desc)}，${r.days.length} 天 ${Math.max(0, r.days.length - 1)} 夜</div>
      ${r.note ? `<div class="warn" style="margin-bottom:0">⚠ ${esc(r.note)}</div>` : ''}</div>
      <div class="row">
        <button class="btn" id="b-share">🔗 分享行程</button>
        <button class="btn" id="b-text">📄 文字行程</button>
      </div>
    </div>
    <div class="layout"><aside class="side">
    <div class="card pad" style="margin-bottom:12px">
      <div class="row">
        <button class="btn" id="b-loc">◎ 定位</button>
        <a class="btn dark" href="#go">◉ 開始記錄</a>
        <a class="btn" href="#go">▲ 行進模式</a>
      </div>
      <p class="xs muted" style="margin-top:10px;line-height:1.6" id="loc-out">定位：看自己在路線上的位置；記錄：螢幕關閉也持續記錄軌跡（視瀏覽器支援）。</p>
    </div>
    <div class="card" style="padding:0 16px;margin-bottom:12px">
      ${slider('heavy', '重裝上河係數', 0.5, 1.6, 0.01, [0.7, 0.8, 0.9, 1.0])}
      <div class="ctl" id="light-wrap"><label>輕裝上河係數（單攻來回段）</label>
        <div class="r"><input type="range" min="0.5" max="1.6" step="0.01" value="${s.light}" data-k="light" ${s.same ? 'disabled' : ''}><span class="v" id="v-light">${fmtVal('light', s.same ? s.heavy : s.light)}</span></div>
        <label class="check"><input type="checkbox" id="same" ${s.same ? 'checked' : ''}> 跟重裝相同</label>
      </div>
      ${slider('rest', '休息（每走 1 小時休幾分鐘）', 0, 30, 1)}
      ${slider('fatigue', '每天掉速（%，第 2 天起累加）', 0, 20, 1)}
      <div class="ctl"><label>第一天日期</label><input type="date" id="date" value="${s.date || ''}">
        <span class="xs muted">填日期會自動算每天的天黑時間</span></div>
      <div class="ctl" id="dusk-wrap" ${s.date ? 'style="display:none"' : ''}><label>天黑時間</label><input type="time" id="dusk" value="${hhmm(s.dusk ?? 1040)}"></div>
    </div>
    </aside><section>
    <div id="plan"></div>
    <p class="foot-note">步程為示範資料（參考上河地圖精神：以「標準體力、重裝」計）。實際時間會受天候、路況、隊伍體能影響，請保守規劃並留意天黑。</p></section></div>`;

  function fmtVal(k, v) { return k === 'rest' || k === 'fatigue' ? String(v) : Number(v).toFixed(2); }
  view().querySelectorAll('input[type=range]').forEach(inp => inp.oninput = () => {
    const k = inp.dataset.k; s[k] = +inp.value; $('#v-' + k).textContent = fmtVal(k, s[k]);
    if (k === 'heavy' && s.same) $('#v-light').textContent = fmtVal('light', s.heavy);
    persist();
  });
  view().querySelectorAll('[data-chip]').forEach(b => b.onclick = () => {
    s[b.dataset.chip] = +b.dataset.v;
    const inp = view().querySelector(`input[data-k=${b.dataset.chip}]`); inp.value = s[b.dataset.chip]; inp.oninput();
  });
  $('#same').onchange = e => { s.same = e.target.checked; view().querySelector('input[data-k=light]').disabled = s.same; $('#v-light').textContent = fmtVal('light', s.same ? s.heavy : s.light); persist(); };
  $('#date').onchange = e => { s.date = e.target.value; $('#dusk-wrap').style.display = s.date ? 'none' : ''; persist(); };
  $('#dusk').onchange = e => { const [h, m] = e.target.value.split(':').map(Number); s.dusk = h * 60 + m; persist(); };
  $('#b-text').onclick = () => {
    const txt = tripText(r, s);
    const m = modal(`<b>文字行程</b><pre>${esc(txt)}</pre><button class="btn dark block" id="cp">複製</button>`);
    m.querySelector('#cp').onclick = () => copyText(txt);
  };
  $('#b-share').onclick = async () => {
    const txt = tripText(r, s);
    if (navigator.share) { try { await navigator.share({ title: r.name, text: txt }); return; } catch {} }
    copyText(txt);
  };
  $('#b-loc').onclick = () => locateOnRoute(r);

  function drawPlan() {
    const P = plan(r, s);
    const H0 = 4 * 60, H1 = 19 * 60, span = H1 - H0;
    const pct = m => Math.max(0, Math.min(100, (m - H0) / span * 100));
    const minDusk = Math.min(...P.map(d => d.dusk));
    const gantt = `<div class="card gantt" style="margin-bottom:14px">
      <div style="position:relative">
        ${P.map(d => `<div class="g-row"><div class="d"><i style="background:${DAY_COLORS[d.i % 8]}"></i>D${d.i + 1}</div>
          <div class="g-track"><div class="g-bar ${d.end > d.dusk ? 'over' : ''}" style="left:${pct(d.start)}%;width:${pct(d.end) - pct(d.start)}%;background:${DAY_COLORS[d.i % 8]}">
            <span>${hhmm(d.end)} 到${esc(d.to)}</span></div></div></div>`).join('')}
        <div class="g-dusk" style="left:calc(40px + (100% - 40px) * ${pct(minDusk) / 100})"><b>天黑 ${hhmm(minDusk)}</b></div>
      </div>
      <div class="g-axis"><div></div><div>${[4, 6, 8, 10, 12, 14, 16, 18].map(h => `<span>${pad(h)}</span>`).join('')}</div></div>
    </div>`;
    const days = P.map(d => {
      const c = DAY_COLORS[d.i % 8];
      const opts = [180, 210, 240, 270, 300, 330, 360, 390, 420, 480].map(m => `<option value="${m}" ${m === d.start ? 'selected' : ''}>${m < 300 ? '凌晨' : '清晨'}${Math.floor(m / 60)}:${pad(m % 60)}</option>`).join('');
      return `<div class="card day" style="--c:${c};margin-bottom:14px">
        <div class="day-h">
          <div class="row" style="align-items:flex-start">
            <div class="tt grow"><em>D${d.i + 1}</em>${esc(d.from)} → ${esc(d.to)}
              ${dateLabel(s, d.i) ? `<div class="xs muted">${dateLabel(s, d.i)}</div>` : ''}</div>
            <div style="text-align:right"><div class="xs muted">出發</div><select class="start-sel" data-day="${d.i}">${opts}</select></div>
          </div>
          <div class="stats">
            <div><small>上河</small><b>${d.sh} 分</b></div>
            <div><small>行進</small><b style="color:#4a6fa5">${dur(d.walk)}</b></div>
            <div><small>含休息</small><b>${dur(d.walk + d.rest)}</b></div>
            <div><small>距離／爬升</small><b style="font-size:.85rem">${d.dist.toFixed(1)}k ↑${d.up} ↓${d.down}</b></div>
            <div class="${d.end > d.dusk ? 'over' : ''}"><small>抵達</small><b>${hhmm(d.end)}</b></div>
            <div><small>天黑</small><b>${hhmm(d.dusk)}</b></div>
          </div>
        </div>
        <table class="wp"><tr><th>地點</th><th style="text-align:center">上河（分）</th><th style="text-align:right">抵達</th><th style="text-align:right">過夜</th></tr>
          ${d.rows.map((w, j) => w.first
            ? `<tr><td colspan="2" class="muted">${esc(w.name)} 出發</td><td class="time">${hhmm(w.arrive)}</td><td></td></tr>`
            : `<tr class="${w.arrive > d.dusk ? 'late' : ''}"><td><div class="nm">${esc(w.name)}</div><div class="meta">${w.km.toFixed(1)}k ↑${w.up} ↓${w.down}</div></td>
              <td class="num">${w.sh}</td>
              <td class="time">${hhmm(w.arrive)}<small>行進 ${dur(w.seg)}</small></td>
              <td style="text-align:right">${w.flags.includes('camp') ? '<span class="tag camp">過夜</span>' : w.light ? '<span class="tag light">輕裝</span>' : ''}</td></tr>`).join('')}
        </table>
      </div>`;
    }).join('');
    $('#plan').innerHTML = gantt + days;
    $('#plan').querySelectorAll('.start-sel').forEach(sel => sel.onchange = () => {
      s.starts = s.starts || []; s.starts[+sel.dataset.day] = +sel.value; persist();
    });
  }
  drawPlan();
}

function tripText(r, s) {
  const P = plan(r, s);
  let t = `【${r.code} ${r.name}】${r.days.length} 天\n係數 重裝 ${s.heavy.toFixed(2)}${s.same ? '' : ' / 輕裝 ' + s.light.toFixed(2)}，休息 ${s.rest} 分/時\n`;
  if (s.date) t += `出發日 ${s.date}\n`;
  P.forEach(d => {
    t += `\nD${d.i + 1} ${dateLabel(s, d.i)} ${d.from} → ${d.to}（上河 ${d.sh} 分，${d.dist.toFixed(1)}k ↑${d.up}）\n`;
    d.rows.forEach(w => { t += `  ${hhmm(w.arrive)}  ${w.name}${w.first ? ' 出發' : ''}${w.flags.includes('camp') ? '（過夜）' : ''}\n`; });
    t += `  天黑 ${hhmm(d.dusk)}${d.end > d.dusk ? '  ⚠ 抵達晚於天黑' : ''}\n`;
  });
  return t;
}

function locateOnRoute(r) {
  const out = $('#loc-out');
  if (!navigator.geolocation) { out.textContent = '這個瀏覽器不支援定位。'; return; }
  out.textContent = '定位中…';
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude: la, longitude: lo, altitude: al } = pos.coords;
    const near = r.peaks.map(peakByName).filter(Boolean)
      .map(p => ({ p, d: haversine(la, lo, p.lat, p.lng) })).sort((a, b) => a.d - b.d)[0];
    out.innerHTML = `目前位置 ${la.toFixed(5)}, ${lo.toFixed(5)}${al ? `，海拔約 ${Math.round(al)}m` : ''}` +
      (near ? `<br>距離本路線的 <b>${near.p.name}</b> 約 ${(near.d / 1000).toFixed(1)} km` : '');
  }, e => { out.textContent = '定位失敗：' + e.message; }, { enableHighAccuracy: true, timeout: 15000 });
}

// ── 路線 ──
function renderRoutes(seg) {
  const segBar = `<div class="seg">
    <a href="#routes" class="${seg === 'big' ? 'on' : ''}">百岳路線<small>${ROUTES.length}</small></a>
    <a href="#routes/small" class="${seg === 'small' ? 'on' : ''}">小百岳<small>${SMALL_PEAKS.length}</small></a>
    <a href="#routes/mine" class="${seg === 'mine' ? 'on' : ''}">我的<small>${st.custom.length}</small></a></div>`;
  view().innerHTML = `<div class="page-head"><div><h1 class="page">路線</h1>
      <p>百岳路線、小百岳，或用 GPX／自組建立自己的路線。</p></div></div>
    <div class="toolbar"><div class="search">🔍<input id="q" placeholder="搜尋百岳、小百岳、山屋、登山口、路線…" value="${esc(st.q)}"></div>
    ${segBar}</div><div id="seg-body"></div>
    <p class="foot-note">內建路線的步程參考上河文化步程精神整理，為示範資料；完登紀錄存在這台裝置。地圖底圖 © OpenStreetMap contributors。出發前請再確認路況與水源。</p>`;
  $('#q').oninput = e => { st.q = e.target.value.trim(); body(); };
  const body = () => ({ big: segBig, small: segSmall, mine: segMine }[seg] || segBig)($('#seg-body'));
  body();
}

function segBig(el) {
  const doneN = st.done.length;
  const list = ROUTES.filter(r => routeMatches(r, st.q))
    .filter(r => !st.tag || routeHasTag(r, st.tag))
    .filter(r => st.dayFilter === 'all' || (st.dayFilter === '1' ? r.days.length === 1 : st.dayFilter === '23' ? r.days.length >= 2 && r.days.length <= 3 : r.days.length >= 4))
    .filter(r => !st.undone || !routeDone(r));
  const tag = ROUTE_TAGS.find(t => t.key === st.tag);
  el.innerHTML = `
    <div class="row" style="justify-content:space-between;margin-bottom:14px">
      <div class="small">完登 <b style="font-size:1.2rem">${doneN}</b> / 100</div>
      <a class="pill" href="#map/big" style="text-decoration:none">百岳總覽地圖 ›</a></div>
    <div class="hscroll">${ROUTE_TAGS.map(t => `<button class="cat ${st.tag === t.key ? 'on' : ''}" data-tag="${t.key}"><b>${t.title}</b><span>${ROUTES.filter(r => routeHasTag(r, t.key)).length} 條</span></button>`).join('')}</div>
    ${tag ? `<div class="sec-h"><h3>${tag.title}</h3><button class="pill" data-tag="">× 看全部</button></div><p class="xs muted" style="margin-bottom:10px">${tag.sub}</p>` : ''}
    <div class="filters">
      <select id="df"><option value="all">天數</option><option value="1">1 天</option><option value="23">2–3 天</option><option value="4">4 天以上</option></select>
      <button id="ud" class="${st.undone ? 'on' : ''}">未完登</button>
    </div>
    <p class="xs muted" style="margin-bottom:6px">${list.length} 條</p>
    <div class="list cards">${list.map(routeItem).join('') || '<div class="empty">沒有符合的路線</div>'}</div>`;
  el.querySelector('#df').value = st.dayFilter;
  el.querySelector('#df').onchange = e => { st.dayFilter = e.target.value; segBig(el); };
  el.querySelector('#ud').onclick = () => { st.undone = !st.undone; segBig(el); };
  el.querySelectorAll('[data-tag]').forEach(b => b.onclick = () => { st.tag = b.dataset.tag && b.dataset.tag !== st.tag ? b.dataset.tag : null; segBig(el); });
}
function routeItem(r) {
  const s = routeStats(r);
  const nDone = r.peaks.filter(n => st.done.includes(n)).length;
  return `<a class="item" href="#route/${encodeURIComponent(r.code)}"><div class="grow">
    <div class="t"><span class="code">${esc(r.code)}</span> ${esc(r.name)}</div>
    <div class="s">${s.days} 天 · 上河 ${s.sh} 分 · ${s.dist.toFixed(1)} km · ↑${s.up}</div>
    <div class="s">百岳 ${r.peaks.length} 座${nDone ? `（已完登 ${nDone}）` : ''}</div></div><span class="chev">›</span></a>`;
}

function segSmall(el) {
  const list = SMALL_PEAKS.filter(p => !st.q || (p.name + p.region + p.trail).includes(st.q)).filter(p => !st.smallTag || p.tags.includes(st.smallTag));
  const tag = SMALL_TAGS.find(t => t.key === st.smallTag);
  el.innerHTML = `
    <div class="row" style="justify-content:space-between;margin-bottom:14px">
      <div class="small">完登 <b style="font-size:1.2rem">${st.doneSmall.length}</b> / ${SMALL_PEAKS.length}</div>
      <a class="pill" href="#map/small" style="text-decoration:none">小百岳總覽地圖 ›</a></div>
    <div class="hscroll">${SMALL_TAGS.map(t => `<button class="cat ${st.smallTag === t.key ? 'on' : ''}" data-tag="${t.key}"><b>${t.title}</b><span>${SMALL_PEAKS.filter(p => p.tags.includes(t.key)).length} 座</span></button>`).join('')}</div>
    ${tag ? `<div class="sec-h"><h3>${tag.title}</h3><button class="pill" data-tag="">× 看全部</button></div><p class="xs muted" style="margin-bottom:10px">${tag.sub}</p>` : ''}
    <p class="xs muted" style="margin-bottom:6px">${list.length} 座</p>
    <div class="list cards">${list.map(p => `<div class="item">
      <input type="checkbox" data-name="${esc(p.name)}" ${st.doneSmall.includes(p.name) ? 'checked' : ''}>
      <a class="grow" href="#map/small/${encodeURIComponent(p.name)}" style="text-decoration:none">
        <div class="t">${p.n ? `<span class="n">${p.n}</span>` : ''}${esc(p.name)}</div>
        <div class="s">${p.alt} m · ${esc(p.region)} · ${esc(p.trail)}</div></a>
      <a class="chev" href="#map/small/${encodeURIComponent(p.name)}" style="text-decoration:none">›</a></div>`).join('') || '<div class="empty">沒有符合的山</div>'}</div>`;
  el.querySelectorAll('[data-tag]').forEach(b => b.onclick = () => { st.smallTag = b.dataset.tag && b.dataset.tag !== st.smallTag ? b.dataset.tag : null; segSmall(el); });
  el.querySelectorAll('input[data-name]').forEach(c => c.onchange = () => {
    const n = c.dataset.name;
    st.doneSmall = c.checked ? [...st.doneSmall, n] : st.doneSmall.filter(x => x !== n);
    segSmall(el);
  });
}

function segMine(el) {
  const mine = st.custom.filter(r => routeMatches(r, st.q));
  el.innerHTML = `<div class="tools">
    <a class="action-card hl" href="#builder"><b>＋ 自組路線</b><p>一段一段填入地點與上河步程，也可以標記過夜點、輕裝單攻段。</p></a>
    <label class="action-card dashed" style="cursor:pointer"><b>＋ 匯入 GPX 建立新路線</b>
      <p>可用健行筆記、Hikingbook、Garmin 匯出的軌跡；有航點會自動帶入節點名稱，有時間紀錄會自動找出過夜點。</p>
      <input type="file" accept=".gpx,application/gpx+xml" id="gpx-in" hidden></label></div>
    ${mine.length ? `<div class="list cards">${mine.map(routeItem).join('')}</div>` : '<p class="small muted" style="line-height:1.7">還沒有自己的路線。用上面兩種方式建立。</p>'}`;
  el.querySelector('#gpx-in').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const r = gpxToRoute(await f.text(), f.name.replace(/\.gpx$/i, ''));
      st.custom.push(r); save('custom'); location.hash = '#route/' + encodeURIComponent(r.code);
    } catch (err) { toast('GPX 讀取失敗：' + err.message); }
  };
}

// ── 路線詳情 ──
function renderRoute(code) {
  const r = getRoute(code);
  if (!r) { view().innerHTML = '<div class="empty">找不到路線。<br><a href="#routes">回路線</a></div>'; return; }
  const s = routeStats(r);
  const custom = st.custom.includes(r);
  view().innerHTML = `
    <a class="crumb" href="${custom ? '#routes/mine' : '#routes'}">‹ 路線</a>
    <div class="page-head"><div>
      <div class="trip-title"><span class="code lg">${esc(r.code)}</span> ${esc(r.name)}</div>
      <div class="small muted">${esc(r.desc || '')}</div>
      ${r.note ? `<div class="warn" style="margin-bottom:0">⚠ ${esc(r.note)}</div>` : ''}</div></div>
    <div class="layout"><aside class="side">
    <div class="card pad" style="margin-bottom:14px">
      <div class="stats" style="margin:0">
        <div><small>天數</small><b>${s.days} 天</b></div>
        <div><small>上河</small><b>${s.sh} 分</b></div>
        <div><small>距離</small><b>${s.dist.toFixed(1)} km</b></div>
        <div><small>爬升</small><b>↑${s.up}</b></div>
        <div><small>下降</small><b>↓${s.down}</b></div>
        <div><small>百岳</small><b>${r.peaks.length} 座</b></div>
      </div>
      ${r.peaks.length ? `<div class="row" style="flex-wrap:wrap;margin-top:12px">${r.peaks.map(n => { const p = peakByName(n); return `<span class="tag ${st.done.includes(n) ? 'camp' : ''}">${p ? 'No.' + p.rank + ' ' : ''}${esc(n)}</span>`; }).join('')}</div>` : ''}
    </div>
    <button class="btn dark block" id="add">＋ 加入我的行程</button>
    ${custom ? '<button class="btn block" id="del" style="margin-top:10px;color:var(--red)">刪除這條自建路線</button>' : ''}
    </aside><section class="days-grid">
    ${r.days.map((d, i) => `<div class="card day" style="--c:${DAY_COLORS[i % 8]}">
      <div class="day-h"><div class="tt"><em>D${i + 1}</em>${esc(d[0][0])} → ${esc(d[d.length - 1][0])}</div></div>
      <table class="wp"><tr><th>地點</th><th style="text-align:center">上河（分）</th><th style="text-align:right">距離／爬升</th><th></th></tr>
      ${d.slice(1).map(p => `<tr><td class="nm">${esc(p[0])}</td><td class="num">${p[1]}</td><td class="time xs">${p[2].toFixed(1)}k ↑${p[3]} ↓${p[4]}</td>
        <td style="text-align:right">${(p[5] || '').includes('camp') ? '<span class="tag camp">過夜</span>' : (p[5] || '').includes('light') ? '<span class="tag light">輕裝</span>' : ''}</td></tr>`).join('')}
      </table></div>`).join('')}</section></div>`;
  $('#add').onclick = () => addTrip(r.code);
  if (custom) $('#del').onclick = () => {
    if (!confirm('刪除這條路線？使用它的行程也會一起刪除。')) return;
    st.custom = st.custom.filter(x => x !== r); st.trips = st.trips.filter(t => t.code !== r.code);
    save('custom'); save('trips'); location.hash = '#routes/mine';
  };
}

// ── 自組路線 ──
function renderBuilder() {
  view().innerHTML = `<div class="narrow"><a class="crumb" href="#routes/mine">‹ 路線</a><div class="page-head"><h1 class="page">自組路線</h1></div>
    <div class="card pad">
      <div class="field"><label>路線名稱</label><input id="b-name" placeholder="例：雪山主東"></div>
      <div class="field"><label>說明（選填）</label><input id="b-desc" placeholder="例：武陵雪山登山口出"></div>
      <div class="field"><label>起點</label><input id="b-start" placeholder="例：雪山登山口"></div>
      <p class="xs muted" style="margin:4px 0 8px">依序加入下一個點：上河分鐘、距離、爬升下降。勾「過夜」代表當天結束在這裡。</p>
      <div id="b-rows"></div>
      <button class="btn block" id="b-add" style="margin-top:6px">＋ 下一個點</button>
    </div>
    <button class="btn dark block" id="b-save" style="margin-top:14px">儲存路線</button></div>`;
  const rows = $('#b-rows');
  const addRow = () => {
    const d = document.createElement('div');
    d.className = 'card'; d.style.cssText = 'padding:10px;margin-bottom:8px;background:var(--bg)';
    d.innerHTML = `<div class="field" style="margin-bottom:6px"><input data-f="name" placeholder="地點名稱"></div>
      <div class="day-in" style="grid-template-columns:repeat(4,1fr)">
        <input data-f="sh" type="number" placeholder="上河分"><input data-f="km" type="number" step="0.1" placeholder="km">
        <input data-f="up" type="number" placeholder="↑m"><input data-f="down" type="number" placeholder="↓m"></div>
      <div class="row"><label class="check"><input type="checkbox" data-f="camp"> 過夜</label>
        <label class="check"><input type="checkbox" data-f="light"> 輕裝段</label>
        <button class="muted xs" style="margin-left:auto" data-rm>移除</button></div>`;
    d.querySelector('[data-rm]').onclick = () => d.remove();
    rows.appendChild(d);
  };
  addRow(); addRow();
  $('#b-add').onclick = addRow;
  $('#b-save').onclick = () => {
    const name = $('#b-name').value.trim(), start = $('#b-start').value.trim();
    if (!name || !start) { toast('請填路線名稱和起點'); return; }
    const pts = [...rows.children].map(d => {
      const g = f => d.querySelector(`[data-f=${f}]`);
      return [g('name').value.trim(), +g('sh').value || 0, +g('km').value || 0, +g('up').value || 0, +g('down').value || 0,
        [g('camp').checked && 'camp', g('light').checked && 'light'].filter(Boolean).join(' ')];
    }).filter(p => p[0]);
    if (!pts.length) { toast('至少加一個點'); return; }
    const days = []; let cur = [[start, 0, 0, 0, 0]];
    pts.forEach((p, i) => { cur.push(p); if (p[5].includes('camp') && i < pts.length - 1) { days.push(cur); cur = [[p[0], 0, 0, 0, 0]]; } });
    days.push(cur);
    const r = { code: nextCode(), name, desc: $('#b-desc').value.trim(), tags: [], peaks: detectPeaks(pts.map(p => p[0])), days };
    st.custom.push(r); save('custom'); location.hash = '#route/' + encodeURIComponent(r.code);
  };
}
const nextCode = () => 'M' + pad(st.custom.reduce((m, r) => Math.max(m, +r.code.slice(1) || 0), 0) + 1);
const detectPeaks = names => [...new Set(names.filter(n => peakByName(n)))];

// ── GPX ──
function parseGpx(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('不是有效的 GPX');
  const pts = [...doc.querySelectorAll('trkpt, rtept')].map(n => ({
    lat: +n.getAttribute('lat'), lon: +n.getAttribute('lon'),
    ele: +(n.querySelector('ele')?.textContent || 0),
    time: n.querySelector('time') ? new Date(n.querySelector('time').textContent) : null,
  }));
  const wpts = [...doc.querySelectorAll('wpt')].map(n => ({
    lat: +n.getAttribute('lat'), lon: +n.getAttribute('lon'), name: n.querySelector('name')?.textContent?.trim() || '航點',
  }));
  if (pts.length < 2) throw new Error('軌跡點太少');
  return { pts, wpts, name: doc.querySelector('trk > name, metadata > name')?.textContent?.trim() };
}
// 以距離與爬升估算「上河式」標準步程（分鐘）
const estSh = (km, up, down) => Math.round(1.2 * (20 * km + 0.2 * up + 0.1 * down));
function trackStats(pts, a = 0, b = pts.length - 1) {
  let dist = 0, up = 0, down = 0, moving = 0;
  for (let i = a + 1; i <= b; i++) {
    const p = pts[i - 1], q = pts[i];
    const d = haversine(p.lat, p.lon, q.lat, q.lon); dist += d;
    const dh = q.ele - p.ele; if (dh > 0) up += dh; else down -= dh;
    if (p.time && q.time) { const dt = (q.time - p.time) / 1000; if (dt > 0 && dt < 600 && d / dt > 0.15) moving += dt; }
  }
  const total = pts[a].time && pts[b].time ? (pts[b].time - pts[a].time) / 1000 : 0;
  return { km: dist / 1000, up: Math.round(up), down: Math.round(down), moving: moving / 60, total: total / 60 };
}
function gpxToRoute(text, fallback) {
  const { pts, wpts, name } = parseGpx(text);
  // 節點：起點 + 航點（依沿線順序）或每 ~2km 一段 + 終點
  let nodes = [];
  if (wpts.length) {
    nodes = wpts.map(w => {
      let bi = 0, bd = Infinity;
      pts.forEach((p, i) => { const d = haversine(w.lat, w.lon, p.lat, p.lon); if (d < bd) { bd = d; bi = i; } });
      return { i: bi, name: w.name };
    }).filter(n => n.i > 0 && n.i < pts.length - 1).sort((a, b) => a.i - b.i);
  } else {
    let acc = 0, k = 1;
    for (let i = 1; i < pts.length - 1; i++) {
      acc += haversine(pts[i - 1].lat, pts[i - 1].lon, pts[i].lat, pts[i].lon);
      if (acc >= 2000 * k) { nodes.push({ i, name: `${2 * k}K` }); k++; }
    }
  }
  // 過夜：時間間隔 > 6 小時
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].time && pts[i - 1].time && pts[i].time - pts[i - 1].time > 6 * 3600e3) {
      const ex = nodes.find(n => Math.abs(n.i - (i - 1)) < 5);
      if (ex) ex.camp = true; else nodes.push({ i: i - 1, name: '營地', camp: true });
    }
  }
  nodes.sort((a, b) => a.i - b.i);
  const nameAt = i => { const n = nearestPeak(pts[i].lat, pts[i].lon); return n.dist < 300 ? n.peak.name : null; };
  nodes.forEach(n => { const pk = nameAt(n.i); if (pk && /^\d+K$|^航點$/.test(n.name)) n.name = pk; });
  nodes.push({ i: pts.length - 1, name: '終點' });
  const days = []; let cur = [['起點', 0, 0, 0, 0]], prev = 0;
  nodes.forEach((n, k) => {
    const s = trackStats(pts, prev, n.i);
    cur.push([n.name, estSh(s.km, s.up, s.down), +s.km.toFixed(1), s.up, s.down, n.camp ? 'camp' : '']);
    prev = n.i;
    if (n.camp && k < nodes.length - 1) { days.push(cur); cur = [[n.name, 0, 0, 0, 0]]; }
  });
  days.push(cur);
  const peaks = [...new Set(pts.filter((_, i) => i % 5 === 0)
    .map(p => { const n = nearestPeak(p.lat, p.lon); return n.dist < 150 ? n.peak.name : null; }).filter(Boolean))];
  return { code: nextCode(), name: name || fallback || '匯入路線', desc: 'GPX 匯入（步程為估算）', tags: [], peaks, days };
}

// ── 地圖（樣式沿用「爬山」頁：OSM 底圖＋▲山名標籤，依縮放顯示）──
function renderMap(kind, focus) {
  const big = kind !== 'small';
  const data = big ? PEAKS.map(p => ({ name: p.name, alt: p.alt, lat: p.lat, lng: p.lng, sub: `第 ${p.rank} 名`, sort: p.rank }))
    : SMALL_PEAKS.map(p => ({ name: p.name, alt: p.alt, lat: p.lat, lng: p.lng, sub: (p.n ? `小百岳 #${p.n} · ` : '') + p.region, sort: p.n || 999 }));
  data.sort((a, b) => a.sort - b.sort);
  const doneList = () => big ? st.done : st.doneSmall;
  const inRoutes = big ? new Set(ROUTES.flatMap(r => r.peaks)).size : SMALL_PEAKS.length;
  view().innerHTML = `
    <a class="crumb" href="${big ? '#routes' : '#routes/small'}">‹ 路線</a>
    <div class="page-head"><div><h1 class="page">${big ? '高山百岳總覽' : '台灣小百岳總覽'}</h1>
      <p>點山頭可以標記完登；${big ? '放大地圖會顯示更多山頭。' : '勾選會同步到「爬山」頁的小百岳地圖。'}</p></div>
      <div class="kpis" style="margin:0"><div><small>已完登</small><b id="k-done">${doneList().length} / ${data.length}</b></div>
        <div><small>有內建路線</small><b>${inRoutes} 座</b></div></div></div>
    <div class="layout map-layout">
      <div class="map-wrap"><div id="map"></div>${big ? '<div class="zoom-hint" id="zoom-hint">🔍 放大地圖可看到更多山頭</div>' : ''}</div>
      <aside class="card peak-side"><div class="search">🔍<input id="pq" placeholder="搜尋山名"></div><div class="peak-list" id="plist"></div></aside>
    </div>
    <p class="foot-note">底圖 © OpenStreetMap contributors。座標為近似值。</p>`;
  mapObj = L.map('map', { center: [23.8, 121.0], zoom: big ? 8 : 9 });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(mapObj);
  if (!big) mapObj.setView([25.07, 121.6], 10);

  const markers = {};
  const isGot = p => doneList().includes(p.name);
  const icon = p => L.divIcon({
    className: '',
    html: `<div class="marker-triangle"><span class="tri ${isGot(p) ? 'tri-visited' : 'tri-unvisited'}">▲</span>
      <div class="label-wrap"><span class="lbl-name ${isGot(p) ? 'visited' : ''}">${esc(p.name)}</span><span class="lbl-alt">${p.alt.toLocaleString()}m</span></div></div>`,
    iconSize: [1, 1], iconAnchor: [0, 8],
  });
  const minAlt = z => !big ? 0 : z <= 8 ? 3500 : z <= 9 ? 3300 : z <= 10 ? 3100 : z <= 11 ? 2900 : 0;
  const updateZoom = () => {
    if (!mapObj) return;
    const z = mapObj.getZoom(), m = minAlt(z), hint = $('#zoom-hint');
    if (hint) hint.style.display = z >= 12 ? 'none' : '';
    data.forEach(p => {
      const mk = markers[p.name], show = isGot(p) || p.alt >= m || p.name === focus;
      if (show && !mapObj.hasLayer(mk)) mk.addTo(mapObj);
      if (!show && mapObj.hasLayer(mk)) mk.remove();
    });
  };
  const popup = (p, mk) => {
    const got = isGot(p), div = document.createElement('div');
    div.className = 'popup-inner';
    div.innerHTML = `<div class="popup-title">${esc(p.name)}</div>
      <div class="popup-sub">${esc(p.sub)} · ${p.alt.toLocaleString()} m</div>
      ${got ? '<div class="popup-date">✓ 已完登</div>' : '<div class="popup-sub">尚未完登</div>'}
      <div class="popup-actions"><button class="pbtn ${got ? 'pbtn-danger' : 'pbtn-primary'}">${got ? '取消完登' : '＋ 標記完登'}</button></div>`;
    div.querySelector('button').onclick = () => {
      if (big) { if (!toggleDone(p.name)) return; }
      else st.doneSmall = got ? st.doneSmall.filter(x => x !== p.name) : [...st.doneSmall, p.name];
      mk.setIcon(icon(p)); mk.closePopup(); $('#k-done').textContent = `${doneList().length} / ${data.length}`;
      drawList(); updateZoom();
    };
    return div;
  };
  data.forEach(p => {
    const mk = L.marker([p.lat, p.lng], { icon: icon(p) });
    mk.bindPopup(() => popup(p, mk), { maxWidth: 300 });
    markers[p.name] = mk;
  });
  const flyTo = name => {
    const p = data.find(x => x.name === name), mk = markers[name]; if (!p) return;
    focus = name; mk.addTo(mapObj);
    mapObj.flyTo([p.lat, p.lng], 13, { duration: 0.8 });
    setTimeout(() => mk.openPopup(), 900);
  };
  const drawList = () => {
    const q = $('#pq').value.trim();
    $('#plist').innerHTML = data.filter(p => !q || p.name.includes(q)).map(p => `<div class="peak-row ${isGot(p) ? 'got' : ''}" data-n="${esc(p.name)}">
      <i></i><div class="grow"><div class="nm">${esc(p.name)}</div><div class="mt">${esc(p.sub)} · ${p.alt.toLocaleString()} m</div></div></div>`).join('')
      || '<div class="empty">找不到</div>';
    $('#plist').querySelectorAll('[data-n]').forEach(r => r.onclick = () => flyTo(r.dataset.n));
  };
  $('#pq').oninput = drawList;
  drawList();
  mapObj.on('zoomend', updateZoom);
  updateZoom();
  if (focus && markers[focus]) { const p = data.find(x => x.name === focus); mapObj.setView([p.lat, p.lng], 13); markers[focus].openPopup(); }
  setTimeout(() => mapObj && mapObj.invalidateSize(), 50);
}

// ── 行進（GPS 記錄）──
const rec = { on: false, pts: LS.get('recPts', []), t0: LS.get('recT0', null), watch: null, timer: null, lock: null };
function renderGo() {
  const s = rec.pts.length > 1 ? trackStats(rec.pts.map(p => ({ ...p, time: new Date(p.t) }))) : { km: 0, up: 0, down: 0 };
  const last = rec.pts[rec.pts.length - 1];
  const near = last ? nearestPeak(last.lat, last.lon) : null;
  const el = rec.t0 ? (Date.now() - rec.t0) / 60000 : 0;
  view().innerHTML = `<div class="page-head"><div><h1 class="page">行進記錄</h1><p>用手機 GPS 記錄軌跡，結束後可下載 GPX 或存成路線。</p></div></div>
    <div class="card pad" style="text-align:center;margin-bottom:12px">
      <div class="xs muted">${rec.on ? '● 記錄中' : rec.pts.length ? '已暫停' : '尚未開始'}</div>
      <div class="go-big" id="g-el">${hhmmss(el)}</div>
    </div>
    <div class="go-grid">
      <div class="card"><small>距離</small><b>${s.km.toFixed(2)} km</b></div>
      <div class="card"><small>累計爬升</small><b>↑${s.up} m</b></div>
      <div class="card"><small>目前海拔</small><b>${last?.ele ? Math.round(last.ele) + ' m' : '—'}</b></div>
      <div class="card"><small>最近的百岳</small><b style="font-size:.95rem">${near ? `${near.peak.name} · ${(near.dist / 1000).toFixed(1)}km` : '—'}</b></div>
    </div>
    <div class="row" style="margin-top:16px">
      ${rec.on ? '<button class="btn dark grow" id="g-stop">■ 暫停記錄</button>'
               : `<button class="btn dark grow" id="g-start">◉ ${rec.pts.length ? '繼續記錄' : '開始記錄'}</button>`}
    </div>
    ${rec.pts.length > 1 && !rec.on ? `<div class="row" style="margin-top:10px">
      <button class="btn grow" id="g-gpx">⬇ 下載 GPX</button><button class="btn grow" id="g-route">存成我的路線</button>
      <button class="btn" id="g-clear" style="color:var(--red)">清除</button></div>` : ''}
    <p class="foot-note">使用手機 GPS 記錄軌跡（${rec.pts.length} 個點）。網頁版在螢幕關閉或切到背景時可能暫停記錄，長程請搭配專用 App。資料只存在這台裝置。</p>`;
  if (rec.on && !rec.timer) rec.timer = setInterval(() => { const e = $('#g-el'); if (e && rec.t0) e.textContent = hhmmss((Date.now() - rec.t0) / 60000); else { clearInterval(rec.timer); rec.timer = null; } }, 1000);
  $('#g-start') && ($('#g-start').onclick = startRec);
  $('#g-stop') && ($('#g-stop').onclick = stopRec);
  $('#g-gpx') && ($('#g-gpx').onclick = () => downloadGpx());
  $('#g-route') && ($('#g-route').onclick = () => {
    const r = gpxToRoute(buildGpx(), '行進紀錄 ' + new Date(rec.t0).toLocaleDateString());
    st.custom.push(r); save('custom'); location.hash = '#route/' + encodeURIComponent(r.code);
  });
  $('#g-clear') && ($('#g-clear').onclick = () => { if (!confirm('清除這次記錄？')) return; rec.pts = []; rec.t0 = null; LS.set('recPts', []); LS.set('recT0', null); render(); });
}
const hhmmss = m => { const s = Math.floor(m * 60); return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`; };
async function startRec() {
  if (!navigator.geolocation) { toast('這個瀏覽器不支援定位'); return; }
  rec.on = true; rec.t0 = rec.t0 || Date.now(); LS.set('recT0', rec.t0);
  try { rec.lock = await navigator.wakeLock?.request('screen'); } catch {}
  rec.watch = navigator.geolocation.watchPosition(pos => {
    const c = pos.coords, last = rec.pts[rec.pts.length - 1];
    if (c.accuracy > 60) return;
    if (last && haversine(last.lat, last.lon, c.latitude, c.longitude) < 5) return;
    rec.pts.push({ lat: c.latitude, lon: c.longitude, ele: c.altitude || 0, t: pos.timestamp });
    LS.set('recPts', rec.pts);
    if (location.hash === '#go') renderGo();
  }, e => toast('定位失敗：' + e.message), { enableHighAccuracy: true, maximumAge: 5000 });
  render();
}
function stopRec() {
  rec.on = false; navigator.geolocation.clearWatch(rec.watch); rec.lock?.release?.(); rec.lock = null;
  render();
}
function buildGpx() {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Cworld 爬山2" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>行進紀錄</name><trkseg>\n` +
    rec.pts.map(p => `<trkpt lat="${p.lat}" lon="${p.lon}"><ele>${p.ele.toFixed(1)}</ele><time>${new Date(p.t).toISOString()}</time></trkpt>`).join('\n') +
    `\n</trkseg></trk></gpx>`;
}
function downloadGpx() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([buildGpx()], { type: 'application/gpx+xml' }));
  a.download = `track-${new Date(rec.t0).toISOString().slice(0, 10)}.gpx`; a.click();
}

// ── 完百 ──
function renderDone() {
  const n = st.done.length;
  view().innerHTML = `<div class="page-head"><div><h1 class="page">我的完百計畫</h1>
      <p>完登紀錄跟「爬山」頁共用：那邊新增的紀錄會出現在這裡，這裡登頂或補登的山也會同步過去。</p></div></div>
    <div class="layout"><aside class="side"><div class="card pad">
      <div class="small muted">已完登</div>
      <div class="big-num">${n} <small>/ 100 座</small></div>
      <div class="bar light"><i style="width:${n}%"></i></div>
      <canvas id="poster" style="width:100%;height:auto;border-radius:6px;border:1px solid var(--line)"></canvas>
      <button class="btn dark block" id="poster-dl" style="margin-top:12px">⬇ 下載完百海報</button>
    </div></aside>
    <section>
      <div class="tools">
        <label class="action-card dashed" style="cursor:pointer"><b>📷 登頂相機</b>
          <p>依照片或 GPS 找出最近的百岳，印上「▲ 山名・海拔・編號」戳記並記錄完登。</p>
          <input type="file" accept="image/*" capture="environment" id="cam" hidden></label>
        <label class="action-card dashed" style="cursor:pointer"><b>🖼️ 匯入以前爬過的照片</b>
          <p>選取有 GPS 的照片，找出在哪些百岳拍過，一次補上完登。</p>
          <input type="file" accept="image/jpeg" multiple id="old-photos" hidden></label>
        <a class="action-card dashed" href="#map/big"><b>🗺️ 百岳總覽地圖</b>
          <p>在地圖上看哪些山登過、哪些還沒，點山頭可以補登。</p></a>
      </div>
      <h2 class="h-serif" style="margin-top:0">🏅 完百集章 <span class="xs muted" style="font-family:var(--sans)">點格子可以補登或取消</span></h2>
      <div class="grid100 light">${PEAKS.slice(0, 100).map(p => `<button class="${st.done.includes(p.name) ? 'got' : ''}" data-p="${esc(p.name)}">
        <small>No.${p.rank}</small>${esc(p.name)}<small>${p.alt}m</small></button>`).join('')}</div>
    </section></div>`;
  drawPoster($('#poster'), 2);
  $('#poster-dl').onclick = () => {
    const cv = document.createElement('canvas'); drawPoster(cv, 5);
    const a = document.createElement('a'); a.href = cv.toDataURL('image/png'); a.download = '完百計畫.png'; a.click();
  };
  const stay = fn => async (...args) => { const y = scrollY; await fn(...args); renderDone(); scrollTo(0, y); };
  view().querySelectorAll('[data-p]').forEach(b => b.onclick = stay(() => toggleDone(b.dataset.p)));
  $('#old-photos').onchange = stay(async e => toast(await importPhotos([...e.target.files])));
  $('#cam').onchange = e => e.target.files[0] && summitCamera(e.target.files[0]);
}

function drawPoster(cv, scale = 1) {
  const W = cv.width = 240 * scale, H = cv.height = 340 * scale, g = cv.getContext('2d');
  g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, W, H);
  const x = lng => (lng - 119.9) / (122.1 - 119.9) * W * 0.86 + W * 0.07;
  const y = lat => (25.4 - lat) / (25.4 - 21.8) * H * 0.78 + H * 0.12;
  g.fillStyle = '#222'; g.font = `700 ${14 * scale}px ${getComputedStyle(document.body).fontFamily}`;
  g.fillText('我的完百計畫', 12 * scale, 22 * scale);
  g.font = `${9 * scale}px sans-serif`; g.fillStyle = '#777';
  g.fillText(`完登 ${st.done.length} / 100`, 12 * scale, 36 * scale);
  PEAKS.forEach(p => {
    const got = st.done.includes(p.name);
    g.beginPath(); g.arc(x(p.lng), y(p.lat), (got ? 3.2 : 2.2) * scale, 0, 7);
    g.fillStyle = got ? '#d4891c' : '#9a9a9a'; g.fill();
  });
}

// EXIF GPS 讀取（JPEG）
async function exifGps(file) {
  const buf = await file.slice(0, 256 * 1024).arrayBuffer(); const v = new DataView(buf);
  if (v.getUint16(0) !== 0xFFD8) return null;
  let o = 2;
  while (o < v.byteLength - 4) {
    const mk = v.getUint16(o), len = v.getUint16(o + 2);
    if (mk === 0xFFE1 && v.getUint32(o + 4) === 0x45786966) {
      const t = o + 10, le = v.getUint16(t) === 0x4949;
      const u16 = p => v.getUint16(t + p, le), u32 = p => v.getUint32(t + p, le);
      const ifd = (p, want) => { const n = u16(p), out = {}; for (let i = 0; i < n; i++) { const e = p + 2 + i * 12, tag = u16(e); if (want.includes(tag)) out[tag] = e; } return out; };
      const i0 = ifd(u32(4), [0x8825]); if (!i0[0x8825]) return null;
      const g = ifd(u32(i0[0x8825] + 8), [1, 2, 3, 4]); if (!g[2] || !g[4]) return null;
      const rat = e => { const p = u32(e + 8); let r = 0; for (let k = 0; k < 3; k++) r += (u32(p + k * 8) / u32(p + k * 8 + 4)) / [1, 60, 3600][k]; return r; };
      let lat = rat(g[2]), lng = rat(g[4]);
      if (g[1] && String.fromCharCode(v.getUint8(t + g[1] + 8)) === 'S') lat = -lat;
      if (g[3] && String.fromCharCode(v.getUint8(t + g[3] + 8)) === 'W') lng = -lng;
      return isFinite(lat) && isFinite(lng) ? { lat, lng } : null;
    }
    o += 2 + len;
  }
  return null;
}
async function importPhotos(files) {
  let withGps = 0; const hits = [];
  for (const f of files) {
    try {
      const g = await exifGps(f); if (!g) continue; withGps++;
      const n = nearestPeak(g.lat, g.lng); if (n.dist < 300) hits.push(n.peak.name);
    } catch {}
  }
  const added = markDone([...new Set(hits)]);
  return `讀了 ${files.length} 張，${withGps} 張有 GPS，新增完登 ${added.length} 座${added.length ? '：' + added.join('、') : ''}`;
}

async function summitCamera(file) {
  let pos = await exifGps(file).catch(() => null);
  if (!pos && navigator.geolocation) {
    pos = await new Promise(res => navigator.geolocation.getCurrentPosition(p => res({ lat: p.coords.latitude, lng: p.coords.longitude }), () => res(null), { enableHighAccuracy: true, timeout: 12000 }));
  }
  const n = pos ? nearestPeak(pos.lat, pos.lng) : null;
  const ok = n && n.dist < 300;
  const img = await createImageBitmap(file);
  const cv = document.createElement('canvas'), sc = Math.min(1, 1600 / Math.max(img.width, img.height));
  cv.width = img.width * sc; cv.height = img.height * sc;
  const g = cv.getContext('2d'); g.drawImage(img, 0, 0, cv.width, cv.height);
  const fs = cv.width / 18;
  g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, cv.height - fs * 3.2, cv.width, fs * 3.2);
  g.fillStyle = '#fff'; g.font = `700 ${fs}px sans-serif`;
  g.fillText(ok ? `▲ ${n.peak.name}　${n.peak.alt}m` : '▲ 未在百岳附近', fs * .6, cv.height - fs * 1.7);
  g.font = `${fs * .45}px sans-serif`;
  g.fillText(`${ok ? '百岳 No.' + n.peak.rank + '　' : ''}${new Date().toLocaleDateString()}${pos ? `　${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}` : ''}`, fs * .6, cv.height - fs * .8);
  if (ok) markDone([n.peak.name]);
  const url = cv.toDataURL('image/jpeg', .9);
  modal(`<b>${ok ? '登頂！已記錄 ' + esc(n.peak.name) : '找不到附近的百岳'}</b>
    ${!ok && n ? `<p class="xs muted">最近的是 ${esc(n.peak.name)}（${(n.dist / 1000).toFixed(1)} km）</p>` : ''}
    <img src="${url}" style="width:100%;margin:10px 0;border-radius:4px">
    <a class="btn dark block" href="${url}" download="${ok ? n.peak.name : 'summit'}.jpg">⬇ 存照片</a>`);
  render();
}

// ── 我的係數 ──
function recCoef(r) {
  const sh = r.days.reduce((a, d) => a + d.sh, 0), act = r.days.reduce((a, d) => a + d.actual * 60, 0), rest = r.days.reduce((a, d) => a + (d.rest || 0), 0);
  return { coef: sh ? (act - rest) / sh : 0, rest: act - rest > 0 ? rest / (act - rest) * 60 : 0 };
}
function renderCoef() {
  const by = gear => st.records.filter(r => r.gear === gear).map(recCoef);
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  const hv = avg(by('重裝').map(c => c.coef)), lt = avg(by('輕裝').map(c => c.coef));
  const rs = avg(st.records.map(recCoef).map(c => c.rest).filter(x => x > 0));
  const c = st.coef;
  view().innerHTML = `<div class="page-head"><div><h1 class="page">我的係數</h1>
      <p>用過去的紀錄算出自己的上河係數與休息比例，新行程會自動套用。</p></div></div>
    <div class="card pad">
      <div class="xs muted" style="margin-bottom:8px">新行程的預設值</div>
      <div class="stats" style="margin:0;grid-template-columns:repeat(4,1fr)">
        <div><small>重裝</small><b>${c.heavy.toFixed(2)}</b></div><div><small>輕裝</small><b>${(c.same ? c.heavy : c.light).toFixed(2)}</b></div>
        <div><small>休息</small><b>${Math.round(c.rest)}分/時</b></div><div><small>掉速</small><b>${c.fatigue}%</b></div></div>
      ${st.records.length ? `<p class="xs muted" style="margin-top:12px;line-height:1.6">依 ${st.records.length} 筆紀錄算出：重裝 ${hv?.toFixed(2) ?? '—'}、輕裝 ${lt?.toFixed(2) ?? '—'}、休息 ${rs ? Math.round(rs) : '—'} 分/時</p>
        <button class="btn dark block" id="apply" style="margin-top:8px">套用為新行程預設</button>` : ''}
    </div>

    <div class="two-col"><div>
    <h2 class="h-serif">方法 A：用 GPX 軌跡估算</h2>
    <p class="xs muted" style="line-height:1.7;margin-bottom:8px">選一個有時間紀錄的 GPX，用距離與爬升估算標準步程，再跟實際移動時間比較。</p>
    <label class="btn" style="cursor:pointer">選擇 GPX 檔…<input type="file" accept=".gpx" id="c-gpx" hidden></label>
    <div id="c-gpx-out"></div>

    </div><div>
    <h2 class="h-serif">方法 B：手動輸入爬過的百岳</h2>
    <p class="xs muted" style="line-height:1.7;margin-bottom:8px">填上河總時間與你實際花的時間。知道休息多久就填，不知道會依預設休息比例扣掉。多日行程分天填。</p>
    <div class="card pad">
      <div class="field"><label>行程名稱</label><input id="c-name" placeholder="例：雪山主東"></div>
      <div class="field"><label>日期</label><input type="date" id="c-date" value="${new Date().toISOString().slice(0, 10)}"></div>
      <div class="field"><label>裝備</label><select id="c-gear"><option>重裝</option><option>輕裝</option></select></div>
      <div class="field"><label>天數</label><select id="c-days">${[1, 2, 3, 4, 5, 6, 7].map(d => `<option>${d}</option>`).join('')}</select></div>
      <div class="day-in xs muted"><span></span><span>上河</span><span>實際</span><span>休息</span></div>
      <div id="c-rows"></div>
      <button class="btn dark" id="c-add" style="margin-top:8px">新增紀錄</button>
    </div>

    </div></div>
    <h2 class="h-serif">我的紀錄（${st.records.length}）</h2>
    <div class="list cards">${st.records.map((r, i) => { const k = recCoef(r); return `<div class="item"><div class="grow">
      <div class="t">${esc(r.name)} <span class="tag">${r.gear}</span></div>
      <div class="s">${r.date} · ${r.days.length} 天 · 係數 ${k.coef.toFixed(2)} · 休息 ${Math.round(k.rest)} 分/時</div></div>
      <button class="muted" data-rm="${i}" style="padding:6px">×</button></div>`; }).join('') || '<div class="empty">還沒有紀錄</div>'}</div>`;

  const rowsEl = $('#c-rows');
  const drawRows = () => { rowsEl.innerHTML = Array.from({ length: +$('#c-days').value }, (_, i) => `<div class="day-in"><b class="small">D${i + 1}</b>
    <input type="number" placeholder="分" data-sh><input type="number" step="0.1" placeholder="小時" data-act><input type="number" placeholder="分（選填）" data-rest></div>`).join(''); };
  drawRows(); $('#c-days').onchange = drawRows;
  $('#c-add').onclick = () => {
    const days = [...rowsEl.children].map(d => ({ sh: +d.querySelector('[data-sh]').value, actual: +d.querySelector('[data-act]').value, rest: d.querySelector('[data-rest]').value === '' ? null : +d.querySelector('[data-rest]').value }));
    if (days.some(d => !d.sh || !d.actual)) { toast('每天都要填上河和實際時間'); return; }
    days.forEach(d => { if (d.rest === null) d.rest = Math.round(d.actual * 60 * st.coef.rest / (60 + st.coef.rest)); });
    st.records.unshift({ name: $('#c-name').value.trim() || '未命名', date: $('#c-date').value, gear: $('#c-gear').value, days });
    save('records'); render();
  };
  view().querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { st.records.splice(+b.dataset.rm, 1); save('records'); render(); });
  $('#apply') && ($('#apply').onclick = () => {
    if (hv) st.coef.heavy = +hv.toFixed(2);
    if (lt) { st.coef.light = +lt.toFixed(2); st.coef.same = false; }
    if (rs) st.coef.rest = Math.round(rs);
    save('coef'); toast('已套用，新行程會用這組係數'); render();
  });
  $('#c-gpx').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const { pts } = parseGpx(await f.text());
      if (!pts[0].time) throw new Error('這個 GPX 沒有時間紀錄');
      const s = trackStats(pts), sh = estSh(s.km, s.up, s.down);
      const coef = s.moving / sh, rest = s.total - s.moving;
      $('#c-gpx-out').innerHTML = `<div class="card pad" style="margin-top:10px">
        <div class="stats" style="margin:0">
          <div><small>距離</small><b>${s.km.toFixed(1)} km</b></div><div><small>爬升</small><b>↑${s.up}</b></div><div><small>估算上河</small><b>${sh} 分</b></div>
          <div><small>總時間</small><b>${dur(s.total)}</b></div><div><small>移動時間</small><b>${dur(s.moving)}</b></div><div><small>估算係數</small><b>${coef.toFixed(2)}</b></div></div>
        <button class="btn dark block" id="c-gpx-save" style="margin-top:12px">存成一筆紀錄</button></div>`;
      $('#c-gpx-save').onclick = () => {
        st.records.unshift({ name: f.name.replace(/\.gpx$/i, ''), date: pts[0].time.toISOString().slice(0, 10), gear: '重裝', days: [{ sh, actual: s.total / 60, rest: Math.round(rest) }] });
        save('records'); render();
      };
    } catch (err) { $('#c-gpx-out').innerHTML = `<p class="warn">${esc(err.message)}</p>`; }
  };
}

render();
const refresh = () => { if (!document.querySelector('.dark-sheet, .modal') && !/^#(trip|builder|coef|go)/.test(location.hash)) render(); };
if (window.HikeSync) HikeSync.onReady(() => { migrate(); refresh(); }); else migrate();
window.addEventListener('storage', e => { if (e.key === 'hikeRecords' || e.key === 'peaksSmallDone') refresh(); });
