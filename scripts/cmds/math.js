module.exports = {
	config: {
		name: "math",
		version: "3.0",
		author: "XNIL",
		countDown: 5,
		role: 0,
		description: "Solve math and win money!",
		category: "game",
		guide: {
			en: "{pn}math\n{pn}math top"
		}
	},

	onStart: async function ({ message, event, args, usersData, userID}) {
		const senderID = event.senderID;

		if (args[0]?.toLowerCase() === "top") {
			const allUsers = await usersData.getAll();

			const top = allUsers
				.filter(user => {
					const wins = Number(user.data?.mathWin) || 0;
					return wins > 0;
				})
				.sort((a, b) => {
					return (
						(Number(b.data?.mathWin) || 0) -
						(Number(a.data?.mathWin) || 0)
					);
				})
				.slice(0, 10);

			if (top.length === 0) {
				return message.reply("❌ No math winners yet.");
			}

			const leaderboard = top
				.map((user, i) => {
					const name =
						user.name ||
						`User ${user.userID?.slice(-4) || "??"}`;

					return `${i + 1}. ${name} – ✅ ${Number(user.data.mathWin)} correct`;
				})
				.join("\n");

			return message.reply(
				`🏆 Top Math Solvers:\n\n${leaderboard}`
			);
		}

		const operators = ["+", "-", "*", "/"];
		const operator =
			operators[Math.floor(Math.random() * operators.length)];

		let num1 = Math.floor(Math.random() * 100) + 1;
		let num2 = Math.floor(Math.random() * 100) + 1;

		if (operator === "/") {
			num1 = num1 * num2;
		}

		const question = `${num1} ${operator} ${num2}`;

		let answer;

		if (operator === "/") {
			answer = (num1 / num2).toFixed(2);
		} else if (operator === "+") {
			answer = (num1 + num2).toString();
		} else if (operator === "-") {
			answer = (num1 - num2).toString();
		} else {
			answer = (num1 * num2).toString();
		}

		const msg = await message.reply(
			`🧠 Solve this to win 💸 1000$:\n${question} = ?\n⏳ You have 60 seconds!`
		);

		global.GoatBot.onReply.set(msg.messageID, {
			commandName: this.config.name,
			author: senderID,
			correctAnswer: answer,
			reward: 1000,
			timeout: setTimeout(() => {
				message.reply(
					`❌ Time's up! The correct answer was: ${answer}`
				);
				global.GoatBot.onReply.delete(msg.messageID);
			}, 60000)
		});
	},

	onReply: async function ({
		message,
		event,
		Reply,
		usersData
	}) {
		if (String(event.senderID) !== String(Reply.author)) {
			return;
		}

		const userInput = event.body?.toString().trim();

		if (!userInput) {
			return message.reply("❌ Please enter an answer.");
		}

		const correct = Number(Reply.correctAnswer);
		const userAns = Number(userInput);

		if (!Number.isFinite(userAns)) {
			return message.reply("❌ Please enter a valid number.");
		}

		if (userAns === correct) {
			clearTimeout(Reply.timeout);

			const replyID =
				event.messageReply?.messageID ||
				event.messageID;

			global.GoatBot.onReply.delete(replyID);

			const userData = await usersData.get(event.senderID);

			const money = Number(userData?.money) || 0;
			const data = userData?.data || {};
			const mathWin = Number(data.mathWin) || 0;

			data.mathWin = mathWin + 1;

			await usersData.set(event.senderID, {
				money: money + Number(Reply.reward),
				data
			});

			return message.reply(
				`✅ Correct! You've earned 💸 ${Reply.reward}$`
			);
		}

		return message.reply("❌ Incorrect! Try again.");
	}
};