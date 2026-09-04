const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "listfile",
    aliases: ["ls", "dir"],
    version: "2.0.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 1,
    description: "List files or show file content",
    category: "owner",
    usePrefix: true,
    guide: { en: "{pn} <path>\nExample: /listfile scripts/cmds\n/listfile index.js" }
  },

  onStart: async function ({ api, event, args, message }) {
    try {
      const chatId = event.chat?.id;
      const userId = event.from?.id;

      const botAdmins = (global.GoatBot.config?.ownerInfo?.botAdmins || []).map(String);
      const ownerId = String(global.GoatBot.config?.ownerInfo?.mainOwner?.id || "");
      if (!botAdmins.includes(String(userId)) && String(userId) !== ownerId) {
        return message.reply("⛔ You are not authorized to use this command.");
      }

      const targetPath = args.join(" ").trim();
      if (!targetPath) {
        return message.reply("Please provide a file or folder path.\nExample: /listfile scripts/cmds");
      }

      const fullPath = path.resolve(process.cwd(), targetPath);
      if (!fullPath.startsWith(process.cwd())) {
        return message.reply("❌ Access denied.");
      }

      if (!fs.existsSync(fullPath)) {
        return message.reply("❌ Path does not exist.");
      }

      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const files = fs.readdirSync(fullPath);
        const text = `📁 Files in ${targetPath}:\n\n${files.join("\n")}`;
        if (text.length > 4000) {
          await message.reply(text.slice(0, 4000));
          if (text.length > 4000) await message.reply(text.slice(4000, 8000));
        } else {
          await message.reply(text);
        }
      } else if (stat.isFile()) {
        const content = fs.readFileSync(fullPath, "utf8");
        if (content.length > 3500) {
          return message.reply("⚠️ File too large to display (max ~3500 chars). Use /file to download.");
        }
        await message.reply(`📄 Content of ${targetPath}:\n\n${content}`);
      } else {
        await message.reply("Not a valid file or directory.");
      }
    } catch (e) {
      await message.reply("❌ Error reading the path: " + (e.message || e));
    }
  }
};
