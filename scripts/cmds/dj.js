module.exports = {
  config: {
    name: "dj",
    version: "3.0.0",
    author: "SK-SIDDIK-KHAN",
    role: 0,
    usePrefix: true,
    category: "media",
    guide: "/dj"
  },

  onStart: async ({ bot, event }) => {
    const axios = require("axios");

    const chatId = event?.threadID || event?.chat?.id || event?.message?.chat?.id || event?.raw?.chat?.id || event?.from?.id;

    if (!chatId) return;

    const links = [
      "https://drive.google.com/uc?id=1C4XLaxrHJwcwT-uEMdzZb4Y-oQ98nS0p",
      "https://drive.google.com/uc?id=1B9VwVFRw-d2r__HTyGxfin3r6QFdGN9K",
      "https://drive.google.com/uc?id=1B9gArnCkpo1801TjiSAuvlVtAdIQP57k",
      "https://drive.google.com/uc?id=1C0iPpXrTWvBOqkKDEEwSo9i7u_9AVyg8",
      "https://drive.google.com/uc?id=1BDIcusE7B9jELmr6lvciFP-puWfy3WXs",
      "https://drive.google.com/uc?id=1C04Pul6GTyzfOQlRLmDk8eGK9z-q3BmA",
      "https://drive.google.com/uc?id=1BNH2gUTtD5zBaTnMDY08pQ4CIGq3Lriw",
      "https://drive.google.com/uc?id=1BUYSSL8poh9icrlp3YOTV5IiYrn7iHAW",
      "https://drive.google.com/uc?id=1BwqorvYxglPa6vptXlLXpI92g3LZBG9C",
      "https://drive.google.com/uc?id=1BbVCsUECiAcZBG95CYuobYpg-wTNtrTL",
      "https://drive.google.com/uc?id=1BSnn0ku6C0DYdlFtnErqKDOuAWhdqmBJ",
      "https://drive.google.com/uc?id=1BYSqt8wKUkZnULVq_W-5O2jC4O-mfLSA"
    ];

    let loading = null;

    try {
      loading = await bot.sendMessage(
        chatId,
        "🎧 Loading DJ Audio... Please Wait ⏰"
      );

      const shuffledLinks = [...new Set(links)].sort(
        () => Math.random() - 0.5
      );

      let sent = false;
      let lastError = null;
      for (const audioURL of shuffledLinks.slice(0, 3)) {
        try {
          const res = await axios({
            url: audioURL,
            method: "GET",
            responseType: "stream",
            timeout: 30000,
            maxContentLength: 50 * 1024 * 1024,
            headers: {
              "User-Agent": "Mozilla/5.0"
            },
            maxRedirects: 5,
            validateStatus: status =>
              status >= 200 && status < 300
          });

          if (!res?.data) {
            throw new Error("Invalid audio response");
          }

          await bot.sendAudio(chatId, res.data, {
            caption: "╭━━━❮ 🎧 DJ MUSIC ❯━━━╮\n" +
              "├‣ 🔊 DJ Audio\n" +
              "├‣ 🎵 Enjoy The Music\n" +
              "╰━━━━━━━━━━━━━━━━╯"
          });

          sent = true;
          break;

        } catch (err) {
          lastError = err;

          console.log(
            "⚠️ DJ audio failed:",
            err?.message || err
          );
        }
      }

      if (!sent) {
        throw lastError || new Error("All audio links failed");
      }

    } catch (err) {
      console.error(
        "❌ dj error:",
        err?.message || err
      );

      try {
        await bot.sendMessage(
          chatId,
          "❌ Failed to load DJ music, please try again!"
        );
      } catch (sendErr) {
        console.error(
          "❌ Error message failed:",
          sendErr?.message || sendErr
        );
      }

    } finally {
     
      if (loading?.message_id) {
        try {
          await bot.deleteMessage(
            chatId,
            loading.message_id
          );
        } catch {}
      }
    }
  }
};