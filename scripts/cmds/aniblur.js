module.exports = {
  config: {
    name: "aniblur",
    aliases: [],
    version: "2.0",
    author: "SK-SIDDIK-KHAN",
    role: 0,
    usePrefix: true,
    category: "fun",
    guide: "/aniblur"
  },

  onStart: async ({ bot, event, message}) => {
    const axios = require("axios");

    const chatId = event.threadID || event?.chat?.id || event?.message?.chat?.id || event?.raw?.chat?.id || message?.threadID || event?.from?.id;

    if (!chatId) return;

    const links = [
      "https://i.postimg.cc/QdzSzcM1/image.jpg",
      "https://i.postimg.cc/QCSJJTPB/ros.jpg",
      "https://i.postimg.cc/3xkF2WZR/Cybergot-Cute-anime-pics-Dark-anime-Anime-monochrome.jpg",
      "https://i.postimg.cc/63XVscx2/Icon.jpg",
      "https://i.postimg.cc/D0YbzdHc/11.jpg",
      "https://i.postimg.cc/nLt9MLRN/12.jpg",
      "https://i.postimg.cc/2601H7kf/zod-ac.jpg",
      "https://i.postimg.cc/g0drmTrW/13.jpg",
      "https://i.postimg.cc/CKN51sff/Pin-on-icons.jpg",
      "https://i.postimg.cc/pr9LsNcD/14.jpg",
      "https://i.postimg.cc/VLCNM8Cw/anime-avatar.jpg",
      "https://i.postimg.cc/Z5my5RD2/15.jpg",
      "https://i.postimg.cc/XqFpVSKn/https-youtube-com-channel-UC3l3cgr-BNj-W5n7de68os-Fnw.jpg",
      "https://i.postimg.cc/dQd1ZFdY/Draincore-Icon-Aesthetic.jpg",
      "https://i.postimg.cc/zXFGpk02/B-L-A-C-K-P-I-N-K-balasultan-krulus-anime-gothic-edits-dp-profile-insta.jpg",
      "https://i.postimg.cc/MGvZ6Jxg/16.jpg",
      "https://i.postimg.cc/76zxz15V/Bbbb.jpg",
      "https://i.postimg.cc/Wp6VP1gh/image.jpg",
      "https://i.postimg.cc/pTfwxs9g/17.jpg",
      "https://i.postimg.cc/ZnjXv0xH/18.jpg",
      "https://i.postimg.cc/vZ4CDYg7/image.jpg",
      "https://i.postimg.cc/PfK74p1z/19.jpg",
      "https://i.postimg.cc/mrQXFtb9/Icon.jpg",
      "https://i.postimg.cc/9MbLJKwF/20.jpg",
      "https://i.postimg.cc/v8PP9Rd0/distorted.jpg"
    ];

    try {
     
      const shuffledLinks = [...new Set(links)].sort(
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
              "╭━━━❮ 🔰 ANIBLUR ❯━━━╮\n" +
              "├‣ 🎌 Anime Profile Picture\n" +
              "├‣ 📸 Random Picture\n" +
              "├‣ ✨ Aesthetic Collection\n" +
              "╰━━━━━━━━━━━━━━━━━╯"
          });

          sent = true;
          break;

        } catch (err) {
          lastError = err;

          console.log(
            "⚠️ aniblur image failed:",
            err?.message || err
          );
        }
      }

      if (!sent) {
        throw lastError || new Error("All image links failed");
      }

    } catch (err) {
      console.error(
        "❌ aniblur error:",
        err?.message || err
      );

      try {
        await bot.sendMessage(
          chatId,
          "❌ Aniblur image load failed, please try again!"
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