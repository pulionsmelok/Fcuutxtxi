module.exports = {
  config: {
    name: "messi",
    aliases: ["messipic", "lm10"],
    version: "3.0",
    author: "SK-SIDDIK-KHAN",
    role: 0,
    usePrefix: true,
    category: "fun",
    guide: "/messi"
  },

  onStart: async ({ bot, event, message}) => {
    const axios = require("axios");

    const links = [
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Lionel_Messi.jpg",
      "https://i.imgur.com/ahKcoO3.jpg",
      "https://i.imgur.com/Vsf4rM3.jpg",
      "https://i.imgur.com/ximEjww.jpg",
      "https://i.imgur.com/ukYhm0D.jpg",
      "https://i.imgur.com/Poice6v.jpg",
      "https://i.imgur.com/5yMvy5Z.jpg",
      "https://i.imgur.com/ndyprcd.jpg",
      "https://i.imgur.com/Pm2gC6I.jpg",
      "https://i.imgur.com/wxxHuAG.jpg",
      "https://i.imgur.com/GwOCq59.jpg",
      "https://i.imgur.com/oM0jc4i.jpg",
      "https://i.imgur.com/dJ0OUef.jpg",
      "https://i.imgur.com/iurRGPT.jpg",
      "https://i.imgur.com/jogjche.jpg",
      "https://i.imgur.com/TiyhKjG.jpg",
      "https://i.imgur.com/AwlBM23.jpg",
      "https://i.imgur.com/9OLSXZD.jpg",
      "https://i.imgur.com/itscmiy.jpg",
      "https://i.imgur.com/FsnCelU.jpg",
      "https://i.imgur.com/c7BCwDF.jpg",
      "https://i.imgur.com/3cnR6xh.jpg",
      "https://i.imgur.com/TZqepnU.jpg",
      "https://i.imgur.com/kYxEPrD.jpg",
      "https://i.imgur.com/9ZjD5nX.jpg",
      "https://i.imgur.com/YWyI4hP.jpg"
    ];

    const chatId = event?.chat?.id || event?.from?.id;

    if (!chatId) return;

    try {
     
      const shuffledLinks = [...links].sort(() => Math.random() - 0.5);

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
            validateStatus: status => status >= 200 && status < 300
          });

          if (!res?.data) {
            throw new Error("Invalid image response");
          }

          await bot.sendPhoto(chatId, res.data, {
            caption:
              "╭━━━❮ ⚽ LIONEL MESSI ❯━━━╮\n" +
              "├‣ 🇦🇷 Messi Profile\n" +
              "├‣ 📸 Random Picture\n" +
              "├‣ 👑 DEV : SK SIDDIK\n" +
              "╰━━━━━━━━━━━━━━━━━━━╯"
          });

          sent = true;
          break;

        } catch (err) {
          lastError = err;
          console.log(
            "⚠️ Messi image failed:",
            err.message
          );
        }
      }

      if (!sent) {
        throw lastError || new Error("All image links failed");
      }

    } catch (err) {
      console.error(
        "❌ messi error:",
        err?.message || err
      );

      try {
        await bot.sendMessage(
          chatId,
          "❌ Messi image load failed, please try again!"
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
