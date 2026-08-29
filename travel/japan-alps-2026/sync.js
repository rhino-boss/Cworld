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
  let dirtyTimer = null;
  let ready = false;        // 初次 pull 完成前禁止上傳
  let remoteCount = 0;      // 雲端目前項目數，用來擋掉誤刪
  let pushing = false;
  let syncedJSON = null;    // 上次與雲端一致時的內容，用來判斷有沒有未上傳的變更

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
  async function pull(opts) {
    const manual = !!(opts && opts.manual);
    if (manual) status('讀取中…', '');
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
        syncedJSON = JSON.stringify(snapshot());
        status(changed ? '已更新' : '已是最新', 'ok');
        // 頁面在載入時就讀過 localStorage，資料有變要重畫一次
        // 手動按「更新」是使用者主動觸發，不受每回合只重整一次的限制
        if (changed && (manual || !sessionStorage.getItem('alps26.reloaded'))) {
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
  async function push(opts) {
    const manual = !!(opts && opts.manual);
    if (!token()) { status('未設定 Token，僅存本機', ''); return; }
    // 還沒讀完雲端就上傳，可能拿舊的本機資料蓋掉雲端
    if (!ready) { status('正在讀取雲端，請稍候再上傳', ''); return; }
    if (pushing) return;
    pushing = true;
    status('上傳中…', '');
    try {
      const data = snapshot();
      if (Object.keys(data).length === 0 && remoteCount > 0) {   // 防止把雲端資料清空
        status('本機無資料，改為重新讀取雲端', 'err');
        pushing = false;
        return pull();
      }
      // 上傳前先確認雲端沒有被別台裝置改過，避免蓋掉對方的變更
      const chk = await fetch(`${API}/${GH.dataFile}?ref=${GH.branch}`, { headers: headers() });
      if (chk.ok) {
        const remoteSha = (await chk.json()).sha;
        if (sha && remoteSha !== sha) {
          const ok = confirm(
            '雲端有其他裝置上傳的較新資料。\n\n' +
            '按「確定」＝用這台裝置的資料覆蓋雲端（對方的變更會不見）\n' +
            '按「取消」＝先不要上傳，建議改按「↓ 更新」把雲端資料抓下來'
          );
          if (!ok) { status('已取消上傳', ''); pushing = false; return; }
        }
        sha = remoteSha;
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
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      sha = (await res.json()).content.sha;
      remoteCount = Object.keys(data).length;
      syncedJSON = JSON.stringify(data);
      status('已上傳', 'ok');
      refreshDirty();
    } catch (e) {
      status(`上傳失敗：${e.message}`, 'err');
    } finally {
      pushing = false;
    }
  }

  /* ── 本機有沒有還沒上傳的變更 ── */
  function isDirty() {
    return ready && syncedJSON !== null && JSON.stringify(snapshot()) !== syncedJSON;
  }
  function refreshDirty() {
    const btn = document.getElementById('sync-push');
    const dirty = isDirty();
    if (btn) btn.classList.toggle('dirty', dirty);
    if (dirty) status('有未上傳的變更', 'warn');
  }
  function scheduleDirty() {
    clearTimeout(dirtyTimer);
    dirtyTimer = setTimeout(refreshDirty, 300);
  }

  /* ── 本機寫入只標記「有變更」，不再自動上傳 ──
     自動上傳會讓開著的舊分頁把別台裝置剛上傳的資料蓋掉，
     所以改成一定要自己按「↑ 上傳」。 */
  localStorage.setItem = function (k, v) {
    origSet(k, v);
    if (k.startsWith(PREFIX) && !SKIP.includes(k)) scheduleDirty();
  };
  localStorage.removeItem = function (k) {
    origRemove(k);
    if (k.startsWith(PREFIX) && !SKIP.includes(k)) scheduleDirty();
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
      "#sync-status[data-kind=warn]{color:#b3621e;font-weight:600}",
      "#sync-push.dirty{background:#c2601c;animation:syncpulse 1.6s ease-in-out infinite}",
      "#sync-push.dirty:not(:disabled):hover{background:#a95214}",
      "@keyframes syncpulse{0%,100%{box-shadow:0 0 0 0 rgba(194,96,28,.55)}50%{box-shadow:0 0 0 5px rgba(194,96,28,0)}}",
      "@media (prefers-reduced-motion:reduce){#sync-push.dirty{animation:none}}",
      "#sync-bar button{border:0;font:inherit;font-weight:700;padding:5px 12px;",
      "border-radius:99px;cursor:pointer;white-space:nowrap}",
      "#sync-bar button:disabled{opacity:.45;cursor:default}",
      "#sync-pull{background:#fff;color:#112840;box-shadow:inset 0 0 0 1px #c9ced6}",
      "#sync-pull:not(:disabled):hover{background:#eef1f5}",
      "#sync-push{background:#112840;color:#fff}",
      "#sync-push:not(:disabled):hover{background:#1e4a7a}",
      "#sync-token{background:transparent;color:#8a8a84;padding:5px 7px;font-size:.95em}",
      "#sync-token:hover{color:#112840}",
      "@media (max-width:640px){#sync-bar{right:8px;bottom:8px;font-size:.72rem;gap:5px;padding:6px 6px 6px 10px}",
      "#sync-bar button{padding:5px 9px}}",
    ].join('');
    document.head.appendChild(css);

    const bar = document.createElement('div');
    bar.id = 'sync-bar';
    const st = document.createElement('span');
    st.id = 'sync-status';
    st.textContent = '讀取雲端資料…';

    const mk = (id, label, title, fn) => {
      const b = document.createElement('button');
      b.id = id; b.type = 'button'; b.textContent = label; b.title = title;
      b.addEventListener('click', fn);
      return b;
    };
    const bPull = mk('sync-pull', '↓ 更新', '從雲端抓最新資料蓋掉這台裝置',
      async () => {
        if (isDirty() && !confirm(
          '這台裝置有還沒上傳的變更。\n\n' +
          '按「確定」＝抓雲端資料下來，這些變更會不見\n' +
          '按「取消」＝先按「↑ 上傳」把變更存上去'
        )) { status('已取消更新', ''); return; }
        await busy(() => pull({ manual: true }));
      });
    const bPush = mk('sync-push', '↑ 上傳', '把這台裝置的資料存回雲端',
      async () => { await busy(() => push({ manual: true })); });
    const bCfg = mk('sync-token', '⚙', '設定 GitHub Token',
      () => window.AlpsSync.setToken());

    async function busy(fn) {
      bPull.disabled = bPush.disabled = true;
      try { await fn(); } finally { bPull.disabled = bPush.disabled = false; refreshDirty(); }
    }

    // 有未上傳的變更就別讓它默默關掉
    window.addEventListener('beforeunload', e => {
      if (isDirty()) { e.preventDefault(); e.returnValue = ''; }
    });

    bar.appendChild(st);
    bar.appendChild(bPull);
    bar.appendChild(bPush);
    bar.appendChild(bCfg);
    document.body.appendChild(bar);
  }

  window.AlpsSync = {
    pull, push,
    setToken() {
      const t = prompt('貼上 GitHub Personal Access Token（需要 Cworld 的 Contents 讀寫權限）\n留空可清除：', token());
      if (t === null) return;
      if (t.trim()) localStorage.setItem('gh_token', t.trim());
      else localStorage.removeItem('gh_token');
      status(t.trim() ? 'Token 已儲存，可以按「↑ 上傳」了' : 'Token 已清除', '');
      refreshDirty();
    },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountUI);
  else mountUI();
  pull().then(refreshDirty);
})();
