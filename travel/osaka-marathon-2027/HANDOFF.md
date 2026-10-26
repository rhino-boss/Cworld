# 大阪馬拉松 2027 — 交接待辦（2026-10-27）

上一個 session 的終端機壞掉（EPERM），以下檔案已在本機改好但**還沒 commit／push**：
`stay.html`（新）、`index.html`、`days.js`、`plan.html`、`race.html`、`prep.html`、`play.html`、`eat.html`、`shop.html`。

## 1. 先推上線
```bash
cd "C:\Users\rhinshen\Mine\AI 工作區\Cworld"
git add -A travel/osaka-marathon-2027
git commit -m "大阪馬拉松：住宿頁、總覽住宿精簡、旅行篇清單改唯讀、D1 飯店座標修正"
git push
```
推完到 https://rhino-boss.github.io/Cworld/travel/osaka-marathon-2027/ 確認：標籤列有「住宿」、住宿頁地圖正常、總覽旅行篇清單沒有輸入框。

## 2. 重拉路線總覽的 D1 路線
`days.js` 的飯店座標已改成 `[34.69054,135.53524]`（城東区鴫野西 2-3-19），但 `routes.js` 還是舊的。
重跑 scratchpad 的 `osaka_routes.js`（BRouter car-fast，每段有快取；如果 scratchpad 不在了，照 routes.js 開頭註解重寫：每天有 `ll` 的節點依序兩兩用 BRouter 串，輸出 `window.ROUTES={D1:{line,km},…}`），然後 commit `routes.js`。
注意：plan.html 載的是 `routes.js?v=1`，改完要把版號升成 `?v=2`。

## 3. 住宿頁補資料（等使用者）
Booking.com 的 PDF 讀不出來。要跟使用者要「入住指示說明」的文字（是不是無人櫃台／鑰匙箱密碼／報到地點），補進 `stay.html` 的「訂房」表。

## 4. 「完百計畫」是什麼
使用者手機上看到 rhino-boss.github.io 有一個「完百計畫」頁（我的行程／路線／行進／完百／我的係數、已同步 1 筆）。本機 Cworld 沒有這個頁，應該是另一個 session 直接推到 GitHub。`git fetch` 後 `git log origin/main` 看是哪個 commit、放在哪個資料夾，回報給使用者資料來源。

## 其他慣例
- 推之前 `node -e "new Function(...)"` 做語法檢查；改 `sub.css`／`days.js` 要升 `?v=`。
- 圖片都放 `img/`，Wikimedia 來源記在 `img/credits.json`。
- commit 訊息結尾加 `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`。
