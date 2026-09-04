// set terminal title
process.stdout.write("\x1b]2;Goat Bot V2 - Telegram\x1b\\");

const fs = require("fs-extra");
const path = require("path");
const https = require("https");
const { URL } = require("url");
const axios = require("axios");
const gradient = require("gradient-string");

const { callbackListenTime, storage5Message } = global.GoatBot;
const {
  log,
  logColor,
  getPrefix,
  createOraDots,
  jsonStringifyColor,
  getText,
  convertTime,
  colors,
  randomString,
} = global.utils;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const currentVersion = require(`${process.cwd()}/package.json`).version;
const config = global.GoatBot.config;
const dirAccount = global.client.dirAccount;

function createLine(content, isMaxWidth = false) {
  let width = process.stdout.columns || 80;
  if (!isMaxWidth && width > 50) width = 50;
  if (!content) return Array(Math.max(1, width)).fill("─").join("");
  content = ` ${String(content).trim()} `;
  const lengthLine = Math.max(0, (isMaxWidth ? (process.stdout.columns || 80) : width) - content.length);
  const left = Math.floor(lengthLine / 2);
  return `${"─".repeat(left)}${content}${"─".repeat(lengthLine - left)}`;
}


function centerText(text, length) {
  const width = process.stdout.columns || 80;
  const textLength = length || String(text).length;
  const leftPadding = Math.max(0, Math.floor((width - textLength) / 2));
  console.log(" ".repeat(leftPadding) + text);
}

function printStartupTitle() {
  const titles = [
    [
      "██████╗  ██████╗  █████╗ ████████╗    ██╗   ██╗██████╗",
      "██╔════╝ ██╔═══██╗██╔══██╗╚══██╔══╝    ██║   ██║╚════██╗",
      "██║  ███╗██║   ██║███████║   ██║       ██║   ██║ █████╔╝",
      "██║   ██║██║   ██║██╔══██║   ██║       ╚██╗ ██╔╝██╔═══╝",
      "╚██████╔╝╚██████╔╝██║  ██║   ██║        ╚████╔╝ ███████╗",
      "╚═════╝  ╚═════╝ ╚═╝  ╚═╝   ╚═╝         ╚═══╝  ╚══════╝"
    ],
    [
      "█▀▀ █▀█ ▄▀█ ▀█▀  █▄▄ █▀█ ▀█▀  █░█ ▀█",
      "█▄█ █▄█ █▀█ ░█░  █▄█ █▄█ ░█░  ▀▄▀ █▄"
    ],
    [`G O A T B O T  V 2 @${currentVersion}`],
    ["GOATBOT V2"]
  ];

  const maxWidth = process.stdout.columns || 80;
  const title = maxWidth > 58 ? titles[0] : maxWidth > 36 ? titles[1] : maxWidth > 26 ? titles[2] : titles[3];

  console.log(gradient("#f5af19", "#f12711")(createLine(null, true)));
  console.log();
  for (const text of title) {
    centerText(gradient("#FA8BFF", "#2BD2FF", "#2BFF88")(text), text.length);
  }

  const subTitle = `GoatBot V2@${currentVersion} - Telegram Bot`;
  const author = "Created by NTKhang with ♡";
  const srcUrl = "Source code: https://github.com/ntkhang03/Goat-Bot-V2";
  const telegramInfo = "Telegram version";

  centerText(gradient("#9F98E8", "#AFF6CF")(subTitle), subTitle.length);
  centerText(gradient("#9F98E8", "#AFF6CF")(author), author.length);
  centerText(gradient("#9F98E8", "#AFF6CF")(srcUrl), srcUrl.length);
  centerText(gradient("#f5af19", "#f12711")(telegramInfo), telegramInfo.length);
}

printStartupTitle();

function readTokenFile() {
  if (!fs.existsSync(dirAccount)) fs.writeFileSync(dirAccount, "");
  const raw = fs.readFileSync(dirAccount, "utf8").trim();
  if (!raw) return "";

  
  
  
  
  try {
    if (raw.startsWith("{")) {
      const obj = JSON.parse(raw);
      return String(obj.token || obj.botToken || "").trim();
    }
  } catch (_) {  }

  const tokenLine = raw.split(/\r?\n/).find((line) => {
    const value = line.replace(/^BOT_TOKEN\s*=\s*/i, "").trim();
    return /^\d{6,12}:[A-Za-z0-9_-]{20,}$/.test(value);
  });
  return tokenLine ? tokenLine.replace(/^BOT_TOKEN\s*=\s*/i, "").trim() : raw.split(/\r?\n/)[0].trim();
}

function writeTokenIfNeeded(token) {
  const raw = fs.existsSync(dirAccount) ? fs.readFileSync(dirAccount, "utf8") : "";
  if (!raw.trim() && token) fs.writeFileSync(dirAccount, token);
}

function requestRaw(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const req = https.request({
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || 443,
      path: `${target.pathname}${target.search}`,
      method: options.method || "GET",
      headers: options.headers || {},
      timeout: options.timeout || 35000,
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const data = Buffer.concat(chunks);
        resolve({ status: res.statusCode || 0, headers: res.headers, data });
      });
    });
    req.on("timeout", () => req.destroy(new Error("Telegram request timed out")));
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function encodeForm(data) {
  return Object.entries(data)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(typeof value === "object" ? JSON.stringify(value) : String(value))}`)
    .join("&");
}

async function multipartRequest(url, fields, file) {
  const boundary = `----GoatBotBoundary${randomString(18)}`;
  const chunks = [];
  const push = (value) => chunks.push(Buffer.isBuffer(value) ? value : Buffer.from(value));

  for (const [name, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    push(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n`);
    push(typeof value === "object" ? JSON.stringify(value) : String(value));
    push("\r\n");
  }

  if (file) {
    push(`--${boundary}\r\nContent-Disposition: form-data; name="${file.field}"; filename="${file.filename || "file.bin"}"\r\nContent-Type: ${file.contentType || "application/octet-stream"}\r\n\r\n`);
    push(file.buffer);
    push("\r\n");
  }
  push(`--${boundary}--\r\n`);

  const result = await requestRaw(url, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": Buffer.concat(chunks).length,
    },
  }, Buffer.concat(chunks));
  const text = result.data.toString("utf8");
  let json;
  try { json = JSON.parse(text); } catch (_) { json = { ok: false, description: text }; }
  if (!json.ok) throw new Error(json.description || "Telegram API error");
  return json.result;
}

