/* ============================================================
   槍劍縱走：跨裝置同步（GitHub 當資料庫）
   - 讀取：任何人都能讀 travel/japan-alps-2026/data.json（公開、免 token）
   - 寫入：需要 GitHub Personal Access Token（存在瀏覽器 localStorage）
   同步內容：勾選、清單、可編輯文字、住宿狀態
   不同步：各區塊展開狀態、檢視／編輯模式（屬於各裝置自己的偏好）
   ============================================================ */
(function () {
  const GH = {
    owner: 'rhino-boss',
    repo: 'Cworld',
    branch: 'main',
    dataFile: 'travel/japan-alps-2026/data.json',
  };
  const PREFIX = 'alps26.';
  const SKIP = ['alps26.open', 'alps26.mode'];
  const RAW = `https://raw.githubusercontent.com/${GH.owner}/${GH.repo}/${GH.branch}/${GH.dataFile}`;
  const API = `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents`;

  let sha = null;
  let pushTimer = null;
  let ready = false;        // 初次 pull 完成前禁止上傳
  let remoteCount = 0;      // 雲端目前項目數，用來擋掉誤刪
  let pushing = false;

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

  // 目前這台裝置上要同步的資料
  function snapshot() {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(PREFIX) && !SKIP.includes(k)) out[k] = localStorage.getItem(k);
    }
    return out;
  }

  const origSet = localStorage.setItem.bind(localStorage);
  const origRemove = localStorage.removeItem.bind(localStorage);

  /* ── 讀：雲端資料覆蓋本機，內容有變就重新整理一次 ── */
  async function pull() {
    try {
      const res = await fetch(`${RAW}?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const remote = await res.json();
        remoteCount = Object.keys(remote).length;
        const local = snapshot();
        let changed = false;
        for (const [k, v] of Object.entries(remote)) {
          if (local[k] !== v) { origSet(k, v); changed = true; }
        }
        for (const k of Object.keys(local)) {
          if (!(k in remote)) { origRemove(k); changed = true; }
        }
        status(`已同步（${Object.keys(remote).length} 項）`, 'ok');
        // 頁面在載入時就讀過 localStorage，資料有變要重畫一次
        if (changed && !sessionStorage.getItem('alps26.reloaded')) {
          sessionStorage.setItem('alps26.reloaded', '1');
          location.reload();
          return;
        }
      } else if (res.status === 404) {
        status('雲端尚無資料', '');
      }
      const meta = await fetch(`${API}/${GH.dataFile}?ref=${GH.branch}`, { headers: headers() });
      sha = meta.ok ? (await meta.json()).sha : null;
    } catch (e) {
      status('讀取雲端失敗，顯示本機資料', 'err');
    }
    ready = true;
  }

  /* ── 寫 ── */
  async function push() {
    if (!token()) { status('未設定 Token，僅存本機', ''); return; }
    if (pushing) { schedulePush(); return; }
    pushing = true;
    status('同步中…', '');
    try {
      const data = snapshot();
      if (Object.keys(data).length === 0 && remoteCount > 0) {   // 防止把雲端資料清空
        status('本機無資料，改為重新讀取雲端', 'err');
        pushing = false;
        return pull();
      }
      const body = {
        message: 'alps26: update trip data',
        content: b64(JSON.stringify(data, null, 2)),
        branch: GH.branch,
      };
      if (sha) body.sha = sha;
      const res = await fetch(`${API}/${GH.dataFile}`, {
        method: 'PUT',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 409) {            // 另一台剛好也寫過 → 重抓 sha 再試
        const meta = await fetch(`${API}/${GH.dataFile}?ref=${GH.branch}`, { headers: headers() });
        sha = meta.ok ? (await meta.json()).sha : null;
        pushing = false;
        return push();
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      sha = (await res.json()).content.sha;
      status(`已同步（${Object.keys(data).length} 項）`, 'ok');
    } catch (e) {
      status(`同步失敗：${e.message}`, 'err');
    } finally {
      pushing = false;
    }
  }

  function schedulePush() {
    if (!ready) return;      // 還沒讀完雲端資料，先不要覆蓋
    clearTimeout(pushTimer);
    pushTimer = setTimeout(push, 1000);
  }

  /* ── 任何本機寫入都排一次上傳 ── */
  localStorage.setItem = function (k, v) {
    origSet(k, v);
    if (k.startsWith(PREFIX) && !SKIP.includes(k)) schedulePush();
  };
  localStorage.removeItem = function (k) {
    origRemove(k);
    if (k.startsWith(PREFIX) && !SKIP.includes(k)) schedulePush();
  };

  /* ── 右下角狀態列 ── */
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
      "#sync-token{border:0;background:#112840;color:#fff;font:inherit;font-weight:700;",
      "padding:5px 12px;border-radius:99px;cursor:pointer}",
      "#sync-token:hover{background:#1e4a7a}",
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
    btn.addEventListener('click', () => window.AlpsSync.setToken());
    bar.appendChild(st);
    bar.appendChild(btn);
    document.body.appendChild(bar);
  }

  window.AlpsSync = {
    pull, push,
    setToken() {
      const t = prompt('貼上 GitHub Personal Access Token（需要 Cworld 的 Contents 讀寫權限）\n留空可清除：', token());
      if (t === null) return;
      if (t.trim()) localStorage.setItem('gh_token', t.trim());
      else localStorage.removeItem('gh_token');
      status(t.trim() ? 'Token 已儲存' : 'Token 已清除', '');
      if (t.trim()) push();
    },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountUI);
  else mountUI();
  pull();
})();
