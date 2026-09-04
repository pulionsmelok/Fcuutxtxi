const axios = require("axios");
const Jimp = require("jimp");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "arrest",
    aliases: ["ar"],
    version: "2.0.5",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 0,
    usePrefix: true,
    description: {
      en: "Create an arrest image with a Telegram user's profile picture."
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

  async generateArrestImage(api, userId) {
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
      .cover(100, 100)
      .circle();

    const backgroundUrl =
      "https://drive.google.com/uc?export=download&id=12TIjNaqG5CiZnMlrCYe7Oao1JTc1f0XN";

    let image;
    try {
      const response = await axios.get(backgroundUrl, {
        responseType: "arraybuffer",
        timeout: 15000,
        validateStatus: status => status >= 200 && status < 300
      });
      image = await Jimp.read(Buffer.from(response.data));
    } catch (backgroundError) {
      console.warn("⚠️ arrest background unavailable, using fallback:", backgroundError.message);
      image = avatar.clone();
    }

    image.resize(
      500,
      500
    );

    image.composite(
      avatar,
      375,
      9
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
        `arrest_${Date.now()}.jpg`
      );

    await image.writeAsync(
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
      const user1 =
        event?.from?.id;

      const replied =
        event?.reply_to_message;

      const targetID =
        replied?.from?.id || user1;

      if (!targetID) {
        return message.reply(
          "❌ User could not be found."
        );
      }

      imagePath =
        await this.generateArrestImage(
          api,
          targetID
        );

      await message.reply({
        body:
          "┌─[ ARREST ]\n" +
          "├‣ 𝐘𝐎𝐔 𝐀𝐑𝐄 𝐔𝐍𝐃𝐄𝐑 𝐀𝐑𝐑𝐄𝐒𝐓 🎀🫰\n" +
          "└───────────────┘",
        attachment: imagePath
      });

    } catch (error) {
      console.error(
        "❌ ARREST error:",
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
          await fs.remove(
            imagePath
          );
        }
      } catch {}
    }
  }
};