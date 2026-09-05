const fs = require("fs-extra");
const path = require("path");

const DEFAULTS = {
  antilink: false,
  spammute: false,
  spamMuteGlobal: false,
  welcome: true,
  leave: true,
  maintenance: false,
  adminonly: false,
  prefixMode: false,
  cooldown: false
};

function getConfig() { global.GoatBot = global.GoatBot || {}; global.GoatBot.config = global.GoatBot.config || {}; return global.GoatBot.config; }
async function persistConfig() { try { if (global.client?.dirConfig) await fs.writeJson(global.client.dirConfig, global.GoatBot.config, { spaces: 2 }); } catch (e) { console.error("SETTING CONFIG SAVE ERROR:", e.message); } }
function prefixModeFile() { return path.join(process.cwd(), "scripts", "cmds", "S1DD1K", "prefixmode.json"); }
function readPrefixMode() { try { const f=prefixModeFile(); return fs.existsSync(f) && fs.readJsonSync(f)?.enabled === true; } catch { return false; } }
function writePrefixMode(enabled) { const f=prefixModeFile(); fs.ensureDirSync(path.dirname(f)); fs.writeJsonSync(f,{enabled:!!enabled},{spaces:2}); getConfig().prefixModeEnabled=!!enabled; }

async function loadSettings() {
  const config=getConfig(); const stored=(config.settingPanel&&typeof config.settingPanel==="object")?config.settingPanel:{};
  return {...DEFAULTS,...stored,adminonly:config.adminOnly?.enable===true,prefixMode:readPrefixMode()||config.prefixModeEnabled===true};
}
async function saveSettings(data) {
  const config=getConfig(); config.settingPanel={...DEFAULTS,...(config.settingPanel||{}),...(data||{})};
  config.adminOnly=config.adminOnly||{enable:false,ignoreCommand:[]}; if(!Array.isArray(config.adminOnly.ignoreCommand)) config.adminOnly.ignoreCommand=[];
  if(Object.prototype.hasOwnProperty.call(data||{},"adminonly")){config.adminOnly.enable=data.adminonly===true;config.settingPanel.adminonly=config.adminOnly.enable;}
  if(Object.prototype.hasOwnProperty.call(data||{},"prefixMode")){writePrefixMode(data.prefixMode===true);config.settingPanel.prefixMode=data.prefixMode===true;}
  await persistConfig();
}
function safeName(v,max=28){v=String(v||"Unknown").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,"").trim();const a=Array.from(v);return a.length>max?a.slice(0,max).join("")+"…":(v||"Unknown");}
function getAdminIds(){const c=global.GoatBot?.config||{};const l=c.adminBot||c.adminUID||c.botAdmins||c.admins||[];return(Array.isArray(l)?l:[l]).filter(Boolean).map(String);}
function isBotAdmin(id){return getAdminIds().includes(String(id));}
function panel(title,lines=[]){return[`╭─❖─〔 ${title} 〕─❖─╮`,...lines.map(x=>`│ ${x}`),"╰─❖─〔 GoatBot 〕─❖─╯"].join("\n");}
function markup(keyboard){return{reply_markup:{inline_keyboard:keyboard}};}
async function sendNew(message,text,keyboard){return message.reply({body:text,...markup(keyboard)});}
async function editPanel(ctx,text,keyboard){
  const opts=markup(keyboard);
  try {

    return await ctx.editMessageText(text, opts);
  } catch (e) {
    const msg=String(e?.description||e?.message||e||"").toLowerCase();

    if (msg.includes("message is not modified")) return null;

    console.error("SETTING PANEL EDIT ERROR:", e?.message||e);
    return null;
  }
}

