module.exports = {
  config: {
    name: "spy",
    aliases: [],
    version: "1.0",
    credits: "S1DD1K",
    role: 0,
    usePrefix: true,
    description: "Get information about a user, including their bio and avatar",
    category: "utility",
    guide: "[user_id]",
    coolDowns: 5
  },

  onStart: async ({ bot, event, args, message}) => {
    try {
      const chatId = event.chat?.id;

      if (!chatId) return;

      const userId =
        event.reply_to_message?.from?.id ||
        args?.[0] ||
        event.from?.id;

      if (!userId) {
        return bot.sendMessage(
          chatId,
          "❌ User not found"
        );
      }

      const user = await bot.getChat(userId);

      const userProfile = await bot.getUserProfilePhotos(userId);

      const bio = user.bio || "No bio available";

      const fullName =
        `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
        "No name";

      const username = user.username
        ? `@${user.username}`
        : "No username";

      const status = user.is_bot ? "Bot" : "User";

      const userLink = user.username
        ? `https://t.me/${user.username}`
        : `tg://user?id=${userId}`;

      let infoMessage = `
╭──✦ [ 𝐔𝐬𝐞𝐫 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 ]
├‣ 🆔 𝚄𝚜𝚎𝚛 𝙸𝙳: ${userId}
├‣ 👤 𝙵𝚞𝚕𝚕 𝙽𝚊𝚖𝚎: ${fullName}
├‣ 📱 𝚄𝚜𝚎𝚛𝚗𝚊𝚖𝚎: ${username}
├‣ 📝 𝙱𝚒𝚘: ${bio}
├‣ 📊 𝚂𝚝𝚊𝚝𝚞𝚜: ${status}
╰‣ 🔗 𝚄𝚜𝚎𝚛 𝙻𝚒𝚗𝚔: ${userLink}`;

      if (
        userProfile &&
        userProfile.total_count > 0 &&
        userProfile.photos?.[0]?.[0]?.file_id
      ) {
        const photoFileId = userProfile.photos[0][0].file_id;

        await bot.sendPhoto(
          chatId,
          photoFileId,
          {
            caption: infoMessage,
            reply_to_message_id: event.message_id
          }
        );
      } else {
        await bot.sendMessage(
          chatId,
          infoMessage,
          {
            reply_to_message_id: event.message_id
          }
        );
      }

    } catch (err) {
      console.log("❌ spy error:", err.message);

      await bot.sendMessage(
        event.chat?.id,
        `❌ Failed to get user information\n\nReason: ${err.message || "Unknown error"}`
      );
    }
  }
};