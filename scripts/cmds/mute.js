const fs = require('fs');
const path = require('path');
const axios = require('axios');

const JSON_PATH = path.join(__dirname, 'S1DD1K', 'muted_users.json');

const loadMuted = () => {
  try {
    if (!fs.existsSync(JSON_PATH)) {
      const dir = path.dirname(JSON_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(JSON_PATH, JSON.stringify({}, null, 2));
      return {};
    }
    return JSON.parse(fs.readFileSync(JSON_PATH, 'utf8') || "{}");
  } catch { return {}; }
};
const saveMuted = (data) => {
  try { fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2)); } catch {}
};

function parseTime(args) {
  if (!args || args.length === 0) return null;
  const text = args.join(" ").toLowerCase();
  let match = text.match(/(?:m\s*(\d+)|(\d+)\s*m)/);
  if (match) {
    const min = parseInt(match[1] || match[2]);
    return { type: 'm', value: min, seconds: min * 60, text: `${min} মিনিট` };
  }
  match = text.match(/(?:h\s*(\d+)|(\d+)\s*h)/);
  if (match) {
    const hr = parseInt(match[1] || match[2]);
    return { type: 'h', value: hr, seconds: hr * 3600, text: `${hr} ঘন্টা` };
  }
  return null;
}

async function getTargetUser({ event, api, args = [], chatId, db = global.db }) {
  
  
  if (event.reply_to_message?.from?.id) {
    const u = event.reply_to_message.from;
    return {
      id: Number(u.id),
      name: [u.first_name, u.last_name].filter(Boolean).join(' ') || `User ${u.id}`,
      username: u.username || null
    };
  }

  
  const textMention = Array.isArray(event.entities)
    ? event.entities.find(e => e.type === 'text_mention' && e.user?.id)
    : null;
  if (textMention?.user?.id) {
    const u = textMention.user;
    return {
      id: Number(u.id),
      name: [u.first_name, u.last_name].filter(Boolean).join(' ') || `User ${u.id}`,
      username: u.username || null
    };
  }

  let raw = String(args[0] || '').trim();
  if (!raw) return null;
  raw = raw.replace(/^@+/, '');
  if (!raw || /^(m|h)$/i.test(raw)) return null;

  
  
  
  if (/^\d+$/.test(raw)) {
    const id = Number(raw);
    if (!Number.isSafeInteger(id) || id <= 0) return null;
    try {
      const member = await api.getChatMember(chatId, id);
      const u = member?.user;
      if (!u?.id) return null;
      return {
        id: Number(u.id),
        name: [u.first_name, u.last_name].filter(Boolean).join(' ') || `User ${u.id}`,
        username: u.username || null
      };
    } catch {
      return null;
    }
  }

  
  
  const wanted = raw.toLowerCase();
  try {
    if (db?.getAllUsers) {
      const users = await db.getAllUsers();
      const found = users.find(u => String(u.username || '').replace(/^@/, '').toLowerCase() === wanted);
      if (found?.id) {
        const id = Number(found.id);
        if (Number.isSafeInteger(id) && id > 0) {
          try {
            const member = await api.getChatMember(chatId, id);
            const u = member?.user;
            if (u?.id) {
              return {
                id: Number(u.id),
                name: [u.first_name, u.last_name].filter(Boolean).join(' ') || found.firstName || `User ${u.id}`,
                username: u.username || found.username || null
              };
            }
          } catch {}
        }
      }
    }
  } catch {}

  return null;
}


async function verifyTargetMember(api, chatId, target) {
  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const member = await api.getChatMember(chatId, Number(target.id));
      const status = String(member?.status || '').toLowerCase();
      if (status === 'left' || status === 'kicked') return { ok: false, member };
      if (status === 'restricted' && member?.is_member === false) return { ok: false, member };
      if (!member?.user?.id) return { ok: false, member };
      return { ok: true, member };
    } catch (e) {
      lastError = e;
      if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  return { ok: false, error: lastError };
}


