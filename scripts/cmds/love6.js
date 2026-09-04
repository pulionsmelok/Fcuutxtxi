const axios = require("axios");
const Jimp = require("jimp");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
  name: 'love6',
  version: '2.0.5',
  author: 'SK-SIDDIK-KHAN',
  countDown: 5,
  role: 0,
  usePrefix: true,
  description: {
    en: "Create a love image with your and the replied user's profile pictures."
  },
  category: 'user'
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

    const av1 = await Jimp.read(buffer1);
    const av2 = await Jimp.read(buffer2);

    const circleOne = av1
      .resize(284, 284)
      .circle();

    const circleTwo = av2
      .resize(295, 295)
      .circle();

    const backgroundUrl =
      "https://drive.google.com/uc?export=download&id=127abSHy13rjpOSwpLIlFc2lGbeJQQRjW";

    const response = await axios.get(backgroundUrl, {
      responseType: "arraybuffer",
      timeout: 30000
    });

    const background = await Jimp.read(
      Buffer.from(response.data)
    );

    background.resize(1024, 562);

    background
      .composite(circleOne, 143, 113)
      .composite(circleTwo, 605, 103);

    const cacheDir = path.join(__dirname, "tmp");

    await fs.ensureDir(cacheDir);

    const outputPath = path.join(
      cacheDir,
      `love6_${Date.now()}.jpg`
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
          "💘 Please reply to someone with /love6"
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
      console.error("❌ LOVE6 error:", error);

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