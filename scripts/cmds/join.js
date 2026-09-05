module.exports = {
  config: {
    name: "join",
    aliases: ["joinlist", "groups"],
    author: "SK-SIDDIK-KHAN",
    version: "3.0-TELEGRAM-WORKING",
    countDown: 5,
    role: 2,
    description: { en: "Show active Telegram groups with working join links" },
    category: "admin",
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, event, message, threadsData }) {
    try {
      const chatId = String(event.threadID);
      const groups = await getGroups(threadsData);

      if (!groups.length) {
        return message.reply("╭─❖─〔 JOIN GROUPS 〕─❖─╮\n│\n│ ❌ No Telegram groups found in database!\n│\n╰─❖─〔 SIDDIK-BOT 〕─❖─╯");
      }

      const loading = await message.reply(`🔍 Found ${groups.length} groups in DB...\n⏳ Checking active groups and links... Please wait...`).catch(() => null);
      const result = await checkActiveGroups(api, groups);

      saveCache(chatId, result.active, {
        total: groups.length,
        kicked: result.removed
      });

      await sendJoinPage({
        api,
        chatId,
        page: 0,
        editMessageId: loading?.messageID || loading?.message_id || null,
        isFirst: true
      });
    } catch (e) {
      console.error("JOIN START ERROR:", e);
      return message.reply(`❌ JOIN ERROR\n\n${e.message || e}`);
    }
  },

  onCallback: async function ({ api, event, ctx, threadsData }) {
    const data = String(event.callbackData || event.data || "");
    const chatId = String(event.threadID || event.message?.chat?.id || "");
    const messageId = event.messageID || event.message?.message_id;
    if (!chatId) return;

    try { await ctx?.answerCbQuery?.().catch(() => {}); } catch {}

    if (data.startsWith("join_page_")) {
      const page = Number.parseInt(data.slice("join_page_".length), 10) || 0;
      await sendJoinPage({ api, chatId, page, editMessageId: messageId });
      return;
    }

    if (data === "join_refresh") {
      try {
        const groups = await getGroups(threadsData);
        const result = await checkActiveGroups(api, groups);
        saveCache(chatId, result.active, { total: groups.length, kicked: result.removed });
        await sendJoinPage({ api, chatId, page: 0, editMessageId: messageId });
        await ctx?.answerCbQuery?.("✅ Refreshed").catch(() => {});
      } catch (e) {
        console.error("JOIN REFRESH ERROR:", e);
        await ctx?.answerCbQuery?.(`❌ ${e.message || "Refresh failed"}`, true).catch(() => {});
      }
      return;
    }

    if (data === "join_no_link") {
      return ctx?.answerCbQuery?.("❌ No usable invite link. Make the bot admin with Invite Users permission.", true).catch(() => {});
    }
  }
};

async function getGroups(threadsData) {
  let allThreads = [];
  try {
    if (threadsData?.getAll) allThreads = await threadsData.getAll();
    else if (global.db?.allThreadData) allThreads = global.db.allThreadData;
  } catch (e) {
    console.error("JOIN DATABASE READ ERROR:", e.message || e);
    allThreads = global.db?.allThreadData || [];
  }

  if (!Array.isArray(allThreads)) allThreads = Object.values(allThreads || {});

  return allThreads.filter(t => {
    const id = String(t?.threadID ?? t?.id ?? t?.chatId ?? t?.chat_id ?? "").trim();
    return /^-\d+$/.test(id);
  });
}

async function checkActiveGroups(api, groups) {
  const active = [];
  let removed = 0;
  let botId = null;

  try {
    botId = api?.getCurrentUserID?.() || api?.botInfo?.id || null;
    if (!botId && api?.getMe) botId = (await api.getMe()).id;
  } catch {}

  for (const group of groups) {
    const gid = String(group.threadID ?? group.id ?? group.chatId ?? "");
    if (!gid) continue;

    try {
      const chat = await api.getChat(gid);
      if (botId && api?.getChatMember) {
        const member = await api.getChatMember(gid, botId).catch(() => null);
        const status = String(member?.status || "").toLowerCase();
        if (["left", "kicked", "banned"].includes(status)) {
          removed++;
          continue;
        }
      }

      active.push({ ...group, __joinChat: chat || null });
    } catch (err) {
      const msg = String(err?.message || "").toLowerCase();
      const definitelyRemoved =
        msg.includes("chat not found") ||
        msg.includes("bot was kicked") ||
        msg.includes("not a member") ||
        msg.includes("forbidden") ||
        msg.includes("chat is deactivated");

      if (definitelyRemoved) removed++;
      else active.push(group);
    }
  }

  return { active, removed };
}

