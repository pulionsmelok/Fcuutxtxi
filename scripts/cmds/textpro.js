const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const TEMPLATES = {
  naruto: "https://textpro.me/create-naruto-logo-style-text-effect-online-1125.html",
  pornhub: "https://textpro.me/create-pornhub-style-logo-online-977.html",
  neon: "https://textpro.me/create-a-gradient-neon-light-text-effect-874.html",
  joker: "https://textpro.me/create-joker-logo-online-934.html",
  thunder: "https://textpro.me/create-thunder-text-effect-online-881.html",
  blackpink: "https://textpro.me/create-blackpink-logo-style-online-10008.html",
  avengers: "https://textpro.me/create-3d-avengers-logo-online-974.html",
  marvel: "https://textpro.me/create-logo-style-marvel-studios-online-952.html",
  glitch: "https://textpro.me/create-glitch-text-effect-style-tik-tok-983.html",
  fire: "https://textpro.me/create-a-fiery-text-effect-online-1007.html",
  gold: "https://textpro.me/gold-foil-text-effect-1010.html",
  matrix: "https://textpro.me/matrix-style-text-effect-online-884.html",
  neonlight: "https://textpro.me/neon-light-text-effect-online-882.html",
  metal: "https://textpro.me/create-a-3d-metallic-text-effect-1016.html",
  harrypotter: "https://textpro.me/create-harry-potter-text-effect-online-1025.html"
};

module.exports = {
  config: {
    name: "textpro",
    aliases: ["textlogo", "tpro"],
    version: "8.0",
    author: "MOHAMMAD BADOL (converted)",
    countDown: 5,
    role: 0,
    description: {
      en: "Create text logo effects"
    },
    category: "image",
    guide: {
      en: "{pn} list\n{pn} <style> <text>\nExample: {pn} naruto Hello"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const threadID = event.threadID;
    if (!args[0]) {
      return message.reply(
        `🎨 TextPro Logo Generator\n\n` +
        `📌 Total styles: ${Object.keys(TEMPLATES).length}\n\n` +
        `📖 Usage:\n` +
        `• /textpro list\n` +
        `• /textpro naruto Hello\n\n` +
        `🔥 Popular: naruto, neon, blackpink, fire, gold, matrix`
      );
    }

    if (args[0].toLowerCase() === "list") {
      return message.reply(`📜 Styles:\n\n${Object.keys(TEMPLATES).join(", ")}`);
    }

    let style = "naruto";
    let text = "Goat Bot";
    const first = args[0].toLowerCase();
    if (TEMPLATES[first]) {
      style = first;
      text = args.slice(1).join(" ") || "Goat Bot";
    } else {
      text = args.join(" ");
    }

    const wait = await message.reply(`⏳ Creating ${style} → ${text}...`);

    try {
      const url = TEMPLATES[style];
      const apiUrl = `https://sakura-apis.onrender.com/api/textprogenerator?url=${encodeURIComponent(url)}&text1=${encodeURIComponent(text)}`;
      const res = await axios.get(apiUrl, { responseType: "arraybuffer", timeout: 90000 });

      const imgPath = path.join(__dirname, "tmp", `tpro_${Date.now()}.jpg`);
      await fs.ensureDir(path.dirname(imgPath));
      await fs.writeFile(imgPath, res.data);

      await api.sendMessage({
        body: `🎨 ${style} | ${text}`,
        attachment: fs.createReadStream(imgPath)
      }, threadID, () => fs.unlink(imgPath).catch(() => {}));

      if (wait?.messageID) api.unsendMessage?.(wait.messageID).catch(() => {});
    } catch (e) {
      return message.reply(`❌ ${e.message}`);
    }
  }
};
