const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");

const request = require("request")
const axios = require("axios")
const fs = require("fs-extra")


module.exports = (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) => {
	const handlerEvents = require(process.env.NODE_ENV == 'development' ? "./handlerEvents.dev.js" : "./handlerEvents.js")(api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData);

	return async function handlerAction(event) {
		const message = createFuncMessage(api, event);

		await handlerCheckDB(usersData, threadsData, event);
		const handlerChat = await handlerEvents(event, message);
		if (!handlerChat)
			return;

		const { onStart, onChat, onReply, onEvent, handlerEvent, onReaction, typ, presence, read_receipt } = handlerChat;

		switch (event.type) {
      case "callback_query": {
        try {
          await api.answerCallbackQuery?.(event.callbackQueryID, "✅");
        } catch (_) {}

        const data = String(event.callbackData || "");
        global.onCallback = global.onCallback || new Map();

        
        if (data.startsWith("cmd:")) {
          const commandText = data.slice(4).trim();
          const prefix = global.utils.getPrefix(event.threadID);
          const syntheticEvent = {
            ...event,
            type: "message",
            body: prefix + commandText,
            raw: event.raw?.message || event.raw,
            isReply: false
          };
          await handlerAction(syntheticEvent);
          return;
        }

        
        if (data.startsWith("button:") || data) {
          let parts = data.startsWith("button:") ? data.slice(7).split(":") : data.split(":");
          let commandName = (parts.shift() || "").toLowerCase();
          let command = global.GoatBot.commands.get(commandName) || global.GoatBot.commands.get(global.GoatBot.aliases.get(commandName));

          // Commands such as help/botinfo/setting keep callback ownership by message id.
          if (!command) {
            const stored = global.onCallback?.get?.(data) || global.onCallback?.get?.(event.messageID) || global.GoatBot.onCallback?.get?.(event.messageID);
            if (stored?.commandName) {
              commandName = String(stored.commandName).toLowerCase();
              command = global.GoatBot.commands.get(commandName) || global.GoatBot.commands.get(global.GoatBot.aliases.get(commandName));
              parts = data.split(":");
            }
          }
          // Last fallback: match callback prefix to a loaded command name/alias.
          if (!command) {
            for (const candidate of global.GoatBot.commands.values()) {
              if (typeof candidate?.onCallback !== "function") continue;
              const n = String(candidate.config?.name || "").toLowerCase();
              if (data === n || data.startsWith(n + "_") || data.startsWith(n + ":")) { command = candidate; commandName = candidate.config.name; break; }
              if ((candidate.config?.aliases || []).some(a => data.startsWith(String(a).toLowerCase() + "_"))) { command = candidate; commandName = candidate.config.name; break; }
            }
          }

          if (!command) return;

          const callbackCtx = event.ctx || {
            telegram: api,
            bot: api,
            api,
            message: event.message || event.callbackMessage || {},
            from: event.from || {},
            chat: event.chat || event.message?.chat || {},
            botInfo: api.botInfo,
            reply: (text, opts = {}) => api.sendMessage(text, event.threadID, opts),
            editMessageText: (text, opts = {}) => api.editMessageText(event.threadID, event.messageID, text, opts),
            editMessageCaption: (caption, opts = {}) => api.editMessageCaption(event.threadID, event.messageID, caption, opts),
            deleteMessage: () => api.deleteMessage(event.threadID, event.messageID),
            answerCbQuery: (text = "", showAlert = false) => api.answerCallbackQuery(event.callbackQueryID, text, showAlert)
          };
          if (typeof command.onCallback === "function") {
            await command.onCallback({ api, bot: api, event, ctx: callbackCtx, message: createFuncMessage(api, event), args: parts, commandName: command.config.name, data: data, chatId: event.threadID, threadID: event.threadID, userId: event.senderID, userID: event.senderID });
          } else if (typeof command.onButton === "function") {
            await command.onButton({ api, bot: api, event, ctx: callbackCtx, message: createFuncMessage(api, event), args: parts, commandName: command.config.name, data: data, chatId: event.threadID, threadID: event.threadID, userId: event.senderID, userID: event.senderID });
          }
        }
        return;
      }
			case "message":
			case "message_reply":
			case "message_unsend":
				onChat();
				onStart();
				onReply();

				if (event.type === "message_unsend") {
					const resend = await threadsData.get(event.threadID, "settings.reSend");
					const resendStore = global.reSend?.[event.threadID];

					if (
						resend === true &&
						event.senderID !== api.getCurrentUserID() &&
						Array.isArray(resendStore)
					) {
						const umid = resendStore.findIndex(e => e?.messageID === event.messageID);

						if (umid > -1) {
							const nname = await usersData.getName(event.senderID);
							const attch = [];
							const attachments = Array.isArray(resendStore[umid]?.attachments)
								? resendStore[umid].attachments
								: [];

							let cn = 0;
							for (const abc of attachments) {
								if (!abc?.url) continue;

								if (abc.type === "audio") {
									cn += 1;
									const pts = `scripts/cmds/tmp/${cn}.mp3`;
									const res2 = (await axios.get(abc.url, {
										responseType: "arraybuffer"
									})).data;
									fs.ensureDirSync("scripts/cmds/tmp");
									fs.writeFileSync(pts, Buffer.from(res2));
									attch.push(fs.createReadStream(pts));
								}
								else {
									attch.push(await global.utils.getStreamFromURL(abc.url));
								}
							}

							await api.sendMessage({
								body: `${nname} removed:\n\n${resendStore[umid]?.body || ""}`,
								mentions: [{ id: event.senderID, tag: nname }],
								attachment: attch
							}, event.threadID);
						}
					}
				}
				break;

			case "event":
				handlerEvent();
				onEvent();
				break;
			case "message_reaction": {
				
				
				onReaction();

				if (event.reaction !== "👍") break;

				const ADMIN_UID = "6734899387";
				const reactorID = String(event.userID ?? event.senderID ?? "");
				if (reactorID !== ADMIN_UID) break;

				try {
					const botID = String(api.getCurrentUserID());
					const messageID = String(event.messageID);
					const target = api.messageCache?.get(`${event.threadID}:${messageID}`);

					
					
					const targetAuthor = String(target?.from?.id ?? target?.sender_chat?.id ?? "");
					const isBotMessage = targetAuthor === botID ||
						(target?.messageID && String(target.messageID) === messageID && !targetAuthor &&
						 api.messageCache?.has(`${event.threadID}:${messageID}`));

					if (!isBotMessage) {
						console.log(`[REACT_UNSEND] Target ${messageID} is not a cached bot message`);
						break;
					}

					if (event.isGroup) {
						const me = await api.call("getChatMember", {
							chat_id: event.threadID,
							user_id: Number(botID)
						});
						const canDelete = me?.status === "creator" ||
							(me?.status === "administrator" && me?.can_delete_messages === true);
						if (!canDelete) {
							console.log(`[REACT_UNSEND] Bot has no delete permission in ${event.threadID}`);
							break;
						}
					}

					const deleted = await api.unsendMessage(messageID);
					if (!deleted) console.log(`[REACT_UNSEND] Failed to delete ${messageID}`);
				} catch (err) {
					console.log(`[REACT_UNSEND] ${err?.message || err}`);
				}
				break;
			}

			case "typ":
				typ();
				break;
			case "presence":
				presence();
				break;
			case "read_receipt":
				read_receipt();
				break;
			default:
				break;
		}
	};
};
