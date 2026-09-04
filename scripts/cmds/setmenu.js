module.exports = {
  config: {
    name: "setmenu",
    aliases: ["setslash", "setbaton"],
    version: "8.6",
    author: "MOHAMMAD BADOL (converted)",
    countDown: 3,
    role: 2,
    description: {
      en: "Turn Telegram slash menu on/off"
    },
    category: "admin",
    guide: {
      en: "{pn} on → Enable slash menu\n{pn} off → Disable slash menu"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const input = (args[0] || "").toLowerCase();

    if (input !== "on" && input !== "off") {
      return message.reply(
        `⚙️ SETMENU CONTROL\n\n` +
        `• /setmenu on  - ON\n` +
        `• /setmenu off - OFF`
      );
    }

    try {
      if (input === "on") {
        const commands = [];
        for (const [name, cmd] of global.GoatBot.commands) {
          let cmdName = String(name || "").toLowerCase().replace(/[^a-z0-9_]/g, "");
          if (!cmdName || !/^[a-z][a-z0-9_]{1,31}$/.test(cmdName)) continue;

          let desc = "";
          if (typeof cmd.config.description === "string") desc = cmd.config.description;
          else if (cmd.config.description?.en) desc = cmd.config.description.en;
          desc = (desc || `${cmdName} command`).replace(/[\u0000-\u001F\u007F]/g, "").trim();
          if (desc.length < 3) desc = `${cmdName} command`;
          if (desc.length > 250) desc = desc.slice(0, 250);

          commands.push({ command: cmdName, description: desc });
        }

        const finalCmds = commands.slice(0, 90);
        if (finalCmds.length === 0) return message.reply("❌ No valid commands found!");

        if (api.setMyCommands) {
          await api.setMyCommands(finalCmds);
          await api.setMyCommands?.(finalCmds, { scope: { type: "all_private_chats" } }).catch(() => {});
          await api.setMyCommands?.(finalCmds, { scope: { type: "all_group_chats" } }).catch(() => {});
        }

        return message.reply(`✅ SLASH MENU ON\n🟢 ${finalCmds.length} Commands Set`);
      }

      if (input === "off") {
        if (api.deleteMyCommands) {
          await api.deleteMyCommands().catch(() => {});
          await api.deleteMyCommands?.({ scope: { type: "all_private_chats" } }).catch(() => {});
          await api.deleteMyCommands?.({ scope: { type: "all_group_chats" } }).catch(() => {});
        }
        return message.reply("🔴 SLASH MENU OFF");
      }
    } catch (e) {
      return message.reply(`❌ Error: ${e.message}`);
    }
  }
};
