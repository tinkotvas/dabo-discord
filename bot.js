const Discord = require("discord.io");
const auth = require("./auth.json");
const fs = require("fs");
const table = require("text-table");

class Botmaestro {
  constructor() {
    this.bot = new Discord.Client({
      token: auth.token,
      autorun: true
    });
    this.currMsg;
    this.dailyDkpVal = 100;
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

        // if (message.match(/de(j|)an/gi)) {
        //   this.bot.sendMessage({
        //     to: channelID,
        //     message: `<:de:383390121577152512><:de:383390121577152512> ${user} sa det magiska ordet <:de:383390121577152512><:de:383390121577152512>`
        //   });
        // }

        if (message.substring(0, 4).match(/!dkp/i)) {
          let command = message.split("!dkp ")[1];
          if (typeof command == "undefined") {
            let message = await this.templateDkpCommands();
            this.bot.sendMessage({
              to: channelID,
              message: message
            });
          } else {
            try {
              let operator = command.split(" ")[0];
              switch (operator) {
                case "give":
                case "take":
                  let amount = command.split(" ")[1];
                  amount = parseInt(amount);
                  if (amount > this.dailyDkpVal) {
                    this.bot.sendMessage({
                      to: channelID,
                      message: `\`\`\`diff\n- Too much DKP, max ${
                        this.dailyDkpVal
                      }\`\`\``
                    });
                    break;
                  }

                  let targetUser = command.split(" ")[2];
                  let num = 3;
                  while (command.split(" ")[num]) {
                    targetUser += ` ${command.split(" ")[num]}`;
                    num += 1;
                  }
                  if (targetUser == user) {
                    this.bot.sendMessage({
                      to: channelID,
                      message: `\`\`\`diff\n- That would be silly, you silly goose.\`\`\``
                    });
                    break;
                  }
                  this.giveAndTakeDKP(
                    user,
                    targetUser,
                    amount,
                    operator,
                    channelID
                  );
                  break;
                case "list":
                  fs.readFile("dkp.json", (err, data) => {
                    if (err) {
                      throw err;
                    }
                    let jsonData = JSON.parse(data);
                    let users = jsonData.users;
                    let message = "```css\n";
                    let tableUsers = [["User", "DKP"]];
                    for (let user of users) {
                      tableUsers.push([user.username, user.dkp]);
                    }
                    message += table(tableUsers, { align: ["l", "r"] }) + "```";
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
      message: `\`\`\`diff\n- Invalid command. Type !dkp for commands\`\`\``
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
          message: `\`\`\`xl\n${user} rolled ${roll}\`\`\``
        });
        break;
    }
  }

  giveAndTakeDKP(currentUser, username, amount, modifier, channelID) {
    fs.readFile("dkp.json", (err, data) => {
      if (err) {
        throw err;
      }
      let jsonData = JSON.parse(data);
      let users = jsonData.users;
      let targetUserIndex = users.findIndex(user => user.username == username);
      let userIndex = users.findIndex(user => user.username == currentUser);
      let foundUser = targetUserIndex == -1 ? false : true;

      //if current user is missing
      if (userIndex == -1) {
        users.push({
          username: currentUser,
          dkp: 0,
          bank: { lastUpdate: new Date(), dkp: 100 }
        });
        userIndex = users.length - 1;
      }

      if (!foundUser) {
        for (let user in this.bot.users) {
          if (this.bot.users[user].username == username) {
            foundUser = true;
            users.push({
              username: this.bot.users[user].username,
              dkp: 0,
              bank: { lastUpdate: new Date(), dkp: 100 }
            });
            break;
          }
        }
        targetUserIndex = users.length - 1;
      }

      let message = "";
      if (foundUser) {
        let now = new Date();
        console.log("userIndex", users[userIndex].bank.dkp);
        console.log("targetUserIndex", targetUserIndex);
        if (
          Math.abs(now - new Date(users[userIndex].bank.lastUpdate)) > 86400000
        ) {
          users[userIndex].bank.dkp = this.dailyDkpVal;
          users[userIndex].bank.lastUpdate = now;
        }

        if (users[userIndex].bank.dkp >= amount) {
          users[userIndex].bank.dkp -= amount;
          if (modifier == "give") {
            users[targetUserIndex].dkp += amount;
            message = `\`\`\`diff\n+ Gave ${amount} DKP to `;
          } else if (modifier == "take") {
            users[targetUserIndex].dkp -= amount;
            message = `\`\`\`diff\n+ Took ${amount} DKP from `;
          }
          message += `${username}, you now have ${
            users[userIndex].bank.dkp
          } more DKP to give or take today.\`\`\``;
          this.dkpJsonSave(jsonData);
        } else {
          message = `\`\`\`diff\n- You don't have enough DKP. Remaining: ${
            users[userIndex].bank.dkp
          }\`\`\``;
        }
      } else {
        message = `\`\`\`diff\n- Did not find the username\`\`\``;
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
    let msg = `\`\`\`diff\n
You're allowed to give and take a total of ${this.dailyDkpVal} DKP every 24-hour period.

commands:
!dkp - show dkp commands
!dkp list - list all users and their DKP
!dkp give <amount> <user> - give DKP to a user
!dkp take <amount> <user> - take DKP from a user

examples:
!dkp give 10 Tin
!dkp take 10 Tin\`\`\``;
    return msg;
  }
}

let bot = new Botmaestro();