async function collectBuffer(value) {
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === "string") {
    if (/^https?:\/\//i.test(value)) return Buffer.from((await axios.get(value, { responseType: "arraybuffer" })).data);
    return fs.readFileSync(value);
  }
  if (value && typeof value.pipe === "function") {
    const parts = [];
    for await (const chunk of value) parts.push(Buffer.from(chunk));
    return Buffer.concat(parts);
  }
  if (value && value.data && Buffer.isBuffer(value.data)) return value.data;
  if (value && typeof value.path === "string" && fs.existsSync(value.path)) return fs.readFileSync(value.path);
  return null;
}

function filenameFor(value, fallback = "file.bin") {
  if (typeof value === "string") return path.basename(value.split("?")[0]) || fallback;
  if (value && value.path) return path.basename(value.path) || fallback;
  return fallback;
}

function extOf(name) {
  const ext = path.extname(name || "").toLowerCase();
  return ext || ".bin";
}

function attachmentType(value, name) {
  const ext = extOf(name);
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return "photo";
  if ([".gif"].includes(ext)) return "animated_image";
  if ([".mp4", ".mov", ".mkv", ".webm"].includes(ext)) return "video";
  if ([".mp3", ".m4a", ".wav", ".ogg", ".oga"].includes(ext)) return "audio";
  return "file";
}

function normalizeId(value) {
  return value === undefined || value === null ? "" : String(value);
}

function normalizeInlineKeyboard(buttons) {
  if (!buttons) return null;
  let rows = Array.isArray(buttons) ? buttons : [buttons];
  if (rows.length && !Array.isArray(rows[0])) rows = [rows];

  return rows.map(row => row.map(button => {
    if (typeof button === "string") {
      return { text: button, callback_data: button };
    }
    if (!button || typeof button !== "object") return null;

    const out = { text: String(button.text || button.label || "Button") };
    if (button.url) out.url = String(button.url);
    else if (button.web_app) out.web_app = button.web_app;
    else if (button.callback_data !== undefined) out.callback_data = String(button.callback_data);
    else if (button.data !== undefined) out.callback_data = String(button.data);
    else out.callback_data = out.text;
    return out;
  }).filter(Boolean)).filter(row => row.length);
}

function makeAttachment(fileId, type, name, botApi) {
  const attachment = {
    type,
    filename: name || `${type}.bin`,
    fileID: fileId,
    url: null,
    duration: 0,
    width: 0,
    height: 0,
  };
  
  
  attachment.getUrl = async () => {
    if (!attachment.url) attachment.url = await botApi.fileUrl(fileId);
    return attachment.url;
  };
  return attachment;
}

class TelegramApi {
  constructor(token) {
    this.token = token;
    this.base = `https://api.telegram.org/bot${token}`;
    this.fileBase = `https://api.telegram.org/file/bot${token}`;
    this.offset = 0;
    this.running = false;
    this.pollingHandle = null;
    this.botInfo = null;
    this.chatCache = new Map();
    this.chatMembers = new Map();
    this.messageCache = new Map();
    this.options = {};
  }

