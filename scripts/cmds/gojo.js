module.exports = {
  config: {
    name: "gojo",
    aliases: ["gojopic", "gojophoto"],
    version: "3.0.0",
    author: "SK-SIDDIK-KHAN",
    role: 0,
    usePrefix: true,
    category: "fun",
    guide: "/gojo"
  },

  onStart: async ({ bot, event, message}) => {
    const axios = require("axios");

    const chatId = event.threadID || event?.chat?.id || event?.message?.chat?.id || event?.raw?.chat?.id || message?.threadID || event?.from?.id;

    if (!chatId) return;

    const links = [
      "https://i.imgur.com/RKTWov0.jpeg",
      "https://i.imgur.com/vBocwop.jpeg",
      "https://i.imgur.com/tTZsRfh.jpeg",
      "https://i.imgur.com/yT69Sac.jpeg",
      "https://i.imgur.com/1qWJ1vy.jpeg",
      "https://i.imgur.com/Xc2uBRl.jpeg",
      "https://i.imgur.com/kU4R0XK.jpeg",
      "https://i.imgur.com/hwFV9Sq.jpeg",
      "https://i.imgur.com/T48CEO6.jpeg",
      "https://i.imgur.com/W8GfqZN.jpeg",
      "https://i.imgur.com/zkApVTb.jpeg",
      "https://i.imgur.com/emUbsFl.jpeg",
      "https://i.imgur.com/WYBJMjm.jpeg",
      "https://i.imgur.com/QHQGDBj.jpeg",
      "https://i.imgur.com/vtCL7i6.jpeg",
      "https://i.imgur.com/2RDEUIR.jpeg",
      "https://i.imgur.com/AnqajiQ.jpeg",
      "https://i.imgur.com/NinTb5o.jpeg",
      "https://i.imgur.com/QgBL32P.jpeg",
      "https://i.imgur.com/gME3HeC.jpeg",
      "https://i.imgur.com/OcVyAEg.jpeg"
    ];

    try {
   
      const shuffledLinks = [...links].sort(
        () => Math.random() - 0.5
      );

      let sent = false;
      let lastError = null;
      for (const imgURL of shuffledLinks.slice(0, 3)) {
        try {
          const res = await axios({
            url: imgURL,
            method: "GET",
            responseType: "stream",
            timeout: 15000,
            maxContentLength: 10 * 1024 * 1024,
            headers: {
              "User-Agent": "Mozilla/5.0"
            },
            validateStatus: status =>
              status >= 200 && status < 300
          });

          if (!res?.data) {
            throw new Error("Invalid image response");
          }

          await bot.sendPhoto(chatId, res.data, {
            caption:
              "╭━━━❮ 🔥 GOJO SATORU ❯━━━╮\n" +
              "├‣ 👁️ The Strongest\n" +
              "├‣ 📸 Random Picture\n" +
              "├‣ ⚡ Limitless\n" +
              "╰━━━━━━━━━━━━━━━━━━━╯"
          });

          sent = true;
          break;

        } catch (err) {
          lastError = err;

          console.log(
            "⚠️ Gojo image failed:",
            err?.message || err
          );
        }
      }

      if (!sent) {
        throw lastError || new Error("All image links failed");
      }

    } catch (err) {
      console.error(
        "❌ gojo error:",
        err?.message || err
      );

      try {
        await bot.sendMessage(
          chatId,
          "❌ Gojo image load failed, please try again!"
        );
      } catch (sendErr) {
        console.error(
          "❌ Error message failed:",
          sendErr?.message || sendErr
        );
      }
    }
  }
};