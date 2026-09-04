const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "prefixmode",
    version: "1.0",
    author: "SK-SIDDIK-KHAN",
    role: 1, 
    category: "admin",
    description: "Toggle all commands to no-prefix mode",
    usePrefix: true,
    cooldown: 3
  },

  onStart: async function({ event, api, args, message }) {
    const dataPath = path.join(__dirname, 'S1DD1K', 'prefixmode.json');

    if (!fs.existsSync(path.dirname(dataPath))) {
      fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    }

    let data = { enabled: false };
    if (fs.existsSync(dataPath)) {
      try { data = JSON.parse(fs.readFileSync(dataPath, "utf8")); } catch {}
    }

    const action = args[0]?.toLowerCase();

    if (!action ||!["on","off","status"].includes(action)) {
      return message.reply(
        `⚙️ PrefixMode System\n\n`+
        `📌 Current: ${data.enabled? "ON (All No-Prefix)" : "OFF (Normal)"}\n\n`+
        `• ${global.GoatBot.config.prefix}prefixmode on - সব কমান্ড No Prefix\n`+
        `• ${global.GoatBot.config.prefix}prefixmode off - আগের মতো Prefix/NoPrefix\n`+
        `• ${global.GoatBot.config.prefix}prefixmode status - স্ট্যাটাস দেখো`
      );
    }

    if (action === "status") {
      return message.reply(`📌 PrefixMode: ${data.enabled? "ON ✅" : "OFF ❌"}\n${data.enabled? "এখন সব কমান্ড Prefix ছাড়াই কাজ করবে।" : "এখন config অনুযায়ী Prefix/NoPrefix কাজ করবে।"}`);
    }

    if (action === "on") {
      data.enabled = true;
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
      global.GoatBot.config.prefixModeEnabled = true;
      return message.reply(`✅ PrefixMode ON\nএখন থেকে সব কমান্ড Prefix ছাড়া কাজ করবে।\nBot restart / loadall দিলেও ON থাকবে।\nOff করতে: ${global.GoatBot.config.prefix}prefixmode off`);
    }

    if (action === "off") {
      data.enabled = false;
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
      global.GoatBot.config.prefixModeEnabled = false;
      return message.reply(`❌ PrefixMode OFF\n\nএখন আগের মতো usePrefix true/false অনুযায়ী কাজ করবে।`);
    }
  }
};