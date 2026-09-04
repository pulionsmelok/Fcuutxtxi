const fs = require("fs-extra");
const path = require("path");

const APPROVE_FILE = path.join(__dirname, "data", "approvedGroups.json");

async function getList() {
  try {
    await fs.ensureFile(APPROVE_FILE);
    const data = await fs.readJson(APPROVE_FILE).catch(() => ([]));
    return Array.isArray(data) ? data.map(String) : [];
  } catch { return []; }
}

async function saveList(list) {
  try {
    await fs.ensureDir(path.dirname(APPROVE_FILE));
    await fs.writeJson(APPROVE_FILE, [...new Set(list.map(String))], { spaces: 2 });
  } catch {}
}

module.exports = {
  config: {
    name: "approve",
    aliases: ["gcapprove", "approval", "apv"],
    version: "11.2-JSON",
    author: "MOHAMMAD BADOL (converted)",
    countDown: 3,
    role: 2,
    description: {
      en: "Approve / Unapprove groups (JSON)"
    },
    category: "admin",
    guide: {
      en: "{pn} → Approve current group\n{pn} list\n{pn} remove <tid>\n{pn} off → Unapprove current"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const sub = (args[0] || "").toLowerCase();
    const tid = String(event.threadID);
    let list = await getList();

    if (sub === "list") {
      if (list.length === 0) return message.reply("📭 No approved groups");
      let txt = `✅ Approved Groups (${list.length}):\n\n`;
      list.forEach((id, i) => { txt += `${i + 1}. ${id}\n`; });
      return message.reply(txt);
    }

    if (sub === "remove" || sub === "del" || sub === "rm") {
      const gid = args[1] || tid;
      list = list.filter(id => id !== String(gid));
      await saveList(list);
      return message.reply(`✅ Removed: ${gid}`);
    }

    if (sub === "off" || sub === "unapprove" || sub === "0") {
      list = list.filter(id => id !== tid);
      await saveList(list);
      return message.reply(`❌ Group Apv OFF\n🆔 ${tid}`);
    }

    // Approve current
    if (!list.includes(tid)) {
      list.push(tid);
      await saveList(list);
    }
    return message.reply(`✅ Group APPROVED\n🆔 ${tid}\n📦 Total: ${list.length}`);
  }
};
