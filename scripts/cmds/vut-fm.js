module.exports = {
  config: {
    name: "vut",
    aliases: ["vutfm", "fm"],
    version: "1.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 0,
    category: "user"
  },

  onStart: async function ({ bot, event }) {
    const axios = require("axios");

    const chatId = event.threadID;

    const links = [
      "https://drive.google.com/uc?id=1DyhbJ-j-4N0dJBf7cqZ3HJlfVSqFPFNr",
      "https://drive.google.com/uc?id=1E6c3W9QcSUxxlfhPzMbM_8QAUwJGjJ20",
      "https://drive.google.com/uc?id=1E2BG1gb8T33SrFo5CkWHJACwHdv2iwdF",
      "https://drive.google.com/uc?id=1E9h0tfBCHyTZuDNZnPlifCKLxJDy9jBe",
      "https://drive.google.com/uc?id=1E2JuP8aIqW6bTqlB0yavXKxQPY1o6RPI",
      "https://drive.google.com/uc?id=1E9cK5e2vRvesVAsFeWvX7PtM-eE5I4H4",
      "https://drive.google.com/uc?id=1E103RtEOdMaVS30TXLreISz5Vg5bEkxl"
    ];

    let loadingMessage;

    try {
      loadingMessage = await bot.sendMessage(
        "Loading Vut Fm... Please Wait ⏰",
        chatId
      );

      const audio =
        links[Math.floor(Math.random() * links.length)];

      const response = await axios({
        method: "GET",
        url: audio,
        responseType: "stream"
      });

      await bot.sendAudio(
        chatId,
        response.data,
        {
          caption: "[ 🅥🅤🅣-🅕🅜 ]"
        }
      );

      setTimeout(async () => {
        try {
          if (loadingMessage?.messageID) {
            await bot.deleteMessage(
              chatId,
              loadingMessage.messageID
            );
          }
        } catch (error) {
          console.error(
            "❌ Failed to delete loading message:",
            error.message
          );
        }
      }, 800);

    } catch (error) {
      console.error("❌ vut error:", error.message);

      try {
        await bot.sendMessage(
          "❌ Vut FM audio পাঠানো যায়নি!",
          chatId
        );
      } catch (err) {
        console.error(
          "❌ Error message failed:",
          err.message
        );
      }
    }
  }
};