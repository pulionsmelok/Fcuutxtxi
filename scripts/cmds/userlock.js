const fs = require("fs-extra");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data", "userlock.json");
const SETTING_FILE = path.join(__dirname, "data", "userlock_setting.json");

async function loadData() {
  try {
    await fs.ensureFile(DATA_FILE);
    return await fs.readJson(DATA_FILE).catch(() => ({})) || {};
  } catch { return {}; }
}
async function saveData(data) {
  try {
    await fs.ensureDir(path.dirname(DATA_FILE));
    await fs.writeJson(DATA_FILE, data, { spaces: 2 });
  } catch {}
}
async function isEnabled() {
  try {
    await fs.ensureFile(SETTING_FILE);
    const s = await fs.readJson(SETTING_FILE).catch(() => ({ enabled: true }));
    return s.enabled !== false;
  } catch { return true; }
}
async function setEnabled(val) {
  try {
    await fs.ensureDir(path.dirname(SETTING_FILE));
    await fs.writeJson(SETTING_FILE, { enabled: val }, { spaces: 2 });
  } catch {}
}

module.exports = {
  config: {
    name: "userlock",
    aliases: ["namewatch", "ulock"],
    version: "4.0-JSON",
    author: "MOHAMMAD BADOL (converted)",
    countDown: 2,
    role: 1,
    description: {
      en: "Detect name/username changes (JSON storage)"
    },
    category: "security",
    guide: {
      en: "{pn} → Show panel\n{pn} on / off"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const input = (args[0] || "").toLowerCase();
    if (input === "on") {
      await setEnabled(true);
      return message.reply("✅ UserLock Global ON (JSON)");
    }
    if (input === "off") {
      await setEnabled(false);
      return message.reply("❌ UserLock Global OFF (JSON)");
    }

    const enabled = await isEnabled();
    const db = await loadData();
    const total = Object.keys(db).length;
    return message.reply(
      `╭─❖─〔 UserLock Panel 〕─❖─╮\n` +
      `│ Status: ${enabled ? "🟢 ON" : "🔴 OFF"}\n` +
      `│ 📊 Tracked Users: ${total}\n` +
      `│ 💾 JSON Storage\n` +
      `│\n` +
      `│ /userlock on  - Enable\n` +
      `│ /userlock off - Disable\n` +
      `╰─❖─〔 Goat Bot 〕─❖─╯`
    );
  },

  onChat: async function ({ api, event, message }) {
    try {
      if (!event.isGroup && !String(event.threadID).startsWith("-")) return;
      if (!(await isEnabled())) return;
      if (!event.senderID) return;

      const userId = String(event.senderID);
      let firstName = event.senderName || "";
      let username = "";

      try {
        const info = await api.getUserInfo?.(userId);
        if (info?.[userId]) {
          firstName = info[userId].name || firstName;
          username = info[userId].vanity || "";
        }
      } catch {}

      const current = {
        name: firstName.trim(),
        username: username.trim(),
        date: new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })
      };

      const db = await loadData();
      const old = db[userId];

      if (!old) {
        db[userId] = { current, history: [] };
        await saveData(db);
        return;
      }

      const oldName = (old.current?.name || "").trim();
      const oldUser = (old.current?.username || "").trim();

      if (oldName === current.name && oldUser === current.username) return;

      let history = old.history || [];
      history.push({ ...old.current });
      if (history.length > 20) history.shift();

      let notice = `🚨 USERLOCK DETECTED!\n━━━━━━━━━━━━━━━━━━\n`;
      notice += `👤 নাম: ${current.name}\n`;
      notice += `🆔 আইডি: ${userId}\n`;
      notice += `━━━━━━━━━━━━━━━━━━\n\n📝 পরিবর্তন:\n`;
      if (oldName !== current.name) notice += `• Name: ${oldName || "নাই"} → ${current.name || "নাই"}\n`;
      if (oldUser !== current.username) notice += `• Username: @${oldUser || "নাই"} → @${current.username || "নাই"}\n`;
      notice += `\n⏰ ${current.date}\n💾 JSON Tracked`;

      await api.sendMessage(notice, event.threadID);
      db[userId] = { current, history };
      await saveData(db);
    } catch (e) { console.log("userlock onChat:", e.message); }
  }
};
