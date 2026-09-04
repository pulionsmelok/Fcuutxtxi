module.exports = {
  config: {
    name: "join",
    aliases: ["joinlist", "groups"],
    version: "1.0-JSON",
    author: "MOHAMMAD BADOL (converted)",
    countDown: 5,
    role: 2,
    description: {
      en: "Show groups the bot is in"
    },
    category: "admin",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event, message, threadsData }) {
    try {
      let allThreads = [];
      try {
        allThreads = await threadsData.getAll();
      } catch {
        allThreads = global.db?.allThreadData || [];
      }

      const groups = (allThreads || []).filter(t => {
        const id = String(t.threadID || t.id || "");
        return id.startsWith("-") || (t.threadID && String(t.threadID).length > 10);
      });

      if (groups.length === 0) return message.reply("No groups in database!");

      let text = `╭─❖─〔 JOIN GROUPS 〕─❖─╮\n`;
      text += `│ ✅ Total Groups: ${groups.length}\n`;
      text += `╰─❖─〔 Goat Bot 〕─❖─╯\n\n`;

      groups.slice(0, 30).forEach((g, i) => {
        const id = g.threadID || g.id;
        const name = g.threadName || g.name || "Unknown";
        text += `${i + 1}. ${name}\n🆔 ${id}\n\n`;
      });

      if (groups.length > 30) text += `... and ${groups.length - 30} more`;

      return message.reply(text);
    } catch (e) {
      return message.reply(`Error: ${e.message}`);
    }
  }
};
