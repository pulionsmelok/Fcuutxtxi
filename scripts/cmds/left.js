module.exports = {
  config: {
    name: "left",
    aliases: ["leave"],
    version: "6.2-JSON",
    author: "MOHAMMAD BADOL (converted)",
    countDown: 5,
    role: 2,
    description: {
      en: "Leave groups (by ID or list)"
    },
    category: "admin",
    guide: {
      en: "{pn} list\n{pn} <threadID>\n{pn} all"
    }
  },

  onStart: async function ({ api, event, args, message, threadsData }) {
    const sub = (args[0] || "").toLowerCase();

    let allThreads = [];
    try { allThreads = await threadsData.getAll(); } catch { allThreads = global.db?.allThreadData || []; }

    const groups = (allThreads || []).filter(t => {
      const id = String(t.threadID || t.id || "");
      return id.startsWith("-") || id.length > 10;
    });

    if (sub === "list" || !sub) {
      if (groups.length === 0) return message.reply("No groups found!");
      let text = `BOT GROUPS: ${groups.length}\n\n`;
      groups.slice(0, 20).forEach((g, i) => {
        text += `${i + 1}. ${g.threadName || g.name || "Unknown"}\nID: ${g.threadID || g.id}\n\n`;
      });
      text += `\nLeave: /left <threadID>\nLeave all: /left all`;
      return message.reply(text);
    }

    if (sub === "all") {
      let left = 0;
      for (const g of groups) {
        const gid = g.threadID || g.id;
        try {
          if (api.leaveChat) await api.leaveChat(gid);
          else if (api.removeUserFromGroup) await api.removeUserFromGroup(api.getCurrentUserID?.() || "", gid);
          left++;
        } catch {}
      }
      return message.reply(`✅ Left ${left} groups`);
    }

    // Leave specific
    const target = args[0];
    if (!target) return message.reply("Usage: /left <threadID> or /left list or /left all");

    try {
      if (api.leaveChat) await api.leaveChat(target);
      else if (api.removeUserFromGroup) await api.removeUserFromGroup(api.getCurrentUserID?.() || "", target);
      return message.reply(`✅ Left group: ${target}`);
    } catch (e) {
      return message.reply(`❌ Fail: ${e.message}`);
    }
  }
};
