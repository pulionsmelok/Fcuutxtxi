module.exports = {
  config: {
    name: "kick",
    aliases: ["kickout"],
    version: "3.0",
    author: "MOHAMMAD BADOL (converted)",
    countDown: 5,
    role: 1,
    description: {
      en: "Kick a user (Reply / UID / Mention)"
    },
    category: "group",
    guide: {
      en: "{pn} (reply)\n{pn} <uid>\n{pn} @mention"
    }
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    const threadID = event.threadID || event.chat?.id;
    if (!threadID || !String(threadID).startsWith("-")) {
      return message.reply("⚠️ গ্রুপে ইউজ করুন!");
    }

    let targetID = null;
    let targetName = "User";

    // Reply
    if (event.messageReply) {
      targetID = event.messageReply.senderID || event.messageReply.from?.id;
      targetName = event.messageReply.senderName || event.messageReply.from?.first_name || "User";
    }
    // Mention
    else if (event.mentions && Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
      targetName = event.mentions[targetID];
    }
    // UID
    else if (args[0] && /^\d+$/.test(args[0])) {
      targetID = args[0];
      try {
        const info = await api.getUserInfo?.(targetID);
        targetName = info?.[targetID]?.name || `User ${targetID}`;
      } catch {
        targetName = `User ${targetID}`;
      }
    }

    if (!targetID) {
      return message.reply(
        `⚠️ কাকে কিক করবে?\n\n` +
        `1️⃣ রিপ্লাই দিয়ে /kick\n` +
        `2️⃣ /kick 123456789\n` +
        `3️⃣ মেনশন করে /kick`
      );
    }

    const adminBot = (global.GoatBot.config.adminBot || []).map(String);
    if (adminBot.includes(String(targetID))) return message.reply("⚠️ Bot Admin কে কিক করা যাবে না!");
    if (String(targetID) === String(event.senderID)) return message.reply("⚠️ নিজেকে কিক করা যাবে না!");

    try {
      // Telegram style kick (ban + unban)
      if (api.banChatMember) {
        const until = Math.floor(Date.now() / 1000) + 5;
        await api.banChatMember(threadID, targetID, { until_date: until });
        setTimeout(async () => {
          try { await api.unbanChatMember?.(threadID, targetID); } catch {}
        }, 6000);
      } else if (api.removeUserFromGroup) {
        await api.removeUserFromGroup(targetID, threadID);
      } else {
        return message.reply("❌ Kick API পাওয়া যায়নি");
      }

      return message.reply(`✅ Kicked ${targetName}!\n🆔 ${targetID}`);
    } catch (e) {
      return message.reply(`❌ Kick হয়নি: ${e.message}`);
    }
  }
};
