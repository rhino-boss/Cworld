// 大阪馬拉松 2027 行程資料（index.html 的每日卡與 plan.html 完整行程共用）
// 節點：[時間, 名稱, {u:官網, m:Google Map 查詢字, p:[照片…]（拍照參考，可左右滑）}]；名稱含「→」的移動列會自動產生 Google Map 路線
// 分段：{n:'備註；備註'}，用「；」分段、顯示時一行一段
window.DAYS=[
  {d:'D1', date:'2/26 五', c:1, route:'關西機場 → <b>INTEX 大阪</b> → <b>海遊館</b> → 天保山 → 鴫野',
   meta:'<b>EXPO 領物</b> 五 11:00–19:00，本人＋護照　<b>飯店</b> 17:00 後才能入住',
   chain:[
     ['09:40–13:10','桃園機場 T1 → 關西機場 T2',{ll:[34.4347,135.2441],u:'https://www.flypeach.com/'}],{n:'交通：樂桃 MM24；訂單 QAJ7AN；起飛前 120～50 分報到'},
     ['13:40–15:00','關西機場 → コスモスクエア'],{n:'交通：南海電鐵 → Metro 御堂筋線 → 中央線；行李放コスモスクエア站置物櫃'},
     ['15:00–16:00','INTEX 大阪 6 號館・EXPO 領號碼布',{ll:[34.6368,135.4215],u:'https://www.osaka-marathon.com/2027/expo/',m:'インテックス大阪'}],{n:'本人＋護照；五 11:00–19:00'},
     ['16:00–16:15','コスモスクエア → 大阪港'],{n:'交通：Metro 中央線 1 站'},
     ['16:15–19:30','海遊館（含夜間展示）',{ll:[34.6545,135.4289],u:'https://www.kaiyukan.com/',m:'海遊館',p:['img/kaiyukan_1.jpg','img/kaiyukan_2.jpg','img/kaiyukan_3.jpg','img/kaiyukan_4.jpg','img/kaiyukan_5.jpg']}],{n:'門票 ¥2,700（線上預購免排隊）；最後入館 19:00、閉館 20:00；17:00 後燈光轉暗進入夜間模式'},
     ['19:30–20:30','晚餐：天保山・章魚燒＋壽司',{ll:[34.6560,135.4302],m:'天保山マーケットプレース',p:['img/tempozan_1.jpg','img/tempozan_2.jpg','img/tempozan_3.jpg','img/tempozan_4.jpg','img/tempozan_5.jpg']}],{n:'章魚燒：なにわ食いしんぼ横丁（天保山 Market Place 2F）；壽司：Market Place 內回轉壽司（店家待定）'},
     ['20:30–21:00','大阪港 → 鴫野'],{n:'交通：Metro 中央線 → 森ノ宮 轉 JR'},
     ['21:00–21:20','Excellence Osaka Castle Park Check-in',{ll:[34.6966,135.5478],u:'https://www.booking.com/',m:'Excellence Osaka Castle Park'}],{n:'17:00 後才能入住；JR 鴫野站旁'},
     ['21:30–22:00','輕鬆跑 3 km（鴫野 → 大阪城公園外圍折返）',{ll:[34.6920,135.5400]}],{n:'6:00 配速；只是活動筋骨、順便認路'}
   ]},
  {d:'D2', date:'2/27 六', c:2, route:'<b>大阪城公園</b> → <b>萬博記念公園</b> → <b>勝尾寺</b> → 京橋',
   meta:'<b>勝尾寺巴士</b> 班次少，先查時刻　<b>賽前一天</b> 碳水為主、21:00 早睡　<b>☃ 下雪</b> 改方案 2 金剛山',
   alt:{title:'方案 2：下雪就去金剛山（樹冰）', route:'<b>大阪城公園</b> → <b>金剛山</b> → 京橋',
     note:'金剛山 1,125 m，大阪最高峰，冬天山頂有樹冰；大阪市區下雪＝山上一定有雪。要帶輕便冰爪（鏈式）、防水鞋、手套；賽前一天上山約 4 小時，依狀況可只到中途折返。',
     chain:[
       ['07:00–07:45','大阪城公園一圈 5 km',{ll:[34.6873,135.5262],m:'大阪城公園'}],{n:'照常；若雪太大就跳過'},
       ['08:30–10:00','鴫野 → 金剛登山口'],{n:'交通：JR → 新今宮 轉 南海高野線 → 河内長野（約 45 分）→ 南海巴士 金剛登山口（約 35 分）'},
       ['10:00–12:00','千早本道 登頂（金剛山 1,125 m）',{ll:[34.4195,135.6735],m:'金剛山 千早本道',u:'https://www.kongozan.com/'}],{n:'石階步道約 4 km、爬升 600 m；山頂 轉法輪寺、國見城跡看樹冰；山頂有賣店可買熱食'},
       ['12:00–12:40','山頂 午餐'],{n:'自備飯糰＋熱飲，或山頂賣店烏龍麵'},
       ['12:40–14:10','下山 → 金剛登山口'],{n:'同路下山；結冰路段冰爪一定要上'},
       ['14:30–16:00','金剛登山口 → 鴫野'],{n:'交通：南海巴士 → 河内長野 → 南海高野線 → 新今宮 → JR'},
       ['16:00–17:00','買隔天早餐、補給'],{n:'便利商店'},
       ['18:00–19:30','晚餐：京橋・居酒屋',{ll:[34.6966,135.5340],m:'京橋 居酒屋 大阪'}],{n:'同方案 1'},
       ['21:00','整理裝備、別號碼布、早睡']
     ]},
   chain:[
     ['07:00–07:45','大阪城公園一圈 5 km',{ll:[34.6873,135.5262],u:'https://osakacastlepark.jp/',m:'大阪城公園',p:['img/osakajo_1.jpg','img/osakajo_2.jpg','img/osakajo_3.jpg','img/osakajo_4.jpg','img/osakajo_5.jpg']}],{n:'6:00 配速；順便看終點與大阪城公園站動線'},
     ['07:45–08:45','早餐、盥洗'],
     ['09:00–10:00','鴫野 → 万博記念公園'],{n:'交通：JR → 御堂筋線（北大阪急行）→ 千里中央 轉 單軌電車'},
     ['10:00–11:00','萬博記念公園・太陽之塔',{ll:[34.8092,135.5322],u:'https://www.expo70-park.jp/',m:'太陽の塔',p:['img/taiyo_1.jpg','img/taiyo_2.jpg','img/taiyo_3.jpg','img/taiyo_4.jpg']}],{n:'入園 ¥260；拍太陽之塔正面、繞公園一圈就走'},
     ['11:00–11:30','万博記念公園 → 千里中央'],{n:'交通：單軌電車'},
     ['11:30–12:30','午餐：千里中央'],{n:'碳水為主，不吃生食；車站共構商場'},
     ['12:30–13:00','千里中央 → 勝尾寺'],{n:'交通：阪急巴士；班次少，先查時刻'},
     ['13:00–15:00','勝尾寺（達摩寺）',{ll:[34.8690,135.4925],u:'https://katsuo-ji-temple.or.jp/',m:'勝尾寺',p:['img/katsuoji_1.jpg','img/katsuoji_2.jpg','img/katsuoji_3.jpg','img/katsuoji_4.jpg','img/katsuoji_5.jpg']}],{n:'拜觀料 ¥500；山上有階梯'},
     ['15:00–16:00','勝尾寺 → 鴫野'],{n:'交通：阪急巴士 → 千里中央 → 御堂筋線 → JR'},
     ['16:00–17:00','買隔天早餐、補給'],{n:'便利商店'},
     ['18:00–19:30','晚餐：京橋・居酒屋',{ll:[34.6966,135.5340],m:'京橋 居酒屋 大阪'}],{n:'京橋是鴫野隔壁站、大阪有名的居酒屋街；賽前選烤物、飯類，少喝酒'},
     ['21:00','整理裝備、別號碼布、早睡']
   ]},
  {d:'D3', date:'2/28 日', c:3, route:'<b>大阪府廳前</b> → 🏁 <b>大阪城公園</b> → 鶴橋',
   meta:'<b>09:15 起跑</b>，關門 16:15　<b>安全手環</b> 沒戴進不了起跑區',
   chain:[
     ['05:30–06:30','起床・早餐'],{n:'賽前 3 小時'},
     ['07:00–07:30','鴫野 → 谷町四丁目'],{n:'交通：JR → Metro'},
     ['07:30–09:15','起點（大阪府廳前）寄物、進起跑區',{ll:[34.6862,135.5203],m:'大阪府庁'}],{n:'戴安全手環才能進起跑區'},
     ['09:15','大阪馬拉松 起跑（第 1 波）',{u:'https://www.osaka-marathon.com/'}],{n:'關門 7 小時（16:15）'},
     ['--:--','完賽・領物資（大阪城公園內）',{ll:[34.6880,135.5290],m:'大阪城公園',p:['img/osakajo_1.jpg','img/osakajo_2.jpg','img/osakajo_3.jpg','img/osakajo_4.jpg','img/osakajo_5.jpg']}],
     ['--:--','大阪城公園 → 鴫野'],{n:'交通：JR 1 站 或 步行'},
     ['--:--','回飯店泡澡、休息'],
     ['18:30','慶功晚餐：鶴橋・燒肉',{ll:[34.6650,135.5316],m:'鶴橋 焼肉'}],{n:'鶴橋是大阪燒肉一條街，JR 環狀線從鴫野直達約 10 分；店家待定'}
   ]},
  {d:'D4', date:'3/1 一', c:4, route:'<b>和歌山城</b> → 關西機場 → 桃園',
   meta:'<b>10:00 前</b> 退房　<b>14:35 前</b> 關西機場 T2 報到完',
   chain:[
     ['09:30–09:50','Check-out'],{n:'10:00 前退房；行李隨身'},
     ['09:50–11:15','鴫野 → 和歌山'],{n:'交通：JR → 天王寺 轉 紀州路快速'},
     ['11:15–12:20','和歌山城',{ll:[34.2277,135.1716],u:'https://wakayamajo.jp/',m:'和歌山城',p:['img/wakayama_1.jpg','img/wakayama_2.jpg','img/wakayama_3.jpg','img/wakayama_4.jpg','img/wakayama_5.jpg']}],{n:'天守閣 ¥410；和歌山站搭巴士 10 分或步行 20 分'},
     ['12:20–13:10','午餐：和歌山拉麵・井出商店',{ll:[34.2301,135.1807],m:'井出商店 和歌山'}],{n:'和歌山拉麵代表店，豚骨醬油；離和歌山站步行 10 分；也可選 丸三'},
     ['13:10–14:00','和歌山 → 關西機場'],{n:'交通：JR → 日根野 轉 關空快速'},
     ['14:00–14:35','關西機場 T2 報到',{ll:[34.4347,135.2441]}],{n:'最晚 14:35（起飛前 50 分）'},
     ['15:25–17:55','關西機場 T2 → 桃園機場 T1',{ll:[34.4347,135.2441],u:'https://www.flypeach.com/'}],{n:'交通：樂桃 MM027；座位 7F；餐：千房大阪燒'}
   ]},
];

// 照片輪播（index.html 彈窗與 plan.html 共用）：左右滑／按箭頭，下方圓點顯示第幾張
window.bindCarousels=function(root){
  (root||document).querySelectorAll('.cphoto:not([data-bound])').forEach(box=>{
    box.dataset.bound='1';
    const track=box.querySelector('.track'), dots=box.querySelector('.dots');
    const n=track.children.length;
    if(dots) dots.innerHTML=Array.from({length:n},(_,i)=>'<i'+(i?'':' class="on"')+'></i>').join('');
    const idx=()=>Math.round(track.scrollLeft/track.clientWidth);
    const go=i=>track.scrollTo({left:Math.max(0,Math.min(n-1,i))*track.clientWidth,behavior:'smooth'});
    box.querySelector('.pv')?.addEventListener('click',e=>{e.stopPropagation();go(idx()-1);});
    box.querySelector('.nx')?.addEventListener('click',e=>{e.stopPropagation();go(idx()+1);});
    track.addEventListener('scroll',()=>{ if(!dots) return; const k=idx(); [...dots.children].forEach((el,i)=>el.classList.toggle('on',i===k)); },{passive:true});
  });
};
