const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "gojol",
    version: "3.0",
    author: "SK-SIDDIK-KHAN",
    role: 0,
    usePrefix: true,
    category: "media",
    guide: "/gojol"
  },

  onStart: async ({ event, bot, message, args }) => {
    const chatId = event?.chat?.id;

    if (!chatId) return;

    const cacheDir = path.join(__dirname, "tmp");

    try {
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const loading = await bot.sendMessage(
        chatId,
        "Loading Islamic Gojol... Please Wait ⏰"
      );

      const links = [
        "https://drive.google.com/uc?id=1xjyq3BrlW3bGrp8y7eedQSuddCbdvLMN",
        "https://drive.google.com/uc?id=1CCQqJVqvFsgyAd4ZjZB0BJ3lGN4Kc2l2",
        "https://drive.google.com/uc?id=1xnht0PdBt9DnLGzW7GmJUTsTIJnxxByo",
        "https://drive.google.com/uc?id=1CDCa4AlqErr1b7JRNWL62AP0WtdjlSOE",
        "https://drive.google.com/uc?id=1yK0A3lyIJoPRp6g3UjNrC31n0yLfc1Ht",
        "https://drive.google.com/uc?id=1ySwrEG6xVqPdY5BcBP8I3YFCUOX4jV9e",
        "https://drive.google.com/uc?id=1CESeRi5Ue4HR6GSDfYJrREGGcsvYJvAB"
      ];

      const audioURL =
        links[Math.floor(Math.random() * links.length)];

      const filePath = path.join(
        cacheDir,
        `gojol_${Date.now()}.mp3`
      );

      const response = await axios({
        method: "GET",
        url: audioURL,
        responseType: "arraybuffer",
        timeout: 30000,
        maxContentLength: 50 * 1024 * 1024,
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      fs.writeFileSync(
        filePath,
        Buffer.from(response.data)
      );

      if (!fs.existsSync(filePath)) {
        throw new Error("Audio download failed");
      }

      await message.sendAttachment({
        body:
          "╭━━━❮ 🎵 ISLAMIC GOJOL ❯━━━╮\n" +
          "├‣ 🕌 Islamic Gojol\n" +
          "├‣ 👑 DEV : SK SIDDIK\n" +
          "╰━━━━━━━━━━━━━━━━━━╯",

        attachment: filePath
      });

      try {
        await bot.deleteMessage(
          chatId,
          loading.message_id
        );
      } catch {}

      try {
        fs.unlinkSync(filePath);
      } catch {}

    } catch (err) {
      console.error(
        "❌ gojol error:",
        err.message
      );

      try {
        await bot.sendMessage(
          chatId,
          `❌ Failed to load audio!\n${err.message}`
        );
      } catch {}
    }
  }
};