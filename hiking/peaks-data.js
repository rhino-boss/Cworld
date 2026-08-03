// ═══════════════════════════════════════════════
// 百岳資料（座標來源：TMCA 近似值）— 全站共用
// 使用方式：<script src="peaks-data.js"></script>
// ═══════════════════════════════════════════════
const PEAKS = [
  {rank:1,  name:"玉山",        alt:3952, lat:23.4697, lng:120.9572},
  {rank:2,  name:"雪山",        alt:3886, lat:24.3881, lng:121.2147},
  {rank:3,  name:"玉山東峰",    alt:3869, lat:23.4731, lng:120.9644},
  {rank:4,  name:"玉山北峰",    alt:3858, lat:23.4806, lng:120.9539},
  {rank:5,  name:"玉山南峰",    alt:3844, lat:23.4611, lng:120.9528},
  {rank:6,  name:"秀姑巒山",    alt:3805, lat:23.5017, lng:121.0283},
  {rank:7,  name:"馬博拉斯山",  alt:3785, lat:23.4844, lng:120.9222},
  {rank:8,  name:"南湖大山",    alt:3742, lat:24.3614, lng:121.4692},
  {rank:9,  name:"東小南山",    alt:3709, lat:23.3833, lng:120.9083},
  {rank:10, name:"中央尖山",    alt:3705, lat:24.2539, lng:121.4261},
  {rank:11, name:"雪山北峰",    alt:3703, lat:24.4033, lng:121.2656},
  {rank:12, name:"關山",        alt:3668, lat:23.1917, lng:120.8719},
  {rank:13, name:"大水窟山",    alt:3642, lat:23.4992, lng:121.0597},
  {rank:14, name:"南湖大山東峰",alt:3632, lat:24.3622, lng:121.4789},
  {rank:15, name:"東郡大山",    alt:3619, lat:23.6219, lng:121.0383},
  {rank:16, name:"奇萊北峰",    alt:3607, lat:24.1972, lng:121.3353},
  {rank:17, name:"向陽山",      alt:3603, lat:23.2856, lng:120.8758},
  {rank:18, name:"大劍山",      alt:3594, lat:24.2789, lng:121.2322},
  {rank:19, name:"雲峰",        alt:3564, lat:23.3806, lng:120.8836},
  {rank:20, name:"奇萊主山",    alt:3560, lat:24.1761, lng:121.3378},
  {rank:21, name:"馬利加南山",  alt:3546, lat:23.5219, lng:120.9961},
  {rank:22, name:"南湖北山",    alt:3536, lat:24.3783, lng:121.4633},
  {rank:23, name:"大雪山",      alt:3530, lat:24.2675, lng:121.1733},
  {rank:24, name:"品田山",      alt:3524, lat:24.4047, lng:121.2800},
  {rank:25, name:"玉山西峰",    alt:3518, lat:23.4700, lng:120.9461},
  {rank:26, name:"頭鷹山",      alt:3510, lat:24.2947, lng:121.4336},
  {rank:27, name:"三叉山",      alt:3496, lat:23.2681, lng:120.8906},
  {rank:28, name:"大霸尖山",    alt:3492, lat:24.4572, lng:121.2983},
  {rank:29, name:"南湖大山南峰",alt:3475, lat:24.3500, lng:121.4783},
  {rank:30, name:"東巒大山",    alt:3468, lat:23.6444, lng:121.0733},
  {rank:31, name:"無明山",      alt:3451, lat:24.2461, lng:121.4411},
  {rank:32, name:"巴巴山",      alt:3449, lat:24.2100, lng:121.3950},
  {rank:33, name:"馬西山",      alt:3443, lat:23.5400, lng:121.0900},
  {rank:34, name:"北合歡山",    alt:3422, lat:24.1561, lng:121.2714},
  {rank:35, name:"合歡山東峰",  alt:3421, lat:24.1478, lng:121.2928},
  {rank:36, name:"小霸尖山",    alt:3418, lat:24.4533, lng:121.3083},
  {rank:37, name:"合歡山",      alt:3417, lat:24.1458, lng:121.2736},
  {rank:38, name:"南玉山",      alt:3383, lat:23.4439, lng:120.9158},
  {rank:39, name:"畢祿山",      alt:3371, lat:24.2094, lng:121.3083},
  {rank:40, name:"卓社大山",    alt:3369, lat:24.0500, lng:121.2856},
  {rank:41, name:"奇萊南峰",    alt:3358, lat:24.1544, lng:121.3408},
  {rank:42, name:"南雙頭山",    alt:3356, lat:23.4700, lng:120.9350},
  {rank:43, name:"能高山南峰",  alt:3349, lat:24.0919, lng:121.3808},
  {rank:44, name:"志佳陽大山",  alt:3345, lat:24.3761, lng:121.2578},
  {rank:45, name:"白姑大山",    alt:3342, lat:24.1469, lng:121.1711},
  {rank:46, name:"八通關山",    alt:3335, lat:23.5083, lng:120.9828},
  {rank:47, name:"新康山",      alt:3331, lat:23.3581, lng:121.0739},
  {rank:48, name:"丹大山",      alt:3325, lat:23.7094, lng:121.0644},
  {rank:49, name:"桃山",        alt:3325, lat:24.4275, lng:121.2692},
  {rank:50, name:"佳陽山",      alt:3314, lat:24.3550, lng:121.2650},
  {rank:51, name:"火石山",      alt:3310, lat:24.3700, lng:121.2900},
  {rank:52, name:"池有山",      alt:3303, lat:24.4192, lng:121.2572},
  {rank:53, name:"伊澤山",      alt:3297, lat:24.4117, lng:121.3172},
  {rank:54, name:"卑南主山",    alt:3295, lat:23.2228, lng:120.9364},
  {rank:55, name:"干卓萬山",    alt:3284, lat:23.9628, lng:121.2039},
  {rank:56, name:"太魯閣大山",  alt:3283, lat:24.2736, lng:121.4792},
  {rank:57, name:"轆轆山",      alt:3279, lat:23.2706, lng:120.8336},
  {rank:58, name:"喀西帕南山",  alt:3276, lat:23.5394, lng:121.1119},
  {rank:59, name:"內嶺爾山",    alt:3275, lat:23.8542, lng:121.0931},
  {rank:60, name:"鈴鳴山",      alt:3272, lat:24.3028, lng:121.4444},
  {rank:61, name:"郡大山",      alt:3265, lat:23.6300, lng:120.9950},
  {rank:62, name:"能高山",      alt:3262, lat:24.1133, lng:121.3800},
  {rank:63, name:"萬東山西峰",  alt:3258, lat:23.6953, lng:121.0742},
  {rank:64, name:"劍山",        alt:3253, lat:24.2831, lng:121.2492},
  {rank:65, name:"屏風山",      alt:3250, lat:24.2369, lng:121.4556},
  {rank:66, name:"小關山",      alt:3249, lat:23.1650, lng:120.8820},
  {rank:67, name:"義西請馬至山",alt:3245, lat:23.7378, lng:121.0742},
  {rank:68, name:"牧山",        alt:3241, lat:23.2500, lng:120.8550},
  {rank:69, name:"玉山前峰",    alt:3239, lat:23.4758, lng:120.9603},
  {rank:70, name:"石門山",      alt:3237, lat:24.1403, lng:121.2994},
  {rank:71, name:"無雙山",      alt:3231, lat:23.8800, lng:121.1700},
  {rank:72, name:"塔關山",      alt:3222, lat:23.2667, lng:120.8381},
  {rank:73, name:"馬比杉山",    alt:3211, lat:24.4539, lng:121.3750},
  {rank:74, name:"達芬尖山",    alt:3208, lat:23.5317, lng:120.9628},
  {rank:75, name:"雪山東峰",    alt:3201, lat:24.3950, lng:121.2336},
  {rank:76, name:"南華山",      alt:3184, lat:24.1194, lng:121.3611},
  {rank:77, name:"關山嶺山",    alt:3176, lat:23.1500, lng:120.8900},
  {rank:78, name:"海諾南山",    alt:3174, lat:23.1647, lng:120.8792},
  {rank:79, name:"中雪山",      alt:3173, lat:24.3050, lng:121.2700},
  {rank:80, name:"閂山",        alt:3168, lat:24.2211, lng:121.4311},
  {rank:81, name:"甘薯峰",      alt:3158, lat:24.2733, lng:121.4472},
  {rank:82, name:"西合歡山",    alt:3145, lat:24.1375, lng:121.2564},
  {rank:83, name:"審馬陣山",    alt:3141, lat:24.3136, lng:121.4264},
  {rank:84, name:"喀拉業山",    alt:3133, lat:24.3814, lng:121.3400},
  {rank:85, name:"庫哈諾辛山",  alt:3115, lat:23.2436, lng:120.8461},
  {rank:86, name:"加利山",      alt:3112, lat:24.4319, lng:121.3358},
  {rank:87, name:"白石山",      alt:3110, lat:24.1978, lng:121.3839},
  {rank:88, name:"磐石山",      alt:3106, lat:24.2700, lng:121.3950},
  {rank:89, name:"帕托魯山",    alt:3101, lat:24.2600, lng:121.4900},
  {rank:90, name:"北大武山",    alt:3092, lat:22.5267, lng:120.8981},
  {rank:91, name:"西巒大山",    alt:3081, lat:23.6444, lng:121.0000},
  {rank:92, name:"塔芬山",      alt:3070, lat:24.3208, lng:121.3667},
  {rank:93, name:"立霧主山",    alt:3069, lat:24.1858, lng:121.4508},
  {rank:94, name:"安東軍山",    alt:3068, lat:24.0711, lng:121.4025},
  {rank:95, name:"光頭山",      alt:3060, lat:24.0050, lng:121.3800},
  {rank:96, name:"羊頭山",      alt:3035, lat:24.1878, lng:121.2733},
  {rank:97, name:"布拉克桑山",  alt:3026, lat:24.3611, lng:121.3556},
  {rank:98, name:"駒盆山",      alt:3022, lat:23.4900, lng:120.9100},
  {rank:99, name:"六順山",      alt:2999, lat:23.8300, lng:121.0800},
  {rank:100,name:"鹿山",        alt:2981, lat:23.0100, lng:120.8700},
];

