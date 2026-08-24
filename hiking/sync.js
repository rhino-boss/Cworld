/* ============================================================
   登山紀錄雲端同步（GitHub 當資料庫）
   - 讀取：任何人都能讀 hiking/records.json（公開、免 token）
   - 寫入：需要 GitHub Personal Access Token（存在瀏覽器 localStorage）
   - 照片：以 data URL 進來，push 時上傳到 hiking/images/ 並改存路徑
   注意：Cworld 是 public repo，同步上去的紀錄與照片都是公開可見的。
   ============================================================ */
(function () {
  const GH = {
    owner: 'rhino-boss',
    repo: 'Cworld',
    branch: 'main',
    dataFile: 'hiking/records.json',
    imgDir: 'hiking/images',
  };
  const KEY = 'hikeRecords';
  const RAW = `https://raw.githubusercontent.com/${GH.owner}/${GH.repo}/${GH.branch}/${GH.dataFile}`;
  const API = `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents`;

  let sha = null;              // records.json 目前的 blob sha，PUT 時要帶
  let pushTimer = null;
let ready = false;          // 初次 pull 完成前禁止上傳
let remoteCount = 0;        // 雲端目前筆數，用來擋掉誤刪
  let pushing = false;
  const readyCbs = [];

  const token = () => localStorage.getItem('gh_token') || '';
  const headers = () => {
    const h = { Accept: 'application/vnd.github+json' };
    if (token()) h.Authorization = `Bearer ${token()}`;
    return h;
  };
  const b64 = str => btoa(String.fromCharCode(...new TextEncoder().encode(str)));

  function status(msg, kind) {
    const el = document.getElementById('sync-status');
    if (el) { el.textContent = msg; el.dataset.kind = kind || ''; }
  }

  /* ── 讀：把雲端資料寫回 localStorage ── */
  async function pull() {
    try {
      const res = await fetch(`${RAW}?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          remoteCount = data.length;
          localStorage.setItem(KEY, JSON.stringify(data), { fromSync: true });
          status(`已同步（${data.length} 筆）`, 'ok');
        }
      } else if (res.status === 404) {
        status('雲端尚無資料', '');
      }
      // 取 sha 供之後覆寫用（404 代表檔案還不存在，第一次 push 不必帶 sha）
      const meta = await fetch(`${API}/${GH.dataFile}?ref=${GH.branch}`, { headers: headers() });
      sha = meta.ok ? (await meta.json()).sha : null;
    } catch (e) {
      status('讀取雲端失敗，顯示本機資料', 'err');
    }
    ready = true;
    readyCbs.forEach(cb => { try { cb(); } catch (e) { console.error(e); } });
  }

  /* ── 照片：data URL → 上傳成檔案，回傳相對路徑 ── */
  async function uploadPhoto(dataUrl, name) {
    const m = /^data:(image\/[a-z+]+);base64,(.*)$/i.exec(dataUrl);
    if (!m) return dataUrl;
    const ext = (m[1].split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    const path = `${GH.imgDir}/${name}.${ext}`;
    const res = await fetch(`${API}/${path}`, {
      method: 'PUT',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `hiking: add photo ${name}`, content: m[2], branch: GH.branch }),
    });
    // 422 通常代表同名檔已存在（重推同一筆紀錄），直接沿用既有路徑
    if (!res.ok && res.status !== 422) throw new Error(`照片上傳失敗 HTTP ${res.status}`);
    return `images/${name}.${ext}`;
  }

  /* ── 寫：上傳照片後覆寫 records.json ── */
  async function push() {
    if (!token()) { status('未設定 Token，僅存本機', ''); return; }
    if (pushing) { schedulePush(); return; }
    pushing = true;
    status('同步中…', '');
    try {
      const records = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (records.length === 0 && remoteCount > 0) {   // 防止把雲端資料清空
        status('本機無資料，改為重新讀取雲端', 'err');
        pushing = false;
        return pull();
      }

      // 先把還是 data URL 的照片上傳成檔案，避免 records.json 被 base64 撐爆
      for (const r of records) {
        if (!Array.isArray(r.photos)) continue;
        for (let i = 0; i < r.photos.length; i++) {
          if (typeof r.photos[i] === 'string' && r.photos[i].startsWith('data:')) {
            r.photos[i] = await uploadPhoto(r.photos[i], `${r.id || 'rec'}_${i}`);
          }
        }
      }
      localStorage.setItem(KEY, JSON.stringify(records), { fromSync: true });

      const body = {
        message: `hiking: update records (${records.length})`,
        content: b64(JSON.stringify(records, null, 2)),
        branch: GH.branch,
      };
      if (sha) body.sha = sha;

      const res = await fetch(`${API}/${GH.dataFile}`, {
        method: 'PUT',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 409) {           // 別台裝置剛好也寫過 → 重抓 sha 再試一次
        const meta = await fetch(`${API}/${GH.dataFile}?ref=${GH.branch}`, { headers: headers() });
        sha = meta.ok ? (await meta.json()).sha : null;
        pushing = false;
        return push();
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      sha = (await res.json()).content.sha;
      status(`已同步（${records.length} 筆）`, 'ok');
    } catch (e) {
      status(`同步失敗：${e.message}`, 'err');
    } finally {
      pushing = false;
    }
  }

  function schedulePush() {
  if (!ready) return;        // 還沒讀完雲端資料，先不要覆蓋
    clearTimeout(pushTimer);
    pushTimer = setTimeout(push, 800);   // 連續多次寫入只推一次
  }

  /* ── 攔截既有的 localStorage 寫入，資料一改就自動上傳 ── */
  const origSet = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function (k, v, opts) {
    origSet(k, v);
    if (k === KEY && !(opts && opts.fromSync)) schedulePush();
  };

  window.HikeSync = {
    pull, push,
    onReady(cb) { readyCbs.push(cb); },
    hasToken: () => !!token(),
    setToken() {
      const t = prompt('貼上 GitHub Personal Access Token（需要 Cworld 的 repo 寫入權限）\n留空可清除：', token());
      if (t === null) return;
      if (t.trim()) localStorage.setItem('gh_token', t.trim());
      else localStorage.removeItem('gh_token');
      status(t.trim() ? 'Token 已儲存' : 'Token 已清除', '');
      if (t.trim()) push();
    },
  };

  /* ── 右下角同步狀態列（所有引入 sync.js 的頁面都會出現） ── */
  function mountUI() {
    if (document.getElementById('sync-bar')) return;
    const css = document.createElement('style');
    css.textContent = [
      "#sync-bar{position:fixed;right:14px;bottom:14px;z-index:5000;display:flex;align-items:center;gap:8px;",
      "background:rgba(255,255,255,.96);border:1px solid #e0e0dc;border-radius:99px;padding:6px 8px 6px 14px;",
      "box-shadow:0 4px 16px rgba(0,0,0,.12);font-size:.76rem;color:#6b6b6b;",
      "font-family:'Helvetica Neue','PingFang TC','Microsoft JhengHei',sans-serif}",
      "#sync-status[data-kind=ok]{color:#2d6a4f;font-weight:600}",
      "#sync-status[data-kind=err]{color:#c0392b;font-weight:600}",
      "#sync-token{border:0;background:#1a4731;color:#fff;font:inherit;font-weight:700;",
      "padding:5px 12px;border-radius:99px;cursor:pointer}",
      "#sync-token:hover{background:#2d6a4f}",
      "@media (max-width:640px){#sync-bar{right:8px;bottom:8px;font-size:.72rem}}",
    ].join('');
    document.head.appendChild(css);

    const bar = document.createElement('div');
    bar.id = 'sync-bar';
    const st = document.createElement('span');
    st.id = 'sync-status';
    st.textContent = '讀取雲端資料…';
    const btn = document.createElement('button');
    btn.id = 'sync-token';
    btn.type = 'button';
    btn.textContent = '☁ 同步設定';
    btn.addEventListener('click', () => window.HikeSync.setToken());
    bar.appendChild(st);
    bar.appendChild(btn);
    document.body.appendChild(bar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountUI);
  else mountUI();

  pull();
})();
