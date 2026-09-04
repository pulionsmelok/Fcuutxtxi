const fs = require("fs-extra");
const path = require("path");

const SETTING_FILE = path.join(__dirname, "data", "botSettings.json");

async function loadSettings() {
  try {
    await fs.ensureFile(SETTING_FILE);
    return await fs.readJson(SETTING_FILE).catch(() => ({})) || {};
  } catch { return {}; }
}
async function saveSettings(data) {
  try {
    await fs.ensureDir(path.dirname(SETTING_FILE));
    await fs.writeJson(SETTING_FILE, data, { spaces: 2 });
  } catch {}
}

module.exports = {
  config: {
    name: "setting",
    aliases: ["settings", "panel", "st"],
    version: "8.0-JSON",
    author: "MOHAMMAD BADOL (converted)",
    countDown: 2,
    role: 2,
    description: {
      en: "Bot settings panel (JSON storage)"
    },
    category: "admin",
    guide: {
      en: "{pn}\n{pn} <key> on/off"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const s = await loadSettings();
    const key = (args[0] || "").toLowerCase();
    const val = (args[1] || "").toLowerCase();

    const defaults = {
      antilink: false,
      spammute: false,
      welcome: true,
      leave: true,
      maintenance: false,
      adminonly: false
    };

    if (key && (val === "on" || val === "off")) {
      s[key] = val === "on";
      await saveSettings(s);
      return message.reply(`✅ ${key} → ${val.toUpperCase()} (JSON saved)`);
    }

    const cur = { ...defaults, ...s };
    let text = `╭─❖─〔 CONTROL PANEL 〕─❖─╮\n`;
    text += `│ ⚙️ Settings (JSON)\n`;
    text += `├━━━━━━━━━━━━\n`;
    for (const [k, v] of Object.entries(cur)) {
      text += `│ ${v ? "🟢" : "🔴"} ${k}\n`;
    }
    text += `├━━━━━━━━━━━━\n`;
    text += `│ /setting <key> on/off\n`;
    text += `│ Ex: /setting antilink on\n`;
    text += `╰─❖─〔 Goat Bot 〕─❖─╯`;
    return message.reply(text);
  }
};
