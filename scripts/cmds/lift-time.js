module.exports = {
  config: {
    name: "lift",
    version: "1.1",
    author: "SK-SIDDIK-KHAN",
    cooldown: 5,
    role: 2,
    category: "admin",
    usePrefix: false
  },

  onStart: async function ({ message, event, args, bot }) {

    const delayMinutes = parseInt(args[0]);

    if (!args[0] || isNaN(delayMinutes) || delayMinutes <= 0) {
      return message.reply("⚠️ | Use: lift <minute>");
    }

    const chatId = event.threadID || event?.chat?.id || event?.message?.chat?.id || event?.raw?.chat?.id || message?.threadID || event?.from?.id;

    if (!chatId) {
      return console.log("❌ | chatId not found!");
    }

    message.reply(
`╭──────────────⊙
├─☾ JUST WAIT
├─☾ ${delayMinutes} MINUTE
├─☾ SK SIDDIK KHAN
╰──────────────⊙`
    );

    setTimeout(() => {
      console.log("⏳ | Time finished, leaving group...");

      if (bot?.leaveChat) {
        bot.leaveChat(chatId)
          .then(() => {
            console.log("✅ | Bot left successfully");
          })
          .catch(err => {
            if (err?.response?.statusCode === 403) {
              console.log("⚠️| Bot already left the group");
            } else {
              console.error("❌ | Lift Error:", err);
            }
          });
      } else {
        console.log("❌ | leaveChat function not found");
      }

    }, delayMinutes * 60 * 1000);
  }
};