  async call(method, params = {}) {
    const body = encodeForm(params);
    const result = await requestRaw(`${this.base}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      timeout: 40000,
    }, body);
    let json;
    try { json = JSON.parse(result.data.toString("utf8")); } catch (_) { throw new Error("Invalid Telegram response"); }
    if (!json.ok) {
      const error = new Error(json.description || `Telegram API ${method} failed`);
      error.response = json;
      throw error;
    }
    return json.result;
  }

  async fileUrl(fileId) {
    const file = await this.call("getFile", { file_id: fileId });
    return `${this.fileBase}/${file.file_path}`;
  }

  async getMe() { return this.botInfo || (this.botInfo = await this.call("getMe")); }
  getCurrentUserID() { return normalizeId(this.botInfo?.id); }
  async getFile(fileId) { return this.call("getFile", { file_id: String(fileId) }); }
  async getFileLink(fileId) { const file = await this.getFile(fileId); if (!file?.file_path) throw new Error("Telegram file path not found"); return `${this.fileBase}/${file.file_path}`; }
  async sendChatAction(chatId, action) { return this.call("sendChatAction", { chat_id: normalizeId(chatId), action: String(action || "typing") }); }
  async getChat(chatId) { return this.call("getChat", { chat_id: normalizeId(chatId) }); }
  async getChatMember(chatId, userId) { return this.call("getChatMember", { chat_id: normalizeId(chatId), user_id: Number(userId) }); }
  async getChatAdministrators(chatId) { return this.call("getChatAdministrators", { chat_id: normalizeId(chatId) }); }
  async getChatMemberCount(chatId) { return this.call("getChatMemberCount", { chat_id: normalizeId(chatId) }); }
  async exportChatInviteLink(chatId) { return this.call("exportChatInviteLink", { chat_id: normalizeId(chatId) }); }
  async leaveChat(chatId) { return this.call("leaveChat", { chat_id: normalizeId(chatId) }); }
  async getUserProfilePhotos(userId, options = {}) { return this.call("getUserProfilePhotos", { user_id: Number(userId), limit: Number(options.limit || 100), offset: Number(options.offset || 0) }); }
  async setChatTitle(chatId, title) { return this.call("setChatTitle", { chat_id: normalizeId(chatId), title: String(title) }); }
  async setChatDescription(chatId, description) { return this.call("setChatDescription", { chat_id: normalizeId(chatId), description: String(description || "") }); }
  async setChatPhoto(chatId, photo) {
    const value = photo?.source || photo?.path || photo?.url || photo?.file_id || photo?.fileID || photo;
    const file = await this._prepareMedia(value, "photo", "chat.jpg");
    if (file) return this._sendMediaMultipart("setChatPhoto", { chat_id: normalizeId(chatId) }, file);
    return this.call("setChatPhoto", { chat_id: normalizeId(chatId), photo: String(value || "") });
  }
  async banChatMember(chatId, userId, options = {}) { return this.call("banChatMember", { chat_id: normalizeId(chatId), user_id: Number(userId), ...options }); }
  async unbanChatMember(chatId, userId, options = {}) { return this.call("unbanChatMember", { chat_id: normalizeId(chatId), user_id: Number(userId), ...options }); }
  async restrictChatMember(chatId, userId, permissions, options = {}) { return this.call("restrictChatMember", { chat_id: normalizeId(chatId), user_id: Number(userId), permissions: typeof permissions === "object" ? JSON.stringify(permissions) : permissions, ...options }); }

  setOptions(options = {}) {
    this.options = { ...this.options, ...options };
    return this.options;
  }

  async sendMessage(form, threadID, callback, replyToMessageID) {
    // Messenger GoatBot compatibility standard:
    // api.sendMessage(message, event.threadID, callback?, replyToMessageID?)
    const chatId = normalizeId(threadID);
    if (!chatId || chatId === "undefined" || chatId === "null") {
      const error = new Error("Invalid threadID. Use api.sendMessage(message, event.threadID).");
      if (typeof callback === "function") callback(error);
      throw error;
    }
    let body = typeof form === "string" ? form : String(form?.body || "");
    const replyId = replyToMessageID || (typeof callback === "number" ? callback : undefined);
    if (typeof callback === "number") callback = undefined;

    const base = {
      chat_id: chatId,
      disable_web_page_preview: false,
    };
    // Preserve Telegram reply_markup passed inside the message form.
    // message.reply({ body, reply_markup }) is the normal command API shape.
    if (form && typeof form === "object") {
      if (form.reply_markup) base.reply_markup = form.reply_markup;
      else if (form.inline_keyboard) base.reply_markup = { inline_keyboard: form.inline_keyboard };
    }

    // Also support reply_markup/inline_keyboard passed as the callback/options argument.
    if (callback && typeof callback === "object" && !Array.isArray(callback)) {
      if (callback.reply_markup) base.reply_markup = callback.reply_markup;
      else if (callback.inline_keyboard) base.reply_markup = { inline_keyboard: callback.inline_keyboard };
    }

    const inlineButtons = normalizeInlineKeyboard(
      form && typeof form === "object" ? (form.buttons || form.inlineKeyboard || form.keyboard) : null
    );
    if (inlineButtons?.length) {
      base.reply_markup = { inline_keyboard: inlineButtons };
    }
    if (replyId) base.reply_parameters = { message_id: Number(replyId) };
    if (form && typeof form === "object" && form.mentions) {
      
      
      const entities = [];
      let text = body;
      for (const mention of form.mentions) {
        if (!mention || !mention.id || !mention.tag) continue;
        const tag = String(mention.tag);
        const idx = text.indexOf(tag);
        if (idx >= 0) {
          entities.push({ offset: idx, length: tag.length, type: "text_mention", user: { id: Number(mention.id), is_bot: false, first_name: tag } });
        }
      }
      if (entities.length) base.entities = entities;
    }

    let result;
    const attachment = form && typeof form === "object" ? form.attachment : null;
    const attachments = attachment ? (Array.isArray(attachment) ? attachment : [attachment]) : [];

    if (!attachments.length) {
      result = await this.call("sendMessage", { ...base, text: body || "\u200b" });
    } else {
      
      
      for (let i = 0; i < attachments.length; i++) {
        const item = attachments[i];
        let value = item?.url || item?.fileID || item;
        let file = null;
        const name = filenameFor(value, `attachment-${i + 1}${extOf(value?.filename || "")}`);
        if (value && typeof value !== "string" && !value.fileID && !value.url) {
          const buffer = await collectBuffer(value);
          if (buffer) file = { field: "media", buffer, filename: name };
        } else if (typeof value === "string" && !/^https?:\/\//i.test(value) && fs.existsSync(value)) {
          file = { field: "media", buffer: fs.readFileSync(value), filename: name };
        }

        const type = item?.type || attachmentType(value, name);
        const method = type === "photo" || type === "png" ? "sendPhoto" : type === "video" ? "sendVideo" : type === "audio" ? "sendAudio" : "sendDocument";
        const field = method === "sendPhoto" ? "photo" : method === "sendVideo" ? "video" : method === "sendAudio" ? "audio" : "document";
        const fields = { chat_id: chatId };
        if (i === 0 && body) fields.caption = body;
        if (i === 0 && replyId) fields.reply_parameters = { message_id: Number(replyId) };
        if (file) {
          file.field = field;
          result = await multipartRequest(`${this.base}/${method}`, fields, file);
        } else {
          fields[field] = typeof value === "string" ? value : String(item?.fileID || "");
          result = await this.call(method, fields);
        }
      }
    }

    const info = { ...result, messageID: normalizeId(result.message_id), threadID: chatId };
    this.messageCache.set(`${chatId}:${info.messageID}`, info);
    if (typeof callback === "function") callback(null, info);
    return info;
  }

  async sendPhoto(chatId, photo, options = {}) {
    const fields = { chat_id: normalizeId(chatId), ...options };
    delete fields.reply_to_message_id;
    if (options.reply_to_message_id) fields.reply_parameters = { message_id: Number(options.reply_to_message_id) };
    const value = photo?.source || photo?.path || photo?.url || photo?.file_id || photo?.fileID || photo;
    const file = await this._prepareMedia(value, "photo", "photo.jpg");
    if (file) return this._sendMediaMultipart("sendPhoto", fields, file);
    fields.photo = typeof value === "string" ? value : String(value || "");
    return this.call("sendPhoto", fields);
  }

  async sendVideo(chatId, video, options = {}) {
    const fields = { chat_id: normalizeId(chatId), ...options };
    delete fields.reply_to_message_id;
    if (options.reply_to_message_id) fields.reply_parameters = { message_id: Number(options.reply_to_message_id) };
    const value = video?.source || video?.path || video?.url || video?.file_id || video?.fileID || video;
    const file = await this._prepareMedia(value, "video", "video.mp4");
    if (file) return this._sendMediaMultipart("sendVideo", fields, file);
    fields.video = typeof value === "string" ? value : String(value || "");
    return this.call("sendVideo", fields);
  }

  async sendAudio(chatId, audio, options = {}) {
    const fields = { chat_id: normalizeId(chatId), ...options };
    delete fields.reply_to_message_id;
    if (options.reply_to_message_id) fields.reply_parameters = { message_id: Number(options.reply_to_message_id) };
    const value = audio?.source || audio?.path || audio?.url || audio?.file_id || audio?.fileID || audio;
    const file = await this._prepareMedia(value, "audio", "audio.mp3");
    if (file) return this._sendMediaMultipart("sendAudio", fields, file);
    fields.audio = typeof value === "string" ? value : String(value || "");
    return this.call("sendAudio", fields);
  }

  async sendDocument(chatId, document, options = {}) {
    const fields = { chat_id: normalizeId(chatId), ...options };
    delete fields.reply_to_message_id;
    if (options.reply_to_message_id) fields.reply_parameters = { message_id: Number(options.reply_to_message_id) };
    const value = document?.source || document?.path || document?.url || document?.file_id || document?.fileID || document;
    const file = await this._prepareMedia(value, "document", document?.filename || "file.bin");
    if (file) return this._sendMediaMultipart("sendDocument", fields, file);
    fields.document = typeof value === "string" ? value : String(value || "");
    return this.call("sendDocument", fields);
  }

  async _prepareMedia(value, field, filename) {
    if (value && typeof value === "object" && !Buffer.isBuffer(value) && value.file_id) return null;
    if (typeof value === "string" && /^https?:\/\//i.test(value)) return { field, buffer: await collectBuffer(value), filename };
    if (typeof value === "string" && fs.existsSync(value)) return { field, buffer: fs.readFileSync(value), filename: path.basename(value) || filename };
    if (Buffer.isBuffer(value)) return { field, buffer: value, filename };
    if (value && typeof value.pipe === "function") return { field, buffer: await collectBuffer(value), filename };
    if (value && value.data && Buffer.isBuffer(value.data)) return { field, buffer: value.data, filename };
    if (value && typeof value.path === "string" && fs.existsSync(value.path)) return { field, buffer: fs.readFileSync(value.path), filename: path.basename(value.path) || filename };
    return null;
  }

  async _sendMediaMultipart(method, fields, file) {
    const result = await multipartRequest(`${this.base}/${method}`, fields, file);
    const info = { ...result, messageID: normalizeId(result.message_id), threadID: normalizeId(fields.chat_id) };
    this.messageCache.set(`${info.threadID}:${info.messageID}`, info);
    return info;
  }

  async deleteMessage(chatId, messageId) {
    return this.call("deleteMessage", { chat_id: normalizeId(chatId), message_id: Number(messageId) });
  }

  async editMessageText(a, b, c, d, e) {
    if (typeof a === "object" && a !== null) return this.call("editMessageText", a);
    if (typeof b === "object" && b !== null && !c) {
      // Telegram-style: editMessageText(text, {chat_id, message_id, ...options})
      if (b.chat_id !== undefined || b.message_id !== undefined) {
        const { chat_id, message_id, ...opts } = b;
        return this.call("editMessageText", { chat_id: normalizeId(chat_id), message_id: Number(message_id), text: String(a || ""), ...opts });
      }
    }
    const chatId = normalizeId(a);
    const messageId = Number(b);
    const text = c == null && typeof d === "string" ? d : (c == null ? "" : String(c));
    const options = (e && typeof e === "object") ? e : ((d && typeof d === "object") ? d : {});
    return this.call("editMessageText", { chat_id: chatId, message_id: messageId, text, ...options });
  }

  async editMessageCaption(a, b, c, d, e) {
    if (typeof a === "object" && a !== null) return this.call("editMessageCaption", a);
    if (b && typeof b === "object" && !c) {
      if (b.chat_id !== undefined || b.message_id !== undefined) {
        const { chat_id, message_id, ...opts } = b;
        return this.call("editMessageCaption", { chat_id: normalizeId(chat_id), message_id: Number(message_id), caption: String(a || ""), ...opts });
      }
    }
    const chatId = normalizeId(a), messageId = Number(b), caption = c == null && typeof d === "string" ? d : (c == null ? "" : String(c));
    const options = (e && typeof e === "object") ? e : ((d && typeof d === "object") ? d : {});
    return this.call("editMessageCaption", { chat_id: chatId, message_id: messageId, caption, ...options });
  }

  async editMessage(text, messageID, chatID) {
    let chatId = normalizeId(chatID);

    if (!chatId) {
      const found = [...this.messageCache.entries()].find(
        ([, m]) => normalizeId(m.messageID || m.message_id) === normalizeId(messageID)
      );
      if (found) chatId = found[0].split(":")[0];
    }

    if (!chatId) throw new Error("Cannot determine chat ID for editMessage");

    const result = await this.call("editMessageText", {
      chat_id: chatId,
      message_id: Number(messageID),
      text: String(text || ""),
      disable_web_page_preview: false
    });

    const info = result && result.message_id
      ? { ...result, messageID: normalizeId(result.message_id), threadID: chatId }
      : { messageID: normalizeId(messageID), threadID: chatId };

    this.messageCache.set(`${chatId}:${info.messageID}`, info);
    return info;
  }

  async answerCallbackQuery(callbackQueryID, text = "", showAlert = false) {
    if (!callbackQueryID) return false;
    if (text && typeof text === "object") {
      const opts = text;
      text = opts.text || "";
      showAlert = !!opts.show_alert;
    } else if (showAlert && typeof showAlert === "object") {
      showAlert = !!showAlert.show_alert;
    }
    return this.call("answerCallbackQuery", {
      callback_query_id: callbackQueryID,
      text: String(text || "").slice(0, 200),
      show_alert: !!showAlert
    });
  }

  async sendButton(text, buttons, threadID, replyToMessageID, callback) {
    return this.sendMessage(
      { body: text, buttons },
      threadID,
      callback,
      replyToMessageID
    );
  }

  async unsendMessage(messageID, callback) {
    const found = [...this.messageCache.entries()].find(([, m]) => normalizeId(m.messageID || m.message_id) === normalizeId(messageID));
    if (!found) return false;
    const [key, msg] = found;
    const [chatId] = key.split(":");
    try {
      const result = await this.call("deleteMessage", { chat_id: chatId, message_id: Number(messageID) });
      this.messageCache.delete(key);
      if (typeof callback === "function") callback(null, result);
      return result;
    } catch (err) {
      if (typeof callback === "function") callback(err);
      return false;
    }
  }

  async setMessageReaction(emoji, messageID, callback) {
    const found = [...this.messageCache.entries()].find(([, m]) => normalizeId(m.messageID || m.message_id) === normalizeId(messageID));
    if (!found) return false;
    const [key] = found;
    const [chatId] = key.split(":");
    try {
      const result = await this.call("setMessageReaction", {
        chat_id: chatId,
        message_id: Number(messageID),
        reaction: JSON.stringify([{ type: "emoji", emoji: String(emoji || "👍") }]),
        is_big: false,
      });
      if (typeof callback === "function") callback(null, result);
      return result;
    } catch (err) {
      if (typeof callback === "function") callback(err);
      return false;
    }
  }

  async getUserInfo(userID) {
    const id = Number(userID);
    if (!Number.isFinite(id)) return { [normalizeId(userID)]: { id: normalizeId(userID), name: "Unknown user", gender: null, vanity: null } };
    
    try {
      const chat = await this.call("getChat", { chat_id: id });
      const name = [chat.first_name, chat.last_name].filter(Boolean).join(" ") || chat.title || chat.username || `User ${id}`;
      return { [normalizeId(id)]: { id: normalizeId(id), name, firstName: chat.first_name, lastName: chat.last_name, username: chat.username, gender: null, vanity: chat.username || null } };
    } catch (_) {
      return { [normalizeId(id)]: { id: normalizeId(id), name: `User ${id}`, gender: null, vanity: null } };
    }
  }

  async getAvatarUrl(userID) {
    try {
      const photos = await this.call("getUserProfilePhotos", { user_id: Number(userID), limit: 1 });
      const sizes = photos?.photos?.[0] || [];
      const photo = sizes[sizes.length - 1];
      return photo ? await this.fileUrl(photo.file_id) : null;
    } catch (_) {
      return null;
    }
  }

  async getThreadInfo(threadID) {
    const chatId = normalizeId(threadID);
    const chat = await this.call("getChat", { chat_id: chatId });
    const isGroup = ["group", "supergroup"].includes(chat.type);
    let admins = [];
    let userInfo = [];
    let participantIDs = [];

    if (isGroup) {
      try {
        const adminMembers = await this.call("getChatAdministrators", { chat_id: chatId });
        admins = adminMembers.map((m) => m.user).filter(Boolean);
      } catch (_) { admins = []; }
      try {
        const count = await this.call("getChatMemberCount", { chat_id: chatId });
        participantIDs = new Array(Math.min(Number(count) || 0, 1000)).fill(null).map((_, i) => `unknown-${i}`);
      } catch (_) {  }
      userInfo = admins.map((u) => ({ id: normalizeId(u.id), name: [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || `User ${u.id}`, gender: null, vanity: u.username || null }));
    } else {
      const u = chat;
      userInfo = [{ id: normalizeId(u.id), name: [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || u.title || `User ${u.id}`, gender: null, vanity: u.username || null }];
      participantIDs = [normalizeId(u.id)];
    }

    const adminIDs = admins.map((u) => normalizeId(u.id));
    const known = this.chatMembers.get(chatId) || new Map();
    for (const u of userInfo) known.set(normalizeId(u.id), u);
    const members = [...known.values()].map((u) => ({ id: u.id, userID: u.id, name: u.name, gender: u.gender, nickname: null, inGroup: true }));
    const info = {
      threadID: chatId,
      threadName: chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(" ") || chat.username || chatId,
      threadType: isGroup ? 2 : 1,
      userInfo,
      participantIDs,
      adminIDs: adminIDs.map((id) => ({ id })),
      nicknames: {},
      imageSrc: null,
      emoji: null,
      threadTheme: { id: null },
      approvalMode: false,
      isGroup,
      members,
    };
    this.chatCache.set(chatId, info);
    return info;
  }

  async getThreadList() {
    return [...this.chatCache.values()];
  }

  async changeNickname(nickname, threadID, userID) {
    
    if (normalizeId(userID) === this.getCurrentUserID()) {
      try { return await this.call("setChatAdministratorCustomTitle", { chat_id: threadID, user_id: Number(userID), custom_title: String(nickname || "") }); } catch (_) { return false; }
    }
    return false;
  }

  async setTitle(threadID, title) { return this.call("setChatTitle", { chat_id: threadID, title }); }
  async changeThreadEmoji() { return false; }
  async changeThreadColor() { return false; }
  async changeGroupImage() { return false; }
  async changeAvatar() { return false; }

  async removeUserFromGroup(userID, threadID, callback) {
    try {
      const result = normalizeId(userID) === this.getCurrentUserID()
        ? await this.call("leaveChat", { chat_id: threadID })
        : await this.call("banChatMember", { chat_id: threadID, user_id: Number(userID), revoke_messages: true });
      if (typeof callback === "function") callback(null, result);
      return result;
    } catch (err) {
      if (typeof callback === "function") callback(err);
      throw err;
    }
  }

  async addUserToGroup(userID, threadID, callback) {
    try {
      const result = await this.call("unbanChatMember", { chat_id: threadID, user_id: Number(userID), only_if_banned: true });
      if (typeof callback === "function") callback(null, result);
      return result;
    } catch (err) {
      if (typeof callback === "function") callback(err);
      throw err;
    }
  }

  async refreshFb_dtsg() { return true; }
  async resolvePhotoUrl(url) { return url; }
  async rf() { return true; }
  getAppState() { return [{ key: "telegram_bot_token", value: this.token }]; }
  async httpPost(url, form) { return axios.post(url, form); }

  async buildAttachment(fileId, type, name) {
    return makeAttachment(fileId, type, name, this);
  }

  async eventFromUpdate(update) {
    if (update.message || update.edited_message || update.channel_post) {
      const msg = update.message || update.edited_message || update.channel_post;
      return this.eventFromMessage(msg);
    }
    if (update.message_reaction) return this.eventFromReaction(update.message_reaction);
    if (update.callback_query) return this.eventFromCallbackQuery(update.callback_query);
    if (update.my_chat_member || update.chat_member) return this.eventFromMemberUpdate(update.my_chat_member || update.chat_member);
    if (update.chat_join_request) return this.eventFromMemberUpdate(update.chat_join_request);
    return null;
  }

  async eventFromMessage(msg) {
    const chat = msg.chat || {};
    const from = msg.from || msg.sender_chat || {};
    const body = msg.text || msg.caption || "";
    const entities = [...(msg.entities || []), ...(msg.caption_entities || [])];
    const event = {
      type: msg.reply_to_message ? "message_reply" : "message",
      body,
      threadID: normalizeId(chat.id),
      senderID: normalizeId(from.id),
      userID: normalizeId(from.id),
      author: normalizeId(from.id),
      messageID: normalizeId(msg.message_id),
      isGroup: ["group", "supergroup"].includes(chat.type),
      isReply: !!msg.reply_to_message,
      mentions: {},
      attachments: [],
      participantIDs: [],
      messageReply: null,
      timestamp: (msg.date || Math.floor(Date.now() / 1000)) * 1000,
      raw: msg,
      message: msg,
      from,
      chat,
      text: body,
      caption: msg.caption,
      reply_to_message: msg.reply_to_message,
      entities,
    };

    for (const entity of entities) {
      if (entity.type === "text_mention" && entity.user) {
        const name = body.slice(entity.offset, entity.offset + entity.length);
        event.mentions[normalizeId(entity.user.id)] = name;
      }
    }

    if (msg.reply_to_message) {
      const reply = msg.reply_to_message;
      const replyFrom = reply.from || reply.sender_chat || {};
      event.messageReply = {
        messageID: normalizeId(reply.message_id),
        senderID: normalizeId(replyFrom.id),
        userID: normalizeId(replyFrom.id),
        author: normalizeId(replyFrom.id),
        body: reply.text || reply.caption || "",
        attachments: await this.attachmentsFromMessage(reply),
      };
    }
    event.attachments = await this.attachmentsFromMessage(msg);

    const known = this.chatMembers.get(event.threadID) || new Map();
    if (from.id) known.set(normalizeId(from.id), { id: normalizeId(from.id), name: [from.first_name, from.last_name].filter(Boolean).join(" ") || from.username || `User ${from.id}`, gender: null, vanity: from.username || null });
    this.chatMembers.set(event.threadID, known);
    this.messageCache.set(`${event.threadID}:${event.messageID}`, msg);
    this.chatCache.set(event.threadID, { ...(this.chatCache.get(event.threadID) || {}), threadID: event.threadID, threadName: chat.title || chat.first_name || chat.username || event.threadID, isGroup: event.isGroup });
    return event;
  }

  async attachmentsFromMessage(msg) {
    const result = [];
    if (msg.photo?.length) {
      const p = msg.photo[msg.photo.length - 1];
      const a = await this.buildAttachment(p.file_id, "photo", `photo-${p.file_unique_id || p.file_id}.jpg`);
      a.width = p.width; a.height = p.height;
      a.url = await this.fileUrl(p.file_id);
      result.push(a);
    }
    if (msg.video) {
      const a = await this.buildAttachment(msg.video.file_id, "video", msg.video.file_name || `video-${msg.video.file_unique_id}.mp4`);
      a.width = msg.video.width; a.height = msg.video.height; a.duration = msg.video.duration; a.url = await this.fileUrl(msg.video.file_id);
      result.push(a);
    }
    if (msg.audio) {
      const a = await this.buildAttachment(msg.audio.file_id, "audio", msg.audio.file_name || `audio-${msg.audio.file_unique_id}.mp3`);
      a.duration = msg.audio.duration; a.url = await this.fileUrl(msg.audio.file_id); result.push(a);
    }
    if (msg.voice) {
      const a = await this.buildAttachment(msg.voice.file_id, "audio", `voice-${msg.voice.file_unique_id}.ogg`);
      a.duration = msg.voice.duration; a.url = await this.fileUrl(msg.voice.file_id); result.push(a);
    }
    if (msg.document) { const a = await this.buildAttachment(msg.document.file_id, "file", msg.document.file_name || `document-${msg.document.file_unique_id}`); a.url = await this.fileUrl(msg.document.file_id); result.push(a); }
    if (msg.animation) { const a = await this.buildAttachment(msg.animation.file_id, "animated_image", msg.animation.file_name || `animation-${msg.animation.file_unique_id}.gif`); a.url = await this.fileUrl(msg.animation.file_id); result.push(a); }
    return result;
  }

  async eventFromCallbackQuery(query) {
    const msg = query.message || query.inline_message || {};
    const chat = msg.chat || {};
    const from = query.from || {};
    const threadID = normalizeId(chat.id || query.chat_instance);
    const messageID = normalizeId(msg.message_id || query.inline_message_id || Date.now());

    return {
      type: "callback_query",
      body: "",
      threadID,
      senderID: normalizeId(from.id),
      userID: normalizeId(from.id),
      author: normalizeId(from.id),
      messageID,
      isGroup: ["group", "supergroup"].includes(chat.type),
      isReply: false,
      mentions: {},
      attachments: [],
      participantIDs: [],
      messageReply: null,
      callbackQueryID: query.id,
      callbackData: String(query.data || ""),
      data: String(query.data || ""),
      callbackMessage: msg,
      message: msg,
      from,
      chat,
      callback_query: query,
      timestamp: (msg.date || Math.floor(Date.now() / 1000)) * 1000,
      raw: query,
    };
  }

  async eventFromReaction(reaction) {
    const actor = reaction.user || reaction.actor_chat || {};
    const chatId = normalizeId(reaction.chat?.id);
    const messageID = normalizeId(reaction.message_id);
    return {
      type: "message_reaction",
      threadID: chatId,
      senderID: normalizeId(actor.id),
      userID: normalizeId(actor.id),
      author: normalizeId(actor.id),
      messageID,
      isGroup: ["group", "supergroup"].includes(reaction.chat?.type),
      reaction: reaction.new_reaction?.find((r) => r.type === "emoji")?.emoji || "",
      oldReaction: reaction.old_reaction?.find((r) => r.type === "emoji")?.emoji || "",
      from: actor,
      chat: reaction.chat || {},
      message: this.messageCache.get(`${chatId}:${messageID}`) || {},
      mentions: {},
      attachments: [],
      participantIDs: [],
      raw: reaction,
    };
  }

  async eventFromMemberUpdate(memberUpdate) {
    const chat = memberUpdate.chat || {};
    const newMember = memberUpdate.new_chat_member;
    const oldMember = memberUpdate.old_chat_member;
    const user = newMember?.user || oldMember?.user || memberUpdate.from || {};
    const threadID = normalizeId(chat.id);
    const isGroup = ["group", "supergroup"].includes(chat.type);
    let logMessageType = null;
    let logMessageData = {};

    if (newMember) {
      const oldStatus = oldMember?.status;
      const newStatus = newMember.status;
      if (["left", "kicked"].includes(oldStatus) && ["member", "administrator", "creator"].includes(newStatus)) {
        logMessageType = "log:subscribe";
        logMessageData.addedParticipants = [{ userFbId: normalizeId(user.id), userFbName: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || `User ${user.id}`, fullName: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || `User ${user.id}` }];
      } else if (["member", "administrator", "creator"].includes(oldStatus) && ["left", "kicked"].includes(newStatus)) {
        logMessageType = "log:unsubscribe";
        logMessageData.leftParticipantFbId = normalizeId(user.id);
      }
    }

    if (!logMessageType) return null;
    return {
      type: "event",
      threadID,
      senderID: normalizeId(memberUpdate.from?.id || user.id),
      userID: normalizeId(memberUpdate.from?.id || user.id),
      author: normalizeId(memberUpdate.from?.id || user.id),
      messageID: normalizeId(Date.now()),
      isGroup,
      body: "",
      mentions: {},
      attachments: [],
      participantIDs: [normalizeId(user.id)],
      logMessageType,
      logMessageData,
      raw: memberUpdate,
    };
  }

  async poll(callback) {
    if (!this.running) return;
    try {
      const updates = await this.call("getUpdates", {
        offset: this.offset,
        timeout: 25,
        allowed_updates: JSON.stringify(["message", "edited_message", "channel_post", "callback_query", "message_reaction", "my_chat_member", "chat_member", "chat_join_request"]),
      });
      for (const update of updates) {
        this.offset = Math.max(this.offset, Number(update.update_id) + 1);
        try {
          const event = await this.eventFromUpdate(update);
          if (event) await callback(null, event);
        } catch (err) {
          await callback(err);
        }
      }
    } catch (err) {
      await callback(err);
      await sleep(2500);
    }
    if (this.running) this.pollingHandle = setImmediate(() => this.poll(callback));
  }

  polling(callback) {
    this.running = true;
    this.pollingHandle = setImmediate(() => this.poll(callback));
    return {
      stopListening: () => { this.running = false; if (this.pollingHandle) clearImmediate(this.pollingHandle); },
    };
  }
}

async function loadDataAndScripts(api) {
  const {
    threadModel,
    userModel,
    dashBoardModel,
    globalModel,
    threadsData,
    usersData,
    dashBoardData,
    globalData,
    sequelize,
  } = await require("./loadData.js")(api, createLine);

  await require("../custom.js")({
    api,
    threadModel,
    userModel,
    dashBoardModel,
    globalModel,
    threadsData,
    usersData,
    dashBoardData,
    globalData,
    getText,
  });

  await require("./loadScripts.js")(
    api,
    threadModel,
    userModel,
    dashBoardModel,
    globalModel,
    threadsData,
    usersData,
    dashBoardData,
    globalData,
    createLine
  );

  return { threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, sequelize };
}

async function fetchGban() {
  const urls = [
    "https://raw.githubusercontent.com/xnil6x-obito/XGBAN/refs/heads/main/gban.json",
  ];
  for (const url of urls) {
    try { return (await axios.get(url, { timeout: 10000 })).data || {}; } catch (_) {  }
  }
  throw new Error("Can't get GBAN data");
}

function isBannedFromGban(dataGban, id) {
  const item = dataGban?.[normalizeId(id)];
  if (!item) return false;
  if (!item.toDate) return true;
  return Date.now() < new Date(item.toDate).getTime();
}

async function checkGban(api) {
  const dataGban = await fetchGban();
  const botID = api.getCurrentUserID();
  if (isBannedFromGban(dataGban, botID)) {
    const item = dataGban[botID];
    log.err("GBAN", getText("login", "gbanMessage", item.date, item.reason, item.date, item.toDate));
    process.exit(0);
  }
  for (const id of global.GoatBot.config.adminBot || []) {
    if (isBannedFromGban(dataGban, id)) {
      const item = dataGban[id];
      log.err("GBAN", getText("login", "gbanMessage", item.date, item.reason, item.date, item.toDate));
      process.exit(0);
    }
  }
  return dataGban;
}

function isWhitelisted(event) {
  const cfg = global.GoatBot.config;
  const sender = normalizeId(event.senderID);
  const thread = normalizeId(event.threadID);
  const admins = (cfg.adminBot || []).map(normalizeId);
  if (admins.includes(sender)) return true;

  const userMode = cfg.whiteListMode?.enable === true;
  const threadMode = cfg.whiteListModeThread?.enable === true;
  const userOK = (cfg.whiteListMode?.whiteListIds || []).map(normalizeId).includes(sender);
  const threadOK = (cfg.whiteListModeThread?.whiteListThreadIds || []).map(normalizeId).includes(thread);

  if (userMode && threadMode) return userOK || threadOK;
  if (userMode) return userOK;
  if (threadMode) return threadOK;
  return true;
}

async function stopListening(api) {
  if (api && api.stop) api.stop();
  if (global.GoatBot.Listening?.stopListening) global.GoatBot.Listening.stopListening();
  global.GoatBot.Listening = null;
  const keys = Object.keys(callbackListenTime);
  const key = keys.pop();
  if (key) callbackListenTime[key] = () => {};
}

function createCallBackListen(api, deps, dataGban) {
  const key = randomString(10) + Date.now();
  const callback = async (error, event) => {
    try {
      if (error) {
        global.responseUptimeCurrent = global.responseUptimeError;
        global.statusAccountBot = "can't login";
        
        return log.err("LISTEN_TELEGRAM", getText("login", "callBackError"), error);
      }
      if (!event) return;

      global.responseUptimeCurrent = global.responseUptimeSuccess;
      global.statusAccountBot = "good";

      if (event.messageID && event.type === "message") {
        if (storage5Message.includes(event.messageID)) return;
        storage5Message.push(event.messageID);
        if (storage5Message.length > 5) storage5Message.shift();
      }

      if (!isWhitelisted(event)) return;

      const sender = normalizeId(event.senderID || event.userID);
      if (isBannedFromGban(dataGban, sender)) {
        if (event.body && event.threadID && event.body.startsWith(getPrefix(event.threadID))) {
          return api.sendMessage(getText("login", "userBanned"), event.threadID, event.messageID);
        }
        return;
      }

      if (event.type === "message" || event.type === "message_reply") {
        const handlerAction = require("../handler/handlerAction.js")(
          api,
          deps.threadModel,
          deps.userModel,
          deps.dashBoardModel,
          deps.globalModel,
          deps.usersData,
          deps.threadsData,
          deps.dashBoardData,
          deps.globalData
        );
        await handlerAction(event);
      } else if (event.type === "callback_query" || event.type === "message_reaction" || event.type === "event") {
        const handlerAction = require("../handler/handlerAction.js")(
          api,
          deps.threadModel,
          deps.userModel,
          deps.dashBoardModel,
          deps.globalModel,
          deps.usersData,
          deps.threadsData,
          deps.dashBoardData,
          deps.globalData
        );
        await handlerAction(event);
      }
    } catch (err) {
      log.err("LISTEN_TELEGRAM", "Event handler error", err);
    }
  };
  callbackListenTime[key] = callback;
  return callback;
}

async function startBot() {
  console.log(colors.hex("#f5ab00")(createLine("START TELEGRAM LOGIN", true)));

  let token = readTokenFile();
  if (!/^\d{6,12}:[A-Za-z0-9_-]{20,}$/.test(token)) {
    log.err("LOGIN TELEGRAM", "Invalid bot token in account.txt");
    log.info("LOGIN TELEGRAM", "Put your BotFather token in account.txt and restart the bot.");
    return;
  }
  writeTokenIfNeeded(token);

  const api = new TelegramApi(token);
  await api.getMe();
  global.GoatBot.fcaApi = api; 
  global.GoatBot.telegramApi = api;
  global.GoatBot.botID = api.getCurrentUserID();
  global.botID = api.getCurrentUserID();
  global.GoatBot.Listening = null;
  global.statusAccountBot = "good";

  logColor("#f5ab00", createLine("BOT INFO"));
  log.info("NODE VERSION", process.version);
  log.info("PROJECT VERSION", currentVersion);
  log.info("BOT ID", `${global.botID} - ${api.botInfo.username ? "@" + api.botInfo.username : api.botInfo.first_name}`);
  log.info("PREFIX", global.GoatBot.config.prefix);
  log.info("LANGUAGE", global.GoatBot.config.language);
  log.info("BOT NICK NAME", global.GoatBot.config.nickNameBot || "GOAT BOT");

  let dataGban;
  try {
    dataGban = await checkGban(api);
    log.master("GBAN", "Telegram GBAN check passed");
  } catch (err) {
    log.err("GBAN", getText("login", "checkGbanError"), err);
    return;
  }

  let notification = "";
  try {
    notification = (await axios.get("https://raw.githubusercontent.com/ntkhang03/Goat-Bot-V2-Gban/master/notification.txt", { timeout: 10000 })).data || "";
  } catch (_) {
    notification = "";
  }

  const deps = await loadDataAndScripts(api);

  
  
  if (global.GoatBot.config.autoLoadScripts?.enable === true) {
    const watch = fs.watch;
    const reload = (folder) => watch(`${process.cwd()}/scripts/${folder}`, async (event, filename) => {
      if (!filename || !filename.endsWith(".js") || filename.endsWith(".eg.js")) return;
      try {
        const filePath = `${process.cwd()}/scripts/${folder}/${filename}`;
        if (!fs.existsSync(filePath)) return;
        const current = fs.readFileSync(filePath, "utf8");
        if (global.temp.contentScripts[folder][filename] === current) return;
        global.temp.contentScripts[folder][filename] = current;
        const name = filename.replace(/\.js$/, "");
        const info = global.utils.loadScripts(
          folder,
          name,
          log,
          global.GoatBot.configCommands,
          api,
          deps.threadModel,
          deps.userModel,
          deps.dashBoardModel,
          deps.globalModel,
          deps.threadsData,
          deps.usersData,
          deps.dashBoardData,
          deps.globalData
        );
        if (info?.status === "success") log.master("AUTO LOAD SCRIPTS", `${folder}/${filename} reloaded`);
        else if (info?.error) log.err("AUTO LOAD SCRIPTS", `${folder}/${filename} reload failed`, info.error);
      } catch (err) {
        log.err("AUTO LOAD SCRIPTS", `Error when reload ${folder}/${filename}`, err);
      }
    });
    reload("cmds");
    reload("events");
  }

  logColor("#f5ab00", createLine("ADMIN BOT"));
  let i = 0;
  for (const uid of global.GoatBot.config.adminBot || []) {
    try {
      const name = await deps.usersData.getName(uid, false);
      log.master("ADMINBOT", `[${++i}] ${uid} | ${name || "Unknown"}`);
    } catch (_) {
      log.master("ADMINBOT", `[${++i}] ${uid}`);
    }
  }
  log.master("NOTIFICATION", String(notification).trim());

  const callback = createCallBackListen(api, deps, dataGban);
  await stopListening(api);
  global.GoatBot.Listening = api.polling(callback);
  global.GoatBot.callBackListen = callback;

  
  const restartConfig = global.GoatBot.config.restartTelegramPolling || {};
  if (restartConfig.enable === true && Number(restartConfig.timeRestart) > 0) {
    clearInterval(global.intervalRestartTelegramPolling);
    global.intervalRestartTelegramPolling = setInterval(async () => {
      try {
        await stopListening(api);
        await sleep(Number(restartConfig.delayAfterStopListening) || 1000);
        global.GoatBot.Listening = api.polling(callback);
        if (restartConfig.logNoti) log.info("LISTEN_TELEGRAM", "Polling restarted");
      } catch (err) {
        log.err("LISTEN_TELEGRAM", "Polling restart failed", err);
      }
    }, Number(restartConfig.timeRestart));
  }
log.master("SUCCESS", "Telegram bot is running");
  log.master("LOAD TIME", `${convertTime(Date.now() - global.GoatBot.startTime)}`);
  // —————————————————— COPYRIGHT INFO —————————————————— //
  logColor("#f5ab00", createLine("COPYRIGHT"));
  console.log(`\x1b[1m\x1b[33m${("COPYRIGHT:")}\x1b[0m\x1b[1m\x1b[37m \x1b[0m\x1b[1m\x1b[36m${("Project GoatBot v2 created by ntkhang03 (https://github.com/ntkhang03), please do not sell this source code or claim it as your own. Thank you!")}\x1b[0m`);
  logColor("#f5ab00", createLine());
}

global.GoatBot.reLoginBot = startBot;
startBot().catch((err) => {
  global.statusAccountBot = "can't login";
  log.err("LOGIN TELEGRAM", "Startup error", err);
});
