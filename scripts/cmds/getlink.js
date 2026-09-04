function box(title, content) {
  return `╭━❮ ✨ ${title} ✨ ❯━╮
${content}
╰━──━─━─━━─━─━❍`;
}

module.exports = {
  config: {
    name: "getlink",
    aliases: ["link", "gl", "geturl"],
    version: "1.0.3",
    author: "SK-SIDDIK-KHAN",
    role: 0,
    prefix: true,
    description: "Get direct download link of replied media",
    category: "Tool",
    usePrefix: true
  },

  onStart: async function ({ event, api, message }) {

    if (!event.reply_to_message) {
      return message.reply(
        box(
          "GET LINK",
          `│ ❌ Reply দাও
│
│ Audio, video বা ছবিতে
│ reply দিয়ে /getlink লিখো`
        )
      );
    }

    const reply = event.reply_to_message;

    try {
      let fileId = null;
      let fileType = "file";
      let fileName = "unknown";

      if (reply.photo) {
        const p = reply.photo;
        fileId = p[p.length - 1].file_id;
        fileType = "photo";
        fileName = "photo.jpg";

      } else if (reply.video) {
        fileId = reply.video.file_id;
        fileType = "video";
        fileName = reply.video.file_name || "video.mp4";

      } else if (reply.audio) {
        fileId = reply.audio.file_id;
        fileType = "audio";
        fileName = reply.audio.file_name || "audio.mp3";

      } else if (reply.voice) {
        fileId = reply.voice.file_id;
        fileType = "voice";
        fileName = "voice.ogg";

      } else if (reply.document) {
        fileId = reply.document.file_id;
        fileType = "document";
        fileName = reply.document.file_name || "file";

      } else if (reply.sticker) {
        fileId = reply.sticker.file_id;
        fileType = "sticker";
        fileName = "sticker.webp";
      }

      if (!fileId) {
        return message.reply(
          box(
            "ERROR",
            `│ ❌ কোনো মিডিয়া পাওয়া যায়নি`
          )
        );
      }

      const fileLink = await api.getFileLink(fileId);
      const url = typeof fileLink === 'string' ? fileLink : fileLink.href;

      const content = `│ 📁 Type: ${fileType.toUpperCase()}
│ 📄 Name: ${fileName.slice(0, 25)}
│
│ 🔗 ${url}`;

      return message.reply(box("LINK FOUND", content));

    } catch (e) {
      return message.reply(
        box("ERROR", `│ ❌ ${e.message}`)
      );
    }
  }
};