const fs = require("fs");
const path = require("path");

if (!global.quizActive) global.quizActive = new Map();
if (!global.quizTimeout) global.quizTimeout = new Map();
if (!global.onReply) global.onReply = new Map();
if (!global.onCallback) global.onCallback = new Map();

const JSON_PATH = path.join(__dirname, "S1DD1K", "quiz.json");

function getQuiz() {
    if (!fs.existsSync(JSON_PATH)) return null;

    const db = JSON.parse(fs.readFileSync(JSON_PATH, "utf-8"));
    if (!Array.isArray(db) || !db.length) return null;

    const q = db[Math.floor(Math.random() * db.length)];
    let options = [...q.options].sort(() => Math.random() - 0.5);

    let correctLetter = "";
    const letters = ["A", "B", "C", "D"];

    options.forEach((opt, i) => {
        if (opt === q.correct) correctLetter = letters[i];
    });

    return { q, options, correctLetter };
}

module.exports = {
    config: {
        name: "quiz",
        aliases: ["q"],
        version: "8.1-FIXED",
        author: "SK-SIDDIK-KHAN",
        role: 0,
        category: "Games",
        prefix: true,
        cooldown: 3
    },

    onStart: async function ({ api, chatId, event }) {
        const threadID = chatId;
        const senderID = event.from?.id;

        if (global.quizTimeout.has(threadID)) {
            clearTimeout(global.quizTimeout.get(threadID));
            global.quizTimeout.delete(threadID);
        }

        const data = getQuiz();

        if (!data) {
            return api.sendMessage(
                `❌ quiz.json not found! Path: S1DD1K/quiz.json`,
                chatId
            );
        }

        const { q, options, correctLetter } = data;

        const text =
`╭─❖─〔 🧠 S1DD1K QUIZ 〕─❖─╮
│ ❓ ${q.question}
│
├─ OPTIONS ─┤
│ 🇦 ${options[0]}
│ 🇧 ${options[1]}
│ 🇨 ${options[2]}
│ 🇩 ${options[3]}
│
│ ⏳ 120s | Press Button
╰─❖─〔 S1DD1K BOT 〕─❖─╯`;

        const kb = {
            inline_keyboard: [
                [
                    {
                        text: `🇦 ${String(options[0]).slice(0, 18)}`,
                        callback_data: `quiz_A`
                    },
                    {
                        text: `🇧 ${String(options[1]).slice(0, 18)}`,
                        callback_data: `quiz_B`
                    }
                ],
                [
                    {
                        text: `🇨 ${String(options[2]).slice(0, 18)}`,
                        callback_data: `quiz_C`
                    },
                    {
                        text: `🇩 ${String(options[3]).slice(0, 18)}`,
                        callback_data: `quiz_D`
                    }
                ],
                [
                    {
                        text: `⏭️ Skip`,
                        callback_data: `quiz_skip`
                    },
                    {
                        text: `📊 Help`,
                        callback_data: `quiz_help`
                    }
                ]
            ]
        };

        const sent = await api.sendMessage(
            text,
            chatId,
            { reply_markup: kb }
        );

        global.quizActive.set(threadID, {
            correctLetter,
            correctAnswer: q.correct,
            question: q.question,
            options,
            msgId: sent.messageID || sent.message_id
        });

        const savedMsgId = sent.messageID || sent.message_id;

        global.onReply.set(savedMsgId, {
            commandName: "quiz",
            author: senderID
        });

        global.onCallback.set(savedMsgId, {
            commandName: "quiz"
        });

        const timer = setTimeout(async () => {
            if (global.quizActive.has(threadID)) {
                const s = global.quizActive.get(threadID);

                const timeoutText =
`╭─❖─〔 ⏰ TIME OUT! 〕─❖─╮
│ ❌ কেউ উত্তর দিতে পারেনি!
│ ❓ ${s.question}
│ 🎯 সঠিক: ${s.correctAnswer} (${s.correctLetter})
╰─❖─〔 S1DD1K BOT 〕─❖─╯`;

                try {
                    await api.editMessageText(
                        timeoutText,
                        {
                            chat_id: threadID,
                            message_id: s.msgId,
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: `🎮 New Quiz`,
                                            callback_data: `quiz_next`
                                        }
                                    ]
                                ]
                            }
                        }
                    );
                } catch {
                    await api.sendMessage(
                        timeoutText,
                        threadID
                    );
                }

                global.quizActive.delete(threadID);
                global.quizTimeout.delete(threadID);
            }
        }, 120000);

        global.quizTimeout.set(threadID, timer);
    },

    onReply: async function ({ event, api, chatId }) {
        const choice = String(event.text || "")
            .trim()
            .toUpperCase();

        if (!["A", "B", "C", "D"].includes(choice)) return;

        return handle(
            api,
            chatId,
            event.from,
            choice
        );
    },

    onCallback: async function ({ event, api, ctx }) {
        const data = event.data;
        const chatId = event.message.chat.id;
        const msgId = event.message.message_id;

        try {
            await ctx.answerCbQuery();
        } catch {}

        if (data === "quiz_help") {
            try {
                await ctx.answerCbQuery(
                    `Button চাপুন! 120s সময়! ভুল দিলে উত্তর দেখাবে না!`,
                    { show_alert: true }
                );
            } catch {}

            return;
        }

        if (data === "quiz_skip") {
            if (global.quizTimeout.has(chatId)) {
                clearTimeout(global.quizTimeout.get(chatId));
                global.quizTimeout.delete(chatId);
            }

            const s = global.quizActive.get(chatId);
            if (!s) return;

            const skipText =
`╭─❖─〔 ⏭️ SKIPPED 〕─❖─╮
│ ❓ ${s.question}
│ 🎯 উত্তর ছিল: ${s.correctAnswer} (${s.correctLetter})
╰─❖─〔 S1DD1K BOT 〕─❖─╯`;

            try {
                await ctx.editMessageText(
                    skipText,
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: `🎮 New Quiz`,
                                        callback_data: `quiz_next`
                                    }
                                ]
                            ]
                        }
                    }
                );
            } catch {}

            global.quizActive.delete(chatId);
            return;
        }

        if (data === "quiz_next") {
            if (global.quizTimeout.has(chatId)) {
                clearTimeout(global.quizTimeout.get(chatId));
                global.quizTimeout.delete(chatId);
            }

            const d = getQuiz();
            if (!d) return;

            const { q, options, correctLetter } = d;

            const text =
`╭─❖─〔 🧠 S1DD1K QUIZ 〕─❖─╮
│ ❓ ${q.question}
│ 🇦 ${options[0]}
│ 🇧 ${options[1]}
│ 🇨 ${options[2]}
│ 🇩 ${options[3]}
╰─❖─〔 120s 〕─❖─╯`;

            const kb = {
                inline_keyboard: [
                    [
                        {
                            text: `🇦 ${String(options[0]).slice(0, 18)}`,
                            callback_data: `quiz_A`
                        },
                        {
                            text: `🇧 ${String(options[1]).slice(0, 18)}`,
                            callback_data: `quiz_B`
                        }
                    ],
                    [
                        {
                            text: `🇨 ${String(options[2]).slice(0, 18)}`,
                            callback_data: `quiz_C`
                        },
                        {
                            text: `🇩 ${String(options[3]).slice(0, 18)}`,
                            callback_data: `quiz_D`
                        }
                    ],
                    [
                        {
                            text: `⏭️ Skip`,
                            callback_data: `quiz_skip`
                        }
                    ]
                ]
            };

            global.quizActive.set(chatId, {
                correctLetter,
                correctAnswer: q.correct,
                question: q.question,
                options,
                msgId
            });

            global.onCallback.set(msgId, {
                commandName: "quiz"
            });

            try {
                await ctx.editMessageText(
                    text,
                    { reply_markup: kb }
                );
            } catch {}

            const timer = setTimeout(async () => {
                if (global.quizActive.has(chatId)) {
                    const s = global.quizActive.get(chatId);

                    const t =
`╭─❖─〔 ⏰ TIME OUT! 〕─❖─╮
│ ❓ ${s.question}
│ 🎯 সঠিক: ${s.correctAnswer} (${s.correctLetter})
╰─❖─〔 S1DD1K BOT 〕─❖─╯`;

                    try {
                        await api.editMessageText(
                            t,
                            {
                                chat_id: chatId,
                                message_id: msgId,
                                reply_markup: {
                                    inline_keyboard: [
                                        [
                                            {
                                                text: `🎮 New Quiz`,
                                                callback_data: `quiz_next`
                                            }
                                        ]
                                    ]
                                }
                            }
                        );
                    } catch {}

                    global.quizActive.delete(chatId);
                    global.quizTimeout.delete(chatId);
                }
            }, 120000);

            global.quizTimeout.set(chatId, timer);
            return;
        }

        const choice = data.replace("quiz_", "");

        return handle(
            api,
            chatId,
            event.from,
            choice,
            ctx
        );
    }
};

