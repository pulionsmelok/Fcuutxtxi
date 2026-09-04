module.exports = {
  config: {
    name: "threadinfo",
    aliases: ["tinfo", "tidinfo"],
    version: "5.0",
    author: "SK-SIDDIK-KHAN",
    role: 0,
    usePrefix: true,
    category: "info",
    guide: "[]"
  },

  onStart: async ({ bot, event, args, message}) => {
    try {
      const chatId = event.chat?.id;

      if (!chatId) return;

      const chat = await bot.getChat(chatId);

      let infoMessage = `╭───[ ᰔᩚ 𝙂𝙍𝙊𝙐𝙋 𝙄𝙉𝙁𝙊࿐ ]\n`;

      infoMessage += `╰‣⊰ 𝙶𝚛𝚘𝚞𝚙 𝙽𝚊𝚖𝚎: ${chat.title || "N/A"}\n`;
      infoMessage += `╰‣⊰ 𝚃𝚢𝚙𝚎: ${chat.type || "N/A"}\n`;
      infoMessage += `╰‣⊰ 𝚃𝙸𝙳: ${chat.id || chatId}\n`;

      if (chat.description) {
        infoMessage += `╰‣⊰ 𝙳𝚎𝚜𝚌𝚛𝚒𝚙𝚝𝚒𝚘𝚗: ${chat.description}\n`;
      }

      if (chat.invite_link) {
        infoMessage += `╰‣⊰ 𝙸𝚗𝚟𝚒𝚝𝚎 𝙻𝚒𝚗𝚔: ${chat.invite_link}\n`;
      }

      await bot.sendMessage(
        chatId,
        infoMessage,
        {
          reply_to_message_id: event.message_id
        }
      );

    } catch (err) {
      console.log("❌ threadinfo error:", err.message);

      await bot.sendMessage(
        event.chat?.id,
        "❌ Failed to get group information"
      );
    }
  }
};