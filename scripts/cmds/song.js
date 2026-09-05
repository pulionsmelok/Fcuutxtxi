const fs = require("fs");
const path = require("path");
const axios = require("axios");
const nayan = require("nayan-media-downloaders");
const Youtube = require("youtube-search-api");

module.exports = {
  config: {
    name: "song",
    aliases: ["sing", "music"],
    author: "SK-SIDDIK-KHAN",
    version: "1.0.1",
    role: 0,
    description: "Search and download song from YouTube",
    category: "media",
    cooldown: 5,
    usePrefix: true
  },

  onStart: async function ({ event, api, message, args }) {
    const chatId = event.chat.id;
    const keyword = args.join(" ").trim();

    let waitMsg = null;
    let filePath = null;

    if (!keyword) {
      return message.reply(
        "⚠️ Please provide a song name.\n\n" +
        "Example:\n" +
        "/song Believer"
      );
    }

    try {
      const results = await Youtube.GetListByKeyword(keyword, false, 1);
      const video = results?.items?.[0];

      if (!video || !video.id) {
        throw new Error("No song found on YouTube.");
      }

      const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;

      waitMsg = await message.reply("⏳ Downloading...");

      const data = await nayan.ytdown(videoUrl);

      const audioUrl = data?.data?.audio;
      const title = data?.data?.title || video.title;

      if (!audioUrl) throw new Error("No audio");

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      filePath = path.join(cacheDir, `song_${Date.now()}.mp3`);

      const writer = fs.createWriteStream(filePath);
      const res = await axios.get(audioUrl, { responseType: "stream" });

      res.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
        res.data.on("error", reject);
      });

      await api.deleteMessage(chatId, waitMsg.message_id).catch(() => {});

      await api.sendAudio(chatId, {
        source: filePath
      }, {
        caption: `🎧 ${title}`,
        reply_to_message_id: event.message_id
      });

    } catch (err) {
      console.log("ERROR:", err);
      await message.reply("❌ | Download failed");
    } finally {
      if (filePath) {
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch {}
      }
    }
  }
};
