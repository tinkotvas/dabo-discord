const Discord = require('discord.js');
const client = new Discord.Client();
const _DS9 = require('./ds9.class');
const Warframe = require('./warframe.class');
const firebase = require('firebase');
const app = firebase.initializeApp( {
    
})





const DS9 = new _DS9();
const warframe = new Warframe();

module.exports = class Client {
    constructor(authToken) {
        client.login(authToken);
        this.setup();
    }

    setup() {
        client.on('ready', () => {
            console.log(`Logged in as ${client.user.tag}!`);
            this.commandHandler();
        });
    }

    commandHandler() {
        client.on("message", e => {
            const user = e.author.username;
            const userID = e.author.id;
            const channel = e.channel;
            const message = e.content;

            /* starts with ! and not from client */
            if (!/^!/.test(message) || RegExp(`^${user}$`, "i").test(client.user.username))
                return;

            const command = message.substring(1).split(" ")[0].toLowerCase();

            if (/so+rti+e+/.test(command)) command = "sortie";
            const activeCommands = {
                /** Warframe Commands */
                roll: () => {
                    this.sendMessage(channel, DS9.roll(user))
                },
                /** Warframe Commands */
                c: () => {
                    warframe.cetus(channel, this);
                },
                cetus: () => {
                    warframe.cetus(channel, this);
                },
                nw: () => {
                    warframe.nightwave(channel, this);
                },
                nightwave: () => {
                    warframe.nightwave(channel, this);
                },
                b: () => {
                    warframe.baro(channel, this);
                },
                baro: () => {
                    warframe.baro(channel, this);
                },
                s: () => {
                    warframe.sortie(channel, this);
                },
                sortie: () => {
                    warframe.sortie(channel, this);
                },
                default: () => {
                    // this.sendMessage(channel, "```diff\n- Invalid command```", "red");
                    return
                }
            };
            typeof activeCommands[command] == "function" ?
                activeCommands[command]() :
                activeCommands["default"]();
        });
    }

    sendMessage(channel, botMessage, color = "pink") {
        let colors = {
            purple: 9055202,
            red: 16711680,
            green: 65280,
            blue: 255,
            pink: 16738740
        };
        color = colors[color];
        let botIconUrl =
            "https://cdn.discordapp.com/app-icons/430399909024497664/dedb8bfa775a4ba760872968e0dba46e.png";

        let embed = {
            title: null,
            description: botMessage,
            url: "",
            color: color,
            timestamp: new Date(),

            footer: {
                icon_url: botIconUrl,
                text: client.user.username
            },
            fields: []
        };

        channel.send({
            embed
        });
    }

}


    // messageHandler2() {
    //     client.on("message", (user, userID, channelID, message, evt) => {
    //         if (
    //             !/^!/.test(message) ||
    //             RegExp(`^${user}$`, "i").test(this.bot.username)
    //         )
    //             return;
    //         let command = message.substring(1).split(" ")[0].toLowerCase();
    //         if (/so+rti+e+/.test(command)) command = "sortie";
    //         const activeCommands = {
    //             roll: () => {
    //                 this.command_roll(user, channelID, message);
    //             },
    //             r: () => {
    //                 this.rules(channelID, message);
    //             },
    //             d: () => {
    //                 this.dabo(user, channelID, message);
    //             },
    //             dabo: () => {
    //                 this.dabo(user, channelID, message);
    //             },
    //             rule: () => {
    //                 this.rules(channelID, message);
    //             },
    //             rules: () => {
    //                 this.rules(channelID, message);
    //             },
    //             p: () => {
    //                 this.play_commands(user, channelID, message);
    //             },
    //             play: () => {
    //                 this.play_commands(user, channelID, message);
    //             },
    //             c: () => {
    //                 this.cetus(channelID);
    //             },
    //             cetus: () => {
    //                 this.cetus(channelID);
    //             },
    //             nw: () => {
    //                 this.nightwave(channelID);
    //             },
    //             nightwave: () => {
    //                 this.nightwave(channelID);
    //             },
    //             b: () => {
    //                 this.baro(channelID);
    //             },
    //             baro: () => {
    //                 this.baro(channelID);
    //             },
    //             s: () => {
    //                 this.sortie(channelID);
    //             },
    //             sortie: () => {
    //                 this.sortie(channelID);
    //             },
    //             god: () => {
    //                 if (!(userID == "201004098600828928")) {
    //                     //this.sendMessage(channelID, "```diff\n- Invalid command```", "red");
    //                     return;
    //                 }
    //                 var exec = require("child_process").execFile;
    //                 exec(`C:\\Program Files (x86)\\TeamViewer\\TeamViewer.exe`, function (
    //                     err,
    //                     data
    //                 ) {
    //                     log.error(err);
    //                     log.error(data.toString());
    //                 });
    //                 this.sendMessage(
    //                     channelID,
    //                     "```diff\nAs you command, my lord```",
    //                     "green"
    //                 );
    //             },
    //             default: () => {
    //                 //this.sendMessage(channelID, "```diff\n- Invalid command```", "red");
    //             }
    //         };
    //         typeof activeCommands[command] == "function" ?
    //             activeCommands[command]() :
    //             activeCommands["default"]();
    //     });
    // }
