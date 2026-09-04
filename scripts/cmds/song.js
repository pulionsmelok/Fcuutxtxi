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
      const results = await Youtube.GetListByKeyword(
        keyword,
        false,
        5
      );

      const video = results?.items?.find(
        item => item?.id && item?.type === "video"
      ) || results?.items?.[0];

      if (!video || !video.id) {
        throw new Error(
          "No song found on YouTube."
        );
      }

      const videoUrl =
        `https://www.youtube.com/watch?v=${video.id}`;

      const videoTitle =
        video.title || keyword;

      waitMsg = await message.reply(
        `⏳ Downloading...\n\n` +
        `🎵 ${videoTitle}`
      );

      const data = await nayan.ytdown(videoUrl);

      const audioUrl =
        data?.data?.audio ||
        data?.data?.audioUrl ||
        data?.audio;

      const title =
        data?.data?.title ||
        videoTitle;

      if (!audioUrl) {
        throw new Error(
          "Downloader did not return an audio URL."
        );
      }

      const cacheDir = path.join(
        __dirname,
        "tmp"
      );

      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, {
          recursive: true
        });
      }

      filePath = path.join(
        cacheDir,
        `song_${Date.now()}.mp3`
      );

      const response = await axios({
        method: "GET",
        url: audioUrl,
        responseType: "stream",
        timeout: 180000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
      });

      const writer =
        fs.createWriteStream(filePath);

      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);

        response.data.on(
          "error",
          reject
        );
      });

      if (!fs.existsSync(filePath)) {
        throw new Error(
          "Downloaded audio file was not created."
        );
      }

      const fileSize =
        fs.statSync(filePath).size;

      if (fileSize <= 0) {
        throw new Error(
          "Downloaded audio file is empty."
        );
      }

      if (waitMsg?.message_id) {
        try {
          await api.deleteMessage(
            chatId,
            waitMsg.message_id
          );
        } catch {}
      }

      await api.sendAudio(
        chatId,
        {
          source: filePath
        },
        {
          caption:
            `🎧 ${title}\n\n` +
            `📥 Downloaded by SIDDIK-BOT`,
          reply_to_message_id:
            event.message_id
        }
      );

      console.log("song ✓");

    } catch (error) {
      console.error(
        "\n========== SONG ERROR =========="
      );

      console.error(
        "Message:",
        error?.message
      );

      console.error(
        "Stack:",
        error?.stack
      );

      if (error?.response) {
        console.error(
          "HTTP Status:",
          error.response.status
        );

        console.error(
          "HTTP Data:",
          error.response.data
        );
      }

      console.error(
        "================================\n"
      );

      if (waitMsg?.message_id) {
        try {
          await api.deleteMessage(
            chatId,
            waitMsg.message_id
          );
        } catch {}
      }

      const errorMessage =
        error?.message ||
        "Unknown error";

      await message.reply(
        `❌ Song download failed!\n\n` +
        `🔴 Error: ${errorMessage}`
      );

    } finally {
      if (filePath) {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (error) {
          console.error(
            "[SONG] Cleanup error:",
            error.message
          );
        }
      }
    }
  }
};
