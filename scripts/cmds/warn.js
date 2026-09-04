
module.exports = {
  config: {
    name: "warn",
    aliases: ["warning"],
    author: "SK-SIDDIK-KHAN",
    version: "2.0.0",
    cooldown: 3,
    role: 1,
    description: "Warn users (3 warnings = auto ban and kick)\n\nUsage:\n- Reply to user's message: /warn [reason]\n- By UID: /warn <user_id> [reason]",
    category: "admin",
    usePrefix: true
  },

  onStart: async function ({ event, api, args, message, bot}) {
    try {
      if (event.chat.type !== 'group' && event.chat.type !== 'supergroup') {
        return message.reply('❌ This command can only be used in groups');
      }

      const chatId = String(event.chat.id);
      let targetId = null;
      let targetName = 'User';
      let reason = '';

      if (event.reply_to_message && event.reply_to_message.from) {
        targetId = String(event.reply_to_message.from.id);
        targetName = event.reply_to_message.from.first_name || 'User';
        reason = args.join(' ') || 'No reason provided';
      }
      else if (args[0] && /^\d+$/.test(args[0])) {
        targetId = String(args[0]);
        reason = args.slice(1).join(' ') || 'No reason provided';

        try {
          const chat = await api.getChat(targetId);
          targetName = chat.first_name || 'User';
        } catch (err) {
          targetName = 'User';
        }
      }
      else if (event.entities) {
        const mention = event.entities.find(e => e.type === 'text_mention');
        if (mention && mention.user) {
          targetId = String(mention.user.id);
          targetName = mention.user.first_name || 'User';
          reason = args.join(' ') || 'No reason provided';
        }
      }

      if (!targetId) {
        return message.reply(
          `❌ Usage:\n` +
          `• ${global.GoatBot.config.prefix}warn [reason] - Reply to user's message\n` +
          `• ${global.GoatBot.config.prefix}warn <user_id> [reason] - Warn by UID\n` +
          `• ${global.GoatBot.config.prefix}warn @mention [reason] - Warn mentioned user`
        );
      }

      if (global.GoatBot.config.adminUID.includes(targetId)) {
        return message.reply('❌ Cannot warn bot admins');
      }

      const warnCount = await global.db.addWarning(
        targetId,
        chatId,
        reason,
        String(event.from.id)
      );

      const mentionText = `[${targetName}](tg://user?id=${targetId})`;

      if (warnCount >= 3) {
        await global.db.banUser(targetId, '3 warnings in group', String(event.from.id));
        await global.db.clearWarnings(targetId, chatId);

        try {
          await api.banChatMember(chatId, parseInt(targetId));
          await message.reply(
            `⚠️ ${mentionText} has been warned!\n\n` +
            `📝 Reason: ${reason}\n` +
            `⚠️ Warnings: ${warnCount}/3\n\n` +
            `❌ User reached 3 warnings and has been banned and kicked from the group!`,
            { parse_mode: 'Markdown' }
          );
        } catch (err) {
          await message.reply(
            `⚠️ User banned but failed to kick: ${err.message}`,
            { parse_mode: 'Markdown' }
          );
        }
      } else {
        await message.reply(
          `⚠️ ${mentionText} has been warned!\n\n` +
          `📝 Reason: ${reason}\n` +
          `⚠️ Warnings: ${warnCount}/3\n\n` +
          `💡 Note: 3 warnings will result in ban and kick from group.`,
          { parse_mode: 'Markdown' }
        );
      }

    } catch (error) {
      console.error('Error in warn command:', error);
      await message.reply(`❌ Error: ${error.message}`);
    }
  }
};
