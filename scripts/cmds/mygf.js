const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const Jimp = require("jimp");

module.exports = {
  config: {
    name: "mygf",
    aliases: ["gf"],
    version: "2.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 0,
    usePrefix: true,
    description: "Create a GF image using two Telegram profile pictures.",
    category: "love"
  },

  onStart: async function ({ message, event, api }) {
    try {
      const uid1 = event.from?.id;
      const uid2 = event.reply_to_message?.from?.id;

      if (!uid2) {
        return message.reply(
          "🔰 Please reply to your GF's message and use /mygf 🔰"
        );
      }

      if (String(uid1) === String(uid2)) {
        return message.reply(
          "😂 নিজের সাথে GF বানানো যাবে না!"
        );
      }

      let imagePath = null;

      try {
        imagePath = await generateImage(
          api,
          uid1,
          uid2
        );

        await message.reply({
          body:
            "┌─[ -𝙼𝚈 𝙶𝙵- ]\n" +
            "├‣ 𝚆𝙴𝙻𝙲𝙾𝙼𝙴 𝙼𝚈 𝙶𝙵 💐\n" +
            "└───────────────┘",
          attachment: imagePath
        });

      } finally {
        if (
          imagePath &&
          await fs.pathExists(imagePath)
        ) {
          setTimeout(async () => {
            try {
              await fs.remove(imagePath);
            } catch {}
          }, 15000);
        }
      }

    } catch (err) {
      console.error("❌ MYGF Error:", err);

      await message.reply(
        "❌ Failed to generate image."
      );
    }
  }
};

async function getTelegramAvatar(api, userID) {
  const photos = await api.getUserProfilePhotos(
    userID,
    {
      limit: 1
    }
  );

  if (!photos?.photos?.length) {
    throw new Error(
      "Profile picture not found."
    );
  }

  const photo =
    photos.photos[0][
      photos.photos[0].length - 1
    ];

  const file = await api.getFile(
    photo.file_id
  );

  if (!file?.file_path) {
    throw new Error(
      "Unable to get profile photo."
    );
  }

  const fileURL = await telegram.getFileLink(photo.file_id);

  const response = await axios.get(
    fileURL,
    {
      responseType: "arraybuffer",
      timeout: 30000
    }
  );

  return Buffer.from(
    response.data
  );
}

async function generateImage(
  api,
  uid1,
  uid2
) {
  const [
    avatarBuffer1,
    avatarBuffer2
  ] = await Promise.all([
    getTelegramAvatar(api, uid1),
    getTelegramAvatar(api, uid2)
  ]);

  const avatar1 = await Jimp.read(
    avatarBuffer1
  );

  const avatar2 = await Jimp.read(
    avatarBuffer2
  );

  avatar1
    .cover(512, 512)
    .circle();

  avatar2
    .cover(512, 512)
    .circle();

  const backgroundURL =
    "https://drive.google.com/uc?export=download&id=19UVI0l2pDh1Jd6ZB3f9H7TOlem5Ew3vA";

  const response = await axios.get(
    backgroundURL,
    {
      responseType: "arraybuffer",
      timeout: 30000
    }
  );

  const background = await Jimp.read(
    Buffer.from(response.data)
  );

  background.resize(
    1280,
    716
  );

  background
    .composite(
      avatar1.resize(360, 360),
      130,
      200
    )
    .composite(
      avatar2.resize(360, 360),
      787,
      200
    );

  const cacheDir = path.join(
    __dirname,
    "tmp"
  );

  await fs.ensureDir(cacheDir);

  const outputPath = path.join(
    cacheDir,
    `mygf_${uid1}_${uid2}_${Date.now()}.jpg`
  );

  await background.writeAsync(
    outputPath
  );

  return outputPath;
}