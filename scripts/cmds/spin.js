module.exports = {
	config: {
		name: "spin",
		version: "4.0",
		author: "XNIL",
		countDown: 5,
		role: 0,
		description: "Spin and win/loss money. Use '/spin <amount>' or '/spin top'.",
		category: "game",
		guide: {
			en: "{pn}spin <amount>\n{pn}spin top"
		}
	},

	onStart: async function ({ message, event, args, usersData, userID}) {
		const senderID = event.senderID;
		const subCommand = args[0];

		if (subCommand?.toLowerCase() === "top") {
			const allUsers = await usersData.getAll();

			const top = allUsers
				.filter(user => {
					const win = Number(user.data?.totalSpinWin) || 0;
					return win > 0;
				})
				.sort((a, b) => {
					return (
						(Number(b.data?.totalSpinWin) || 0) -
						(Number(a.data?.totalSpinWin) || 0)
					);
				})
				.slice(0, 10);

			if (top.length === 0) {
				return message.reply("❌ No spin winners yet.");
			}

			const result = top
				.map((user, i) => {
					const name =
						user.name ||
						`User ${user.userID?.slice(-4) || "??"}`;

					return `${i + 1}. ${name} – 💸 ${Number(
						user.data.totalSpinWin
					).toLocaleString()} coins`;
				})
				.join("\n");

			return message.reply(
				`🏆 Top Spin Winners:\n\n${result}`
			);
		}

		const betAmount = Number(subCommand);

		if (!Number.isFinite(betAmount) || betAmount <= 0) {
			return message.reply(
				"❌ Usage:\n/spin <amount>\n/spin top"
			);
		}

		const userData = await usersData.get(senderID);

		if (!userData) {
			return message.reply(
				"❌ Account data not found. Please try again."
			);
		}

		const balance = Number(userData.money) || 0;
		const data = userData.data || {};
		const totalSpinWin = Number(data.totalSpinWin) || 0;

		if (balance < betAmount) {
			return message.reply(
				`❌ Not enough money.\n💰 Your balance: ${formatMoney(balance)}`
			);
		}

		const outcomes = [
			{
				text: "💥 You lost everything!",
				multiplier: 0
			},
			{
				text: "😞 You got back half.",
				multiplier: 0.5
			},
			{
				text: "🟡 You broke even.",
				multiplier: 1
			},
			{
				text: "🟢 You doubled your money!",
				multiplier: 2
			},
			{
				text: "🔥 You tripled your bet!",
				multiplier: 3
			},
			{
				text: "🎉 JACKPOT! 10x reward!",
				multiplier: 10
			}
		];

		const result =
			outcomes[Math.floor(Math.random() * outcomes.length)];

		const reward = Math.floor(
			betAmount * result.multiplier
		);

		const newBalance = balance - betAmount + reward;

		let newTotalSpinWin = totalSpinWin;

		if (reward > betAmount) {
			newTotalSpinWin += reward - betAmount;
		}

		data.totalSpinWin = newTotalSpinWin;

		await usersData.set(senderID, {
			money: newBalance,
			data
		});

		return message.reply(
			`${result.text}\n` +
			`🎰 You bet: ${formatMoney(betAmount)}\n` +
			`💸 You won: ${formatMoney(reward)}\n` +
			`💰 New balance: ${formatMoney(newBalance)}`
		);
	}
};

function formatMoney(amount) {
	amount = Number(amount) || 0;

	if (amount >= 1e15)
		return (amount / 1e15).toFixed(2).replace(/\.00$/, "") + "Q";

	if (amount >= 1e12)
		return (amount / 1e12).toFixed(2).replace(/\.00$/, "") + "T";

	if (amount >= 1e9)
		return (amount / 1e9).toFixed(2).replace(/\.00$/, "") + "B";

	if (amount >= 1e6)
		return (amount / 1e6).toFixed(2).replace(/\.00$/, "") + "M";

	if (amount >= 1e3)
		return (amount / 1e3).toFixed(2).replace(/\.00$/, "") + "K";

	return amount.toLocaleString("en-US");
}