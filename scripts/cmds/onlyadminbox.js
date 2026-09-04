module.exports = {
  config: { name: "onlyadminbox", version: "1.0", author: "Telegram", countDown: 5, role: 0, category: "system" },
  onStart: async function ({ api, event, bot }) {
    try {
      const member = await bot.getChatMember(Number(event.threadID), Number(event.senderID));
      const allowed = ["creator", "administrator"].includes(member.status);
      return api.sendMessage(
        allowed ? "✅ You are a Telegram group admin." : "❌ Only Telegram group admins can use this command.",
        event.threadID
      );
    } catch (error) {
      return message.reply("❌ This command must be used in a Telegram group where the bot can check members.");
    }
  }
};