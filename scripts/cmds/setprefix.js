const fs = require("fs-extra");

module.exports = {
	config: {
		name: "setpf",
		version: "1.4",
		author: "SK-SIDDIK-KHAN",
		countDown: 5,
		role: 0, 
		category: "config"
	},
	langs: {
		en: {
			onlyAdmin: "You do not have permission to use this command",
			confirmGlobal: "Please react to this message to confirm changing the global prefix.",
			successGlobal: "Global prefix successfully changed to: %1",
		}
	},
	onStart: async function ({ message, args, commandName, event, getLang }) {
		if (event.senderID !== "100059026788061") 
			return message.reply(getLang("onlyAdmin"));

		if (!args[0])
			return message.SyntaxError();
 
		const newPrefix = args[0];
		const formSet = {
			commandName,
			author: event.senderID,
			newPrefix,
			setGlobal: true
		};
 
		return message.reply(getLang("confirmGlobal"), (err, info) => {
			if (err) return console.error(err);
			formSet.messageID = info.messageID;
			global.GoatBot.onReaction.set(info.messageID, formSet);
		});
	},
	onReaction: async function ({ message, event, Reaction, getLang }) {
		const { author, newPrefix } = Reaction;
		if (event.userID !== author)
			return;
		
		global.GoatBot.config.prefix = newPrefix;
		fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
		return message.reply(getLang("successGlobal", newPrefix));
	}
};