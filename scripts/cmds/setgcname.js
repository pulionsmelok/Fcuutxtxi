module.exports = {
  config: {
    name: "setgcname",
    aliases: ["changegcname", "gcname"],
    author: "SK-SIDDIK-KHAN",
    version: "1.0",
    cooldown: 10,
    role: 1,
    description: "Change group name with confirmation",
    category: "admin",
    usePrefix: true
  },

  onStart: async function ({ event, api, args, message, chatId, userId, ctx }) {
    if (!message.isGroup) {
      return message.reply('❌ This command can only be used in groups.');
    }

    const adminList = await api.getChatAdministrators(chatId);
    const isAdmin = adminList.some(admin => admin.user.id === userId);
    const isBotAdmin = global.GoatBot.config.adminUID.includes(String(userId));

    if (!isAdmin && !isBotAdmin) {
      return message.reply('⚠️ Only group admins can use this command.');
    }

    const botMember = adminList.find(admin => admin.user.id === (global.botInfo && global.botInfo.id));
    const botIsAdmin = !!botMember;

    if (!botIsAdmin) {
      return message.reply('❌ Bot needs admin rights to change group name.');
    }

    if (args.length === 0) {
      return message.reply(`❌ Please provide a new group name.\n\n💡 Usage: ${global.GoatBot.config.prefix}setgcname <new name>`);
    }

    const newName = args.join(' ');

    if (newName.length > 128) {
      return message.reply('❌ Group name is too long! Maximum 128 characters.');
    }

    const chat = await api.getChat(chatId);
    const currentName = chat.title;

    const confirmText = `🏷️ Change Group Name?\n\n` +
      `📂 Current Name: ${currentName}\n` +
      `📝 New Name: ${newName}\n\n` +
      `⚠️ This will change the group name for all members.\n` +
      `Click the button below to confirm.`;

    const keyboard = message.Markup.inlineKeyboard([
      [
        message.Markup.button.callback('✅ Confirm', `confirm_gcname_${chatId}`),
        message.Markup.button.callback('❌ Cancel', `cancel_gcname_${chatId}`)
      ]
    ]);

    global.onCallback.set(`confirm_gcname_${chatId}`, {
      commandName: 'setgcname',
      newName: newName,
      userId: userId,
      chatId: chatId
    });

    global.onCallback.set(`cancel_gcname_${chatId}`, {
      commandName: 'setgcname',
      userId: userId,
      chatId: chatId
    });

    return message.reply(confirmText, keyboard);
  },

  onCallback: async function ({ event, api, message, ctx }) {
    const data = event.data;
    const userId = event.from.id;

    const chatIdMatch = data.match(/_(-?\d+)$/);
    if (!chatIdMatch) return;
    
    const chatId = chatIdMatch[1];

    const callbackData = global.onCallback.get(data);
    
    if (!callbackData) {
      return ctx.answerCbQuery('❌ This action has expired!', { show_alert: true });
    }

    if (callbackData.userId !== userId) {
      return ctx.answerCbQuery('⚠️ Only the person who initiated this can confirm!', { show_alert: true });
    }

    if (data.startsWith('confirm_gcname_')) {
      try {
        const adminList = await api.getChatAdministrators(chatId);
        const botMember = adminList.find(admin => admin.user.id === (global.botInfo && global.botInfo.id));
        
        if (!botMember) {
          global.onCallback.delete(data);
          await ctx.editMessageText('❌ Bot lost admin rights! Cannot change group name.');
          return ctx.answerCbQuery('❌ Bot needs admin rights!', { show_alert: true });
        }

        await api.setChatTitle(chatId, callbackData.newName);
        
        await message.db.updateThread(chatId, { name: callbackData.newName });

        global.onCallback.delete(data);
        global.onCallback.delete(`cancel_gcname_${chatId}`);

        await ctx.editMessageText(
          `✅ Group Name Changed!\n\n` +
          `📝 New Name: ${callbackData.newName}\n` +
          `👤 Changed by: ${event.from.first_name}`
        );

        await ctx.answerCbQuery('✅ Group name changed successfully!');
      } catch (error) {
        global.onCallback.delete(data);
        await ctx.editMessageText(`❌ Error changing group name: ${error.message}`);
        await ctx.answerCbQuery('❌ Failed to change name!', { show_alert: true });
      }
    }

    if (data.startsWith('cancel_gcname_')) {
      global.onCallback.delete(`confirm_gcname_${chatId}`);
      global.onCallback.delete(data);

      await ctx.editMessageText('❌ Group name change cancelled.');
      await ctx.answerCbQuery('❌ Cancelled!');
    }
  }
};
