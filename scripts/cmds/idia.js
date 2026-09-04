global.idiaSessions = global.idiaSessions || {};

module.exports = {
  config: {
    name: "idia",
    aliases: ["gan"],
    version: "7.0",
    author: "SK-SIDDIK-KHAN",
    role: 1,
    usePrefix: true,
    category: "user"
  },

  onStart: async function ({ message, event, bot }) {

    const chatId = event.chat.id;
    const text = event.text || "";
    const args = text.split(" ");

    if (args[1] && args[1].toLowerCase() === "off") {
      if (global.idiaSessions[chatId]) {
        clearInterval(global.idiaSessions[chatId]);
        delete global.idiaSessions[chatId];
      }
      return;
    }

    let userId = null;
    let name = "User";

    if (event.reply_to_message) {
      userId = event.reply_to_message.from.id;
      name = event.reply_to_message.from.first_name;
    }

    else if (event.entities) {
      const mention = event.entities.find(e => e.type === "mention");
      if (mention) {
        const username = text.substring(mention.offset + 1, mention.offset + mention.length);
        name = username;

      }
    }

    if (!userId && !text.includes("@")) {
      return message.reply("⚠️ | আপনি কাকে জ্ঞান দিতে চান এমন 1 জনকে @ম্যানশন করতে হবে");
    }

    const mentionText = userId
      ? `<a href="tg://user?id=${userId}">${name}</a>`
      : `@${name}`;

    const texts = [
      "বিপদ-আপদের সময় দুনিয়ার সকল দরজা বন্ধ হয়ে গেলেও আল্লাহ তায়ালার দরজা সবসময় খোলা থাকে 🥰",
      "দুনিয়াতে একটি মাত্র ঘর যার নাম কাবা ঘর 😍",
      "তার জন্য কাঁদ যে তোমার চোখের জল দেখে সেও কাঁদে 🐰",
      "নিজেকে চেনা সবচেয়ে কঠিন 💔",
      "৫ ওয়াক্ত সালাত আদায় করুন 🥰",
      "ডিপ্রেশন কাটাতে ইসলামিক ভিডিও দেখুন 📿",
      "যাহা তুমি দেখাও তার চেয়ে বেশি থাকা উচিত 🤬",
      "যা জানো তার চেয়ে কম বলো 🤟",
      "বন্ধুত্ব টিকিয়ে রাখতে দুজন লাগে 🤝",
      "স্বপ্ন দেখলে বাস্তবায়ন সম্ভব 💉",
      "আজ যে অবহেলা করে কাল প্রয়োজন হবে",
      "যে ছাড়ে নাই তাকে ছাড়ো না 💔",
      "আল্লাহর পথে চলুন 🥰",
      "~ অন্যকে গালি দেওয়া থেকে বিরত থাকুন ♥️",
      "মা-বাবাকে ভালোবাসুন 🥰",
      "নিজের ওপর বিশ্বাস রাখুন 😍",
      "মৃত্যু নিশ্চিত, সময় অনিশ্চিত 😢",
      "নামাজই টেনশনের সমাধান 💔",
      "নিজেকে এমন বানাও যেন সবাই আফসোস করে ✌️",
      "কোরআনে মনের ঔষধ আছে ✋",
      "ধোঁকাবাজির সাথে সম্পর্ক নাই 🤟",
      "হালাল রিজিকেই বরকত 💰",
      "সালাম দিতে কৃপণ হইও না",
      "চরিত্রই আসল সম্পদ 🙂",
      "নাপাক হলে নামাজ হবে না ♥️",
      "~ কাউকে অতীত নিয়ে খোটা দিও না 💔",
      "সম্মান করতে না পারলে ভালোবাসো না 🙂",
      "সফল মানুষ কখনো হার মানে না 🐰",
      "~ বড়দের সম্মান করো 😍"
    ];

    if (global.idiaSessions[chatId]) {
      clearInterval(global.idiaSessions[chatId]);
    }

    await message.reply(`📢 ${mentionText}, 😇 | তোমাকে কিছু উপদেশ দেওয়া হবে...`, {
      parse_mode: "HTML"
    });

    let i = 0;

    const interval = setInterval(async () => {
      await message.reply(`💡 ${texts[i % texts.length]} - ${mentionText}`, {
        parse_mode: "HTML"
      });
      i++;
    }, 3000);

    global.idiaSessions[chatId] = interval;
  }
};
