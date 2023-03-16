import TelegramBot from "node-telegram-bot-api";
import { menu, nav } from "./libraries/keyboards";
import { config } from "./Config/config";
import { Token } from "./libraries/tokens";
import { Gas } from "./libraries/gasFee";
import { Account } from "./libraries/accounts";
import { Transaction } from "./libraries/transactions";

const bot = new TelegramBot(config.token, { polling: true });
let token_limit = 4;
let acct_pages: any = {};
let acct_tokens: any = {};
let acct_addr: any = {};
let txn_pages: any = {};
let txn_tokens: any = {};
let txn_hash: any = {};

bot.onText(/\/start/, (msg) => {
    let user = msg.from?.username;
    //@ts-ignore
    delete acct_addr[user];
    //@ts-ignore
    delete acct_tokens[user];
    //@ts-ignore
    delete acct_pages[user];
    //@ts-ignore
    delete txn_hash[user];
    //@ts-ignore
    delete txn_tokens[user];
    //@ts-ignore
    delete txn_pages[user];

    bot.sendMessage(msg.chat.id, "Welcome to Fantom Telegram Explorer", {
        reply_markup: {
            keyboard: menu,
            force_reply: true,
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    });
});

bot.onText(/\/account (.+)/, async (msg, match) => {
    let acct_address = match?.[1];
    let { message_id } = await bot.sendMessage(msg.chat.id, "⌛");

    Promise.all([
        Account.getNativeBalance(String(acct_address)),
        Account.getTokenBalances(String(acct_address)),
    ]).then(async (account_info) => {
        let ftm_bal = account_info[0];
        let token_bal = account_info[1];
        let user = msg.from?.username;
        console.log(user);
        //@ts-ignore
        delete txn_hash[user];
        //@ts-ignore
        delete txn_tokens[user];
        //@ts-ignore
        delete txn_pages[user];
        //@ts-ignore
        acct_pages[user] = 1;
        //@ts-ignore
        acct_addr[user] = acct_address;
        //@ts-ignore
        acct_tokens[user] = token_bal;
        //@ts-ignore
        let token_display =
            //@ts-ignore
            token_bal?.length > 1
                ? "<b>🪙Token Balance:</b> ..."
                : `<b>📍Token Address</b>: ${
                      token_bal?.[0].token_address
                  }\n\n<b>🔣Symbol</b>: ${
                      token_bal?.[0].symbol
                  }\n\n<b>💵Balance</b>: ${
                      Number(token_bal?.[0].balance) /
                      Math.pow(10, Number(token_bal?.[0].decimals))
                  }`;
        let account_message =
            ftm_bal != undefined && token_bal !== undefined
                ? `<b>Wallet Address</b>: ${msg.text}\n\n🪙<b>Ftm Balance</b>: ${ftm_bal}\n\n${token_display}`
                : "An Error Occurred😔";
        bot.deleteMessage(msg.chat.id, message_id).then(() => {
            //@ts-ignore
            bot.sendMessage(
                msg.chat.id,
                account_message,
                //@ts-ignore
                token_bal?.length > 1
                    ? {
                          reply_markup: {
                              inline_keyboard: [
                                  [
                                      {
                                          text: "View Tokens",
                                          callback_data: "account_token_bal",
                                      },
                                  ],
                                  [
                                      {
                                          text: "Check Explorer",
                                          url: `https://ftmscan.com/address/${msg.text}`,
                                      },
                                  ],
                              ],
                          },
                          parse_mode: "HTML",
                      }
                    : { parse_mode: "HTML" }
            );
        });
    });
});

bot.onText(/^🏦Account$/, async (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, "Input Wallet Address?", {
        reply_markup: { force_reply: true },
    }).then((resp) => {
        bot.onReplyToMessage(resp.chat.id, resp.message_id, async (msg) => {
            //@ts-ignore
            let user = msg.from?.username;
            console.log(user);
            //@ts-ignore
            delete txn_hash[user];
            //@ts-ignore
            delete txn_tokens[user];
            //@ts-ignore
            delete txn_pages[user];
            //@ts-ignore
            acct_pages[user] = 1;
            //@ts-ignore
            acct_addr[user] = String(msg.text);
            let { message_id } = await bot.sendMessage(msg.chat.id, "⌛");
            //@ts-ignore
            Promise.all([
                Account.getNativeBalance(String(msg.text)),
                Account.getTokenBalances(String(msg.text)),
            ]).then(async (account_info) => {
                let ftm_bal = account_info[0];
                let token_bal = account_info[1];
                //@ts-ignore
                acct_tokens[user] = token_bal;
                //@ts-ignore
                let token_display =
                    //@ts-ignore
                    token_bal?.length > 1
                        ? "<b>🪙Token Balance:</b>  ..."
                        : `<b>📍Token Address</b>: ${
                              token_bal?.[0].token_address
                          }\n\n<b>🔣Symbol</b>: ${
                              token_bal?.[0].symbol
                          }\n\n<b>💵Balance</b>: ${
                              Number(token_bal?.[0].balance) /
                              Math.pow(10, Number(token_bal?.[0].decimals))
                          }`;
                let account_message =
                    ftm_bal != undefined && token_bal !== undefined
                        ? `<b>Wallet Address</b>: ${msg.text}\n\n🪙<b>Ftm Balance</b>: ${ftm_bal}\n\n${token_display}`
                        : "An Error Occurred😔";
                bot.deleteMessage(msg.chat.id, message_id).then(() => {
                    //@ts-ignore
                    bot.sendMessage(
                        msg.chat.id,
                        account_message,
                        //@ts-ignore
                        token_bal?.length > 1
                            ? {
                                  reply_markup: {
                                      inline_keyboard: [
                                          [
                                              {
                                                  text: "View Tokens",
                                                  callback_data:
                                                      "account_token_bal",
                                              },
                                          ],
                                          [
                                              {
                                                  text: "Check Explorer",
                                                  url: `https://ftmscan.com/address/${msg.text}`,
                                              },
                                          ],
                                      ],
                                  },
                                  parse_mode: "HTML",
                              }
                            : { parse_mode: "HTML" }
                    );
                });
            });
        });
    });
});

