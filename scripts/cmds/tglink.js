module.exports = {
  config: {
    name: "tglink",
    aliases: ["linktg"],
    version: "5.0",
    author: "SK-SIDDIK-KHAN",
    role: 0,
    usePrefix: false,
    category: "utility",
    guide: "/linkth (reply / mention / id)"
  },

  onStart: async ({ bot, event, args, message}) => {
    try {
      const chatId = event.chat?.id;
      if (!chatId) return;

      let userId = null;
      let username = null;

      if (event.reply_to_message) {
        userId = event.reply_to_message.from?.id;
        username = event.reply_to_message.from?.username;
      }

      else if (event.entities) {
        for (const ent of event.entities) {

          if (ent.type === "mention") {
            username = event.text.substring(
              ent.offset,
              ent.offset + ent.length
            ).replace("@", "");
          }

          if (ent.type === "text_mention") {
            userId = ent.user?.id;
            username = ent.user?.username;
          }
        }
      }

      if (!userId && args[0]) {
        userId = args[0];
      }

      if (!userId) {
        userId = event.from?.id;
        username = event.from?.username;
      }

      if (!userId && !username) {
        return bot.sendMessage(chatId, "❌ User not found");
      }

      let link;

      if (username) {
        link = `https://t.me/${username}`;
      } else {
        link = `tg://user?id=${userId}`;
      }

      await bot.sendMessage(chatId,
        `🔗 Profile Link:\n${link}`,
        { reply_to_message_id: event.message_id }
      );

    } catch (err) {
      console.log("❌ tglink error:", err.message);
      try {
        if (event.chat?.id) {
          await bot.sendMessage(
            event.chat.id,
            "❌ Failed to get profile link"
          );
        }
      } catch (_) {}
    }
  }
};
