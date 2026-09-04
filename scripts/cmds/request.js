const fs = require("fs-extra");
const path = require("path");

const APPROVAL_FILE = path.join(__dirname, "data", "approvals.json");

async function getApprovals() {
  try {
    await fs.ensureFile(APPROVAL_FILE);
    return await fs.readJson(APPROVAL_FILE).catch(() => ({})) || {};
  } catch { return {}; }
}

async function saveApprovals(data) {
  try {
    await fs.ensureDir(path.dirname(APPROVAL_FILE));
    await fs.writeJson(APPROVAL_FILE, data, { spaces: 2 });
  } catch {}
}

module.exports = {
  config: {
    name: "request",
    aliases: ["req", "appeal"],
    version: "6.1-JSON",
    author: "MOHAMMAD BADOL (converted)",
    countDown: 5,
    role: 0,
    description: {
      en: "Send unban request to admins"
    },
    category: "utility",
    guide: {
      en: "{pn} <reason>"
    }
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    const userId = String(event.senderID);
    const userName = await usersData.getName(userId).catch(() => "User");

    // Simple ban check using Goat usersData if available
    let isBanned = false;
    try {
      const userData = await usersData.get(userId);
      isBanned = userData?.banned?.status === true;
    } catch {}

    if (!isBanned) {
      return message.reply("✅ তুমি ব্যান নও, বট ইউজ করতে পারো!");
    }

    if (!args[0] || args[0].toLowerCase() === "help") {
      return message.reply(
        `📝 UNBAN REQUEST\n━━━━━━━━━━━━\n` +
        `/request কারণ লিখো\n` +
        `Ex: /request ভাই মাফ করে দেন`
      );
    }

    const reason = args.join(" ").trim();
    if (reason.length < 5) return message.reply("❌ কারণ বড় করে লিখো (৫ অক্ষরের বেশি)");

    const requestId = `unban_${userId}_${Date.now()}`;
    const data = {
      userId,
      name: userName,
      reason,
      threadID: String(event.threadID),
      date: Date.now()
    };

    const all = await getApprovals();
    all[requestId] = data;
    await saveApprovals(all);

    const adminMsg =
      `🚨 NEW UNBAN REQUEST\n━━━━━━━━━━━━\n` +
      `👤 Name: ${userName}\n` +
      `🆔 ID: ${userId}\n` +
      `📝 Reason: ${reason}\n` +
      `📍 Thread: ${event.threadID}\n` +
      `🕐 ${new Date().toLocaleString()}\n━━━━━━━━━━━━\n` +
      `Approve: /unban ${userId}\nReject: ignore`;

    const adminList = (global.GoatBot.config.adminBot || []).map(String);
    for (const aid of adminList) {
      try { await api.sendMessage(adminMsg, aid); } catch {}
    }

    return message.reply("✅ রিকোয়েস্ট পাঠানো হয়েছে, এডমিন দেখবে! ⏳");
  }
};
