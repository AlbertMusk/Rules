/**
 * Twitter Media Downloader (Web) v2.0
 * Safari Web only
 * - HTML 下载选择页
 * - Tweet ID 去重
 */

if (!$response || !$response.body) $done({});

const STORE_KEY = "TW_WEB_MEDIA_IDS";
const MAX_CACHE = 50;

function readCache() {
  try { return JSON.parse($persistentStore.read(STORE_KEY) || "[]"); }
  catch { return []; }
}
function writeCache(arr) {
  $persistentStore.write(JSON.stringify(arr.slice(-MAX_CACHE)), STORE_KEY);
}

function buildHTML(videos, images) {
  const items = [];
  videos.forEach((u, i) => items.push(
    `<li>🎬 视频 ${i+1}<a href="${u}" target="_blank" download>下载</a></li>`
  ));
  images.forEach((u, i) => items.push(
    `<li>🖼 图片 ${i+1}<a href="${u}" target="_blank" download>下载</a></li>`
  ));

  return `<!doctype html><html><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Twitter 媒体下载</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont;padding:16px}
h2{margin:8px 0 12px}
ul{padding:0}
li{list-style:none;background:#f2f2f7;margin:10px 0;padding:12px;border-radius:10px;
display:flex;justify-content:space-between;align-items:center}
a{background:#1d9bf0;color:#fff;text-decoration:none;padding:6px 12px;border-radius:8px;font-weight:600}
</style></head><body>
<h2>解析结果</h2><ul>${items.join("")}</ul>
</body></html>`;
}

try {
  const data = JSON.parse($response.body);

  const tweet =
    data?.data?.tweetResult?.result ||
    data?.data?.threaded_conversation_with_injections_v2
      ?.instructions?.[0]?.entries?.[0]
      ?.content?.itemContent?.tweet_results?.result;

  if (!tweet) $done({});

  const tweetId = tweet.rest_id || tweet.legacy?.id_str;
  if (!tweetId) $done({});

  const cache = readCache();
  if (cache.includes(tweetId)) $done({});

  const media =
    tweet?.legacy?.extended_entities?.media ||
    tweet?.extended_entities?.media;

  if (!media || !media.length) $done({});

  const videos = [];
  const images = [];

  media.forEach(m => {
    if (m.type === "video" || m.type === "animated_gif") {
      const vars = m.video_info?.variants || [];
      const mp4s = vars.filter(v => v.content_type === "video/mp4")
                       .sort((a,b)=>(b.bitrate||0)-(a.bitrate||0));
      mp4s.forEach(v => v.url && videos.push(v.url));
    }
    if (m.type === "photo") {
      images.push(m.media_url_https + "?name=orig");
    }
  });

  if (!videos.length && !images.length) $done({});

  cache.push(tweetId); writeCache(cache);

  const html = buildHTML(videos, images);
  const dataURL = "data:text/html;charset=utf-8," + encodeURIComponent(html);

  $notification.post(
    "Twitter 媒体已解析（Web）",
    `🎬 ${videos.length} · 🖼 ${images.length}`,
    "打开下载选择页",
    { "open-url": dataURL }
  );

} catch (e) {}

$done({});