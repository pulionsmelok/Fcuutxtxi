const axios = require("axios");
const Jimp = require("jimp");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "us",
    aliases: ["loveus"],
    version: "2.0.5",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 0,
    usePrefix: true,
    description: {
      en: "Create a love image with your and the replied user's profile pictures."
    },
    category: "love"
  },

  async getProfilePhoto(api, userId) {
    const photos =
      await api.getUserProfilePhotos(
        userId,
        {
          limit: 1
        }
      );

    if (!photos?.photos?.length) {
      return null;
    }

    const photo =
      photos.photos[0][
        photos.photos[0].length - 1
      ];

    const file =
      await api.getFile(
        photo.file_id
      );

    if (!file?.file_path) {
      return null;
    }

    const token =
      global.GoatBot.config?.token ||
      api.token ||
      process.env.BOT_TOKEN;

    if (!token) {
      throw new Error(
        "Telegram bot token not found."
      );
    }

    const fileURL =
      `https://api.telegram.org/file/bot${token}/${file.file_path}`;

    const response =
      await axios.get(
        fileURL,
        {
          responseType: "arraybuffer",
          timeout: 30000
        }
      );

    return Buffer.from(
      response.data
    );
  },

  async createLoveImage(
    api,
    uid1,
    uid2
  ) {
    const [
      buffer1,
      buffer2
    ] = await Promise.all([
      this.getProfilePhoto(
        api,
        uid1
      ),
      this.getProfilePhoto(
        api,
        uid2
      )
    ]);

    if (!buffer1) {
      throw new Error(
        "Your profile picture was not found."
      );
    }

    if (!buffer2) {
      throw new Error(
        "Replied user's profile picture was not found."
      );
    }

    const avOne =
      await Jimp.read(
        buffer1
      );

    const avTwo =
      await Jimp.read(
        buffer2
      );

    avOne
      .cover(512, 512)
      .circle();

    avTwo
      .cover(512, 512)
      .circle();

    const backgroundURL =
      "https://drive.google.com/uc?export=download&id=1AJZNV21hzR9Hzo0WNhOOeHFRNtAVsm3p";

    const response =
      await axios.get(
        backgroundURL,
        {
          responseType: "arraybuffer",
          timeout: 30000
        }
      );

    const background =
      await Jimp.read(
        Buffer.from(
          response.data
        )
      );

    background
      .resize(
        466,
        659
      )
      .composite(
        avOne.resize(
          110,
          110
        ),
        150,
        76
      )
      .composite(
        avTwo.resize(
          100,
          100
        ),
        245,
        305
      );

    const cacheDir =
      path.join(
        __dirname,
        "tmp"
      );

    await fs.ensureDir(
      cacheDir
    );

    const outputPath =
      path.join(
        cacheDir,
        `loveus_${Date.now()}.jpg`
      );

    await background.writeAsync(
      outputPath
    );

    return outputPath;
  },

  onStart: async function ({
    message,
    event,
    api
  }) {
    let imagePath = null;

    try {
      const senderID =
        event?.from?.id;

      const targetID =
        event?.reply_to_message?.from?.id;

      if (!targetID) {
        return message.reply(
          "💗 Reply to someone's message and use /us"
        );
      }

      if (!senderID) {
        return message.reply(
          "❌ Sender ID could not be found."
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
        await this.createLoveImage(
          api,
          senderID,
          targetID
        );

      await message.reply({
        body:
          "┌─[ -Pookie 🎀- ]\n" +
          "├‣ 𝐉𝐔𝐒𝐓 𝐘𝐎𝐔 𝐀𝐍𝐃 𝐌𝐄 🎀\n" +
          "└───────────────┘",
        attachment: imagePath
      });

    } catch (error) {
      console.error(
        "❌ US error:",
        error
      );

      try {
        await message.reply(
          `❌ Error: ${error.message}`
        );
      } catch {}

    } finally {
      try {
        if (
          imagePath &&
          await fs.pathExists(
            imagePath
          )
        ) {
          await fs.remove(
            imagePath
          );
        }
      } catch {}
    }
  }
};