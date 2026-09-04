const axios = require("axios");
const Jimp = require("jimp");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
  name: "marry",
  aliases: ["marriage"],
  version: "2.0.0",
  author: "SK-SIDDIK-KHAN",
  countDown: 5,
  role: 0,
  usePrefix: true,
  description: "Create a marriage image with your profile picture and a replied user's profile picture.",
  category: "fun"
},

  onStart: async function ({ message, event, api, ctx, bot}) {
    const senderID = event.from?.id;
    const targetID = event.reply_to_message?.from?.id;

    if (!targetID) {
      return message.reply(
        "💍 Please reply to someone's message and use /marry ❗"
      );
    }

    if (String(senderID) === String(targetID)) {
      return message.reply(
        "😂 নিজের সাথে আবার বিয়ে করা যায় নাকি!"
      );
    }

    let imagePath = null;

    try {
      imagePath = await generateProposalImage(
        api || ctx?.bot || ctx?.telegram || global.GoatBot.api,
        senderID,
        targetID
      );

      await message.reply({
        body:
          "┌─[ MARRIAGE ]\n" +
          "├‣ ₕₑᵣₑ ᵢₛ ᵢₘₐgᵢₙₐₜᵢₒₙ ₘₐᵣᵣᵢₑd 💐\n" +
          "└───────────────┘",
        attachment: imagePath
      });
    } catch (err) {
      console.error("❌ Marry image error:", err);

      await message.reply(
        "❌ Failed to generate marriage image."
      );
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

async function getTelegramAvatar(telegram, userID) {
  const photos = await telegram.getUserProfilePhotos(
    userID,
    { limit: 1 }
  );

  if (!photos?.photos?.length) {
    throw new Error(
      `Profile picture not found for user ${userID}`
    );
  }

  const photo =
    photos.photos[0][photos.photos[0].length - 1];

  const file = await telegram.getFile(photo.file_id);

  if (!file?.file_path) {
    throw new Error("Could not get Telegram file path.");
  }

  const fileURL = await telegram.getFileLink(photo.file_id);

  const response = await axios.get(fileURL, {
    responseType: "arraybuffer",
    timeout: 30000
  });

  return Buffer.from(response.data);
}

async function generateProposalImage(
  telegram,
  senderID,
  targetID
) {
  const [avatarBuffer1, avatarBuffer2] =
    await Promise.all([
      getTelegramAvatar(telegram, senderID),
      getTelegramAvatar(telegram, targetID)
    ]);

  const avatar1 = await Jimp.read(avatarBuffer1);
  const avatar2 = await Jimp.read(avatarBuffer2);

  avatar1
    .cover(512, 512)
    .circle();

  avatar2
    .cover(512, 512)
    .circle();

  const backgroundURL =
    "https://drive.google.com/uc?export=download&id=11MyfMu0iXbGuxCvoMwNGcEPPMa8SDnXG";

  const response = await axios.get(backgroundURL, {
    responseType: "arraybuffer",
    timeout: 30000
  });

  const background = await Jimp.read(
    Buffer.from(response.data)
  );

  background.resize(1024, 684);

  background
    .composite(
      avatar1.resize(85, 85),
      204,
      160
    )
    .composite(
      avatar2.resize(80, 80),
      315,
      105
    );

  const cacheDir = path.join(__dirname, "tmp");
  await fs.ensureDir(cacheDir);

  const outputPath = path.join(
    cacheDir,
    `marry_${Date.now()}.png`
  );

  await background.writeAsync(outputPath);

  return outputPath;
}