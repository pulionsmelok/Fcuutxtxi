const axios = require("axios");
const Jimp = require("jimp");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "love",
    version: "2.0.5",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 0,
    usePrefix: true,
    description: {
      en: "Create a love image using two Telegram profile pictures."
    },
    category: "love",
    guide: {
      en: "{pn} reply to someone"
    }
  },

  async getProfilePhoto(api, userId) {
    const photos = await api.getUserProfilePhotos(userId, {
      limit: 1
    });

    if (!photos?.photos?.length) {
      return null;
    }

    const photo =
      photos.photos[0][photos.photos[0].length - 1];

    const file = await api.getFile(photo.file_id);

    if (!file?.file_path) {
      return null;
    }

    const token =
      api.token ||
      global.GoatBot.config?.token ||
      process.env.BOT_TOKEN;

    if (!token) {
      throw new Error("Bot token not found.");
    }

    const fileUrl =
      `https://api.telegram.org/file/bot${token}/${file.file_path}`;

    const response = await axios.get(fileUrl, {
      responseType: "arraybuffer",
      timeout: 30000
    });

    return Buffer.from(response.data);
  },

  async generateLoveImage(api, uid1, uid2) {
    const [buffer1, buffer2] = await Promise.all([
      this.getProfilePhoto(api, uid1),
      this.getProfilePhoto(api, uid2)
    ]);

    if (!buffer1) {
      throw new Error(
        "Your Telegram profile picture could not be found."
      );
    }

    if (!buffer2) {
      throw new Error(
        "The other user's Telegram profile picture could not be found."
      );
    }

    const avatar1 = await Jimp.read(buffer1);
    const avatar2 = await Jimp.read(buffer2);

    avatar1
      .cover(512, 512)
      .circle();

    avatar2
      .cover(512, 512)
      .circle();

    const backgroundUrl =
      "https://drive.google.com/uc?export=download&id=11TPaOEF6IjxpY6yMlfLgIip-X99MrQpJ";

    const response = await axios.get(backgroundUrl, {
      responseType: "arraybuffer",
      timeout: 30000
    });

    const background = await Jimp.read(
      Buffer.from(response.data)
    );

    background
      .resize(1440, 1080)
      .composite(
        avatar1.resize(470, 470),
        125,
        210
      )
      .composite(
        avatar2.resize(470, 470),
        800,
        200
      );

    const cacheDir = path.join(
      __dirname,
      "tmp"
    );

    await fs.ensureDir(cacheDir);

    const outputPath = path.join(
      cacheDir,
      `love_${Date.now()}.jpg`
    );

    await background.writeAsync(outputPath);

    return outputPath;
  },

  onStart: async function ({
    message,
    event,
    api
  }) {
    let imagePath = null;

    try {
      const senderID = event?.from?.id;

      if (!senderID) {
        return message.reply(
          "❌ Your Telegram ID could not be detected."
        );
      }

      const targetID =
        event?.reply_to_message?.from?.id;

      if (!targetID) {
        return message.reply(
          "💌 Reply to someone and use /love."
        );
      }

      if (
        String(senderID) ===
        String(targetID)
      ) {
        return message.reply(
          "😂 নিজের সাথে love করা যাবে না!"
        );
      }

      imagePath =
        await this.generateLoveImage(
          api,
          senderID,
          targetID
        );

      await message.reply({
        body:
          "┌─[ LOVE ]\n" +
          "├‣ ᴘʟᴇᴀsᴇ ᴀᴄᴄᴇᴘᴛ ᴍʏ ʟᴏᴠᴇ 💘\n" +
          "└───────────────┘",
        attachment: imagePath
      });

    } catch (error) {
      console.error(
        "❌ LOVE error:",
        error
      );

      try {
        await message.reply(
          `❌ Failed to generate image.\n\n${error.message}`
        );
      } catch {}

    } finally {
      if (
        imagePath &&
        await fs.pathExists(imagePath)
      ) {
        try {
          await fs.remove(imagePath);
        } catch {}
      }
    }
  }
};