function formatMuteError(err) {
  const raw = String(err?.message || err || 'Unknown error');
  const upper = raw.toUpperCase();
  if (upper.includes('PARTICIPANT_ID_INVALID') || upper.includes('USER_ID_INVALID')) {
    return 'টার্গেট ইউজারটি এই গ্রুপে নেই/Telegram ওই user_id গ্রহণ করছে না। Reply করে /mute দিন বা সঠিক numeric user ID দিন।';
  }
  if (upper.includes('CHAT_ADMIN_REQUIRED') || upper.includes('BOT_ADMIN')) {
    return 'বটকে Admin করে “Restrict Users” permission দিন।';
  }
  if (upper.includes('RIGHT_FORBIDDEN') || upper.includes('FORBIDDEN')) {
    return 'বটের প্রয়োজনীয় Admin permission নেই। “Restrict Users” permission চালু করুন।';
  }
  return raw;
}


module.exports = {
  config: {
    name: "mute",
    aliases: ["unmute", "mutelist", "mlist", "mute_list"],
    author: "SK-SIDDIK-KHAN",
    version: "6.0.8",
    cooldown: 3,
    role: 1,
    description: "Mute/Unmute m/h + Reply/Mention/UID + List",
    category: "moderation",
    usePrefix: true
  },

  onStart: async function ({ event, api, args, message, chatId, userId, ctx, db, bot}) {
    if (!message.isGroup) return message.reply('❌ গ্রুপে ইউজ করুন।');
    if (message.chatType !== 'supergroup') return message.reply('❌ Telegram-এর Mute/Restrict শুধু Supergroup-এ কাজ করে। এই গ্রুপটি Supergroup-এ convert করুন।');
    const text = (event.text || event.caption || '').toLowerCase();
    const isUnmute = text.includes('unmute');
    const isList = text.includes('list') || args[0]?.toLowerCase() === 'list';

    if (isList || event.text?.toLowerCase().endsWith('mutelist') || event.text?.toLowerCase().endsWith('mlist')) {
      const muted = loadMuted();
      const list = muted[chatId] || [];
      if (list.length === 0) return message.reply('✅ এই গ্রুপে কেউ মিউট নেই।');
      let response = `🔇 **MUTED USERS LIST**\n━━━━━━━━━━━━━━━━━━━━\n`;
      list.forEach((u, i) => {
        response += `👤 ${i + 1}. **নাম:** ${u.name}\n🆔 **ID:** \`${u.id}\`\n⏰ **সময়:** ${u.time}${u.expire? `\n⏳ **Expire:** ${u.expire}`:''}\n━━━━━━━━━━━━━━━━━━━━\n`;
      });
      response += `\n📊 মোট: ${list.length} জন`;
      try {
        const chat = await api.getChat(chatId);
        if (chat.photo?.big_file_id) {
          const file = await api.getFile(chat.photo.big_file_id);
          const url = `https://api.telegram.org/file/bot${api.token}/${file.file_path}`;
          const res = await axios.get(url, { responseType: "arraybuffer" });
          const dir = path.join(__dirname, "tmp");
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          const p = path.join(dir, `mute_${chatId}.jpg`);
          fs.writeFileSync(p, Buffer.from(res.data));
          await api.sendPhoto(chatId, { source: fs.createReadStream(p) }, { caption: response, parse_mode: "Markdown" });
          try { fs.unlinkSync(p); } catch {}
          return;
        }
      } catch {}
      return api.sendMessage(chatId, response, { parse_mode: "Markdown" });
    }

    const timeData = parseTime(args);
    let targetArgs = [...args];
    if (timeData) {
      const filtered = [];
      for (let i = 0; i < args.length; i++) {
        const a = String(args[i]).toLowerCase();
        const next = String(args[i + 1] || '');
        if ((a === 'm' || a === 'h') && /^\d+$/.test(next)) {
          i++;
          continue;
        }
        if (/^\d+[mh]$/.test(a)) continue;
        filtered.push(args[i]);
      }
      targetArgs = filtered;
    }

    let target = await getTargetUser({ event, api, args: targetArgs, chatId, db });
    if (!target && event.reply_to_message?.from) {
      target = await getTargetUser({ event, api, args: [], chatId, db });
    }
    if (!target) {
      return message.reply(
        `⚠️ ব্যবহার:\n` +
        `/mute (reply) - Lifetime\n` +
        `/mute m 50 (reply) - 50 Min\n` +
        `/mute h 24 (reply) - 24 Hour\n` +
        `/mute @username m 30\n` +
        `/mute 123456 h 5\n` +
        `/unmute (reply/@/uid)\n` +
        `/mutelist`
      );
    }

    if (target.id === userId) return message.reply('❌ নিজেকে মিউট করা যাবে না!');
    if (target.id === ctx.botInfo?.id) return message.reply('❌ আমাকে মিউট করা যাবে না!');

    const targetCheck = await verifyTargetMember(api, chatId, target);
    if (!targetCheck.ok) {
      const detail = targetCheck.error ? formatMuteError(targetCheck.error) : 'ইউজারটি এখন এই গ্রুপের সদস্য নয়।';
      return message.reply(`❌ টার্গেট যাচাই করা যায়নি: ${detail}`);
    }

    const currentTime = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' });

    if (isUnmute) {
      try {
        await api.restrictChatMember(chatId, target.id, {
          can_send_messages: true,
          can_send_media_messages: true,
          can_send_polls: true,
          can_send_other_messages: true,
          can_add_web_page_previews: true,
          can_invite_users: true
        });
        let muted = loadMuted();
        if (muted[chatId]) {
          muted[chatId] = muted[chatId].filter(u => String(u.id)!== String(target.id));
          saveMuted(muted);
        }
        return message.reply(`✅ **${target.name}** আনমিউট করা হয়েছে!\n🆔 \`${target.id}\``, { parse_mode: "Markdown" });
      } catch (e) {
        return message.reply(`❌ আনমিউট হয়নি: ${formatMuteError(e)}\nবটকে Admin + Restrict permission দিন।`);
      }
    }

    try {
      try {
        const admins = await api.getChatAdministrators(chatId);
        if (admins.some(a => String(a.user.id) === String(target.id))) {
          return message.reply('⚠️ এডমিনকে মিউট করা যাবে না!');
        }
      } catch {}

      let restrictObj = { can_send_messages: false };
      let expireText = "Lifetime";
      let expireTime = null;

      if(timeData) {
        const until_date = Math.floor(Date.now()/1000) + timeData.seconds;
        restrictObj.until_date = until_date;
        expireText = timeData.text;
        expireTime = new Date(Date.now() + timeData.seconds*1000).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' });
      }

      await api.restrictChatMember(chatId, target.id, restrictObj);

      let muted = loadMuted();
      if (!muted[chatId]) muted[chatId] = [];
      muted[chatId] = muted[chatId].filter(u => String(u.id)!== String(target.id));
      muted[chatId].push({
        id: target.id,
        name: target.name,
        username: target.username || '',
        time: currentTime,
        expire: expireTime || "Never",
        duration: expireText
      });
      saveMuted(muted);

      if(timeData) {
        setTimeout(async () => {
          try {
            await api.restrictChatMember(chatId, target.id, {
              can_send_messages: true,
              can_send_media_messages: true,
              can_send_polls: true,
              can_send_other_messages: true,
              can_add_web_page_previews: true
            });
            let m = loadMuted();
            if(m[chatId]) { m[chatId] = m[chatId].filter(u => String(u.id)!== String(target.id)); saveMuted(m); }
            await api.sendMessage(chatId, `✅ Auto Unmute: **${target.name}** এর ${expireText} মিউট শেষ!`, { parse_mode: "Markdown" }).catch(()=>{});
          } catch {}
        }, timeData.seconds * 1000);
      }

      return message.reply(`🔇 **${target.name}** কে মিউট করা হয়েছে।\n🆔 \`${target.id}\`\n⏰ ${currentTime}\n⏳ **Duration:** ${expireText}${expireTime? `\n🔓 **Unmute:** ${expireTime}`:''}`, { parse_mode: "Markdown" });

    } catch (err) {
      if (err.message?.includes('admin') || err.message?.includes('ADMIN')) {
        return message.reply('⚠️ ইউজারটি এডমিন বা বট এডমিন না।');
      }
      return message.reply(`❌ মিউট হয়নি: ${formatMuteError(err)}\nবটকে 'Restrict Users' পারমিশন সহ এডমিন করুন।`);
    }
  }
};