const LABELS={maintenance:"🚧 Maintenance",adminonly:"👑 Admin Only",prefixMode:"🧩 Prefix Mode",cooldown:"⏱️ Global Cooldown",antilink:"🔗 Anti Link",spammute:"🚫 Spam Mute",spamMuteGlobal:"🌍 Spam Mute Global",welcome:"👋 Welcome",leave:"👋 Leave Message"};
const CATS={general:["maintenance","adminonly","prefixMode","cooldown"],security:["antilink","spammute","spamMuteGlobal"],message:["welcome","leave"]};
async function buildMain(){const s=await loadSettings();const text=panel("SETTINGS PANEL",["⚙️ GoatBot Control Panel","",`🚧 Maintenance: ${s.maintenance?"🟢 ON":"🔴 OFF"}`,`👑 Admin Only: ${s.adminonly?"🟢 ON":"🔴 OFF"}`,`🧩 Prefix Mode: ${s.prefixMode?"🟢 ON":"🔴 OFF"}`,`⏱️ Global Cooldown: ${s.cooldown?"🟢 ON":"🔴 OFF"}`,`🌍 SpamMute Global: ${s.spamMuteGlobal?"🟢 ON":"🔴 OFF"}`]);const keyboard=[[{text:"⚙️ General Settings",callback_data:"setting_general"}],[{text:"🛡️ Security Settings",callback_data:"setting_security"}],[{text:"💬 Message Settings",callback_data:"setting_message"}],[{text:"🛠️ Command Role Manager",callback_data:"setting_roles"}],[{text:"🔄 Config Reload",callback_data:"setting_configreload"},{text:"♻️ Restart",callback_data:"setting_restart"}],[{text:"🔄 Refresh",callback_data:"setting_main"}]];return{text,keyboard};}
async function buildCategory(type){const s=await loadSettings();const keys=CATS[type]||[];const text=panel(`${type.toUpperCase()} SETTINGS`,keys.map(k=>`${s[k]?"🟢":"🔴"} ${LABELS[k]}: ${s[k]?"ON":"OFF"}`));const keyboard=keys.map(k=>[{text:`${s[k]?"🟢 ON":"🔴 OFF"} — ${LABELS[k]}`,callback_data:`setting_toggle_${k}`}]);keyboard.push([{text:"⬅️ Back",callback_data:"setting_main"}]);return{text,keyboard};}
function getCommands(){const c=global.GoatBot?.commands;if(!c||typeof c.values!=="function")return[];const all=[...c.values()].filter(x=>x?.config?.name);return[...new Map(all.map(x=>[String(x.config.name),x])).values()].sort((a,b)=>String(a.config.name).localeCompare(String(b.config.name)));}
async function buildRoles(page=0){const commands=getCommands(),perPage=8,totalPages=Math.max(1,Math.ceil(commands.length/perPage));page=Math.max(0,Math.min(Number(page)||0,totalPages-1));const list=commands.slice(page*perPage,page*perPage+perPage);const keyboard=list.map(cmd=>{const r=Number(cmd.config.role||0),icon=r>=2?"🔒":r===1?"🛡️":"🌐";return[{text:`${icon} /${safeName(cmd.config.name,25)} [${r}]`,callback_data:`setting_edit_${cmd.config.name}`}];});const nav=[];if(page>0)nav.push({text:"⬅️ Prev",callback_data:`setting_rolepage_${page-1}`});nav.push({text:`📄 ${page+1}/${totalPages}`,callback_data:"setting_noop"});if(page<totalPages-1)nav.push({text:"Next ➡️",callback_data:`setting_rolepage_${page+1}`});keyboard.push(nav,[{text:"⬅️ Back",callback_data:"setting_main"}]);return{text:panel("ROLE MANAGER",[`📋 Total Commands: ${commands.length}`,"Select a command to change its role"]),keyboard};}
const showMain=async ctx=>{const p=await buildMain();return editPanel(ctx,p.text,p.keyboard)};const showCategory=async(ctx,t)=>{const p=await buildCategory(t);return editPanel(ctx,p.text,p.keyboard)};const showRoles=async(ctx,p)=>{const x=await buildRoles(p);return editPanel(ctx,x.text,x.keyboard)};

