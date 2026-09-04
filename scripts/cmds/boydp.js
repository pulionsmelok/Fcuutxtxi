module.exports = {
  config: {
    name: "boydp",
    aliases: [],
    version: "3.0.7",
    author: "SK-SIDDIK-KHAN",
    role: 0,
    usePrefix: true,
    category: "fun",
    guide: "/boydp"
  },

  onStart: async ({ bot, event, message}) => {
    const axios = require("axios");

    const chatId = event?.chat?.id || event?.from?.id;

    if (!chatId) return;

    const links = [
      "https://i.imgur.com/lGowut2.jpg",
      "https://i.imgur.com/4qDvuWi.jpg",
      "https://i.imgur.com/vu5yPzj.jpg",
      "https://i.imgur.com/ZCYaMfF.jpeg",
      "https://i.imgur.com/hSQWcAM.jpeg",
      "https://i.imgur.com/ovX6lfA.jpeg",
      "https://i.imgur.com/RgfrYpM.jpeg",
      "https://i.imgur.com/DfvFLov.jpeg",
      "https://i.imgur.com/GPwbrDj.jpeg",
      "https://i.imgur.com/jSifYwo.jpeg",
      "https://i.imgur.com/Chc5pLl.jpeg",
      "https://i.imgur.com/HbznJXK.jpeg",
      "https://i.imgur.com/OLKdt61.jpeg",
      "https://i.imgur.com/tDNqmML.jpeg",
      "https://i.imgur.com/yUwx4o4.jpeg",
      "https://i.imgur.com/e4xWHUv.jpeg",
      "https://i.imgur.com/q6LfLx0.jpeg",
      "https://i.imgur.com/eoKKdzI.jpeg",
      "https://i.imgur.com/n3DS2ha.jpeg",
      "https://i.imgur.com/E5QWGCE.jpeg",
      "https://i.imgur.com/44YNGf6.jpeg",
      "https://i.imgur.com/fh8i2Ph.jpeg",
      "https://i.imgur.com/EMazlEj.jpeg",
      "https://i.imgur.com/Uz4RQSg.jpeg",
      "https://i.imgur.com/INxT1BF.jpeg",
      "https://i.imgur.com/jnU2FrO.jpeg",
      "https://i.imgur.com/qFDKN6v.jpeg",
      "https://i.imgur.com/m84lelb.jpeg",
      "https://i.imgur.com/FmMsaOR.jpeg",
      "https://i.imgur.com/Ln7It9C.jpeg",
      "https://i.imgur.com/SZ9KznS.jpeg",
      "https://i.imgur.com/WypMeee.jpeg",
      "https://i.imgur.com/Zq9sgX0.jpeg",
      "https://i.imgur.com/kIvSt9A.jpeg",
      "https://i.imgur.com/g3R1fQh.jpeg",
      "https://i.imgur.com/jv1LGtq.jpeg",
      "https://i.imgur.com/lKkm83o.jpeg",
      "https://i.imgur.com/Yuai95W.jpeg",
      "https://i.imgur.com/FNWIrNo.jpeg",
      "https://i.imgur.com/YUOScB2.jpeg",
      "https://i.imgur.com/Gd8K8Cg.jpeg",
      "https://i.imgur.com/R0mvOeZ.jpeg",
      "https://i.imgur.com/GGLiv35.jpeg",
      "https://i.imgur.com/b4hHhSk.jpeg",
      "https://i.imgur.com/45QWr06.jpeg",
      "https://i.imgur.com/uz7bh1h.jpeg",
      "https://i.imgur.com/7blSNAk.jpeg",
      "https://i.imgur.com/r11VKsm.jpeg",
      "https://i.imgur.com/4NyGJmu.jpeg",
      "https://i.imgur.com/HMMe7fV.jpeg",
      "https://i.imgur.com/447Dsfb.jpeg",
      "https://i.imgur.com/BsfPGOF.jpeg",
      "https://i.imgur.com/h0C5puK.jpeg",
      "https://i.imgur.com/qpgBE0X.jpeg",
      "https://i.imgur.com/f0HFaCv.jpeg",
      "https://i.imgur.com/a4vo9Cv.jpeg",
      "https://i.imgur.com/J7PAAuR.jpeg",
      "https://i.imgur.com/OG7CCAz.jpeg",
      "https://i.imgur.com/tqnzYDJ.jpeg",
      "https://i.imgur.com/3ItPOnW.jpeg",
      "https://i.imgur.com/yCkue9w.jpeg",
      "https://i.imgur.com/jx6VfM6.jpeg",
      "https://i.imgur.com/52cEmKs.jpg",
      "https://i.imgur.com/9xLfitZ.jpg",
      "https://i.imgur.com/RJ3Lou6.jpg",
      "https://i.imgur.com/dwAKjDy.jpg",
      "https://i.imgur.com/qBlbbCX.jpg"
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
              "╭━━━❮ 👤 BOY DP ❯━━━╮\n" +
              "├‣ 📸 Random Profile Picture\n" +
              "├‣ ✨ HD Collection\n" +
              "╰━━━━━━━━━━━━━━━━━╯\n\n" +
              "𝐌𝐀𝐃𝐄 𝐁𝐘 𝐒𝐊 𝐒𝐈𝐃𝐃𝐈𝐊"
          });

          sent = true;
          break;

        } catch (err) {
          lastError = err;

          console.log(
            "⚠️ boydp image failed:",
            err?.message || err
          );
        }
      }

      if (!sent) {
        throw lastError || new Error("All image links failed");
      }

    } catch (err) {
      console.error(
        "❌ boydp error:",
        err?.message || err
      );

      try {
        await bot.sendMessage(
          chatId,
          "❌ Image load failed, please try again!"
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