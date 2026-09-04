const os = require('os');

module.exports = {
  config: {
    name: "ping",
    aliases: ["pong", "speed"],
    author: "SK-SIDDIK-KHAN",
    version: "3.2",
    cooldown: 5,
    role: 0,
    description: "Check bot response time and system information",
    category: "system",
    usePrefix: true
  },

  onStart: async function ({ event, api, message }) {
    const apiStartTime = Date.now();
    
    const loadingStates = [
      '[█▒▒▒▒▒▒▒▒▒]',
      '[███▒▒▒▒▒▒▒]',
      '[█████▒▒▒▒▒]',
      '[███████▒▒▒]',
      '[██████████]'
    ];
    
    const msg = await message.reply(loadingStates[0]);
    const apiPing = Date.now() - apiStartTime;
    
    for (let i = 1; i < loadingStates.length; i++) {
      await sleep(250);
      await message.edit(loadingStates[i], msg.message_id);
    }
    
    const uptime = process.uptime();
    
    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const usedMem = (totalMem - freeMem).toFixed(2);
    const memUsage = ((usedMem / totalMem) * 100).toFixed(1);
    
    const cpuUsage = process.cpuUsage();
    const cpuPercent = ((cpuUsage.user + cpuUsage.system) / 1000000).toFixed(2);
    
    const formattedUptime = formatUptime(uptime);
    
    let userCount = 0;
    let groupCount = 0;
    
    try {
      if (global.db) {
        if (typeof global.db.getAllUsers === 'function') {
          const allUsers = await global.db.getAllUsers();
          userCount = allUsers.length;
        } else if (typeof global.db.users?.getAll === 'function') {
          const allUsers = await global.db.users.getAll();
          userCount = allUsers.length;
        } else if (typeof global.db.allUserID === 'function') {
          const allUsers = await global.db.allUserID();
          userCount = allUsers.length;
        }

        if (typeof global.db.getAllThreads === 'function') {
          const allThreads = await global.db.getAllThreads();
          groupCount = allThreads.filter(t => t.type === 'group' || t.type === 'supergroup' || t.isGroup).length;
        } else if (typeof global.db.threads?.getAll === 'function') {
          const allThreads = await global.db.threads.getAll();
          groupCount = allThreads.filter(t => t.type === 'group' || t.type === 'supergroup' || t.isGroup).length;
        } else if (typeof global.db.allThreadID === 'function') {
          const allThreads = await global.db.allThreadID();
          groupCount = allThreads.length;
        }
      }
    } catch (err) {
      console.error("Error fetching db stats for ping command:", err);
    }
    
    const responseText = `🏓 Pong!\n\n` +
      `📊 System Information:\n\n` +
      `⏱️ API Ping: ${apiPing}ms\n` +
      `🕐 Bot Uptime: ${formattedUptime}\n` +
      `💾 Memory: ${usedMem}GB / ${totalMem}GB (${memUsage}%)\n` +
      `⚙️ CPU Usage: ${cpuPercent}s\n` +
      `🖥️ Platform: ${os.platform()} ${os.arch()}\n` +
      `📦 Node: ${process.version}\n\n` +
      `📈 Bot Statistics:\n` +
      `👤 Commands: ${new Set([...(global.GoatBot.commands?.values() || [])].map(c => c.config?.name).filter(Boolean)).size}\n` +
      `🎭 Events: ${global.GoatBot.eventCommands?.size || 0}\n` +
      `⏳ Cooldowns: ${global.cooldowns?.size || 0}\n` +
      `👥 Total Users: ${userCount}\n` +
      `💬 Total Groups: ${groupCount}\n\n` +
      `👤 User: ${event.from?.first_name || 'User'}\n` +
      `📍 Chat: ${event.chat?.title || 'Private Chat'}`;
    
    await message.edit(responseText, msg.message_id);
  }
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  let result = [];
  if (d > 0) result.push(`${d}d`);
  if (h > 0 || d > 0) result.push(`${h}h`);
  if (m > 0 || h > 0 || d > 0) result.push(`${m}m`);
  result.push(`${s}s`);
  
  return result.join(' ');
}
