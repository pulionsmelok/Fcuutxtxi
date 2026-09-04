module.exports = {
  config: { name: "admin", version: "1.0", author: "Telegram", countDown: 5, role: 0, category: "system" },
  onStart: async function ({ api, event, args }) {
    const admins = global.GoatBot?.config?.adminBot || global.adminIDs || [];
    const id = String(event.senderID);
    if (!admins.map(String).includes(id))
      return message.reply("❌ You are not a bot admin.");
    return message.reply(args.length ? `✅ Bot admin command: ${args.join(" ")}` : "✅ You are a bot admin.");
  }
};