async function handle(api, chatId, user, choice, ctx = null) {
    const s = global.quizActive.get(chatId);

    if (!s) {
        if (ctx) {
            try {
                await ctx.answerCbQuery(
                    "❌ Expired! /quiz",
                    { show_alert: true }
                );
            } catch {}
        }
        return;
    }

    const name = user?.first_name || "User";

    if (choice === s.correctLetter) {
        if (global.quizTimeout.has(chatId)) {
            clearTimeout(global.quizTimeout.get(chatId));
            global.quizTimeout.delete(chatId);
        }

        global.quizActive.delete(chatId);

        const win =
`╭─❖─〔 🎉 WINNER! 〕─❖─╮
│ 👑 ${name}
│ ✅ ${s.correctAnswer} (${s.correctLetter})
│ ❓ ${s.question}
│ 🎯 তোমার উত্তর: ${choice} 100% সঠিক
╰─❖─〔 S1DD1K BOT 〕─❖─╯`;

        const kb = {
            inline_keyboard: [
                [
                    {
                        text: `🎮 Play Again`,
                        callback_data: `quiz_next`
                    }
                ]
            ]
        };

        if (ctx) {
            try {
                await ctx.editMessageText(
                    win,
                    { reply_markup: kb }
                );
            } catch {
                await api.sendMessage(
                    win,
                    chatId,
                    { reply_markup: kb }
                );
            }
        } else {
            await api.sendMessage(
                win,
                chatId,
                { reply_markup: kb }
            );
        }

    } else {
        const wrong =
`╭─❖─〔 ❌ WRONG! 〕─❖─╮
│ 👤 ${name}
│ ❌ তোমার উত্তর: ${choice} - ভুল!
│ 💡 আবার চেষ্টা করো!
│ ❓ ${s.question}
╰─❖─〔 TRY AGAIN 〕─❖─╯`;

        const kb = {
            inline_keyboard: [
                [
                    {
                        text: `🇦 ${String(s.options[0]).slice(0, 15)}`,
                        callback_data: `quiz_A`
                    },
                    {
                        text: `🇧 ${String(s.options[1]).slice(0, 15)}`,
                        callback_data: `quiz_B`
                    }
                ],
                [
                    {
                        text: `🇨 ${String(s.options[2]).slice(0, 15)}`,
                        callback_data: `quiz_C`
                    },
                    {
                        text: `🇩 ${String(s.options[3]).slice(0, 15)}`,
                        callback_data: `quiz_D`
                    }
                ],
                [
                    {
                        text: `⏭️ Skip`,
                        callback_data: `quiz_skip`
                    }
                ]
            ]
        };

        if (ctx) {
            try {
                await ctx.answerCbQuery(
                    `❌ ভুল! আবার চেষ্টা করো!`,
                    { show_alert: false }
                );
            } catch {}

            try {
                await ctx.editMessageText(
                    wrong,
                    { reply_markup: kb }
                );
            } catch {}

            setTimeout(async () => {
                const still = global.quizActive.get(chatId);

                if (still) {
                    const back =
`╭─❖─〔 🧠 S1DD1K QUIZ 〕─❖─╮
│ ❓ ${still.question}
│ 🇦 ${still.options[0]}
│ 🇧 ${still.options[1]}
│ 🇨 ${still.options[2]}
│ 🇩 ${still.options[3]}
│ 💬 Last: ${name} Wrong (${choice})
╰─❖─〔 GUESS AGAIN 〕─❖─╯`;

                    const kb2 = {
                        inline_keyboard: [
                            [
                                {
                                    text: `🇦`,
                                    callback_data: `quiz_A`
                                },
                                {
                                    text: `🇧`,
                                    callback_data: `quiz_B`
                                },
                                {
                                    text: `🇨`,
                                    callback_data: `quiz_C`
                                },
                                {
                                    text: `🇩`,
                                    callback_data: `quiz_D`
                                }
                            ]
                        ]
                    };

                    try {
                        await api.editMessageText(
                            back,
                            {
                                chat_id: chatId,
                                message_id: still.msgId,
                                reply_markup: kb2
                            }
                        );
                    } catch {}
                }
            }, 2000);

        } else {
            await api.sendMessage(
                `❌ ${name} ভুল! আবার চেষ্টা করো!`,
                chatId
            );
        }
    }
}