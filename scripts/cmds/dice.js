module.exports = {
	config: {
		name: "dice",
		version: "1.7",
		author: "xnil6x",
		countDown: 3,
		role: 0,
		shortDescription: "🎲 Dice Game | Bet & win coins!",
		longDescription: "Bet coins and roll the dice. Dice value decides your fate. No need to guess!",
		category: "game",
		guide: {
			en: "{pn}dice <bet amount>\nExample: {pn}dice 1000"
		}
	},

	onStart: async function ({ message, event, args, usersData }) {
		const { senderID } = event;

		try {
			const userData = await usersData.get(senderID);

			if (!userData) {
				return message.reply("❌ Account issue! Please try again later.");
			}

			const balance = Number(userData.money) || 0;
			const betAmount = Number(args[0]);

			if (!Number.isFinite(betAmount) || betAmount <= 0) {
				return message.reply(
					"⚠️ Invalid usage!\nUse: {pn}dice <bet amount>\nExample: {pn}dice 1000"
				);
			}

			if (betAmount > balance) {
				return message.reply(
					`❌ You only have ${formatMoney(balance)} coins!`
				);
			}

			const diceRoll = Math.floor(Math.random() * 6) + 1;
			let resultMessage = `🎲 Dice rolled: ${diceRoll}\n`;
			let winAmount = 0;

			switch (diceRoll) {
				case 1:
				case 2:
					winAmount = -betAmount;
					resultMessage +=
						`❌ You lost!\nLost: ${formatMoney(betAmount)} coins`;
					break;

				case 3:
					winAmount = betAmount * 2;
					resultMessage +=
						`✅ You won DOUBLE!\nWon: +${formatMoney(winAmount)} coins`;
					break;

				case 4:
				case 5:
					winAmount = betAmount * 3;
					resultMessage +=
						`✅ You won TRIPLE!\nWon: +${formatMoney(winAmount)} coins`;
					break;

				case 6:
					winAmount = betAmount * 10;
					resultMessage +=
						`🎉 JACKPOT! Rolled 6\nWon: +${formatMoney(winAmount)} coins`;
					break;
			}

			const newBalance = balance + winAmount;

			await usersData.set(senderID, {
				money: newBalance
			});

			resultMessage += `\n💰 Balance: ${formatMoney(newBalance)}`;

			return message.reply(resultMessage);
		} catch (error) {
			console.error("[DICE ERROR]", error);
			return message.reply("❌ Something went wrong. Please try again.");
		}
	}
};

function formatMoney(num) {
	num = Number(num) || 0;

	if (num >= 1e15)
		return (num / 1e15).toFixed(2).replace(/\.00$/, "") + "Q";
	if (num >= 1e12)
		return (num / 1e12).toFixed(2).replace(/\.00$/, "") + "T";
	if (num >= 1e9)
		return (num / 1e9).toFixed(2).replace(/\.00$/, "") + "B";
	if (num >= 1e6)
		return (num / 1e6).toFixed(2).replace(/\.00$/, "") + "M";
	if (num >= 1e3)
		return (num / 1e3).toFixed(2).replace(/\.00$/, "") + "K";

	return num.toLocaleString("en-US");
}