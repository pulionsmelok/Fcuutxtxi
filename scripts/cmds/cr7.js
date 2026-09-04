module.exports = {
  config: {
    name: "cr7",
    aliases: [],
    version: "3.0.4",
    author: "SK-SIDDIK-KHAN",
    role: 0,
    usePrefix: true,
    category: "fun",
    guide: "/cr7"
  },

  onStart: async ({ bot, event, message}) => {
    const axios = require("axios");

    const chatId = event.threadID || event?.chat?.id || event?.message?.chat?.id || event?.raw?.chat?.id || message?.threadID || event?.from?.id;

    if (!chatId) return;

    const links = [
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Cristiano_Ronaldo.jpg",
      "https://i.imgur.com/gwAuLMT.jpg",
      "https://i.imgur.com/MuuhaJ4.jpg",
      "https://i.imgur.com/6t0R8fs.jpg",
      "https://i.imgur.com/7RTC4W5.jpg",
      "https://i.imgur.com/VTi2dTP.jpg",
      "https://i.imgur.com/gdXJaK9.jpg",
      "https://i.imgur.com/VqZp7IU.jpg",
      "https://i.imgur.com/9pio8Lb.jpg",
      "https://i.imgur.com/iw714Ym.jpg",
      "https://i.imgur.com/zFbcrjs.jpg",
      "https://i.imgur.com/e0td0K9.jpg",
      "https://i.imgur.com/gsJWOmA.jpg",
      "https://i.imgur.com/lU8CaT0.jpg",
      "https://i.imgur.com/mmZXEYl.jpg",
      "https://i.imgur.com/d2Ot9pW.jpg",
      "https://i.imgur.com/iJ1ZGwZ.jpg",
      "https://i.imgur.com/isqQhNQ.jpg",
      "https://i.imgur.com/GoKEy4g.jpg",
      "https://i.imgur.com/TjxTUsl.jpg",
      "https://i.imgur.com/VwPPL03.jpg",
      "https://i.imgur.com/45zAhI7.jpg",
      "https://i.imgur.com/n3agkNi.jpg",
      "https://i.imgur.com/F2mynhI.jpg",
      "https://i.imgur.com/XekHaDO.jpg"
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
              "╭━━━❮ 🐐 CR7 ❯━━━╮\n" +
              "├‣ 🇵🇹 Cristiano Ronaldo\n" +
              "├‣ 📸 Random Picture\n" +
              "├‣ ⚽ Football Legend\n" +
              "╰━━━━━━━━━━━━━━━━━╯"
          });

          sent = true;
          break;

        } catch (err) {
          lastError = err;

          console.log(
            "⚠️ CR7 image failed:",
            err?.message || err
          );
        }
      }

      if (!sent) {
        throw lastError || new Error("All image links failed");
      }

    } catch (err) {
      console.error(
        "❌ cr7 error:",
        err?.message || err
      );

      try {
        await bot.sendMessage(
          chatId,
          "❌ Ronaldo image load failed, please try again!"
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