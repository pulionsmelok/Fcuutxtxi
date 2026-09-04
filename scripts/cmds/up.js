const os = require("os");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

let canvasLib;
try { canvasLib = require("canvas"); } catch { canvasLib = null; }

module.exports = {
  config: {
    name: "up",
    aliases: ["uptime"],
    author: "SK-SIDDIK-KHAN",
    version: "3.7 FINAL",
    description: "SIDDIK-BOT-V5 UPTIME SYSTEM",
    category: "system",
    usePrefix: true,
    cooldown: 0,
    role: 0,
  },

  onStart: async function ({ event, api, message, bot}) {
    const chatId = event.chat?.id || message.chatId;
    let loadingMsg;

    try {
        loadingMsg = await message.reply("🔄 [▒▒▒▒▒▒] 0%");
        const steps = ["⚡ [██▒▒▒▒▒▒▒▒] 20%","⚡ [████▒▒▒▒▒▒] 40%","⚡ [██████▒▒▒▒] 60%","⚡ [████████▒▒] 80%","✅ [██████████] 100%"];

        for (let s of steps) {
            await new Promise(r => setTimeout(r, 300));
            try { await message.edit(s, loadingMsg.message_id, chatId); } catch {}
        }
    } catch {}

    const commands = global.GoatBot.commands;
    const events = global.GoatBot.eventCommands;

    const uniqueCmds = commands?.values
      ? [...new Set(
          [...commands.values()]
            .map(c => c?.config?.name)
            .filter(Boolean)
        )].length
      : 0;

    const totalEvents = events?.size || 0;
    const botPrefix = global.GoatBot.config?.prefix || "/";

    const now = new Date();

    const bdTime = now.toLocaleString("en-US", {
        timeZone: "Asia/Dhaka",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });

    const bdDate = now.toLocaleString("en-US", {
        timeZone: "Asia/Dhaka",
        month: "2-digit",
        day: "2-digit",
        year: "numeric"
    });

    const formatUptime = () => {
        let s = Math.floor(process.uptime());

        const d = Math.floor(s / 86400);
        s %= 86400;

        const h = Math.floor(s / 3600);
        s %= 3600;

        const m = Math.floor(s / 60);
        const sec = s % 60;

        const parts = [];

        if (d > 0) parts.push(`${d}d`);
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}m`);
        if (sec > 0) parts.push(`${sec}s`);

        return parts.join(" ") || "0s";
    };

    const uptimeStr = formatUptime();

    const totalRamMB = os.totalmem() / 1024 / 1024;
    const freeRamMB = os.freemem() / 1024 / 1024;
    const usedRamMB = totalRamMB - freeRamMB;

    const totalRam = totalRamMB.toFixed(0);
    const usedRam = usedRamMB.toFixed(0);

    let ping = -1;

    try {
        const pingStart = Date.now();
        await api.getMe();
        ping = Date.now() - pingStart;
    } catch {}

    const pingText = ping >= 0 ? `${ping} ms` : "N/A";

    const captionText =
`✨ 𝐒𝐈𝐃𝐃𝐈𝐊 𝐁𝐎𝐓 𝐔𝐏 𝐒𝐘𝐒𝐓𝐄𝐌 ✨
┏━━━━━━━━━━━━━━❥
┃ 👑 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫: 𝐒𝐊 𝐒𝐈𝐃𝐃𝐈𝐊
┃━━━━━━━━━━━━━━━
┃ ⏱️ 𝐔𝐩𝐭𝐢𝐦𝐞: ${uptimeStr}
┃━━━━━━━━━━━━━━━
┃ ⚡ 𝐋𝐚𝐭𝐞𝐧𝐜𝐲: ${pingText}
┃━━━━━━━━━━━━━━━
┃ 📊 𝐑𝐚𝐦: ${usedRam} / ${totalRam} mb
┃━━━━━━━━━━━━━━━
┃ 💻 𝐂𝐦𝐝𝐬: ${uniqueCmds}
┃ 🌐 𝐄𝐯𝐞𝐧𝐭𝐬: ${totalEvents}
┃━━━━━━━━━━━━━━━
┃ 🛠️ 𝐏𝐫𝐞𝐟𝐢𝐱: [ ${botPrefix} ]
┃━━━━━━━━━━━━━━━
┃ 📅 ${bdTime} | ${bdDate}
┗━━━━━━━━━━━━━━❥
🟢 𝐐𝐔𝐀𝐍𝐓𝐔𝐌 𝐌𝐀𝐈𝐍𝐅𝐑𝐀𝐌𝐄 : 𝐎𝐍𝐋𝐈𝐍𝐄`;

    if (!canvasLib) {
        if (loadingMsg) await message.unsend(loadingMsg.message_id).catch(() => {});
        return message.reply(captionText + "\n\n⚠️ Canvas not installed, run: npm i canvas");
    }

    const { createCanvas, loadImage } = canvasLib;
    const cacheDir = path.join(__dirname, "tmp");

    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }

    const imgPath = path.join(cacheDir, `up_${Date.now()}.png`);

    try {
        const canvas = createCanvas(800, 800);
        const ctx = canvas.getContext("2d");

        const bgG = ctx.createRadialGradient(400,400,0,400,400,600);
        bgG.addColorStop(0,"#0b1528");
        bgG.addColorStop(1,"#020610");
        ctx.fillStyle = bgG;
        ctx.fillRect(0,0,800,800);

        const frameG = ctx.createLinearGradient(0,0,800,800);
        frameG.addColorStop(0,"#00f2fe");
        frameG.addColorStop(0.5,"#9d4edd");
        frameG.addColorStop(1,"#00ffaa");

        ctx.strokeStyle = frameG;
        ctx.lineWidth = 6;
        ctx.strokeRect(20,20,760,760);

        ctx.fillStyle = "#fff";
        ctx.font = "bold 38px sans-serif";
        ctx.textAlign = "center";
        ctx.shadowColor = "#00f2fe";
        ctx.shadowBlur = 15;
        ctx.fillText("QUANTUM SYSTEM V5",400,75);
        ctx.shadowBlur = 0;

        const avX=220, avY=280, avR=110;

        ctx.strokeStyle="#00f2fe";
        ctx.lineWidth=5;
        ctx.beginPath();
        ctx.arc(avX,avY,avR+12,0,Math.PI*2);
        ctx.stroke();

        ctx.strokeStyle="#00ffaa";
        ctx.lineWidth=3;
        ctx.beginPath();
        ctx.arc(avX,avY,avR,0,Math.PI*2);
        ctx.stroke();

        try {
            const botId = (await api.getMe()).id;
            const file = await api.getUserProfilePhotos(botId);

            if (file?.photos?.[0]?.[0]) {
                const fileId = file.photos[0][0].file_id;
                const fileInfo = await api.getFile(fileId);
                const fileUrl = `https://api.telegram.org/file/bot${api.token}/${fileInfo.file_path}`;

                const res = await axios.get(fileUrl, {
                    responseType: "arraybuffer"
                });

                const avatar = await loadImage(Buffer.from(res.data));

                ctx.save();
                ctx.beginPath();
                ctx.arc(avX,avY,avR-4,0,Math.PI*2);
                ctx.clip();
                ctx.drawImage(avatar,avX-avR,avY-avR,avR*2,avR*2);
                ctx.restore();
            }
        } catch {}

        const drawBox = (x,y,w,h,header,value,color) => {
            ctx.fillStyle="rgba(5,10,25,0.65)";
            ctx.fillRect(x,y,w,h);

            ctx.shadowColor=color;
            ctx.shadowBlur=12;
            ctx.strokeStyle=color;
            ctx.lineWidth=2.5;
            ctx.strokeRect(x,y,w,h);
            ctx.shadowBlur=0;

            ctx.fillStyle=color+"33";
            ctx.fillRect(x+2,y+2,w-4,30);

            ctx.fillStyle=color;
            ctx.font="bold 15px sans-serif";
            ctx.textAlign="left";
            ctx.fillText(`▶ ${header}`,x+15,y+22);

            ctx.fillStyle="#fff";
            ctx.font="bold 22px monospace";
            ctx.fillText(value,x+15,y+62);
        };

        drawBox(420,130,330,85,"BOT DEVELOPER","SK SIDDIK","#00f2fe");
        drawBox(420,245,330,85,"SYSTEM UPTIME",uptimeStr,"#00ffaa");
        drawBox(420,360,330,85,"TOTAL CMDS",`${uniqueCmds} Active`,"#ffb703");
        drawBox(50,500,340,85,"RAM USAGE",`${usedRam} / ${totalRam} MB`,"#ff4d6d");
        drawBox(410,500,340,85,"LATENCY PING",pingText,"#ff7a00");
        drawBox(50,610,340,85,"BOT PREFIX",`[ ${botPrefix} ] Mode`,"#00ffaa");
        drawBox(410,610,340,85,"EVENTS",`${totalEvents} Active`,"#9d4edd");

        ctx.fillStyle="rgba(0,242,254,0.1)";
        ctx.fillRect(50,712,700,50);

        ctx.strokeStyle="#00f2fe";
        ctx.lineWidth=1.5;
        ctx.strokeRect(50,712,700,50);

        ctx.fillStyle="#fff";
        ctx.font="bold 18px sans-serif";
        ctx.textAlign="center";
        ctx.fillText(`${bdTime} | ${bdDate} (BST)`,400,743);

        fs.writeFileSync(imgPath,canvas.toBuffer());

        if (loadingMsg) await message.unsend(loadingMsg.message_id).catch(() => {});

        await api.sendPhoto(
            chatId,
            { source: fs.createReadStream(imgPath) },
            { caption: captionText }
        );

    } catch (e) {
        console.log("UP ERROR:",e);

        if (loadingMsg) {
            await message.unsend(loadingMsg.message_id).catch(() => {});
        }

        await message.reply(
            captionText + `\n\n❌ Canvas Err: ${e.message}`
        );

    } finally {
        if (fs.existsSync(imgPath)) {
            try { fs.unlinkSync(imgPath); } catch {}
        }
    }
  }
};