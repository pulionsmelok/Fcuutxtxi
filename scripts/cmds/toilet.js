const axios = require("axios");
const Jimp = require("jimp");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "toilet",
    aliases: ["toilets"],
    version: "2.0.5",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 0,
    usePrefix: true,
    description: {
      en: "Create a toilet image using a Telegram user's profile picture."
    },
    category: "fun"
  },

  async getProfilePhoto(api, userId) {
    const photos =
      await api.getUserProfilePhotos(userId, {
        limit: 1
      });

    if (!photos?.photos?.length) {
      return null;
    }

    const photo =
      photos.photos[0][
        photos.photos[0].length - 1
      ];

    const file =
      await api.getFile(photo.file_id);

    if (!file?.file_path) {
      return null;
    }

    const fileUrl = await api.getFileLink(photo.file_id);

    const response =
      await axios.get(fileUrl, {
        responseType: "arraybuffer",
        timeout: 30000
      });

    return Buffer.from(response.data);
  },

  async generateToiletImage(api, userId) {
    const avatarBuffer =
      await this.getProfilePhoto(
        api,
        userId
      );

    if (!avatarBuffer) {
      throw new Error(
        "User has no Telegram profile picture."
      );
    }

    const avatar =
      await Jimp.read(
        avatarBuffer
      );

    avatar
      .resize(400, 400)
      .circle();

    const backgroundUrl =
      "https://drive.google.com/uc?export=download&id=12m2y61lcba7P6bqmKcy7j60mel8PGRin";

    const response =
      await axios.get(
        backgroundUrl,
        {
          responseType: "arraybuffer",
          timeout: 30000
        }
      );

    const background =
      await Jimp.read(
        Buffer.from(response.data)
      );

    background.resize(
      1080,
      1350
    );

    background.composite(
      avatar,
      310,
      670
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
        `toilet_${Date.now()}.png`
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
      let targetID =
        event?.reply_to_message?.from?.id;

      if (!targetID) {
        targetID =
          event?.from?.id;
      }

      if (!targetID) {
        return message.reply(
          "❌ User could not be found."
        );
      }

      imagePath =
        await this.generateToiletImage(
          api,
          targetID
        );

      await message.reply({
        body:
          "┌─[ TOILET ]\n" +
          "├‣ ʏᴏᴜ ᴅᴇsᴇʀᴠᴇ ᴛʜɪs ᴘʟᴀᴄᴇ 🙂✌️\n" +
          "└───────────────┘",
        attachment: imagePath
      });

    } catch (error) {
      console.error(
        "❌ TOILET error:",
        error
      );

      try {
        await message.reply(
          `❌ Failed to generate image.\n\n${error.message}`
        );
      } catch {}

    } finally {
      try {
        if (
          imagePath &&
          await fs.pathExists(imagePath)
        ) {
          await fs.remove(imagePath);
        }
      } catch {}
    }
  }
};