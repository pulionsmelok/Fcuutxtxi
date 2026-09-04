const fs = require("fs-extra");
const path = require("path");

const POLL_FILE = path.join(__dirname, "data", "polls.json");

async function loadPolls() {
  try {
    await fs.ensureFile(POLL_FILE);
    const data = await fs.readJson(POLL_FILE).catch(() => ({}));
    return data || {};
  } catch { return {}; }
}

async function savePolls(data) {
  try {
    await fs.ensureDir(path.dirname(POLL_FILE));
    await fs.writeJson(POLL_FILE, data, { spaces: 2 });
  } catch (e) { console.log("poll save err", e.message); }
}

function buildPollText(poll) {
  const total = poll.options.reduce((a, b) => a + (b.votes || 0), 0);
  let text = `📊 ${poll.question}\n━━━━━━━━━━━━━━━━━━\n\n`;
  poll.options.forEach((opt, i) => {
    const percent = total === 0 ? 0 : Math.round((opt.votes / total) * 100);
    const filled = Math.round(percent / 10);
    const bar = "█".repeat(filled) + "░".repeat(10 - filled);
    text += `${i + 1}. ${opt.name}\n ${bar} ${percent}% (${opt.votes} vote)\n\n`;
  });
  text += `━━━━━━━━━━━━━━━━━━\n🗳️ Total: ${total}\n💡 Reply with number to vote (1-${poll.options.length})`;
  return text;
}

module.exports = {
  config: {
    name: "poll",
    aliases: ["vote", "polls"],
    version: "9.0-JSON",
    author: "MOHAMMAD BADOL (converted)",
    countDown: 5,
    role: 0,
    description: {
      en: "Create poll with | or - separator (JSON storage)"
    },
    category: "utility",
    guide: {
      en: "{pn} Question | Opt1 | Opt2\n{pn} Question - Opt1 - Opt2"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const raw = args.join(" ").trim();
    if (!raw) {
      return message.reply(
        `╭─❖─〔 Poll Create 〕─❖─╮\n` +
        `│ 2 ভাবে বানাও:\n` +
        `│ /poll প্রশ্ন | Opt1 | Opt2\n` +
        `│ /poll প্রশ্ন - Opt1 - Opt2\n` +
        `╰─❖─〔 Goat Bot 〕─❖─╯`
      );
    }

    let parts = [];
    if (raw.includes("|")) parts = raw.split("|").map(s => s.trim()).filter(Boolean);
    else if (raw.includes(" - ")) parts = raw.split(" - ").map(s => s.trim()).filter(Boolean);
    else parts = raw.split("-").map(s => s.trim()).filter(Boolean);

    if (parts.length < 3) {
      return message.reply(`❌ কমপক্ষে 2টা Option লাগবে!\n\n✅ Ex:\n/poll Best Game? - Free Fire - PUBG`);
    }

    const question = parts[0];
    const options = parts.slice(1).slice(0, 8);
    const pollId = Date.now().toString();

    const pollData = {
      pollId,
      question,
      options: options.map(name => ({ name, votes: 0 })),
      voters: {},
      creatorId: String(event.senderID),
      threadID: String(event.threadID),
      createdAt: new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })
    };

    const all = await loadPolls();
    all[pollId] = pollData;
    await savePolls(all);

    const text = buildPollText(pollData);
    return message.reply(text, (err, info) => {
      if (!err && info?.messageID) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "poll",
          messageID: info.messageID,
          author: event.senderID,
          pollId
        });
      }
    });
  },

  onReply: async function ({ api, event, Reply, message }) {
    if (Reply.commandName !== "poll") return;
    const vote = parseInt(event.body?.trim());
    if (isNaN(vote) || vote < 1) return;

    const all = await loadPolls();
    const poll = all[Reply.pollId];
    if (!poll) return message.reply("❌ Poll Expired!");

    const idx = vote - 1;
    if (idx < 0 || idx >= poll.options.length) return message.reply("❌ Invalid option number!");

    const userId = String(event.senderID);
    const oldVote = poll.voters[userId];

    if (oldVote === idx) {
      poll.options[idx].votes = Math.max(0, poll.options[idx].votes - 1);
      delete poll.voters[userId];
    } else {
      if (oldVote !== undefined) poll.options[oldVote].votes = Math.max(0, poll.options[oldVote].votes - 1);
      poll.options[idx].votes++;
      poll.voters[userId] = idx;
    }

    all[Reply.pollId] = poll;
    await savePolls(all);

    const text = buildPollText(poll);
    return message.reply(text);
  }
};
