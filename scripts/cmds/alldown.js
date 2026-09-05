const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { alldown } = require("nayan-media-downloaders");

const supported = ["instagram.com","instagr.am","tiktok.com","youtube.com","youtu.be","pinterest.com","pin.it","twitter.com","x.com","facebook.com","fb.watch"];

module.exports = {
  config: {
    name: "alldown",
    author: "SK-SIDDIK-KHAN",
    description: "Auto Video Downloader",
    category: "media",
    usePrefix: false,
    cooldown: 0
  },

  onStart: async function () {},

  onChat: async function ({ api, event, chatId, message }) {
    let tempFile = null;
    try {
      const text = String(event?.body || event?.raw?.text || event?.raw?.caption || event?.message?.text || event?.message?.caption || "").trim();
      if (!text) return;

      const match = text.match(/https?:\/\/[^\s]+/i);
      if (!match) return;

      const link = match[0].replace(/[)\]}>.,]+$/, "");

      let url;
      try { url = new URL(link); } catch { return; }

      const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
      const isSupported = supported.some(domain =>
        hostname === domain || hostname.endsWith("." + domain)
      );

      if (!isSupported) return;

      const replyId =
        event?.messageID ||
        event?.raw?.message_id ||
        event?.message?.message_id;

      const waitMsg = await api.sendMessage(
        "⏳ 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗜𝗡𝗚",
        chatId,
        replyId ? { reply_to_message_id: replyId } : {}
      );

      const res = await alldown(link);
      const data = res?.data || res;

      const videoUrl =
        data?.high ||
        data?.low ||
        data?.url ||
        data?.video ||
        data?.videoUrl;

      if (!videoUrl) throw new Error("No video URL found");

      let title = String(data?.title || "Downloaded Video")
        .split("#")[0]
        .replace(/\s{2,}/g, " ")
        .trim() || "Downloaded Video";

      tempFile = path.join(
        __dirname,
        "tmp",
        `alldown_${Date.now()}.mp4`
      );

      fs.mkdirSync(path.dirname(tempFile), { recursive: true });

      const response = await axios({
        method: "GET",
        url: videoUrl,
        responseType: "stream",
        timeout: 180000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(tempFile);

        response.data.pipe(writer);

        writer.on("finish", resolve);
        writer.on("error", reject);
        response.data.on("error", reject);
      });

      if (waitMsg?.messageID) {
        await api.deleteMessage(chatId, waitMsg.messageID).catch(() => {});
      }

      await api.sendVideo(chatId, tempFile, {
        caption: title,

        ...(replyId ? {
          reply_to_message_id: replyId
        } : {}),

        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔖 COPY TITLE",
                copy_text: {
                  text: title
                }
              }
            ],
            [
              {
                text: "👑 DEV : SK-SIDDIK",
                url: "https://t.me/busy1here"
              }
            ]
          ]
        }
      });

    } catch (err) {
      console.error(
        "❌ AutoDownload Error:",
        err.message || err
      );

      try {
        const replyId =
          event?.messageID ||
          event?.raw?.message_id ||
          event?.message?.message_id;

        await api.sendMessage(
          `❌ Download Failed\n${err.message || "Unknown error"}`,
          chatId,
          replyId
            ? { reply_to_message_id: replyId }
            : {}
        );
      } catch {}

    } finally {
      if (tempFile) {
        setTimeout(() => {
          try {
            if (fs.existsSync(tempFile)) {
              fs.unlinkSync(tempFile);
            }
          } catch {}
        }, 15000);
      }
    }
  }
};