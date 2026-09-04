const axios = require("axios");
const Jimp = require("jimp");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "love3",
    version: "2.0.5",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 0,
    usePrefix: true,
    description: {
      en: "Create a love image with your and the replied user's profile pictures."
    },
    category: "user"
  },

  async getProfilePhoto(api, userId) {
    const photos = await api.getUserProfilePhotos(userId, {
      limit: 1
    });

    if (!photos?.photos?.length) return null;

    const photo = photos.photos[0][photos.photos[0].length - 1];
    const file = await api.getFile(photo.file_id);

    if (!file?.file_path) return null;

    const fileUrl = await api.getFileLink(photo.file_id);

    const response = await axios.get(fileUrl, {
      responseType: "arraybuffer",
      timeout: 30000
    });

    return Buffer.from(response.data);
  },

  async createAvatar(buffer) {
    const avatar = await Jimp.read(buffer);

    avatar
      .resize(470, 470)
      .circle();

    return avatar;
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
        "The replied user has no Telegram profile picture."
      );
    }

    const [av1, av2] = await Promise.all([
      this.createAvatar(buffer1),
      this.createAvatar(buffer2)
    ]);

    const backgroundUrl =
      "https://drive.google.com/uc?export=download&id=11j2blqNtj3GMbJOi9CvodiExUshH4vtm";

    const response = await axios.get(backgroundUrl, {
      responseType: "arraybuffer",
      timeout: 30000
    });

    const background = await Jimp.read(
      Buffer.from(response.data)
    );

    background.resize(1440, 1080);

    background
      .composite(av1, 125, 210)
      .composite(av2, 800, 200);

    const cacheDir = path.join(__dirname, "tmp");

    await fs.ensureDir(cacheDir);

    const outputPath = path.join(
      cacheDir,
      `love3_${Date.now()}.jpg`
    );

    await background.writeAsync(outputPath);

    return outputPath;
  },

  onStart: async function ({ message, event, api }) {
    let imagePath = null;

    try {
      const user1 = event?.from?.id;
      const replied = event?.reply_to_message;

      if (!replied?.from?.id) {
        return message.reply(
          "💘 Please reply to someone with /love3"
        );
      }

      const user2 = replied.from.id;

      if (String(user1) === String(user2)) {
        return message.reply(
          "😂 নিজের সাথে love করা যাবে না!"
        );
      }

      imagePath = await this.generateLoveImage(
        api,
        user1,
        user2
      );

      await message.reply({
        body:
          "┌─[ LOVE ]\n" +
          "├‣ ᴘʟᴇᴀsᴇ ᴀᴄᴄᴇᴘᴛ ᴍʏ ʟᴏᴠᴇ 💘\n" +
          "└───────────────┘",
        attachment: imagePath
      });

    } catch (error) {
      console.error("❌ LOVE3 error:", error);

      try {
        await message.reply(
          `❌ Failed to generate love image.\n\n${error.message}`
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