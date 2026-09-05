const os = require('os');

function formatUptime(sec) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

module.exports = {
  config: {
    name: "botinfo",
    aliases: ["about", "botabout"],
    author: "SK-SIDDIK-KHAN",
    version: "1.0.9",
    role: 0,
    cooldown: 5,
    description: "Premium Bot Information",
    category: "info",
    usePrefix: true
  },

  onStart: async function ({ event, api, chatId }) {
    const targetChatId =
      chatId ??
      event?.chat?.id ??
      event?.message?.chat?.id ??
      event?.callback_query?.message?.chat?.id;

    if (targetChatId === undefined || targetChatId === null) {
      throw new Error("Chat ID not found");
    }

    const cfg = global.GoatBot.config || {};
    const botName = cfg.botInfo?.name || "S1DD1K";
    const botUser = cfg.botInfo?.username || "sksiddik_bot";
    const version = cfg.botInfo?.version || "6.2";
    const ownerName = cfg.ownerInfo?.mainOwner?.name || "S1DD1K";
    const ownerId = cfg.ownerInfo?.mainOwner?.id || "6734899387";

    const uptime = formatUptime(process.uptime());

    const totalCmds =
      new Set(
        [...(global.GoatBot.commands?.values() || [])]
          .map(c => c.config?.name)
          .filter(Boolean)
      ).size || 0;

    let totalUsers = 0;
    let totalGroups = 0;

    try {
      totalUsers = (await global.db?.getAllUsers())?.length || 0;
    } catch {}

    try {
      totalGroups = (await global.db?.getAllThreads())?.length || 0;
    } catch {}

    const memUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const platform = os.platform();

    const text = `╔══════════════════════════╗
║ 🕌 ﷽ - ${botName} - ﷽ 🕌 ║
╚══════════════════════════╝

┏━━━━━〔 🤖 BOT INFO 〕━━━━━┓
┃ 🤖 Name: ${botName}
┃ 🔰 Username: @${botUser}
┃ 🧩 Version: ${version} PREMIUM
┃ 📦 Total Features: ${totalCmds}+
┃ ⏰ Uptime: ${uptime}
┃ 💾 Memory: ${memUsed} MB
┃ 🖥️ Platform: ${platform}
┣━━━━━〔 📊 NETWORK 〕━━━━━┫
┃ 👥 Connected Users: ${totalUsers}+
┃ 👨‍👩‍👧‍👦 Active Groups: ${totalGroups}+
┃ 🚀 Speed: Ultra Fast ⚡
┃ 🟢 Status: Online 24/7
┣━━━━━〔 👑 DEVELOPER 〕━━━━━┫
┃ 👑 Name: ${ownerName}
┃ 🆔 ID: ${ownerId}
┃ 📩 Telegram: @busy1here
┣━━━━━〔 💎 WHY BEST? 〕━━━━━┫
┃ 🔥 All-in-One Multipurpose Bot
┃ 🛡️ Advanced Group Management
┃ ⚡ Lightning Fast & Secure
┃ 🧠 Smart AI Powered System
┃ 🕌 100% Islamic Friendly
┃ 💎 Premium Premium Features
┃ 🔄 24/7 Auto Active & Stable
┃ 🚀 Built for Big Communities
┃ 💖 Trusted by Thousands Users
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

✨ A Powerful Telegram Bot that can
   handle everything you need!
💎 No Limits, Only Power! 🚀

🕌 আলহামদুলিল্লাহ - Allahu Akbar 🕌
💖 Made with Love by ${ownerName}`;

    return api.sendMessage(text, targetChatId, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "👑 Owner", url: "https://t.me/busy1here" }
          ],
          [
            {
              text: "🚀 Add Bot to Group",
              url: `https://t.me/${botUser}?startgroup=true`
            },
            {
              text: "📜 Help Menu",
              callback_data: "botabout_help"
            }
          ],
          [
            {
              text: "🔄 Refresh Info",
              callback_data: "botabout_refresh"
            }
          ]
        ]
      }
    });
  },

  onCallback: async function ({ event, api, ctx, message, chatId, userId}) {
    const data = event.data || event.callback_query?.data;

    if (data === "botabout_refresh") {
      const cmd = global.GoatBot.commands.get("botinfo");

      if (cmd) {
        return cmd.onStart({
          event,
          api,
          chatId: event?.message?.chat?.id || event?.callback_query?.message?.chat?.id || chatId,
          userId: event?.from?.id || event?.callback_query?.from?.id || userId
        });
      }
    }

    if (data === "botabout_help") {
      try {
        await ctx.editMessageText(
          `📜 WELCOME TO HELP!

🚀 This is Most Powerful Multipurpose Bot!

💎 Features:
• Group Management
• Fun & Entertainment
• Islamic Tools
• Utility & AI
• And 100+ More!

Just type /help to explore! ✨`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "⬅️ Back to About",
                    callback_data: "botabout_main"
                  }
                ]
              ]
            }
          }
        );
      } catch {}
    }

    if (data === "botabout_main") {
      const cmd = global.GoatBot.commands.get("botinfo");

      if (cmd) {
        return cmd.onStart({
          event,
          api,
          chatId: event?.message?.chat?.id || event?.callback_query?.message?.chat?.id || chatId,
          userId: event?.from?.id || event?.callback_query?.from?.id || userId
        });
      }
    }

    try {
      await ctx.answerCbQuery();
    } catch {}
  }
};