bot.onText(/^🪙Token$/, (msg) => {
    const chatId = msg.chat.id;

    let user = msg.from?.username;
    //@ts-ignore
    delete acct_addr[user];
    //@ts-ignore
    delete acct_tokens[user];
    //@ts-ignore
    delete acct_pages[user];
    //@ts-ignore
    delete txn_hash[user];
    //@ts-ignore
    delete txn_tokens[user];
    //@ts-ignore
    delete txn_pages[user];

    bot.sendMessage(chatId, "Input Token Address?", {
        reply_markup: { force_reply: true },
    }).then((resp) => {
        bot.onReplyToMessage(resp.chat.id, resp.message_id, async (msg) => {
            let { message_id } = await bot.sendMessage(msg.chat.id, "⌛");
            let info = await Token.getTokenInfo(String(msg.text), "mainnet");
            bot.deleteMessage(msg.chat.id, message_id).then(() => {
                let token_info =
                    info != undefined
                        ? `<b>💳Name</b>: ${info.name} \n\n<b>🔣Symbol</b>: ${info.symbol} \n\n<b>➗Decimals</b>: ${info.decimals} \n\n<b>🏦Total Supply</b>: ${info.totalSupply}`
                        : "An Error Occurred😔";
                bot.sendMessage(msg.chat.id, token_info, {
                    reply_markup: { keyboard: nav.home, resize_keyboard: true },
                    parse_mode: "HTML",
                });
            });
        });
    });
});

bot.onText(/\/token (.+)/, async (msg, match) => {
    let user = msg.from?.username;
    //@ts-ignore
    delete acct_addr[user];
    //@ts-ignore
    delete acct_tokens[user];
    //@ts-ignore
    delete acct_pages[user];
    //@ts-ignore
    delete txn_hash[user];
    //@ts-ignore
    delete txn_tokens[user];
    //@ts-ignore
    delete txn_pages[user];

    let t_address = match?.[1];
    let { message_id } = await bot.sendMessage(msg.chat.id, "⌛");
    Token.getTokenInfo(String(t_address), "mainnet").then((info) => {
        bot.deleteMessage(msg.chat.id, message_id).then(() => {
            let token_info =
                info != undefined
                    ? `<b>💳Name</b>: ${info.name} \n\n<b>🔣Symbol</b>: ${info.symbol} \n\n<b>➗Decimals</b>: ${info.decimals} \n\n<b>🏦Total Supply</b>: ${info.totalSupply}`
                    : "An Error Occurred😔";
            bot.sendMessage(msg.chat.id, token_info, {
                reply_markup: { keyboard: nav.home, resize_keyboard: true },
                parse_mode: "HTML",
            });
        });
    });
});

