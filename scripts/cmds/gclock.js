const fs = require("fs");
const path = require("path");
const axios = require("axios");

const CACHE_DIR = path.join(__dirname, "tmp");
if (!fs.existsSync(CACHE_DIR)) {
  try { fs.mkdirSync(CACHE_DIR, { recursive: true }); } catch {}
}

const Markup = {
  inlineKeyboard: (buttons) => ({
    reply_markup: {
      inline_keyboard: buttons
    }
  }),
  button: {
    callback: (text, data) => ({
      text,
      callback_data: String(data)
    })
  }
};

function getStatus(data = {}) {
  return (
    `🔒 *Anti-Change Protection Status*\n\n` +
    `📝 *Name:* ${data.lockedName ? "🔒 Locked" : "🔓 Unlocked"}\n` +
    `🖼️ *Photo:* ${data.lockedPhoto ? "🔒 Locked" : "🔓 Unlocked"}\n` +
    `📄 *Description:* ${data.lockedDescription ? "🔒 Locked" : "🔓 Unlocked"}\n\n` +
    `👇 Button চাপ দিয়ে Lock / Unlock করো।`
  );
}

function getKeyboard(data = {}) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(
        data.lockedName ? "🔒 Name: Locked" : "🔓 Name: Unlocked",
        `gclock_name_${data.lockedName ? "unlock" : "lock"}`
      )
    ],
    [
      Markup.button.callback(
        data.lockedPhoto ? "🔒 Photo: Locked" : "🔓 Photo: Unlocked",
        `gclock_photo_${data.lockedPhoto ? "unlock" : "lock"}`
      )
    ],
    [
      Markup.button.callback(
        data.lockedDescription
          ? "🔒 Description: Locked"
          : "🔓 Description: Unlocked",
        `gclock_description_${data.lockedDescription ? "unlock" : "lock"}`
      )
    ],
    [
      Markup.button.callback("🔄 Refresh", "gclock_refresh")
    ]
  ]);
}

function photoCachePath(chatId) {
  return path.join(CACHE_DIR, `gclock_photo_${chatId}.jpg`);
}

async function downloadChatPhoto(api, fileId, chatId) {
  if (!fileId || fileId === "NO_PHOTO") return null;
  try {
    const token =
      api.token ||
      global.GoatBot.config?.botInfo?.token ||
      global.GoatBot.config?.token ||
      global.GoatBot.config?.credentials?.token;
    const file = await api.getFile(fileId);
    if (!file?.file_path || !token) return null;

    const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 30000
    });
    const out = photoCachePath(chatId);
    fs.writeFileSync(out, Buffer.from(res.data));
    return out;
  } catch (e) {
    console.error("GCLOCK photo download:", e?.message || e);
    return null;
  }
}

async function autoUnsend(message, text, extra = {}) {
  const sent = await message.reply(text, extra);
  const mid = sent?.message_id || sent?.result?.message_id;
  const chatId =
    message.chatId ||
    message.ctx?.chat?.id ||
    message.event?.chat?.id;
  if (mid && chatId && message.api) {
    setTimeout(() => {
      message.api.deleteMessage(chatId, mid).catch(() => {});
    }, 10000);
  } else if (mid && message.ctx?.bot) {
    const cid = message.ctx.chat?.id;
    if (cid) {
      setTimeout(() => {
        message.ctx.bot.deleteMessage(cid, mid).catch(() => {});
      }, 10000);
    }
  }
  return sent;
}

