// Telegram Bot compatible startup script based on Goat Bot V2

process.stdout.write("\x1b]2;Goat Bot V2 - Telegram\x1b\x5c");

const fs = require("fs-extra");
const path = require("path");
const https = require("https");
const { URL } = require("url");
const axios = require("axios");

const defaultRequire = require;

function decode(text) {
	text = Buffer.from(text, 'hex').toString('utf-8');
	text = Buffer.from(text, 'hex').toString('utf-8');
	text = Buffer.from(text, 'base64').toString('utf-8');
	return text;
}

const readline = defaultRequire("readline");
const toptp = defaultRequire("totp-generator");
const qr = new (defaultRequire("qrcode-reader"));
const Canvas = defaultRequire("canvas");

async function getName(userID) {
	try {
		const user = await axios.post(`https://www.facebook.com/api/graphql/?q=${`node(${userID}){name}`}`);
		return user.data[userID].name;
	}
	catch (error) {
		return null;
	}
}

function compareVersion(version1, version2) {
	const v1 = version1.split(".");
	const v2 = version2.split(".");
	for (let i = 0; i < 3; i++) {
		if (parseInt(v1[i]) > parseInt(v2[i]))
			return 1;
		if (parseInt(v1[i]) < parseInt(v2[i]))
			return -1;
	}
	return 0;
}

const { writeFileSync, readFileSync, existsSync, watch } = require("fs-extra");
const handlerWhenListenHasError = require("./handlerWhenListenHasError.js");
const checkLiveCookie = require("./checkLiveCookie.js");
const { callbackListenTime, storage5Message } = global.GoatBot;
const { log, logColor, getPrefix, createOraDots, jsonStringifyColor, getText, convertTime, colors, randomString } = global.utils;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const currentVersion = require(`${process.cwd()}/package.json`).version;

// Original titles array kept unchanged as requested
const titles = [
	[
		"██████╗ ██████╗ █████╗ ████████╗ ██╗ ██╗██████╗",
		"██╔════╝ ██╔═══██╗██╔══██╗╚══██╔══╝ ██║ ██║╚════██╗",
		"██║ ███╗██║ ██║███████║ ██║ ██║ ██║ █████╔╝",
		"██║ ██║██║ ██║██╔══██║ ██║ ╚██╗ ██╔╝██╔═══╝",
		"╚██████╔╝╚██████╔╝██║ ██║ ██║ ╚████╔╝ ███████╗",
		"╚═════╝ ╚═════╝ ╚═╝ ╚═╝ ╚═╝ ╚═══╝ ╚══════╝"
	],
	[
		"█▀▀ █▀█ ▄▀█ ▀█▀ █▄▄ █▀█ ▀█▀ █░█ ▀█",
		"█▄█ █▄█ █▀█ ░█░ █▄█ █▄█ ░█░ ▀▄▀ █▄"
	],
	[
		"G O A T B O T V 2 @" + currentVersion
	],
	[
		"GOATBOT V2"
	]
];

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

function readTokenFile() {
	if (!fs.existsSync(dirAccount)) fs.writeFileSync(dirAccount, "");
	const raw = fs.readFileSync(dirAccount, "utf8").trim();
	if (!raw) return "";

	try {
		if (raw.startsWith("{")) {
			const obj = JSON.parse(raw);
			return String(obj.token || obj.botToken || "").trim();
		}
	} catch (_) {}

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
		if (form && typeof form === "object") {
			if (form.reply_markup) base.reply_markup = form.reply_markup;
			else if (form.inline_keyboard) base.reply_markup = { inline_keyboard: form.inline_keyboard };
		}
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

	async deleteMessage(chatId, messageId) {
		return this.call("deleteMessage", { chat_id: normalizeId(chatId), message_id: Number(messageId) });
	}

	async editMessageText(a, b, c, d, e) {
		if (typeof a === "object" && a !== null) return this.call("editMessageText", a);
		const chatId = normalizeId(a);
		const messageId = Number(b);
		const text = c == null && typeof d === "string" ? d : (c == null ? "" : String(c));
		const options = (e && typeof e === "object") ? e : ((d && typeof d === "object") ? d : {});
		return this.call("editMessageText", { chat_id: chatId, message_id: messageId, text, ...options });
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
			} catch (_) {}
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

	async buildAttachment(fileId, type, name) {
		return makeAttachment(fileId, type, name, this);
	}

	async eventFromUpdate(update) {
		if (update.message || update.edited_message || update.channel_post) {
			const msg = update.message || update.edited_message || update.channel_post;
			return this.eventFromMessage(msg);
		}
		if (update.callback_query) return this.eventFromCallbackQuery(update.callback_query);
		return null;
	}

	async eventFromMessage(msg) {
		const chat = msg.chat || {};
		const from = msg.from || msg.sender_chat || {};
		const body = msg.text || msg.caption || "";
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
		};
		return event;
	}

	async eventFromCallbackQuery(query) {
		const msg = query.message || {};
		const chat = msg.chat || {};
		const from = query.from || {};
		return {
			type: "callback_query",
			body: "",
			threadID: normalizeId(chat.id || query.chat_instance),
			senderID: normalizeId(from.id),
			userID: normalizeId(from.id),
			author: normalizeId(from.id),
			messageID: normalizeId(msg.message_id || Date.now()),
			callbackData: String(query.data || ""),
			raw: query,
		};
	}

	async poll(callback) {
		if (!this.running) return;
		try {
			const updates = await this.call("getUpdates", {
				offset: this.offset,
				timeout: 25,
				allowed_updates: JSON.stringify(["message", "edited_message", "callback_query", "message_reaction"]),
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

async function startBot() {
	// Display titles array without changing structure
	if (titles && titles.length > 0) {
		const selectedTitle = titles[0];
		selectedTitle.forEach(line => console.log(colors.hex("#f5ab00")(line)));
	}

	console.log(colors.hex("#f5ab00")(createLine("START TELEGRAM BOT", true)));

	let token = readTokenFile();
	if (!/^\d{6,12}:[A-Za-z0-9_-]{20,}$/.test(token)) {
		log.err("LOGIN TELEGRAM", "Invalid bot token in account.txt");
		return;
	}
	writeTokenIfNeeded(token);

	const api = new TelegramApi(token);
	await api.getMe();
	global.GoatBot.fcaApi = api;
	global.GoatBot.telegramApi = api;
	global.GoatBot.botID = api.getCurrentUserID();
	global.botID = api.getCurrentUserID();

	logColor("#f5ab00", createLine("BOT INFO"));
	log.info("NODE VERSION", process.version);
	log.info("PROJECT VERSION", currentVersion);
	log.info("BOT ID", `${global.botID} - ${api.botInfo.username ? "@" + api.botInfo.username : api.botInfo.first_name}`);

	const deps = await loadDataAndScripts(api);

	const callback = async (error, event) => {
		if (error) return;
		if (!event) return;
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
	};

	global.GoatBot.Listening = api.polling(callback);
	global.GoatBot.callBackListen = callback;

	log.master("SUCCESS", "Telegram bot is running successfully");
	logColor("#f5ab00", createLine("COPYRIGHT"));
}

global.GoatBot.reLoginBot = startBot;
startBot().catch((err) => {
	log.err("LOGIN TELEGRAM", "Startup error", err);
});
