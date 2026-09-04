module.exports = {
  config: {
    name: "pin",
    aliases: ["pinmsg", "unpin", "unpinmsg"],
    version: "1.1.0",
    author: "MOHAMMAD BADOL (converted)",
    countDown: 2,
    role: 1,
    description: {
      en: "Pin / Unpin message in group"
    },
    category: "group",
    guide: {
      en: "{pn} (reply) → Pin message\n{pn} silent (reply) → Silent pin\n{pn} unpin (reply) → Unpin\n{pn} unpin all → Unpin all"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const threadID = event.threadID || event.chat?.id;
    if (!threadID || !String(threadID).startsWith("-")) {
      return message.reply("❌ এই কমান্ড শুধু গ্রুপে কাজ করবে!");
    }

    const text = (event.body || event.text || "").toLowerCase();
    const isUnpin = text.includes("unpin");

    // UNPIN
    if (isUnpin) {
      if (args[0]?.toLowerCase() === "all" || text.includes("all")) {
        try {
          await api.unpinAllChatMessages?.(threadID);
          return message.reply("✅ সব পিন রিমুভ করা হয়েছে!");
        } catch (e) {
          return message.reply(`❌ Unpin All Fail: ${e.message}`);
        }
      }

      const replyId = event.messageReply?.messageID || event.reply_to_message?.message_id;
      if (replyId) {
        try {
          await api.unpinChatMessage?.(threadID, replyId);
          return message.reply("✅ Unpinned!");
        } catch (e) {
          return message.reply(`❌ Unpin Fail: ${e.message}`);
        }
      } else {
        return message.reply("📌 যে মেসেজ আনপিন করতে চাও সেটাতে রিপ্লাই দিয়ে /unpin লিখো");
      }
    }

    // PIN
    const replyMsg = event.messageReply || event.reply_to_message;
    if (!replyMsg) {
      return message.reply(
        `📌 পিন করতে মেসেজে রিপ্লাই দাও!\n\n` +
        `/pin → নোটিফিকেশন সহ পিন\n` +
        `/pin silent → সাইলেন্ট পিন\n` +
        `/unpin → রিপ্লাই দিয়ে আনপিন\n` +
        `/unpin all → সব আনপিন`
      );
    }

    const isSilent = args[0]?.toLowerCase() === "silent" || args[0]?.toLowerCase() === "s";
    const msgId = replyMsg.messageID || replyMsg.message_id;

    try {
      await api.pinChatMessage?.(threadID, msgId, { disable_notification: isSilent });
      return message.reply(isSilent ? "📌 Silent Pin Done! 🔕" : "📌 Pinned!");
    } catch (e) {
      return message.reply(`❌ Pin Fail: ${e.message}\nবটকে Pin Permission দাও!`);
    }
  }
};
