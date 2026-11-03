/* 大阪馬拉松：<details> 展開／收合動畫（總覽各區塊、馬拉松篇子區塊共用） */
(function(){
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function bind(d){
    const s = d.querySelector(':scope>summary');
    if (!s || d.dataset.anim) return;
    d.dataset.anim = '1';
    s.addEventListener('click', e => {
      if (reduce || e.target.closest('a')) return;   // 標題上的「開完整頁」連結照常
      e.preventDefault();
      if (d._anim) { d._anim.cancel(); d._anim = null; }
      const opening = !d.open;
      const start = d.offsetHeight;
      // 先量出目標高度（同步切換不會畫出中間狀態）
      d.open = !d.open; const end = d.offsetHeight; d.open = !d.open;
      if (opening) d.open = true;
      d.style.overflow = 'hidden';
      const a = d.animate({ height: [start + 'px', end + 'px'] }, { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
      d._anim = a;
      a.onfinish = () => { if (!opening) d.open = false; d.style.overflow = ''; d._anim = null; };
      a.oncancel = () => { d.style.overflow = ''; };
    });
  }
  /* 玩什麼／吃什麼卡片標題：括號補充（例如「（有空檔再去）」）只在右邊 📍↗ 不會被擠到下一行時才顯示；
     D0（不排在特定哪天）的標籤改寫成「有空」 */
  document.querySelectorAll('.spot .head .day').forEach(el => { if (el.textContent.trim() === 'D0') el.textContent = '有空'; });
  document.querySelectorAll('.spot .head .name').forEach(n => {
    const m = n.textContent.match(/^(.*?)\s*([（(].*[）)])\s*$/);
    if (!m) return;
    n.innerHTML = '';
    n.append(m[1]);
    const pn = document.createElement('span'); pn.className = 'pn'; pn.textContent = m[2]; n.append(pn);
  });
  const fitNotes = () => document.querySelectorAll('.spot .head').forEach(h => {
    const pn = h.querySelector('.name .pn'), ic = h.querySelector('.icons'), nm = h.querySelector('.name');
    if (!pn) return;
    pn.style.display = '';
    if (!ic) return;
    // 圖示和標題不在同一行（被擠下去）就把括號補充藏起來
    if (ic.getBoundingClientRect().top > nm.getBoundingClientRect().top + 4) pn.style.display = 'none';
  });
  fitNotes(); window.addEventListener('load', fitNotes); window.addEventListener('resize', fitNotes);

  /* 玩什麼／吃什麼：依天數分組，每組前面放一顆「寶可夢球＋D1・2/26 五」分隔標題 */
  const spots = document.getElementById('spots');
  if (spots) {
    // 先把卡片依 D1→D4→有空 排好（同一天內維持原本順序），同一天才會只有一個分隔標題
    const keyOf = c => c.querySelector('.head .day')?.textContent.trim() || '';
    const rank = k => /^D\d$/.test(k) ? +k[1] : 9;
    [...spots.querySelectorAll(':scope>.spot')].map((c, i) => [c, i])
      .sort((a, b) => rank(keyOf(a[0])) - rank(keyOf(b[0])) || a[1] - b[1])
      .forEach(([c]) => spots.appendChild(c));
    let last = null;
    spots.querySelectorAll(':scope>.spot').forEach(card => {
      const tag = card.querySelector('.head .day');
      const key = tag ? tag.textContent.trim() : '';
      if (key === last) return;
      last = key;
      const day = (window.DAYS || []).find(v => v.d === key);
      const n = [...spots.querySelectorAll(':scope>.spot')].filter(c => (c.querySelector('.head .day')?.textContent.trim() || '') === key).length;
      const h = document.createElement('div');
      h.className = 'dgrp';
      if (tag) h.setAttribute('style', tag.getAttribute('style') || '');
      h.innerHTML = '<b>' + (key === '有空' || !key ? '有空再去' : key) + '</b>' + (day ? '<span>' + day.date + '</span>' : '') + '<i>' + n + ' 個</i>';
      spots.insertBefore(h, card);
    });
  }

  /* 必買：各類標題右側的件數 */
  document.querySelectorAll('.shopsec').forEach(s => { const c = s.querySelector('h2 .cnt'); if (c) c.textContent = s.querySelectorAll('.item').length + ' 項'; });

  /* 總覽「旅行篇」清單：備註開頭的 D1／D2… 做成當天顏色的寶可夢球膠囊（勾選會重畫清單，所以用觀察器每次補上） */
  const tagDays = ul => ul.querySelectorAll('.note:not([data-t])').forEach(em => {
    em.dataset.t = '1';
    const m = em.textContent.match(/^(D[1-4])\s*(.*)$/);
    if (!m) return;
    em.innerHTML = '<span class="dtag" style="--dk:var(--d' + m[1][1] + ')">' + m[1] + '</span>' + (m[2] ? ' ' + m[2].replace(/</g, '&lt;') : '');
  });
  document.querySelectorAll('#sec-travel .ck').forEach(ul => { tagDays(ul); new MutationObserver(() => tagDays(ul)).observe(ul, { childList: true }); });

  const run = () => document.querySelectorAll('details').forEach(bind);
  run();
  // 有些區塊是 JS 之後才產生的，晚一點再補綁一次
  setTimeout(run, 0); setTimeout(run, 800);
})();
