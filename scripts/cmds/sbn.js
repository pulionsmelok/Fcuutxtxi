const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "sbn",
    aliases: ["sbn", "banglasay"],
    version: "2.0.9",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 0,
    usePrefix: true,
    shortDescription: "Convert Bangla text to voice",
    longDescription: "Convert Bangla text into speech",
    category: "media",
    guide: "{pn} <text>"
  },

  onStart: async function ({ message, args, event }) {
    try {
      let text = args.join(" ").trim();

      if (!text && event.reply_to_message) {
        text =
          event.reply_to_message.text ||
          event.reply_to_message.caption ||
          "";
      }

      if (!text) {
        return message.reply(
          "❌ Please enter a Bangla message.\n\nExample:\n/x আমি তোমাকে ভালোবাসি ❤️"
        );
      }

      if (text.length > 200) {
        return message.reply(
          "❌ Message too long!\nPlease keep it under 200 characters."
        );
      }

      const url =
        "https://translate.google.com/translate_tts" +
        "?ie=UTF-8" +
        "&tl=bn" +
        "&client=tw-ob" +
        `&q=${encodeURIComponent(text)}`;

      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 30000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Android 13; Mobile)"
        }
      });

      if (!response.data || !response.data.length) {
        throw new Error("Empty audio response");
      }

      const cacheDir =
        global.utils?.CACHE_DIR ||
        path.join(__dirname, "tmp");

      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, {
          recursive: true
        });
      }

      const filePath = path.join(
        cacheDir,
        `bangla_tts_${Date.now()}.mp3`
      );

      fs.writeFileSync(filePath, Buffer.from(response.data));

      await message.reply({
        body: `🔊 ${text}`,
        attachment: filePath
      });

      setTimeout(() => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (_) {}
      }, 15000);

    } catch (error) {
      console.error(
        "❌ Bangla TTS Error:",
        error.response?.data ||
        error.message ||
        error
      );

      return message.reply(
        "❌ Failed to generate the voice.\nPlease try again later."
      );
    }
  }
};