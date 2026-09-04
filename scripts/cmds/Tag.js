module.exports = {
  config: {
    name: "tag",
    aliases: ["mention"],
    author: "SK-SIDDIK-KHAN",
    version: "1.1",
    cooldown: 3,
    role: 0,
    description: "Tag (mention) a user by reply or name in group",
    category: "utility",
    usePrefix: true
  },

  onStart: async ({ event, message, args, api }) => {
    try {
      const chatType = event.chat?.type || "";
      if (chatType === "private") {
        return await message.reply("❌ This command can only be used in groups.");
      }

      let user = null;
      let extra = "";

      if (event.reply_to_message?.from) {
        user = event.reply_to_message.from;
        extra = args.length ? args.join(" ") : "👋 You’ve been tagged!";
      } else if (args.length > 0) {
        const name = args.join(" ");
        return await message.reply(`👋 ${name}`);
      } else {
        return await message.reply("❌ Reply to someone or write a name.\nExample: reply `/tag` or `/tag hello`");
      }

      const fullName = ((user.first_name || "") + (user.last_name ? " " + user.last_name : "")).trim() || "User";
      const mention = `<a href="tg://user?id=${user.id}">${fullName}</a>`;

      await message.reply(`${mention}\n${extra}`, { parse_mode: "HTML" });
    } catch (error) {
      console.error("Error in tag command:", error);
      await message.reply(`❌ Error: ${error.message}`);
    }
  }
};