module.exports = {
  config: {
    name: "gclock",
    aliases: ["antichange", "lockgc"],
    author: "SK-SIDDIK",
    version: "2.2.0",
    cooldown: 5,
    role: 2,
    category: "group",
    description: "Lock group name, photo and description",
    guide: "{pn}"
  },

  onStart: async function ({ message, args, api, event, db, ctx, bot}) {
    try {
      const chatId = event.chat?.id;
      if (!chatId) return;

      if (event.chat.type !== "group" && event.chat.type !== "supergroup") {
        return message.reply("❌ This command can only be used in groups.");
      }

      let botId = global.botInfo?.id;
      if (!botId) {
        try {
          const me = await api.getMe();
          botId = me.id;
          if (!global.botInfo) global.botInfo = me;
        } catch (e) {
          return message.reply("❌ Bot ID পাওয়া যায়নি। আবার try করো।");
        }
      }

      const botMember = await api.getChatMember(chatId, botId).catch(() => null);
      if (!botMember || (botMember.status !== "administrator" && botMember.status !== "creator")) {
        return message.reply("❌ আমাকে আগে Group Admin করো।");
      }
      if (botMember.can_change_info === false) {
        return message.reply('❌ আমাকে "Change Group Info" permission দাও।');
      }

      const database = db || global.db;
      if (!database?.getThread) {
        return message.reply("❌ Database not ready. Restart bot.");
      }
      const data = (await database.getThread(String(chatId))) || {};

      if (!args.length) {
        return autoUnsend(message, getStatus(data), {
          parse_mode: "Markdown",
          ...getKeyboard(data)
        });
      }

      const setting = String(args[0]).toLowerCase();
      if (!["name", "photo", "description", "desc"].includes(setting)) {
        return message.reply("❌ Use: name, photo অথবা description");
      }

      const target = setting === "desc" ? "description" : setting;
      const cap = target.charAt(0).toUpperCase() + target.slice(1);
      const lockField = `locked${cap}`;
      const saveField = `saved${cap}`;

      if (data[lockField]) {
        await database.updateThread(String(chatId), {
          [lockField]: false,
          [saveField]: "",
          ...(target === "photo" ? { savedPhotoPath: "" } : {})
        });
        if (target === "photo") {
          try {
            const p = photoCachePath(chatId);
            if (fs.existsSync(p)) fs.unlinkSync(p);
          } catch {}
        }
        return autoUnsend(message, `🔓 ${target} unlocked.`);
      }

      const chat = await api.getChat(chatId);
      let value = "";

      if (target === "name") value = chat.title || "";
      if (target === "description") value = chat.description || "";
      if (target === "photo") {
        value = chat.photo?.big_file_id || chat.photo?.small_file_id || "NO_PHOTO";
      }

      const update = {
        [lockField]: true,
        [saveField]: value
      };

      if (target === "photo" && value !== "NO_PHOTO") {
        const localPath = await downloadChatPhoto(api, value, chatId);
        update.savedPhotoPath = localPath || "";
      }

      await database.updateThread(String(chatId), update);
      return autoUnsend(message, `🔒 ${target} locked successfully.`);
    } catch (e) {
      console.error("GCLOCK START:", e);
      return message.reply(`❌ Error: ${e.message}`);
    }
  },

  onCallback: async function ({ event, api, ctx, db, message}) {
    try {
      const database = db || global.db;
      if (!database?.getThread) {
        return ctx.answerCbQuery("❌ Database not ready", { show_alert: true }).catch(() => {});
      }

      const data = event?.data || "";
      if (!data.startsWith("gclock_")) return;

      const chatId = event?.message?.chat?.id;
      const messageId = event?.message?.message_id;
      const userId = event?.from?.id;

      if (!chatId || !messageId || !userId) {
        return ctx.answerCbQuery("❌ Invalid callback").catch(() => {});
      }

      const admins = await api.getChatAdministrators(chatId).catch(() => []);
      const isAdmin = admins.some((x) => String(x.user.id) === String(userId));

      if (!isAdmin) {
        return ctx.answerCbQuery("❌ Only admins can use this.", { show_alert: true }).catch(() => {});
      }

      let thread = (await database.getThread(String(chatId))) || {};

      if (data === "gclock_refresh") {
        await api.editMessageText(getStatus(thread), {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "Markdown",
          ...getKeyboard(thread)
        }).catch(() => {});
        return ctx.answerCbQuery("✅ Refreshed").catch(() => {});
      }

      const parts = data.split("_");
      const setting = parts[1];
      const action = parts[2];

      if (!["name", "photo", "description"].includes(setting) || !["lock", "unlock"].includes(action)) {
        return ctx.answerCbQuery("❌ Invalid button").catch(() => {});
      }

      const cap = setting.charAt(0).toUpperCase() + setting.slice(1);
      const lockField = `locked${cap}`;
      const saveField = `saved${cap}`;

      if (action === "lock") {
        const chat = await api.getChat(chatId);
        let value = "";
        if (setting === "name") value = chat.title || "";
        if (setting === "description") value = chat.description || "";
        if (setting === "photo") {
          value = chat.photo?.big_file_id || chat.photo?.small_file_id || "NO_PHOTO";
        }

        const update = {
          [lockField]: true,
          [saveField]: value
        };

        if (setting === "photo" && value !== "NO_PHOTO") {
          const localPath = await downloadChatPhoto(api, value, chatId);
          update.savedPhotoPath = localPath || "";
        }

        await database.updateThread(String(chatId), update);
        await ctx.answerCbQuery(`🔒 ${setting} locked!`).catch(() => {});
      }

      if (action === "unlock") {
        const update = {
          [lockField]: false,
          [saveField]: ""
        };
        if (setting === "photo") {
          update.savedPhotoPath = "";
          try {
            const p = photoCachePath(chatId);
            if (fs.existsSync(p)) fs.unlinkSync(p);
          } catch {}
        }
        await database.updateThread(String(chatId), update);
        await ctx.answerCbQuery(`🔓 ${setting} unlocked!`).catch(() => {});
      }

      thread = (await database.getThread(String(chatId))) || {};
      await api.editMessageText(getStatus(thread), {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        ...getKeyboard(thread)
      }).catch(() => {});
    } catch (e) {
      console.error("GCLOCK CALLBACK:", e);
      try {
        await ctx.answerCbQuery(`❌ ${e.message}`, { show_alert: true });
      } catch {}
    }
  }
};
