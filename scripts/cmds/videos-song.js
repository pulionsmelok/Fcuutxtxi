const fs = require("fs");
const path = require("path");
const axios = require("axios");
const nayan = require("nayan-media-downloaders");
const Youtube = require("youtube-search-api");

module.exports = {
  config: {
    name: "video",
    aliases: ["videos", "yt"],
    author: "SK-SIDDIK-KHAN",
    role: 0,
    description: "Direct video download",
    category: "media",
    usePrefix: true
  },

  onStart: async function ({ api, event, args }) {
    const chatId = event.threadID;
    const keyword = args.join(" ");

    if (!keyword) {
      return api.sendMessage(
        "⚠️ | Example: /video Believer",
        chatId,
        { reply_to_message_id: event.messageID }
      );
    }

    let filePath = null;

    try {
      const results = await Youtube.GetListByKeyword(keyword, false, 1);
      const video = results.items?.[0];

      if (!video) {
        return api.sendMessage("❌ | Video not found", chatId);
      }

      const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;

      const wait = await api.sendMessage(
        "⏳ | Downloading video...",
        chatId,
        { reply_to_message_id: event.messageID }
      );

      const data = await nayan.ytdown(videoUrl);

      const videoLink = data?.data?.video;
      const title = data?.data?.title || video.title || "Downloaded Video";

      if (!videoLink) throw new Error("No video");

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      filePath = path.join(
        cacheDir,
        `video_${Date.now()}.mp4`
      );

      const res = await axios.get(videoLink, {
        responseType: "stream",
        timeout: 180000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);

        res.data.pipe(writer);

        writer.on("finish", resolve);
        writer.on("error", reject);
        res.data.on("error", reject);
      });

      if (wait?.messageID) {
        await api.deleteMessage(chatId, wait.messageID).catch(() => {});
      }

      if (`🎬 ${title}`.length <= 1024) {
        await api.sendVideo(chatId, filePath, {
          caption: `🎬 ${title}`
        });
      } else {
        await api.sendVideo(chatId, filePath);

        await api.sendMessage(
          `🎬 ${title}`,
          chatId,
          { reply_to_message_id: event.messageID }
        );
      }

    } catch (err) {
      console.log("ERROR:", err);

      await api.sendMessage(
        "❌ | Download failed",
        chatId,
        { reply_to_message_id: event.messageID }
      ).catch(() => {});

    } finally {
      if (filePath) {
        setTimeout(() => {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch {}
        }, 15000);
      }
    }
  }
};