// 單筆紀錄是否對應到某座百岳
// 1. 優先看 GPX 偵測出的 r.peaks 清單
// 2. 其次看山名是否包含該百岳全名（單向比對；反向比對會讓「關山」誤中
//    關山嶺山 / 小關山 / 塔關山）
function recordMatchesPeak(r, peakName) {
  if (!r) return false;
  if (Array.isArray(r.peaks) && r.peaks.includes(peakName)) return true;
  return typeof r.name === 'string' && r.name.includes(peakName);
}

// 從所有紀錄算出已完成的百岳名稱集合
function completedPeakSet(records) {
  const set = new Set();
  PEAKS.forEach(peak => {
    if (records.some(r => recordMatchesPeak(r, peak.name))) set.add(peak.name);
  });
  return set;
}

// 兩點距離（公尺）
function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const f1 = lat1 * Math.PI / 180, f2 = lat2 * Math.PI / 180;
  const df = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(df/2)**2 + Math.cos(f1)*Math.cos(f2)*Math.sin(dl/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// 從軌跡點陣列找出經過的百岳
// points: [{lat, lon, ele, time}]，thresholdM: 判定為「登頂」的距離門檻（公尺）
// 上面的座標是近似值（實測 Garmin 軌跡在合歡山主峰仍差約 300 m），
// 所以預設門檻放寬到 400 m，再讓使用者手動勾選 / 排除
// 回傳：[{name, alt, rank, distM, time}]，依經過時間排序（無時間則依海拔）
function detectPeaksNearTrack(points, thresholdM = 400) {
  if (!points || !points.length) return [];
  const hits = [];
  const degLat = thresholdM / 111000;

  PEAKS.forEach(peak => {
    const degLon = thresholdM / (111000 * Math.cos(peak.lat * Math.PI / 180));
    let best = Infinity, bestIdx = -1;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      // 先用經緯度方框粗篩，避免對每個點都算 haversine
      if (Math.abs(p.lat - peak.lat) > degLat) continue;
      if (Math.abs(p.lon - peak.lng) > degLon) continue;
      const d = haversineM(p.lat, p.lon, peak.lat, peak.lng);
      if (d < best) { best = d; bestIdx = i; }
    }
    if (best <= thresholdM) {
      hits.push({
        rank: peak.rank, name: peak.name, alt: peak.alt,
        distM: Math.round(best),
        time: bestIdx >= 0 ? points[bestIdx].time : null,
      });
    }
  });

  hits.sort((a, b) => {
    if (a.time && b.time) return a.time - b.time;
    return b.alt - a.alt;
  });
  return hits;
}
