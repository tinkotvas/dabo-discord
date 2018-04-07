const Discord = require("discord.io");
const auth = require("./auth.json");
const fs = require("fs");
const table = require("text-table");
/**
 *
 *
 * @class Fembot
 */
class Fembot {
  constructor() {
    this.bot = new Discord.Client({
      token: auth.token,
      autorun: true
    }).on("ready", evt => {
      console.log("Connected");
      console.log("Logged in as: ");
      console.log(this.bot.username + " - (" + this.bot.id + ")");
      this.messageHandler();
    });
    fs.readFile("dkp.json", (err, data) => {
      if (err) {
        throw err;
      }
      this.dkpScores = JSON.parse(data);
    });

    this.maxDailyDKP = 100;
  }
  /**
   * registers everything that starts with !
   *
   * @memberof Fembot
   */
  messageHandler() {
    this.bot.on("message", async (user, userID, channelID, message, evt) => {
      if (message.substring(0, 1) == "!" && user != "fembot") {
        let command = message.substring(1).split(" ")[0];

        const activeCommands = {
          roll: () => {
            this.rollDice(user, channelID, message);
          },
          dkp: () => {
            this.dkpCommands(user, channelID, message);
          },
          default: () => {
            this.sendMessage(channelID, "```diff\n- Invalid command```");
          }
        };

        typeof activeCommands[command] == "function"
          ? activeCommands[command]()
          : activeCommands["default"]();
      }
    });
  }
  /**
   * sends message
   *
   * @param {any} channelID  - the channelID of where the commands was typed
   * @param {string} botMessage - the message the bot should write
   * @memberof Fembot
   */
  async sendMessage(channelID, botMessage) {
    this.bot.sendMessage({
      to: channelID,
      message: botMessage
    });
  }
  /**
   *  runs the methods depending on commands given
   *
   * @param {any} user - the user playing
   * @param {any} channelID - the channelID of where the commands was typed
   * @param {any} message - the full command (message)
   * @memberof Fembot
   */
  dkpCommands(user, channelID, message) {
    let botMessage;
    let commands = message.split("!dkp ")[1];
    let command = message.split("!dkp ")[1];
    if (typeof commands != "undefined") {
      command = commands.split(" ")[0];
    }

    const activeCommands = {
      list: () => {
        this.dkpList(channelID);
      },
      dice: () => {
        this.dkpDice(user, channelID, commands);
      },
      give: () => {
        this.giveOrTakeDKP(user, channelID, commands);
      },
      take: () => {
        this.giveOrTakeDKP(user, channelID, commands);
      },
      default: () => {
        this.sendMessage(channelID, this.tmplDkpCommands());
      }
    };

    typeof activeCommands[command] == "function"
      ? activeCommands[command]()
      : activeCommands["default"]();
  }

  /**
   * prints the current users and their DKP
   *
   * @param {any} channelID - the channelID of where the commands was typed
   * @memberof Fembot
   */
  dkpList(channelID) {
    let botMessage = "```css\n";
    let tableUsers = [["User", "DKP"]];
    for (let user of this.dkpScores.users) {
      tableUsers.push([user.username, user.dkp]);
    }
    botMessage += table(tableUsers, { align: ["l", "r"] }) + "```";
    this.sendMessage(channelID, botMessage);
  }
  /**
   * basic !roll command 1-100
   *
   * @param {any} user - the user playing
   * @param {any} channelID - the channelID of where the commands was typed
   * @param {any} commands - the full command after !dkp
   * @returns {number} - returns a 1-100 number
   * @memberof Fembot
   */
  rollDice(user, channelID, message) {
    let botMessage;
    var args = message.substring(1).split(" ");
    var cmd = args[0];

    args = args.splice(1);
    switch (cmd) {
      case "roll":
        let roll = Math.floor(Math.random() * 100) + 1;

        if (user == "Julius Caesar") {
          roll = -1;
        }

        botMessage = `\`\`\`xl\n${user} rolled ${roll}\`\`\``;
        this.sendMessage(channelID, botMessage);
        return roll;
        break;
    }
  }

  /**
   * roll dice game of High/Low/7 (1/1/4*bet)
   *
   * @param {any} user - the user playing
   * @param {any} channelID - the channelID of where the commands was typed
   * @param {any} commands - the full command after !dkp
   * @memberof Fembot
   */
  dkpDice(user, channelID, commands) {
    let users = this.dkpScores.users;
    let userIndex = this.getUserIndex(user);

    let amount = parseInt(commands.split(" ")[1]);
    let choice = commands.split(" ")[2];

    if (
      choice == "high" ||
      choice == "h" ||
      choice == "low" ||
      choice == "l" ||
      choice == 7
    ) {
      if (users[userIndex].dkp >= amount) {
        users[userIndex].dkp -= amount;
        let diceOne = Math.floor(Math.random() * 6) + 1;
        let diceTwo = Math.floor(Math.random() * 6) + 1;
        let diceSum = diceOne + diceTwo;

        let botMessage =
          "```diff\n! You place your " +
          amount +
          " DKP bet on " +
          (choice == "h" || choice == "l"
            ? choice == "h" ? (choice = "high") : (choice = "low")
            : choice) +
          "\n" +
          "\n+ First dice    : " +
          diceOne +
          "\n+ Second dice   : " +
          diceTwo +
          "\n+ Dice total    : " +
          diceSum +
          "\n\n";

        let winnings = 0;
        if (choice == 7 && diceSum == 7) {
          winnings = amount * 4;
          users[userIndex].dkp += winnings;
          botMessage += `+ Holy smokes, you just won ${winnings} DKP, `;
        } else if ((choice == "high" || choice == "h") && diceSum > 7) {
          winnings = amount * 2;
          users[userIndex].dkp += winnings;
          botMessage += `+ Sweet, you just won ${winnings} DKP, `;
        } else if ((choice == "low" || choice == "l") && diceSum < 7) {
          winnings = amount * 2;
          users[userIndex].dkp += winnings;
          botMessage += `+ Sweet, you just won ${winnings} DKP, `;
        } else {
          botMessage += "- You loose your hard earned DKP, ";
        }
        botMessage += "setting your total to " + users[userIndex].dkp + "```";
        this.sendMessage(channelID, botMessage);
        this.saveDKP();
      } else {
        this.sendMessage(
          channelID,
          `\`\`\`diff\n- Not enough DKP, you only have ${
            users[userIndex].dkp
          }\`\`\``
        );
      }
    } else {
      this.sendMessage(channelID, "-Invalid command");
    }
  }

