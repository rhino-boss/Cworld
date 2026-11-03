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
  const run = () => document.querySelectorAll('details').forEach(bind);
  run();
  // 有些區塊是 JS 之後才產生的，晚一點再補綁一次
  setTimeout(run, 0); setTimeout(run, 800);
})();
