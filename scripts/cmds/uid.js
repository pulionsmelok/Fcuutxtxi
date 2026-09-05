module.exports = {
  config: {
    name: "uid",
    aliases: ["userid", "id"],
    version: "1.0.0",
    author: "SK-SIDDIK-KHAN",
    description: "ইউজারের আইডি এবং প্রোফাইল ডিটেইলস দেখাবে।",
    category: "utility",
    role: 0,
    usePrefix: true,
    cooldown: 0
  },

  onStart: async ({ bot, event, message }) => {
    try {
      const chatId =
        event?.chat?.id ||
        event?.from?.id;

      if (!chatId) return;

      const targetUser =
        event?.reply_to_message?.from ||
        event?.from;

      if (!targetUser?.id) {
        return message.reply(
          "❌ user not found"
        );
      }

      const userId = targetUser.id;
      const firstName =
        targetUser.first_name || "N/A";

      const username = targetUser.username
        ? `@${targetUser.username}`
        : "N/A";

      const caption =
        `<b>👤 USER INFO</b>\n` +
        `━━━━━━━━━━━━━━━\n` +
        `<b>🪪 Name:</b> ${firstName}\n` +
        `<b>🔗 Username:</b> ${username}\n` +
        `<b>🆔 UID:</b> <code>${userId}</code>\n` +
        `━━━━━━━━━━━━━━━\n` +
        `<b>⚡ DEV: SK SIDDIK</b>`;

      try {
        const photos =
          await bot.getUserProfilePhotos(
            userId,
            { limit: 1 }
          );

        if (
          photos?.total_count > 0 &&
          photos?.photos?.[0]?.[0]?.file_id
        ) {
          const fileId =
            photos.photos[0][0].file_id;

          return await bot.sendPhoto(
            chatId,
            fileId,
            {
              caption,
              parse_mode: "HTML",
              reply_to_message_id:
                event?.message_id
            }
          );
        }
      } catch (photoErr) {
        console.error(
          "Profile Photo Error:",
          photoErr.message
        );
      }

      return bot.sendMessage(
        chatId,
        caption +
          `\n\n<i>⚠️ প্রোফাইল পিকচার নেই</i>`,
        {
          parse_mode: "HTML",
          reply_to_message_id:
            event?.message_id
        }
      );

    } catch (err) {
      console.error("UID Error:", err);

      return message.reply(
        "❌ তথ্য আনতে সমস্যা হয়েছে।"
      );
    }
  }
};
