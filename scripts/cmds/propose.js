const axios = require("axios");
const Jimp = require("jimp");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "propose",
    aliases: ["proposal"],
    version: "2.0.5",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 0,
    usePrefix: true,
    description: {
      en: "Create a proposal image with your and the replied user's profile pictures."
    },
    category: "love",
    guide: {
      en: "Reply to someone's message and use {pn}"
    }
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

  async generateProposalImage(api, uid1, uid2) {
    const [buffer1, buffer2] =
      await Promise.all([
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
        "The replied user's profile picture could not be found."
      );
    }

    const avatar1 =
      await Jimp.read(buffer1);

    const avatar2 =
      await Jimp.read(buffer2);

    avatar1
      .cover(512, 512)
      .circle();

    avatar2
      .cover(512, 512)
      .circle();

    const backgroundUrl =
      "https://drive.google.com/uc?export=download&id=1AKOFk9AUwd6GHzlK1j5Y9ElVul0usU-R";

    const response =
      await axios.get(backgroundUrl, {
        responseType: "arraybuffer",
        timeout: 30000
      });

    const background =
      await Jimp.read(
        Buffer.from(response.data)
      );

    background
      .resize(760, 506)
      .composite(
        avatar1.resize(90, 90),
        210,
        65
      )
      .composite(
        avatar2.resize(90, 90),
        458,
        105
      );

    const cacheDir =
      path.join(__dirname, "tmp");

    await fs.ensureDir(cacheDir);

    const outputPath =
      path.join(
        cacheDir,
        `propose_${Date.now()}.png`
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
      const user1 =
        event?.from?.id;

      const replied =
        event?.reply_to_message;

      if (!replied?.from?.id) {
        return message.reply(
          "💌 Please reply to someone's message and use /propose"
        );
      }

      const user2 =
        replied.from.id;

      if (
        String(user1) ===
        String(user2)
      ) {
        return message.reply(
          "😂 নিজের কাছে আবার propose করা যায় নাকি!"
        );
      }

      imagePath =
        await this.generateProposalImage(
          api,
          user1,
          user2
        );

      await message.reply({
        body:
          "┌─[ -143- ]\n" +
          "├‣ 🅛🅞🅥🅔 🅨🅞🅤 🅑🅐🅑🅨 💐\n" +
          "└───────────────┘",
        attachment: imagePath
      });

    } catch (error) {
      console.error(
        "❌ PROPOSE error:",
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