module.exports = {
  config: {
    name: "setting",
    aliases: ["settings", "panel", "control", "st", "config"],
    author: "SK-SIDDIK-KHAN",
    version: "6.4.2",
    description: "Global AntiLink 5s + SpamMute Fixed",
    category: "admin",
    usePrefix: true,
    role: 2,
    cooldown: 2
  },

onStart:async function({args,message}){const key=String(args?.[0]||"").toLowerCase(),value=String(args?.[1]||"").toLowerCase();if(key&&["on","off"].includes(value)){if(!Object.prototype.hasOwnProperty.call(DEFAULTS,key))return message.reply(`❌ Unknown setting: ${key}`);const s=await loadSettings();s[key]=value==="on";await saveSettings(s);return message.reply(`✅ ${LABELS[key]||key} → ${value.toUpperCase()}\n💾 Saved successfully.`);}const p=await buildMain();return sendNew(message,p.text,p.keyboard);},
onCallback:async function({event,ctx,userId}){const data=String(event?.data||event?.callbackData||"");const uid=event?.from?.id||event?.senderID||event?.userID||userId;try{await ctx.answerCbQuery();}catch{}if(!isBotAdmin(uid)){try{await ctx.answerCbQuery("❌ Only Bot Admin!",true);}catch{}return;}if(data==="setting_noop")return;if(data==="setting_main")return showMain(ctx);if(data==="setting_general")return showCategory(ctx,"general");if(data==="setting_security")return showCategory(ctx,"security");if(data==="setting_message")return showCategory(ctx,"message");if(data==="setting_roles")return showRoles(ctx,0);
if(data==="setting_configreload"){try{global.GoatBot.config=fs.readJsonSync(global.client.dirConfig);global.GoatBot.configCommands=fs.readJsonSync(global.client.dirConfigCommands);try{await ctx.answerCbQuery("✅ Config reloaded");}catch{}return showMain(ctx);}catch(e){return ctx.reply(`❌ Config reload failed: ${e.message}`);}}
if(data==="setting_restart"){try{const path=require("path");const restartFile=path.join(__dirname,"tmp","restart.json");const sent=await ctx.reply("🔄 Restarting bot...");fs.ensureDirSync(path.dirname(restartFile));fs.writeJsonSync(restartFile,{threadID:String(ctx.chatId||event?.message?.chat?.id||""),time:Date.now(),messageID:String(sent?.messageID||sent?.message_id||sent?.id||"")},{spaces:2});}catch{}setTimeout(()=>process.exit(2),500);return;}
if(data.startsWith("setting_rolepage_"))return showRoles(ctx,parseInt(data.slice(17),10)||0);
if(data.startsWith("setting_toggle_")){const key=data.slice(15);if(!Object.prototype.hasOwnProperty.call(DEFAULTS,key))return;const s=await loadSettings();s[key]=!s[key];await saveSettings(s);if(CATS.general.includes(key))return showCategory(ctx,"general");if(CATS.security.includes(key))return showCategory(ctx,"security");return showCategory(ctx,"message");}
if(data.startsWith("setting_edit_")){const name=data.slice(13);return editPanel(ctx,panel("EDIT COMMAND ROLE",[`/${safeName(name)}`,"Select required role:"]),[[{text:"🌐 Everyone [0]",callback_data:`setting_save_${name}_0`},{text:"🛡️ G-Admin [1]",callback_data:`setting_save_${name}_1`},{text:"🔒 Bot Admin [2]",callback_data:`setting_save_${name}_2`}],[{text:"⬅️ Back",callback_data:"setting_roles"}]]);}
if(data.startsWith("setting_save_")){const m=data.match(/^setting_save_(.+)_(0|1|2)$/);if(!m)return;const[,name,role]=m,cmd=global.GoatBot?.commands?.get(name);if(cmd?.config)cmd.config.role=Number(role);try{await ctx.answerCbQuery(`✅ /${name} → Role ${role}`);}catch{}return showRoles(ctx,0);}
}};