bot.onText(/^⛽Gas$/, async (msg) => {
    let user = msg.from?.username;
    //@ts-ignore
    delete acct_addr[user];
    //@ts-ignore
    delete acct_tokens[user];
    //@ts-ignore
    delete acct_pages[user];
    //@ts-ignore
    delete txn_hash[user];
    //@ts-ignore
    delete txn_tokens[user];
    //@ts-ignore
    delete txn_pages[user];

    let { message_id } = await bot.sendMessage(msg.chat.id, "⌛");
    let gasinfo = await Gas.fee();
    bot.deleteMessage(msg.chat.id, message_id);
    let standard = `🚗<b>Standard</b>:\n        Gwei: ${gasinfo?.standard.gwei} \n        fee: $${gasinfo?.standard.usd}\n`;
    let slow = `🐢<b>Slow</b>:\n        Gwei: ${gasinfo?.slow.gwei}\n        fee: $${gasinfo?.slow.usd}\n`;
    let fast = `🔥<b>Fast</b>:\n        Gwei: ${gasinfo?.fast.gwei} \n        fee: $${gasinfo?.fast.usd}\n`;
    let instant = `⚡<b>Instant</b>:\n        Gwei: ${gasinfo?.instant.gwei}\n        fee: $${gasinfo?.instant.usd}`;
    let gas =
        gasinfo != undefined
            ? `${slow} \n${standard} \n${fast} \n${instant}`
            : "An Error Occurred😔";

    bot.deleteMessage(msg.chat.id, message_id).then(() => {
        bot.sendMessage(msg.chat.id, gas, {
            reply_markup: { keyboard: nav.home, resize_keyboard: true },
            parse_mode: "HTML",
        });
    });
});

bot.onText(/\/gas/, async (msg) => {
    let user = msg.from?.username;
    //@ts-ignore
    delete acct_addr[user];
    //@ts-ignore
    delete acct_tokens[user];
    //@ts-ignore
    delete acct_pages[user];
    //@ts-ignore
    delete txn_hash[user];
    //@ts-ignore
    delete txn_tokens[user];
    //@ts-ignore
    delete txn_pages[user];

    let { message_id } = await bot.sendMessage(msg.chat.id, "⌛");
    let gasinfo = await Gas.fee();
    let standard = `🚗<b>Standard</b>:\n        Gwei: ${gasinfo?.standard.gwei} \n        fee: $${gasinfo?.standard.usd}\n`;
    let slow = `🐢<b>Slow</b>:\n        Gwei: ${gasinfo?.slow.gwei}\n        fee: $${gasinfo?.slow.usd}\n`;
    let fast = `🔥<b>Fast</b>:\n        Gwei: ${gasinfo?.fast.gwei} \n        fee: $${gasinfo?.fast.usd}\n`;
    let instant = `⚡<b>Instant</b>:\n        Gwei: ${gasinfo?.instant.gwei}\n        fee: $${gasinfo?.instant.usd}`;
    let gas =
        gasinfo != undefined
            ? `${slow} \n${standard} \n${fast} \n${instant}`
            : "An Error Occurred😔";

    bot.deleteMessage(msg.chat.id, message_id).then(() => {
        bot.sendMessage(msg.chat.id, gas, {
            reply_markup: { keyboard: nav.home, resize_keyboard: true },
            parse_mode: "HTML",
        });
    });
});

