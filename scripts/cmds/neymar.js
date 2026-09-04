const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "neymar",
    version: "3.0.0",
    author: "SK-SIDDIK-KHAN",
    role: 0,
    usePrefix: true,
    category: "fun",
    guide: "/neymar"
  },

  onStart: async ({ bot, event, message }) => {
    const chatId = event.threadID || event?.chat?.id || event?.message?.chat?.id || event?.raw?.chat?.id || message?.threadID || event?.from?.id;

    if (!chatId) return;

    const cacheDir = path.join(__dirname, "tmp");

    try {
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const links = [
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Neymar_Jr_Portrait_(149008871).jpeg",
        "https://i.imgur.com/arWjsNg.jpg",
        "https://i.imgur.com/uJYvMR0.jpg",
        "https://i.imgur.com/A3MktQ4.jpg",
        "https://i.imgur.com/wV8YHHp.jpg",
        "https://i.imgur.com/14sAFjM.jpg",
        "https://i.imgur.com/EeAi2G6.jpg",
        "https://i.imgur.com/fUZbzhJ.jpg",
        "https://i.imgur.com/bUjGSCX.jpg",
        "https://i.imgur.com/4KZvLbO.jpg",
        "https://i.imgur.com/gBEAsYZ.jpg",
        "https://i.imgur.com/baKOat0.jpg",
        "https://i.imgur.com/4Z0ERpD.jpg",
        "https://i.imgur.com/h2ReDUe.jpg",
        "https://i.imgur.com/KQPalvi.jpg",
        "https://i.imgur.com/VRALDic.jpg",
        "https://i.imgur.com/Z3qGkZa.jpg",
        "https://i.imgur.com/etyPi7B.jpg",
        "https://i.imgur.com/tMxLEwl.jpg",
        "https://i.imgur.com/OwEdlZo.jpg",
        "https://i.imgur.com/UHAo39t.jpg",
        "https://i.imgur.com/aV4EVT9.jpg",
        "https://i.imgur.com/zdC8yiG.jpg",
        "https://i.imgur.com/JI7tjsr.jpg",
        "https://i.imgur.com/fFuPCrM.jpg",
        "https://i.imgur.com/XIaAXju.jpg",
        "https://i.imgur.com/yyIJwPH.jpg",
        "https://i.imgur.com/MyGcsJM.jpg",
        "https://i.imgur.com/UXjh4R1.jpg",
        "https://i.imgur.com/QGrvMZL.jpg"
      ];

      const imgURL = links[0] || links[Math.floor(Math.random() * links.length)];

      const filePath = path.join(
        cacheDir,
        `neymar_${Date.now()}.jpg`
      );

      const res = await axios({
        url: imgURL,
        method: "GET",
        responseType: "arraybuffer",
        timeout: 15000,
        maxContentLength: 10 * 1024 * 1024,
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      if (!res.data) {
        throw new Error("Invalid image");
      }

      fs.writeFileSync(
        filePath,
        Buffer.from(res.data)
      );

      if (!fs.existsSync(filePath)) {
        throw new Error("Image download failed");
      }

      await message.sendAttachment({
        body:
          "╭━━━❮ ⚽ NEYMAR JR ❯━━━╮\n" +
          "├‣ 🇧🇷 Neymar Profile\n" +
          "├‣ 📸 Random Picture\n" +
          "╰━━━━━━━━━━━━━━━━━╯",
        attachment: filePath
      });

      try {
        fs.unlinkSync(filePath);
      } catch {}

    } catch (err) {
      console.error(
        "❌ neymar error:",
        err.message
      );

      try {
        await bot.sendMessage(
          chatId,
          "❌ Image load failed, try again!"
        );
      } catch {}
    }
  }
};