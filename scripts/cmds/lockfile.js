const fs = require("fs-extra");
const path = require("path");

const LOCK_FILE = path.join(__dirname, "data", "lockedCommands.json");

async function getLocked() {
  try {
    await fs.ensureFile(LOCK_FILE);
    const data = await fs.readJson(LOCK_FILE).catch(() => ([]));
    return Array.isArray(data) ? data.map(c => String(c).toLowerCase()) : [];
  } catch { return []; }
}

async function saveLocked(arr) {
  try {
    await fs.ensureDir(path.dirname(LOCK_FILE));
    await fs.writeJson(LOCK_FILE, [...new Set(arr.map(c => String(c).toLowerCase()))], { spaces: 2 });
  } catch {}
}

module.exports = {
  config: {
    name: "lockfile",
    aliases: ["lockcmd", "cmdlock"],
    version: "20-JSON",
    author: "MOHAMMAD BADOL (converted)",
    countDown: 2,
    role: 2,
    description: {
      en: "Lock/Unlock commands (JSON storage)"
    },
    category: "admin",
    guide: {
      en: "{pn} list\n{pn} lock <cmd>\n{pn} unlock <cmd>\n{pn} unlockall"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const sub = (args[0] || "").toLowerCase();
    const locked = await getLocked();
    const allCmds = [...global.GoatBot.commands.keys()].sort();

    if (sub === "list") {
      if (locked.length === 0) return message.reply("✅ কোনো Command Lock নাই!");
      let txt = `╭━❮ Locked-List ❯━╮\n`;
      locked.forEach((c, i) => { txt += `├‣ ${i + 1}. 🔒 ${c}\n`; });
      txt += `├‣ Total: ${locked.length}\n╰━━━━━━━━━━━━╯`;
      return message.reply(txt);
    }

    if (sub === "lock" && args[1]) {
      const name = args[1].toLowerCase();
      if (!allCmds.includes(name) && !global.GoatBot.commands.has(name)) {
        return message.reply(`❌ Command "${name}" পাওয়া যায়নি`);
      }
      if (locked.includes(name)) return message.reply(`⚠️ ${name} ইতিমধ্যে Locked`);
      locked.push(name);
      await saveLocked(locked);
      return message.reply(`🔒 Locked: ${name}`);
    }

    if (sub === "unlock" && args[1]) {
      const name = args[1].toLowerCase();
      const newList = locked.filter(c => c !== name);
      await saveLocked(newList);
      return message.reply(`✅ Unlocked: ${name}`);
    }

    if (sub === "unlockall") {
      await saveLocked([]);
      return message.reply("✅ All Unlocked!");
    }

    return message.reply(
      `╭━❮ Lock-File ❯━╮\n` +
      `├‣ 📦 Total Cmd: ${allCmds.length}\n` +
      `├‣ 🔒 Locked: ${locked.length}\n` +
      `├‣ ✅ Unlocked: ${allCmds.length - locked.length}\n` +
      `├━━━━━━━━━━━━\n` +
      `├ /lockfile list\n` +
      `├ /lockfile lock <cmd>\n` +
      `├ /lockfile unlock <cmd>\n` +
      `├ /lockfile unlockall\n` +
      `╰━━━━━━━━━━━━╯`
    );
  }
};