bot.onText(/\/help/, (msg) => {
    let user = msg.from?.username;
    //@ts-ignore
    delete acct_addr[user];
    //@ts-ignore
    delete acct_tokens[user];
    //@ts-ignore
    delete acct_pages[user];
    //@ts-ignore
    delete txn_hash[user];
    //@ts-ignore
    delete txn_tokens[user];
    //@ts-ignore
    delete txn_pages[user];

    let start = `use the /start command to start the bot`;
    let account =
        "Get Account information using the default button or /account <wallet address>";
    let transaction =
        "Get Transaction information using the default button or /transaction <transaction hash>";
    let token = `Get Token information using the default button or /token <token address>`;
    let gas = `Get gas information using the default button or /gas`;
    let help = `Hi, this is fantom telegram explorer\nA simple explorer that enables you to query information from fantom blockchain.\n\n${start}\n\n${account}\n\n${transaction}\n\n${token}\n\n${gas}`;

    bot.sendMessage(msg.chat.id, help, {
        reply_markup: {
            keyboard: nav.home,
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    });
});

bot.onText(/^🆘Help$/, (msg) => {
    let user = msg.from?.username;
    //@ts-ignore
    delete acct_addr[user];
    //@ts-ignore
    delete acct_tokens[user];
    //@ts-ignore
    delete acct_pages[user];
    //@ts-ignore
    delete txn_hash[user];
    //@ts-ignore
    delete txn_tokens[user];
    //@ts-ignore
    delete txn_pages[user];
    let start = `use the /start command to start the bot`;
    let account =
        "Get Account information using the default button or /account <wallet address>";
    let transaction =
        "Get Transaction information using the default button or /transaction <transaction hash>";
    let token = `Get Token information using the default button or /token <token address>`;
    let gas = `Get gas information using the default button or /gas`;
    let help = `Hi, this is fantom telegram explorer\nA simple explorer that enables you to query information from fantom blockchain.\n\n${start}\n\n${account}\n\n${transaction}\n\n${token}\n\n${gas}`;

    bot.sendMessage(msg.chat.id, help, {
        reply_markup: {
            keyboard: nav.home,
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    });
});

bot.onText(/^🏠Home$/, (msg) => {
    let user = msg.from?.username;
    //@ts-ignore
    delete acct_addr[user];
    //@ts-ignore
    delete acct_tokens[user];
    //@ts-ignore
    delete acct_pages[user];
    //@ts-ignore
    delete txn_hash[user];
    //@ts-ignore
    delete txn_tokens[user];
    //@ts-ignore
    delete txn_pages[user];

    bot.sendMessage(msg.chat.id, "What action do you want to perform?", {
        reply_markup: { keyboard: menu, resize_keyboard: true },
    });
});

bot.onText(/^🎫Transaction$/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Input Transaction Hash?", {
        reply_markup: { force_reply: true },
    }).then((resp) => {
        bot.onReplyToMessage(resp.chat.id, resp.message_id, async (msg) => {
            //@ts-ignore
            let user = msg.from?.username;
            console.log(user);
            //@ts-ignore
            delete acct_addr[user];
            //@ts-ignore
            delete acct_tokens[user];
            //@ts-ignore
            delete acct_pages[user];
            //@ts-ignore
            txn_pages[user] = 1;
            //@ts-ignore
            txn_hash[user] = String(msg.text);
            let { message_id } = await bot.sendMessage(msg.chat.id, "⌛");
            Transaction.getTxnInfo(String(msg.text), "mainnet").then(
                async (txn) => {
                    //@ts-ignore
                    txn_tokens[user] = txn?.tokenTransfers;
                    //@ts-ignore
                    let token_txn =
                        //@ts-ignore
                        txn?.tokenTransfers.length > 1
                            ? "<b>🪙Token Transfers:</b> ..."
                            : //@ts-ignore
                              `<b>🪙Token Transfer</b>: \n          <b>🔣Symbol</b>: ${txn?.tokenTransfers.name}\n        <b>☝️From</b>: ${txn?.tokenTransfers.from}\n        <b>👇To</b>: ${txn?.tokenTransfers.to}\n         <b>💵Amount</b>: ${txn?.tokenTransfers.amount}`;

                    let txn_message =
                        txn != undefined
                            ? `<b>🔄Status:</b>${txn.status}\n\n<b>☝️Sender:</b> ${txn.sender}\n\n<b>👇Reciever:</b> ${txn.reciever}\n\n<b>💵FTM Amount:</b> ${txn.amount}\n\n<b>⌚Date:</b> ${txn.time}\n\n<b>👛Fee</b>: ${txn.fee}\n\n${token_txn}`
                            : "An Error Occurred😔";
                    bot.deleteMessage(msg.chat.id, message_id).then(() => {
                        //@ts-ignore
                        bot.sendMessage(
                            msg.chat.id,
                            txn_message,
                            //@ts-ignore
                            txn?.tokenTransfers.length > 1
                                ? {
                                      reply_markup: {
                                          inline_keyboard: [
                                              [
                                                  {
                                                      text: "View Token Transfers",
                                                      callback_data:
                                                          "txn_token_transfers",
                                                  },
                                              ],
                                              [
                                                  {
                                                      text: "Check Explorer",
                                                      url: `https://ftmscan.com/tx/${msg.text}`,
                                                  },
                                              ],
                                          ],
                                      },
                                      parse_mode: "HTML",
                                  }
                                : { parse_mode: "HTML" }
                        );
                    });
                }
            );
        });
    });
});

