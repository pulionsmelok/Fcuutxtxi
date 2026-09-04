const axios = require('axios');
const Jimp = require('jimp');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "love1",
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

    if (!photos?.photos?.length) {
      return null;
    }

    const photo = photos.photos[0][photos.photos[0].length - 1];

    const file = await api.getFile(photo.file_id);

    if (!file?.file_path) {
      return null;
    }

    const fileUrl = await api.getFileLink(photo.file_id);

    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    return Buffer.from(response.data);
  },

  async makeCircle(buffer) {
    const image = await Jimp.read(buffer);

    const size = Math.min(
      image.bitmap.width,
      image.bitmap.height
    );

    image.cover(size, size);
    image.circle();

    return image;
  },

  async generateLoveImage(api, uid1, uid2) {
    const [avatarBuffer1, avatarBuffer2] = await Promise.all([
      this.getProfilePhoto(api, uid1),
      this.getProfilePhoto(api, uid2)
    ]);

    if (!avatarBuffer1) {
      throw new Error('First user has no profile picture.');
    }

    if (!avatarBuffer2) {
      throw new Error('Second user has no profile picture.');
    }

    const av1 = await this.makeCircle(avatarBuffer1);
    const av2 = await this.makeCircle(avatarBuffer2);

    const backgroundUrl =
      'https://drive.google.com/uc?export=download&id=11X8zbvhW6-vXsC65-rjdnNjbD2JJdRSr';

    const response = await axios.get(backgroundUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    const background = await Jimp.read(
      Buffer.from(response.data)
    );

    background.resize(1440, 1080);

    av1.resize(470, 460);
    av2.resize(470, 460);

    background.composite(av1, 128, 210);
    background.composite(av2, 800, 200);

    const cacheDir = path.join(__dirname, 'tmp');

    await fs.ensureDir(cacheDir);

    const outputPath = path.join(
      cacheDir,
      `love1_${Date.now()}.jpg`
    );

    await background.writeAsync(outputPath);

    return outputPath;
  },

  onStart: async function ({ message, event, api }) {
    let imagePath = null;

    try {
      const uid1 = event?.from?.id;
      const replied = event?.reply_to_message;

      if (!replied?.from?.id) {
        return message.reply(
          '💘 Please reply to someone with /love1'
        );
      }

      const uid2 = replied.from.id;

      if (String(uid1) === String(uid2)) {
        return message.reply(
          '😂 নিজের সাথে love করা যাবে না!'
        );
      }

      imagePath = await this.generateLoveImage(
        api,
        uid1,
        uid2
      );

      await message.reply({
        body:
          '┌─[ LOVE ]\n' +
          '├‣ ᴘʟᴇᴀsᴇ ᴀᴄᴄᴇᴘᴛ ᴍʏ ʟᴏᴠᴇ 💘\n' +
          '└───────────────┘',
        attachment: imagePath
      });

    } catch (error) {
      console.error('❌ LOVE1 error:', error);

      try {
        await message.reply(
          '❌ Failed to generate image.'
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