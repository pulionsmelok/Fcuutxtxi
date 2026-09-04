const chalk = require("chalk");
const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "console",
    version: "1.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 2,
    description: {
      en: "Logs detailed message information to the console for debugging or monitoring"
    },
    category: "INFO"
  },

  onStart: async function () {
    return;
  },

  onChat: async function ({ event }) {

    const msg = event;

    if (!msg) return;

    const chatId = msg.threadID || msg.chat?.id;
    const userId = msg.senderID || msg.from?.id;

    if (!chatId || !userId) return;

    const firstName =
      msg.from?.first_name || "";

    const lastName =
      msg.from?.last_name
        ? ` ${msg.from.last_name}`
        : "";

    const name =
      `${firstName}${lastName}`.trim() ||
      "Unknown User";

    const threadName =
      msg.chat?.title || null;

    let chatType, title, user;

    if (threadName === null) {
      chatType = "PRIVATE CHAT MESSAGE";
      title = "INBOX";
      user = name;
    } else {
      chatType = "GROUP CHAT MESSAGE";
      title = "Group Name";
      user = threadName;
    }

    const msgContent =
      msg.body ||
      msg.text ||
      msg.caption ||
      "media or special characters";

    const time = moment
      .tz("Asia/Dhaka")
      .format("LLLL");

    console.log(
`${chalk.blue("\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯")}
${chalk.blue(chatType)}
${chalk.blue("⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯")}
» From: ${chalk.blue(name)}
» UID: ${chalk.blue(String(userId))}
» ${title}: ${chalk.blue(String(user))}
» Chat ID: ${chalk.blue(String(chatId))}
🔖 Message: ${chalk.blue(msgContent)}
» Time: ${chalk.blue(time)}
`
    );
  }
};