bot.onText(/\/transaction (.+)/, async (msg, match) => {
    let hash = match?.[1];
    let { message_id } = await bot.sendMessage(msg.chat.id, "⌛");
    //@ts-ignore
    let user = msg.from?.username;
    console.log(user);
    //@ts-ignore
    delete acct_addr[user];
    //@ts-ignore
    delete acct_tokens[user];
    //@ts-ignore
    delete acct_pages[user];
    //@ts-ignore
    Transaction.getTxnInfo(String(hash), "mainnet").then(async (txn) => {
        console.log(txn);
        //@ts-ignore
        txn_tokens[user] = txn?.tokenTransfers;
        //@ts-ignore
        txn_pages[user] = 1;
        console.log(hash);
        //@ts-ignore
        txn_hash[user] = hash;
        //@ts-ignore
        let token_txn =
            //@ts-ignore
            txn?.tokenTransfers.length > 1
                ? "<b>🪙Token Transfers:</b> ..."
                : //@ts-ignore
                  `<b>🪙Token Transfer</b>: \n          <b>🔣Symbol</b>: ${txn?.tokenTransfers.name}\n        <b>☝️From</b>: ${txn?.tokenTransfers.from}\n        <b>👇To</b>: ${txn?.tokenTransfers.to}\n         <b>💵Amount</b>: ${txn?.tokenTransfers.amount}`;

        let txn_message =
            txn != undefined
                ? `<b>🔄Status:</b>${txn.status}\n\n<b>☝️Sender:</b> ${txn.sender}\n\n<b>👇Reciever:</b> ${txn.reciever}\n\n<b>💵FTM Amount:</b> ${txn.amount}\n\n<b>⌚Date:</b> ${txn.time}\n\n<b>👛Fee</b>: ${txn.fee}\n\n${token_txn}`
                : "An Error Occurred😔";
        bot.deleteMessage(msg.chat.id, message_id).then(() => {
            //@ts-ignore
            bot.sendMessage(
                msg.chat.id,
                txn_message,
                //@ts-ignore
                txn?.tokenTransfers.length > 1
                    ? {
                          reply_markup: {
                              inline_keyboard: [
                                  [
                                      {
                                          text: "View Token Transfers",
                                          callback_data: "txn_token_transfers",
                                      },
                                  ],
                                  [
                                      {
                                          text: "Check Explorer",
                                          url: `https://ftmscan.com/tx/${msg.text}`,
                                      },
                                  ],
                              ],
                          },
                          parse_mode: "HTML",
                      }
                    : { parse_mode: "HTML" }
            );
        });
    });
});