  /**
   * Checks if the username supplied is in our json
   * if not checks for the user on the server, and if
   * a matching username is found, we save the user to our
   * JSON and respond with the index, otherwise we return -1
   *
   * @param {any} username the username of the one we want the index for
   * @returns {number} index - -1 or the actual index
   * @memberof Fembot
   */
  getUserIndex(username) {
    let users = this.dkpScores.users;
    let index = users.findIndex(user => user.username == username);
    //if current user is missing, check if he exist and save him
    if (index == -1) {
      for (let user in this.bot.users) {
        if (this.bot.users[user].username == username) {
          users.push({
            username: this.bot.users[user].username,
            id: this.bot.users[user].id,
            dkp: 0,
            bank: {
              lastUpdate: new Date(new Date().toJSON().split("T")[0]),
              dkp: 100
            }
          });
          index = users.length - 1;
          break;
        }
      }
    }
    return index;
  }

  /**
   * used to give or take DKP
   *
   * @param {any} currentUser the user that issued the command
   * @param {any} channelID the channelID of where the command was issued
   * @param {any} command should be all commands after "!dkp "
   * @memberof Fembot
   */
  async giveOrTakeDKP(currentUser, channelID, command) {
    let botMessage;
    let modifier = command.split(" ")[0];
    let amount = parseInt(command.split(" ")[1]);
    let targetUser = command.split(" ")[2];
    let num = 3;
    while (command.split(" ")[num]) {
      targetUser += ` ${command.split(" ")[num]}`;
      num += 1;
    }

    if (amount > this.maxDailyDKP) {
      botMessage = `\`\`\`diff\n- Too much DKP, max ${this.maxDailyDKP}\`\`\``;
      this.sendMessage(channelID, botMessage);
      return;
    }

    if (targetUser == user) {
      botMessage = `\`\`\`diff\n- That would be silly, you silly goose.\`\`\``;
      this.sendMessage(channelID, botMessage);
      return;
    }

    let users = this.dkpScores.users;
    let targetUserIndex = this.getUserIndex(targetUser);
    let userIndex = this.getUserIndex(currentUser);

    if (targetUserIndex >= 0 && userIndex >= 0) {
      let now = new Date(new Date().toJSON().split("T")[0]);
      let then = new Date(
        new Date(users[userIndex].bank.lastUpdate).toJSON().split("T")[0]
      );

      if (Math.abs(now - then) >= 86400000) {
        users[userIndex].bank.dkp = this.maxDailyDKP;
        users[userIndex].bank.lastUpdate = now;
      }

      if (users[userIndex].bank.dkp >= amount) {
        users[userIndex].bank.dkp -= amount;
        if (modifier == "give") {
          users[targetUserIndex].dkp += amount;
          botMessage = `\`\`\`diff\n+ Gave ${amount} DKP to `;
        } else if (modifier == "take") {
          users[targetUserIndex].dkp -= Math.floor(amount / 2);
          botMessage = `\`\`\`diff\n+ Took ${Math.floor(amount / 2)} DKP from `;
        }
        botMessage += `${targetUser}, you now have ${
          users[userIndex].bank.dkp
        } more DKP to give or take today.\`\`\``;
        this.saveDKP();
      } else {
        botMessage = `\`\`\`diff\n- Not enough DKP, you only have ${
          users[userIndex].bank.dkp
        }\`\`\``;
      }
    } else {
      botMessage = `\`\`\`diff\n- Did not find the username ${targetUser}\`\`\``;
    }
    this.sendMessage(channelID, botMessage);
  }

  /**
   * Saves the current user data with DKP scores
   *
   * @memberof Fembot
   */
  saveDKP() {
    let json = JSON.stringify(this.dkpScores);
    fs.writeFile("dkp.json", json, "utf8");
  }

  /**
   * Just a string template for the DKP commands to be called
   *
   * @returns {string} botMessage - the whole message as a string
   * @memberof Fembot
   */
  tmplDkpCommands() {
    let botMessage =
      "```diff\n" +
      "You're allowed to give and take a total of " +
      this.maxDailyDKP +
      " DKP every 24-hour period." +
      "\n\ncommands:" +
      "\n!dkp - show dkp commands" +
      "\n!dkp list - list all users and their DKP" +
      "\n!dkp give <amount> <user> - give DKP to a user" +
      "\n!dkp take <amount> <user> - take DKP from a user (diminishing returns 50%)" +
      "\n!dkp dice <amount> high/low/7 - feeling lucky? (h/l for short)" +
      "\n\nexamples:" +
      "\n!dkp give 10 Tin" +
      "\n!dkp take 10 Tin" +
      "\n!dkp dice 50 h" +
      "\n!dkp dice 50 7```";
    return botMessage;
  }
}

let bot = new Fembot();
