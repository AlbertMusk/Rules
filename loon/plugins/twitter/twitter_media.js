/**
 * Twitter Media Downloader for Loon
 * Author: ChatGPT
 */

if (!$response || !$response.body) {
  $done({});
}

try {
  const data = JSON.parse($response.body);

  // 兼容不同 TweetDetail 返回结构
  const tweet =
    data?.data?.tweetResult?.result ||
    data?.data?.threaded_conversation_with_injections_v2
      ?.instructions?.[0]
      ?.entries?.[0]
      ?.content?.itemContent?.tweet_results?.result;

  if (!tweet) $done({});

  const media =
    tweet?.legacy?.extended_entities?.media ||
    tweet?.extended_entities?.media;

  if (!media || media.length === 0) $done({});

  const videos = [];
  const images = [];

  media.forEach(item => {
    // 视频 / GIF
    if (item.type === "video" || item.type === "animated_gif") {
      const variants = item.video_info?.variants || [];
      const mp4s = variants.filter(v => v.content_type === "video/mp4");
      mp4s.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
      if (mp4s[0]?.url) {
        videos.push(mp4s[0].url);
      }
    }

    // 图片
    if (item.type === "photo") {
      images.push(item.media_url_https + "?name=orig");
    }
  });

  if (videos.length === 0 && images.length === 0) $done({});

  const title = "Twitter 媒体已解析";
  const subtitle = [
    videos.length ? `🎬 视频 ${videos.length}` : null,
    images.length ? `🖼 图片 ${images.length}` : null
  ].filter(Boolean).join(" · ");

  const downloadUrl = videos[0] || images[0];

  $notification.post(
    title,
    subtitle,
    "点击使用 Safari 下载",
    { "open-url": downloadUrl }
  );

} catch (e) {
  // 静默失败，避免刷通知
}

$done({});
