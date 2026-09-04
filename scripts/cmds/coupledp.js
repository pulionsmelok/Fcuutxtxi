module.exports = {
  config: {
    name: "coupledp",
    aliases: [],
    version: "3.0.5",
    author: "SK-SIDDIK-KHAN",
    role: 0,
    usePrefix: true,
    category: "fun",
    guide: "/coupledp"
  },

  onStart: async ({ bot, event, message}) => {
    const axios = require("axios");

    const chatId = event.threadID || event?.chat?.id || event?.message?.chat?.id || event?.raw?.chat?.id || message?.threadID || event?.from?.id;

    if (!chatId) return;

    const links = [
      "https://i.imgur.com/g7woYNY.jpg",
      "https://i.postimg.cc/BnhsHvyZ/received-1191220331561614.jpg",
      "https://i.postimg.cc/ZRX53qWv/received-1202819107059319.jpg",
      "https://i.postimg.cc/yNd1bR9S/received-1277919869496358.jpg",
      "https://i.postimg.cc/VNp8ZVm3/received-1370966393798998.jpg",
      "https://i.postimg.cc/YC2MvFdy/received-1410207299549627.jpg",
      "https://i.postimg.cc/s2DxCqFx/received-1575640496421558.jpg",
      "https://i.postimg.cc/hvFKv3Y9/received-189991853831346.jpg",
      "https://i.postimg.cc/1RNtSDdG/received-201915739517704.jpg",
      "https://i.postimg.cc/HsgpCRXm/received-2104226693113547.jpg",
      "https://i.postimg.cc/j5frp4jC/received-235206272677545.jpg",
      "https://i.postimg.cc/WbG1FTTt/received-235360602731729.jpg",
      "https://i.postimg.cc/xjH0hnkg/received-255099287260206.jpg",
      "https://i.postimg.cc/m2yTZjyH/received-3505135599701479.jpg",
      "https://i.postimg.cc/qvpM2Svw/received-605119934945053.jpg",
      "https://i.postimg.cc/pT522tsW/received-607001748245024.jpg",
      "https://i.postimg.cc/5ywbCScD/received-642702237806079.jpg",
      "https://i.postimg.cc/tJPCzH6S/received-6447490728654057.jpg",
      "https://i.postimg.cc/mkGGB1cj/received-667269661468341.jpg",
      "https://i.postimg.cc/nrYfzVBJ/received-712080477598648.jpg",
      "https://i.postimg.cc/7Ls6H9DV/received-778471177337750.jpg",
      "https://i.postimg.cc/J4VhzGw9/received-822897445855051.jpg",
      "https://i.postimg.cc/g0TzF0qt/received-836313448160197.jpg",
      "https://i.postimg.cc/g24csswW/received-950979049537517.jpg",
      "https://i.postimg.cc/Kz1YRT8y/received-990740405680183.jpg",
      "https://i.imgur.com/0jDiNmQ.jpg",
      "https://i.imgur.com/3OX7sWP.jpg",
      "https://i.imgur.com/IthNc1C.jpg",
      "https://i.imgur.com/1RoN4la.jpg",
      "https://i.imgur.com/vcfIO27.jpg",
      "https://i.imgur.com/8yWRoMe.jpg",
      "https://i.imgur.com/nku8dTF.jpg",
      "https://i.imgur.com/V32qQb0.jpg",
      "https://i.imgur.com/lkem5Gd.jpg",
      "https://i.imgur.com/QIpV0AY.jpg",
      "https://i.imgur.com/zdnDEtm.jpg",
      "https://i.imgur.com/w7eKGSy.jpg",
      "https://i.imgur.com/ONCJm5B.jpg",
      "https://i.imgur.com/oQavLMr.jpg",
      "https://i.imgur.com/MuBToNp.jpg",
      "https://i.imgur.com/JrMY7j8.jpg",
      "https://i.imgur.com/MauPoyi.jpg",
      "https://i.imgur.com/t1B6vz1.jpg",
      "https://i.imgur.com/VT200cX.jpg",
      "https://i.imgur.com/9HTasfZ.jpg",
      "https://i.imgur.com/waeDhYd.jpg",
      "https://i.imgur.com/5dHsVO8.jpg",
      "https://i.imgur.com/rrWIcrz.jpg",
      "https://i.imgur.com/nEVUP1b.jpg",
      "https://i.imgur.com/iHqdCMp.jpg",
      "https://i.imgur.com/YHsbqM7.jpg",
      "https://i.imgur.com/5ZQOCmT.jpg",
      "https://i.imgur.com/AvoyQyk.jpg",
      "https://i.imgur.com/MCuS0xn.jpg",
      "https://i.imgur.com/c8yiwxR.jpg"
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
              "╭━━━❮ 💕 COUPLE DP ❯━━━╮\n" +
              "├‣ 👫 Couple Profile Picture\n" +
              "├‣ 📸 Random Picture\n" +
              "├‣ ✨ Cute Collection\n" +
              "╰━━━━━━━━━━━━━━━━━╯\n\n" +
              "𝐌𝐀𝐃𝐄 𝐁𝐘 𝐒𝐊 𝐒𝐈𝐃𝐃𝐈𝐊"
          });

          sent = true;
          break;

        } catch (err) {
          lastError = err;

          console.log(
            "⚠️ coupledp image failed:",
            err?.message || err
          );
        }
      }

      if (!sent) {
        throw lastError || new Error("All image links failed");
      }

    } catch (err) {
      console.error(
        "❌ coupledp error:",
        err?.message || err
      );

      try {
        await bot.sendMessage(
          chatId,
          "❌ Couple DP image load failed, please try again!"
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