const fs = require("fs-extra");
const path = require("path");

const restartFile = path.join(__dirname, "tmp", "restart.json");

function readRestartInfo() {
  try {
    if (!fs.existsSync(restartFile)) return null;
    const raw = fs.readFileSync(restartFile, "utf8").trim();
    if (!raw) return null;
    try { return JSON.parse(raw); }
    catch {
      const [threadID, time, messageID] = raw.split(/\s+/);
      return { threadID, time: Number(time), messageID };
    }
  } catch { return null; }
}

function saveRestartInfo(info) {
  fs.ensureDirSync(path.dirname(restartFile));
  fs.writeJsonSync(restartFile, info, { spaces: 2 });
}

async function deleteRestartMessage(api, info) {
  const chatId = info?.threadID || info?.chatId;
  const messageID = info?.messageID || info?.message_id;
  if (!chatId || !messageID) return;
  try {
    if (typeof api.deleteMessage === "function") await api.deleteMessage(chatId, messageID);
    else if (typeof api.unsendMessage === "function") await api.unsendMessage(messageID);
  } catch {}
}

module.exports = {
  config: {
    name: "restart",
    version: "1.2-TELEGRAM",
    author: "NTKhang + SK-SIDDIK-KHAN",
    countDown: 5,
    role: 2,
    description: { vi: "Khởi động lại bot", en: "Restart bot" },
    category: "Owner",
    guide: { vi: "   {pn}: Khởi động lại bot", en: "   {pn}: Restart bot" }
  },

  langs: {
    vi: { restartting: "🔄 | Đang khởi động lại bot...", restarted: "✅ | Bot restarted\n⏰ | Time: %1s" },
    en: { restartting: "🔄 | Restarting bot...", restarted: "✅ | Bot restarted\n⏰ | Time: %1s" }
  },

  onLoad: async function ({ api }) {
    const info = readRestartInfo();
    if (!info) return;
    await deleteRestartMessage(api, info);

    const elapsed = Math.max(0, (Date.now() - Number(info.time || Date.now())) / 1000).toFixed(2);
    const threadID = info.threadID || info.chatId;

    try { fs.removeSync(restartFile); } catch {}

    if (threadID) {
      try {
        await api.sendMessage(`✅ | Bot restarted\n⏰ | Time: ${elapsed}s`, threadID);
      } catch {}
    }
  },

  onStart: async function ({ api, message, event, getLang }) {
    const threadID = event?.threadID || event?.chatID;
    const sent = await message.reply(getLang("restartting"));
    const messageID = sent?.messageID || sent?.message_id || sent?.id;

    saveRestartInfo({
      threadID,
      time: Date.now(),
      messageID: messageID ? String(messageID) : null
    });
    setTimeout(() => process.exit(2), 300);
  }
};