function saveCache(chatId, groups, info) {
  global.joinCache ||= {};
  global.joinInfo ||= {};
  global.joinCache[String(chatId)] = groups;
  global.joinInfo[String(chatId)] = info;
}

function cleanTitle(title) {
  return String(title || "Unknown Group")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Unknown Group";
}

function validLink(link) {
  const value = String(link || "").trim();
  return /^(https?:\/\/)?t\.me\//i.test(value) ? (value.startsWith("http") ? value : `https://${value}`) : "";
}

async function getJoinLink(api, gid, group, chat) {
  if (chat?.username) return `https://t.me/${chat.username}`;

  const stored = [
    chat?.invite_link,
    chat?.inviteLink,
    group?.inviteLink,
    group?.invite_link,
    group?.link,
    group?.data?.inviteLink,
    group?.data?.invite_link,
    group?.data?.link
  ];

  for (const item of stored) {
    const link = validLink(item);
    if (link) return link;
  }

  if (api?.exportChatInviteLink) {
    try {
      const link = await api.exportChatInviteLink(gid);
      const valid = validLink(link);
      if (valid) return valid;
    } catch (e) {
    }
  }

  if (api?.call) {
    try {
      const link = await api.call("createChatInviteLink", {
        chat_id: String(gid),
        name: "SIDDIK-BOT Join"
      });
      const valid = validLink(link?.invite_link || link);
      if (valid) return valid;
    } catch {}
  }

  return "";
}

async function sendJoinPage({ api, chatId, page = 0, editMessageId = null, isFirst = false }) {
  const key = String(chatId);
  const groups = global.joinCache?.[key] || [];
  const info = global.joinInfo?.[key] || { total: groups.length, kicked: 0 };
  const PER_PAGE = 2;

  if (!groups.length) {
    const emptyText = `╭─❖─〔 JOIN GROUPS 〕─❖─╮\n│\n│ ❌ No active groups!\n│ ❌ Removed: ${info.kicked || 0}\n│ 📂 DB Total: ${info.total || 0}\n│\n╰─❖─〔 SIDDIK-BOT 〕─❖─╯`;
    return editOrSend(api, chatId, editMessageId, emptyText, {}, isFirst);
  }

  const totalPages = Math.max(1, Math.ceil(groups.length / PER_PAGE));
  page = Math.max(0, Math.min(Number(page) || 0, totalPages - 1));
  const start = page * PER_PAGE;
  const pageGroups = groups.slice(start, start + PER_PAGE);

  let text =
    "╭─❖─〔 JOIN GROUPS 〕─❖─╮\n" +
    "│\n" +
    `│ ✅ Active: ${groups.length}\n` +
    `│ ❌ Removed: ${info.kicked || 0}\n` +
    `│ 📂 DB Total: ${info.total || groups.length}\n` +
    `│ 📄 Page: ${page + 1}/${totalPages}\n` +
    "│\n" +
    "╰─❖─〔 SIDDIK-BOT 〕─❖─╯\n\n";

  const keyboard = [];

  for (let i = 0; i < pageGroups.length; i++) {
    const group = pageGroups[i];
    const gid = String(group.threadID ?? group.id ?? group.chatId ?? "");
    const index = start + i + 1;
    let chat = group.__joinChat || null;

    if (!chat) {
      try { chat = await api.getChat(gid); } catch {}
    }

    const title = cleanTitle(chat?.title || group.threadName || group.name || group.title);
    const username = chat?.username ? `@${chat.username}` : "";
    const inviteLink = await getJoinLink(api, gid, group, chat);

    text += `${index}. ${title}\n`;
    text += `🆔 ${gid}\n`;
    if (username) text += `🔗 ${username}\n`;
    text += "\n";

    if (inviteLink) {
      keyboard.push([{ text: `🚀 Join ${title.slice(0, 24)}`, url: inviteLink }]);
    } else {
      keyboard.push([{ text: `❌ ${title.slice(0, 24)} - No Link`, callback_data: "join_no_link" }]);
    }
  }

  const nav = [];
  if (page > 0) nav.push({ text: "⬅️ Prev", callback_data: `join_page_${page - 1}` });
  if (page < totalPages - 1) nav.push({ text: "Next ➡️", callback_data: `join_page_${page + 1}` });
  if (nav.length) keyboard.push(nav);
  keyboard.push([{ text: "🔄 Refresh List", callback_data: "join_refresh" }]);

  return editOrSend(api, chatId, editMessageId, text, {
    reply_markup: { inline_keyboard: keyboard }
  }, isFirst);
}

async function editOrSend(api, chatId, messageId, text, options) {
  if (messageId) {
    try {
      return await api.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        ...options
      });
    } catch (e) {
      console.error("JOIN EDIT ERROR:", e.message || e);
    }
  }

  return api.sendMessage(text, chatId, options);
}
