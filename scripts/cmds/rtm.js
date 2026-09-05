const { execSync } = require('child_process');

module.exports = {
  config: {
    name: 'rtm',
    version: '2.3.0',
    author: 'SK-SIDDIK-KHAN',
    countDown: 15,
    role: 0,
    shortDescription: 'Display bot uptime and system stats with media ban check',
    longDescription: 'Display bot uptime and system stats with media ban check',
    category: 'system',
    guide: '{pn}: Show bot system info'
  },

  onStart: async function ({ message, event, usersData, threadsData, api, threadID}) {
    const startTime = Date.now();
    const users = await usersData.getAll();
    const groups = await threadsData.getAll();
    const uptime = process.uptime();

    try {
      const d = Math.floor(uptime / (3600 * 24));
      const h = Math.floor((uptime % (3600 * 24)) / 3600);
      const m = Math.floor((uptime % 3600) / 60);
      const s = Math.floor(uptime % 60);

      const totalMem = (parseInt(execSync("grep MemTotal /proc/meminfo | awk '{print $2}'")) / (1024 * 1024)).toFixed(2);
      const freeMem = (parseInt(execSync("grep MemAvailable /proc/meminfo | awk '{print $2}'")) / (1024 * 1024)).toFixed(2);
      const cpuModel = execSync("grep 'model name' /proc/cpuinfo | uniq | cut -d: -f2").toString().trim();
      const cpuCores = parseInt(execSync("nproc"));
      const cpuUsage = execSync("top -bn1 | grep '%Cpu' | awk '{print $2 + $4}'").toString().trim();
      const diskUsage = execSync("df -h / | awk 'NR==2{print $5}'").toString().trim();
      const diskTotal = execSync("df -h / | awk 'NR==2{print $2}'").toString().trim();
      const diskFree = execSync("df -h / | awk 'NR==2{print $4}'").toString().trim();
      const osVersion = execSync("grep 'PRETTY_NAME' /etc/os-release | cut -d= -f2").toString().replace(/"/g, '');
      const nodeVersion = process.version;
      const endTime = Date.now();
      const ping = endTime - startTime;
      const totalMsg = users.reduce((sum, u) => sum + (u.messageCount || 0), 0);
      const mediaBan = await threadsData.get(event.threadID, 'mediaBan') || false;

      const output =
`╭━━━〔 🤖 𝐁𝐎𝐓 𝐈𝐍𝐅𝐎 〕━━━╮
┃👥 𝗨𝘀𝗲𝗿𝘀        : ${users.length}
┃💬 𝗚𝗿𝗼𝗼𝘂𝗽𝘀      : ${groups.length}
┃🧾 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀 : ${global.GoatBot.commands?.size || 'N/A'}
┃📨 𝗧𝗼𝘁𝗮𝗹 𝗠𝘀𝗴𝘀  : ${totalMsg}
┃⏱️ 𝗨𝗽𝘁𝗶𝗺𝗲       : ${d}d ${h}h ${m}m ${s}s
┃📶 𝗣𝗶𝗻𝗴          : ${ping}ms
╰━━━━━━━━━━━━━━━━━━╯

╭━〔 🖥 𝐒𝐄𝐑𝐕𝐄𝐑 𝐒𝐓𝐀𝐓𝐒 〕━╮
┃🧠 𝗥𝗔𝗠 : ${freeMem}GB free / ${totalMem}GB
┃💽 𝗗𝗶𝘀𝗸 : ${diskUsage} used (T: ${diskTotal}, F: ${diskFree})
┃⚙️ 𝗖𝗽𝗨     : ${cpuModel}
┃🔢 𝗖𝗼𝗿𝗲𝘀   : ${cpuCores}
┃🔥 𝗖𝗽𝗨 𝗨𝘀𝗮𝗴𝗲 : ${cpuUsage}%
╰━━━━━━━━━━━━━━━━━━╯

╭━〔 ⚙️ 𝐒𝐘𝐒𝐓𝐄𝐌 〕━━━╮
┃🖥 𝗢𝗦 : ${osVersion}
┃📦 𝗡𝗼𝗱𝗲.𝗷𝘀  : ${nodeVersion}
┃🔒 𝗠𝗲𝗱𝗶𝗮 𝗕𝗮𝗻𝗻𝗲𝗱  : ${mediaBan ? '🚫 Yes' : '✅ No'}
╰━━━━━━━━━━━━━━━━━━╯`;

      const frames = [
        '🔄 𝗜𝗻𝗶𝘁𝗶𝗮𝗹𝗶𝘇𝗶𝗻𝗴...\n[░░░░░░░░░░]',
        '🔄 𝗖𝗵𝗲𝗰𝗸𝗶𝗻𝗴 𝗦𝘁𝗮𝘁𝘀...\n[███░░░░░░░]',
        '🔧 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 𝗜𝗻𝗳𝗼...\n[██████░░░░]',
        '✅ 𝗗𝗼𝗻𝗲!\n[██████████]'
      ];

      const sent = await message.reply("⚙️ Gathering system info...");

      let step = 0;
      const animate = async () => {
        if (step < frames.length) {
          await api.editMessage(frames[step], sent.messageID, event.threadID);
          step++;
          return setTimeout(animate, 600);
        }
        await api.editMessage(output, sent.messageID, event.threadID);
      };

      await animate();

    } catch (err) {
      console.error(err);
      return message.reply("❌ Error occurred:\n" + err.message);
    }
  }
};
