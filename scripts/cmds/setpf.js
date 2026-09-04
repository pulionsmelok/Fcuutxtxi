const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "setpf",
    aliases: ["setprefix", "newpf", "changeprefix"],
    version: "2.0",
    author: "SK-SIDDIK-KHAN",
    cooldown: 5,
    role: 2,
    usePrefix: true,
    category: "config"
  },

  onStart: async function ({
    bot,
    event,
    args,
    message
  }) {

    const userId = String(event.senderID);

    const admins = (
      global.GoatBot.config.adminBot || []
    ).map(String);

    if (!admins.includes(userId)) {
      return message.reply(
        "━━━━━━━━━━━━━━━━\n" +
        "⚠️ 𝐎𝐧𝐥𝐲 𝐁𝐨𝐭 𝐀𝐝𝐦𝐢𝐧 𝐜𝐚𝐧 𝐜𝐡𝐚𝐧𝐠𝐞 𝐭𝐡𝐞 𝐬𝐲𝐬𝐭𝐞𝐦 𝐩𝐫𝐞𝐟𝐢𝐱\n" +
        "━━━━━━━━━━━━━━━━"
      );
    }

    if (!args[0]) {
      return message.reply(
        `❌ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐩𝐫𝐨𝐯𝐢𝐝𝐞 𝐚 𝐧𝐞𝐰 𝐩𝐫𝐞𝐟𝐢𝐱.\n\n` +
        `Example: ${global.GoatBot.config.prefix}setpf !`
      );
    }

    const newPrefix = args[0];

    if (newPrefix.length > 10) {
      return message.reply(
        "❌ 𝐏𝐫𝐞𝐟𝐢𝐱 𝐦𝐮𝐬𝐭 𝐛𝐞 𝟏𝟎 𝐜𝐡𝐚𝐫𝐚𝐜𝐭𝐞𝐫𝐬 𝐨𝐫 𝐥𝐞𝐬𝐬."
      );
    }

    const confirmMessage =
      "━━━━━━━━━━━━━━━━\n" +
      "🔄 𝐂𝐡𝐚𝐧𝐠𝐞 𝐒𝐲𝐬𝐭𝐞𝐦 𝐏𝐫𝐞𝐟𝐢𝐱\n\n" +
      `📌 𝐎𝐥𝐝 𝐏𝐫𝐞𝐟𝐢𝐱: ${global.GoatBot.config.prefix}\n` +
      `📌 𝐍𝐞𝐰 𝐏𝐫𝐞𝐟𝐢𝐱: ${newPrefix}\n\n` +
      "⚠️ 𝐂𝐥𝐢𝐜𝐤 𝐂𝐨𝐧𝐟𝐢𝐫𝐦 𝐭𝐨 𝐚𝐩𝐩𝐥𝐲 𝐭𝐡𝐞 𝐜𝐡𝐚𝐧𝐠𝐞.\n" +
      "━━━━━━━━━━━━━━━━";

    await bot.sendMessage(
      {
        body: confirmMessage,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "✅ Confirm",
                callback_data:
                  `setpf:confirm:${userId}:${encodeURIComponent(newPrefix)}`
              },
              {
                text: "❌ Cancel",
                callback_data:
                  `setpf:cancel:${userId}`
              }
            ]
          ]
        }
      },
      event.threadID
    );
  },

  onCallback: async function ({
    bot,
    event,
    args
  }) {

    const action = String(args[0] || "");
    const userId = String(args[1] || "");

    if (
      !event.senderID ||
      String(event.senderID) !== userId
    ) {
      return bot.answerCallbackQuery(
        event.callbackQueryID,
        {
          text: "❌ You are not allowed to use this button.",
          show_alert: true
        }
      );
    }

    if (action === "cancel") {

      await bot.answerCallbackQuery(
        event.callbackQueryID,
        {
          text: "❌ Prefix change cancelled."
        }
      );

      return bot.editMessageText(
        event.threadID,
        event.messageID,
        "━━━━━━━━━━━━━━━━\n" +
        "❌ 𝐏𝐫𝐞𝐟𝐢𝐱 𝐜𝐡𝐚𝐧𝐠𝐞 𝐜𝐚𝐧𝐜𝐞𝐥𝐥𝐞𝐝\n" +
        "━━━━━━━━━━━━━━━━"
      );
    }

    if (action === "confirm") {

      let newPrefix = "";

      try {
        newPrefix = decodeURIComponent(
          args.slice(2).join(":") || ""
        );
      } catch {
        return bot.answerCallbackQuery(
          event.callbackQueryID,
          {
            text: "❌ Invalid prefix.",
            show_alert: true
          }
        );
      }

      if (!newPrefix) {
        return bot.answerCallbackQuery(
          event.callbackQueryID,
          {
            text: "❌ Invalid prefix.",
            show_alert: true
          }
        );
      }

      if (newPrefix.length > 10) {
        return bot.answerCallbackQuery(
          event.callbackQueryID,
          {
            text: "❌ Prefix must be 10 characters or less.",
            show_alert: true
          }
        );
      }

      const configPath =
        global.client?.dirConfig ||
        path.join(
          process.cwd(),
          "config.json"
        );

      try {

        let configData = {};

        try {
          configData = JSON.parse(
            fs.readFileSync(
              configPath,
              "utf8"
            )
          );
        } catch {
          configData =
            global.GoatBot.config;
        }

        configData.prefix = newPrefix;

        fs.writeFileSync(
          configPath,
          JSON.stringify(
            configData,
            null,
            2
          ),
          "utf8"
        );

        global.GoatBot.config.prefix =
          newPrefix;

        Object.assign(
          global.GoatBot.config,
          configData
        );

        await bot.answerCallbackQuery(
          event.callbackQueryID,
          {
            text:
              `✅ Prefix changed to ${newPrefix}`
          }
        );

        return bot.editMessageText(
          event.threadID,
          event.messageID,
          "━━━━━━━━━━━━━━━━\n" +
          `✅ 𝐒𝐲𝐬𝐭𝐞𝐦 𝐩𝐫𝐞𝐟𝐢𝐱 𝐡𝐚𝐬 𝐛𝐞𝐞𝐧 𝐜𝐡𝐚𝐧𝐠𝐞𝐝 𝐭𝐨 : ${newPrefix}\n` +
          "━━━━━━━━━━━━━━━━"
        );

      } catch (err) {

        console.error(
          "❌ SET PREFIX ERROR:",
          err
        );

        return bot.answerCallbackQuery(
          event.callbackQueryID,
          {
            text: "❌ Failed to change prefix.",
            show_alert: true
          }
        );
      }
    }
  }
};