bot.on("callback_query", (calldata) => {
    if (calldata.data == "acct_next") {
        //@ts-ignore
        let acct_address = acct_addr[String(calldata.from.username)];
        console.log(acct_address);
        console.log(
            `this is the acct_default next ${
                acct_pages[String(calldata.from.username)]
            }`
        );
        //@ts-ignore
        acct_pages[String(calldata.from.username)] += 1;
        let tokens: [] = acct_tokens[String(calldata.from.username)];
        if (acct_tokens != undefined) {
            let acct_token_message: any[] = [];
            //@ts-ignore
            let acct_page_limit = Math.ceil(tokens?.length / token_limit);
            let acct_start_index =
                (acct_pages[String(calldata.from.username)] - 1) * token_limit;
            let acct_end_index =
                acct_pages[String(calldata.from.username)] * token_limit;
            let acct_token_list = tokens?.slice(
                acct_start_index,
                acct_end_index
            );
            console.log(acct_token_list);

            //@ts-ignore
            function token_getter(token) {
                let formatted = `<b>📍Token Address</b>: ${
                    token?.token_address
                }\n\n<b>🔣Symbol</b>: ${token?.symbol}\n\n<b>💵Balance</b>: ${
                    Number(token?.balance) / Math.pow(10, token?.decimals)
                }\n\n\n\n`;
                acct_token_message.push(formatted);
            }

            function tokenMessage() {
                //@ts-ignore
                for (const token of acct_token_list) {
                    token_getter(token);
                }
            }
            tokenMessage();
            //@ts-ignore
            //@ts-ignore
            bot.deleteMessage(
                //@ts-ignore
                calldata.message?.chat.id,
                calldata.message?.message_id
            ).then((e) => {
                console.log(e);
                //@ts-ignore
                bot.sendMessage(
                    //@ts-ignore
                    calldata.message?.chat.id,
                    "".concat(...acct_token_message),
                    {
                        reply_markup:
                            tokens.length > 4
                                ? {
                                      inline_keyboard: [
                                          //@ts-ignore
                                          acct_pages[calldata.from.username] > 1
                                              ? nav.acct_prev
                                              : [],
                                          //@ts-ignore
                                          acct_pages[calldata.from.username] <
                                          acct_page_limit
                                              ? nav.acct_next
                                              : [],
                                      ],
                                      resize_keyboard: true,
                                  }
                                : {},
                        parse_mode: "HTML",
                    }
                );
            });
        }
    }
    if (calldata.data == "acct_prev") {
        let acct_address = acct_addr[String(calldata.from.username)];
        let tokens: [] = acct_tokens[String(calldata.from.username)];
        //@ts-ignore
        console.log(acct_address);
        console.log(
            `this is the acct_default prev ${
                acct_pages[String(calldata.from.username)]
            }`
        );
        //@ts-ignore
        acct_pages[String(calldata.from.username)] -= 1;
        if (acct_tokens != undefined) {
            let acct_token_message: any[] = [];
            //@ts-ignore
            let acct_page_limit = Math.ceil(tokens?.length / token_limit);
            let acct_start_index =
                (acct_pages[String(calldata.from.username)] - 1) * token_limit;
            let acct_end_index =
                acct_pages[String(calldata.from.username)] * token_limit;
            let acct_token_list = tokens?.slice(
                acct_start_index,
                acct_end_index
            );
            console.log(acct_token_list);

            //@ts-ignore
            function token_getter(token) {
                let formatted = `<b>📍Token Address</b>: ${
                    token?.token_address
                }\n\n<b>🔣Symbol</b>: ${token?.symbol}\n\n<b>💵Balance</b>: ${
                    Number(token?.balance) / Math.pow(10, token?.decimals)
                }\n\n\n\n`;
                acct_token_message.push(formatted);
            }

            function tokenMessage() {
                //@ts-ignore
                for (const token of acct_token_list) {
                    token_getter(token);
                }
            }
            tokenMessage();
            //@ts-ignore
            //@ts-ignore
            bot.deleteMessage(
                //@ts-ignore
                calldata.message?.chat.id,
                calldata.message?.message_id
            ).then((e) => {
                console.log(e);
                //@ts-ignore
                bot.sendMessage(
                    //@ts-ignore
                    calldata.message?.chat.id,
                    "".concat(...acct_token_message),
                    {
                        reply_markup:
                            tokens.length > 4
                                ? {
                                      inline_keyboard: [
                                          //@ts-ignore
                                          acct_pages[calldata.from.username] > 1
                                              ? nav.acct_prev
                                              : [],
                                          //@ts-ignore
                                          acct_pages[calldata.from.username] <
                                          acct_page_limit
                                              ? nav.acct_next
                                              : [],
                                      ],
                                      resize_keyboard: true,
                                  }
                                : {},
                        parse_mode: "HTML",
                    }
                );
            });
        }
    }

    if (calldata.data == "txn_next") {
        //@ts-ignore
        let hash = txn_hash[String(calldata.from.username)];
        console.log("next click");
        console.log(hash);
        console.log(
            `this is the txn_default next ${
                txn_pages[String(calldata.from.username)]
            }`
        );
        //@ts-ignore
        txn_pages[String(calldata.from.username)] += 1;
        let tokens: [] = txn_tokens[String(calldata.from.username)];
        if (tokens != undefined) {
            let txn_token_message: any[] = [];
            //@ts-ignore
            let txn_page_limit = Math.ceil(tokens?.length / token_limit);
            let txn_start_index =
                (txn_pages[String(calldata.from.username)] - 1) * token_limit;
            let txn_end_index =
                txn_pages[String(calldata.from.username)] * token_limit;
            let txn_token_list = tokens?.slice(txn_start_index, txn_end_index);

            //@ts-ignore
            function token_getter(token) {
                let formatted = `\n<b>🔣Symbol</b>: ${token.name}\n\n<b>☝️From</b>: ${token.from}\n\n<b>👇To</b>: ${token.to}\n\n<b>💵Amount</b>: ${token.amount}\n\n\n`;
                txn_token_message.push(formatted);
            }

            function tokenMessage() {
                //@ts-ignore
                for (const token of txn_token_list) {
                    token_getter(token);
                }
            }
            tokenMessage();
            //@ts-ignore
            //@ts-ignore
            bot.deleteMessage(
                //@ts-ignore
                calldata.message?.chat.id,
                calldata.message?.message_id
            ).then((e) => {
                console.log(e);
                //@ts-ignore
                bot.sendMessage(
                    //@ts-ignore
                    calldata.message?.chat.id,
                    "".concat(...txn_token_message),
                    {
                        reply_markup:
                            tokens.length > 4
                                ? {
                                      inline_keyboard: [
                                          //@ts-ignore
                                          txn_pages[calldata.from.username] > 1
                                              ? nav.txn_prev
                                              : [],
                                          //@ts-ignore
                                          txn_pages[calldata.from.username] <
                                          txn_page_limit
                                              ? nav.txn_next
                                              : [],
                                      ],
                                      resize_keyboard: true,
                                  }
                                : {},
                        parse_mode: "HTML",
                    }
                );
            });
        }
    }

    if (calldata.data == "txn_prev") {
        //@ts-ignore
        let hash = txn_hash[String(calldata.from.username)];
        console.log("prev click");
        console.log(hash);
        console.log(
            `this is the txn_default prev ${
                txn_pages[String(calldata.from.username)]
            }`
        );
        //@ts-ignore
        txn_pages[String(calldata.from.username)] -= 1;
        let tokens: [] = txn_tokens[String(calldata.from.username)];
        if (tokens != undefined) {
            let txn_token_message: any[] = [];
            //@ts-ignore
            let txn_page_limit = Math.ceil(tokens?.length / token_limit);
            let txn_start_index =
                (txn_pages[String(calldata.from.username)] - 1) * token_limit;
            let txn_end_index =
                txn_pages[String(calldata.from.username)] * token_limit;
            let txn_token_list = tokens?.slice(txn_start_index, txn_end_index);

            //@ts-ignore
            function token_getter(token) {
                let formatted = `\n<b>🔣Symbol</b>: ${token.name}\n\n<b>☝️From</b>: ${token.from}\n\n<b>👇To</b>: ${token.to}\n\n<b>💵Amount</b>: ${token.amount}\n\n\n`;
                txn_token_message.push(formatted);
            }

            function tokenMessage() {
                //@ts-ignore
                for (const token of txn_token_list) {
                    token_getter(token);
                }
            }
            tokenMessage();
            //@ts-ignore
            //@ts-ignore
            bot.deleteMessage(
                //@ts-ignore
                calldata.message?.chat.id,
                calldata.message?.message_id
            ).then((e) => {
                console.log(e);
                //@ts-ignore
                bot.sendMessage(
                    //@ts-ignore
                    calldata.message?.chat.id,
                    "".concat(...txn_token_message),
                    {
                        reply_markup:
                            tokens.length > 4
                                ? {
                                      inline_keyboard: [
                                          //@ts-ignore
                                          txn_pages[calldata.from.username] > 1
                                              ? nav.txn_prev
                                              : [],
                                          //@ts-ignore
                                          txn_pages[calldata.from.username] <
                                          txn_page_limit
                                              ? nav.txn_next
                                              : [],
                                      ],
                                      resize_keyboard: true,
                                  }
                                : {},
                        parse_mode: "HTML",
                    }
                );
            });
        }
    }

    if (calldata.data == "account_token_bal") {
        //@ts-ignore
        let acct_address = acct_addr[String(calldata.from.username)];
        console.log(acct_address);
        console.log(String(calldata.from.username));
        //@ts-ignore
        let tokens: [] = acct_tokens[String(calldata.from.username)];
        if (tokens != undefined) {
            let acct_token_message: any[] = [];
            //@ts-ignore
            let acct_page_limit = Math.ceil(tokens?.length / token_limit);
            let acct_start_index =
                (acct_pages[String(calldata.from.username)] - 1) * token_limit;
            let acct_end_index =
                acct_pages[String(calldata.from.username)] * token_limit;
            let acct_token_list = tokens.slice(
                acct_start_index,
                acct_end_index
            );
            console.log(acct_token_list);

            //@ts-ignore
            function token_getter(token) {
                let formatted = `<b>📍Token Address</b>: ${
                    token?.token_address
                }\n\n<b>🔣Symbol</b>: ${token?.symbol}\n\n<b>💵Balance</b>: ${
                    Number(token?.balance) / Math.pow(10, token?.decimals)
                }\n\n\n\n`;
                acct_token_message.push(formatted);
            }

            function tokenMessage() {
                for (const token of acct_token_list) {
                    token_getter(token);
                }
            }
            tokenMessage();
            //@ts-ignore
            //@ts-ignore
            bot.deleteMessage(
                //@ts-ignore
                calldata.message?.chat.id,
                calldata.message?.message_id
            ).then((e) => {
                console.log(e);
                //@ts-ignore
                bot.sendMessage(
                    //@ts-ignore
                    calldata.message?.chat.id,
                    "".concat(...acct_token_message),
                    {
                        reply_markup:
                            tokens.length > 4
                                ? {
                                      inline_keyboard: [
                                          //@ts-ignore
                                          acct_pages[calldata.from.username] > 1
                                              ? nav.acct_prev
                                              : [],
                                          //@ts-ignore
                                          acct_pages[calldata.from.username] <
                                          acct_page_limit
                                              ? nav.acct_next
                                              : [],
                                      ],
                                      resize_keyboard: true,
                                  }
                                : {},
                        parse_mode: "HTML",
                    }
                );
            });
        }
    }

    if ((calldata.data = "txn_token_transfers")) {
        //@ts-ignore
        let hash = txn_hash[String(calldata.from.username)];
        console.log(hash);
        console.log(String(calldata.from.username));
        console.log("clicking");
        //@ts-ignore
        let tokens: [] = txn_tokens[String(calldata.from.username)];
        console.log(tokens.length);
        if (tokens != undefined) {
            let txn_token_message: any[] = [];
            //@ts-ignore
            let txn_page_limit = Math.ceil(tokens?.length / token_limit);
            let txn_start_index =
                (txn_pages[String(calldata.from.username)] - 1) * token_limit;
            let txn_end_index =
                txn_pages[String(calldata.from.username)] * token_limit;
            let txn_token_list = tokens.slice(txn_start_index, txn_end_index);

            //@ts-ignore
            function token_getter(token) {
                let formatted = `\n<b>🔣Symbol</b>: ${token.name}\n\n<b>☝️From</b>: ${token.from}\n\n<b>👇To</b>: ${token.to}\n\n<b>💵Amount</b>: ${token.amount}\n\n\n`;
                txn_token_message.push(formatted);
            }

            function tokenMessage() {
                for (const token of txn_token_list) {
                    token_getter(token);
                }
            }
            tokenMessage();
            //@ts-ignore
            //@ts-ignore
            bot.deleteMessage(
                //@ts-ignore
                calldata.message?.chat.id,
                calldata.message?.message_id
            ).then((e) => {
                console.log(e);
                //@ts-ignore
                bot.sendMessage(
                    //@ts-ignore
                    calldata.message?.chat.id,
                    "".concat(...txn_token_message),
                    {
                        reply_markup:
                            tokens.length > 4
                                ? {
                                      inline_keyboard: [
                                          //@ts-ignore
                                          txn_pages[calldata.from.username] > 1
                                              ? nav.txn_prev
                                              : [],
                                          //@ts-ignore
                                          txn_pages[calldata.from.username] <
                                          txn_page_limit
                                              ? nav.txn_next
                                              : [],
                                      ],
                                      resize_keyboard: true,
                                  }
                                : {},
                        parse_mode: "HTML",
                    }
                );
            });
        }
    }
});
