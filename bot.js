var Discord = require("discord.io");
var auth = require("./auth.json");
var fs = require("fs");

class Botmaestro {
  constructor() {
    let bot;
    let currMsg;
    this.initBot();

    let today = new Date();
    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);

    console.log(today);
    console.log(tomorrow);

    console.log(tomorrow - today);
  }

  initBot() {
    this.bot = new Discord.Client({
      token: auth.token,
      autorun: true
    });
    this.initReady();
  }

  initReady() {
    this.bot.on("ready", evt => {
      console.log("Connected");
      console.log("Logged in as: ");
      console.log(this.bot.username + " - (" + this.bot.id + ")");
      this.initMessage();
    });
  }

  async initMessage() {
    this.bot.on("message", async (user, userID, channelID, message, evt) => {
      // Our bot needs to know if it will execute a command
      // It will listen for messages that will start with `!`
      if (user != "botmaestro") {
        this.currMsg = {
          user,
          userID,
          channelID,
          message,
          evt
        };
        if (message.substring(0, 1) == "!") {
          this.runExclamationCommands(user, channelID, message);
        }

        if (message.match(/de(j|)an/gi)) {
          this.bot.sendMessage({
            to: channelID,
            message: `<:de:383390121577152512><:de:383390121577152512> ${user} sa det magiska ordet <:de:383390121577152512><:de:383390121577152512>`
          });
        }

        if (message.substring(0, 4).match(/!dkp/i)) {
          let dkpcmd = message.split("!dkp ")[1];

          if (typeof dkpcmd == "undefined") {
            let message = await this.templateDkpCommands();
            this.bot.sendMessage({
              to: channelID,
              message: message
            });
          } else {
            try {
              let dkpoperator = dkpcmd.split(" ")[0];
              switch (dkpoperator) {
                case "remove":
                case "add":
                  let dkpamount = dkpcmd.split(" ")[1];
                  dkpamount = parseInt(dkpamount);
                  if (dkpamount > 10) {
                    this.bot.sendMessage({
                      to: channelID,
                      message: `Too much DKP, max 10`
                    });
                    break;
                  }
                  let dkpuser = dkpcmd.split(" ")[2];
                  let num = 3;
                  while (dkpcmd.split(" ")[num]) {
                    dkpuser += ` ${dkpcmd.split(" ")[num]}`;
                    num += 1;
                  }
                  this.dkpAddRemove(dkpuser, dkpamount, dkpoperator, channelID);
                  break;

                case "list":
                  fs.readFile("dkp.json", (err, data) => {
                    if (err) {
                      throw err;
                    }
                    let jsonData = JSON.parse(data);
                    let users = jsonData.users;

                    let message =
                      "is announcing the DKP list.\n\nDKP | Username\n\n";

                    for (let user of users) {
                      message += `${user.dkp} | ${user.username}\n`;
                    }

                    this.bot.sendMessage({
                      to: channelID,
                      message: message
                    });
                  });
                  break;
                default:
                  this.invalidCommand(channelID);
                  break;
              }
            } catch (e) {
              this.invalidCommand(channelID);
            }
          }
        }
      }
    });
  }

  invalidCommand(channelID) {
    this.bot.sendMessage({
      to: channelID,
      message: `Invalid command. Type !dkp for commands`
    });
  }

  runExclamationCommands(user, channelID, message) {
    var args = message.substring(1).split(" ");
    var cmd = args[0];

    args = args.splice(1);
    switch (cmd) {
      case "roll":
        let roll = Math.floor(Math.random() * 100) + 1;
        this.bot.sendMessage({
          to: channelID,
          message: `${user} rolled ${roll}`
        });
        break;
      // Just add any case commands if you want to..
    }
  }

  dkpAddRemove(username, amount, modifier, channelID) {
    fs.readFile("dkp.json", (err, data) => {
      if (err) {
        throw err;
      }
      let jsonData = JSON.parse(data);
      let users = jsonData.users;
      let userIndex = users.findIndex(user => user.username == username);
      let foundUser = userIndex == -1 ? false : true;

      if (!foundUser) {
        for (let user in this.bot.users) {
          if (this.bot.users[user].username == username) {
            foundUser = true;
            users.push({
              username: this.bot.users[user].username,
              dkp: 0,
              bank: { lastUpdate: new Date(), dkp: 1000 }
            });
            break;
          }
        }
        userIndex = users.length - 1;
      }

      let message = "";
      if (foundUser) {
        let now = new Date();
        if (
          Math.abs(now - new Date(users[userIndex].bank.lastUpdate)) > 86400000
        ) {
          users[userIndex].bank.dkp = 10;
          users[userIndex].bank.lastUpdate = now;
        }

        if (users[userIndex].bank.dkp > amount) {
          if (modifier == "add") {
            users[userIndex].dkp += amount;
            message = `Added ${amount} DKP to ${username}`;
          } else if (modifier == "remove") {
            users[userIndex].dkp -= amount;
            message = `Removed ${amount} DKP to ${username}`;
          }
          this.dkpJsonSave(jsonData);
        } else {
          message = `You don't have enough DKP\nRemaining: ${
            users[userIndex].bank.dkp
          }`;
        }
      } else {
        message = `Did not find the username`;
      }
      this.bot.sendMessage({
        to: channelID,
        message: message
      });
    });
  }

  dkpJsonSave(users) {
    let json = JSON.stringify(users);
    fs.writeFile("dkp.json", json, "utf8");
  }

  templateDkpCommands() {
    let msg = `is, yet again, telling you the commands
  
    commands:
    \`!dkp\` - \`show dkp commands\`
    \`!dkp list\` - \`List all users and their dkp\`
    \`!dkp add <amount> <user>\` - \`add dkp to user (max 10)\`
    \`!dkp remove <amount> <user>\` - \`remove dkp from user (max 10)\`
  
    examples:
    \`!dkp add 2 Tin\`
    \`!dkp remove 2 Tin\``;

    return msg;
  }
}

let bot = new Botmaestro();
