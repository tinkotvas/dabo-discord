const Discord = require("discord.io");
const fs = require("fs");
const table = require("text-table");
const schedule = require("node-schedule");
const Log = require("log");
const log = new Log(
  "debug" | "info" | "warning" | "error",
  // save to file, bad idea
 // fs.createWriteStream(`./log/${Date.now()}.log`)
);

module.exports = class Botman {
  constructor(authToken) {
    this.bot = new Discord.Client({
      token: authToken,
      autorun: true
    });
    this.bot.on("ready", evt => {
      log.info("Connecteds as " + this.bot.username + " (" + this.bot.id + ")");
      this.messageHandler();
    });
    fs.readFile("dkp.json", (err, data) => {
      if (err) throw err;
      this.dkpScores = JSON.parse(data);
    });
    this.maxDailyDKP = 500;
  }

  messageHandler() {
    this.bot.on("message", (user, userID, channelID, message, evt) => {
      if (
        !/^!/.test(message) ||
        RegExp(`^${user}$`, "i").test(this.bot.username)
      )
        return;
      let command = message.substring(1).split(" ")[0];
      const activeCommands = {
        roll: () => {
          this.command_roll(user, channelID, message);
        },
        god: () => {
          if (!(userID == "201004098600828928")) {
            this.sendMessage(channelID, "```diff\n- Invalid command```", "red");
            return;
          }
          var exec = require("child_process").execFile;
          exec(`C:\\Program Files (x86)\\TeamViewer\\TeamViewer.exe`, function(
            err,
            data
          ) {
            log.error(err);
            log.error(data.toString());
          });
          this.sendMessage(
            channelID,
            "```diff\nAs you command, my lord```",
            "green"
          );
        },
        dkp: () => {
          this.dkp_commands(user, channelID, message);
        },
        default: () => {
          this.sendMessage(channelID, "```diff\n- Invalid command```", "red");
        }
      };
      typeof activeCommands[command] == "function"
        ? activeCommands[command]()
        : activeCommands["default"]();
    });
  }

  sendMessage(channelID, botMessage, color = "pink") {
    let colors = {
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
        text: this.bot.username
      },
      fields: []
    };

    this.bot.sendMessage({
      to: channelID,
      embed
    });
  }

  findOrCreateUser(username) {
    let users = this.dkpScores.users;
    let index = users.findIndex(user =>
      RegExp(`^${user.username}$`, "i").test(username)
    );
    //if current user is missing, check if he exist and save him
    if (index == -1) {
      for (let user in this.bot.users) {
        if (RegExp(`^${this.bot.users[user].username}$`, "i").test(username)) {
          users.push({
            username: this.bot.users[user].username,
            id: this.bot.users[user].id,
            dkp: 0,
            bank: {
              lastUpdate: new Date(new Date().toJSON().split("T")[0]),
              dkp: this.maxDailyDKP
            }
          });
          index = users.length - 1;
          break;
        }
      }
    }
    return index;
  }

  // registerShedules() {
  //   let givePoints = schedule.scheduleJob("00 00 00 00 00", function() {

  //     this.registerShedules();
  //   });
  // }

  dkp_commands(user, channelID, message) {
    let commands = message.split("!dkp ")[1];
    let command = message.split("!dkp ")[1];
    if (typeof commands != "undefined") {
      command = commands.split(" ")[0];
    }

    const activeCommands = {
      shop: () => {
        this.dkp_command_shop(user, channelID, commands);
      },
      s: () => {
        this.dkp_command_shop(user, channelID, commands);
      },
      bless: () => {
        this.dkp_command_bless_or_curse(user, channelID, command);
      },
      curse: () => {
        this.dkp_command_bless_or_curse(user, channelID, command);
      },
      list: () => {
        this.dkp_command_list(channelID);
      },
      l: () => {
        this.dkp_command_list(channelID);
      },
      sellsoul: () => {
        this.dkp_command_sellSoul(user, channelID);
      },
      ss: () => {
        this.dkp_command_sellSoul(user, channelID);
      },
      dice: () => {
        this.dkp_command_dice(user, channelID, commands);
      },
      d: () => {
        this.dkp_command_dice(user, channelID, commands);
      },
      give: () => {
        this.dkp_command_giveOrTake(user, channelID, commands);
      },
      g: () => {
        this.dkp_command_giveOrTake(user, channelID, commands);
      },
      take: () => {
        this.dkp_command_giveOrTake(user, channelID, commands);
      },
      t: () => {
        this.dkp_command_giveOrTake(user, channelID, commands);
      },
      default: () => {
        this.sendMessage(channelID, this.dkp_command_default());
      }
    };

    // add shortened of all commands to first char
    // Object.keys(activeCommands).forEach( key => {
    //   activeCommands[key.charAt(0)] = activeCommands[key]
    // });

    typeof activeCommands[command] == "function"
      ? activeCommands[command]()
      : activeCommands["default"]();
  }

  dkp_command_bless_or_curse(user, channelID, command) {
    let users = this.dkpScores.users;
    let userIndex = this.findOrCreateUser(user);
    let newUser = false;

    if (!users[userIndex].blessOrCurse) {
      users[userIndex].blessOrCurse = {};
      newUser = true;
    }
    let now = new Date(new Date().toJSON().split("T")[0]);
    let then = new Date(
      new Date(newUser || users[userIndex].blessOrCurse.lastUpdate)
        .toJSON()
        .split("T")[0]
    );
    if (Math.abs(now - then) >= 86400000) {
      users.forEach(user => {
        if (user.dkp > 0) {
          if (command == "bless") {
            user.dkp += Math.round(user.dkp * 0.05);
          } else {
            user.dkp -= Math.round(user.dkp * 0.05);
          }
        }
      });
      if (command == "bless") {
        this.sendMessage(
          channelID,
          user +
            " blesses everybody for their valiant effort slaying dragons. May the sun shine bright on you! (+5% DKP)",
          "green"
        );
      } else {
        this.sendMessage(
          channelID,
          user +
            " curses everybody hoarding DKP! May everyone turn to ash in eternal hellfire. (-5% DKP)",
          "red"
        );
      }
      users[userIndex].blessOrCurse.lastUpdate = now;
      this.saveScoresToJSON();
    } else {
      this.sendMessage(
        channelID,
        user +
          ", you have already excercised your divine right on this glorious day."
      );
    }
  }

  dkp_command_list(channelID) {
    let tableUsers = [["#", "User", "DKP"]];
    let count = 1;
    for (let user of this.dkpScores.users) {
      if (user.dkp == 0) {
        continue;
      }
      tableUsers.push([count, user.username, user.dkp]);
      count++;
    }
    let botMessage = `__Current Dragon Killing Master God__\n\n<@${
      this.getTopDkpUser().id
    }>\n\n`;
    botMessage += "```glsl\n";
    botMessage += table(tableUsers, { align: ["l", "l", "r"] }) + "```";
    this.sendMessage(channelID, botMessage);
  }

  dkp_command_shop(user, channelID, commands) {
    let users = this.dkpScores.users;
    let userIndex = this.findOrCreateUser(user);
    let numberOfShopItems = 1;
    let cost = 100;
    let amountPerPurchase = 3;
    if (!users[userIndex].inventory) {
      users[userIndex].inventory = {};
    }
    let choice = commands.split(" ")[1];
    let choiceNr = commands.split(" ")[2];
    let amountOf = commands.split(" ")[3];
    if (choice) {
      if ((choice == "buy" || choice == "b") && choiceNr) {
        if (!users[userIndex].inventory[choiceNr]) {
          users[userIndex].inventory[choiceNr] = 0;
        }
        if (amountOf) {
          cost = cost * amountOf;
          amountPerPurchase = amountPerPurchase * amountOf;
        }
        if (
          users[userIndex].dkp >= cost &&
          (choiceNr >= 1 && choiceNr <= numberOfShopItems)
        ) {
          users[userIndex].dkp -= cost;
          users[userIndex].inventory[choiceNr] += amountPerPurchase;
          this.sendMessage(
            channelID,
            `You have purchased shop item number: ` + choiceNr
          );
        }
      }

      if (choice == "inventory" || choice == "i") {
        let botMessage = "Your inventory\n```diff\n";
        for (let i = 1; i <= numberOfShopItems; i++) {
          if (users[userIndex].inventory[i]) {
            botMessage +=
              "Item number " +
              i +
              " charges: " +
              users[userIndex].inventory[i] +
              "\n";
          }
        }
        botMessage += "\n```";
        this.sendMessage(channelID, botMessage);
      }
    } else {
      let botMessage =
        "Welcome to the shop, please stay a while" +
        "\n```diff\n" +
        "\nYou buy with the command:" +
        "\n!dkp shop buy <nr> <amount>" +
        "\n!dkp shop buy 1" +
        "\n!dkp shop buy 1 3" +
        "\n\nOffers:" +
        "\n\n1 - Lucky #7 - 100dkp" +
        "\n   The number 7 seems to be both high and low (3 uses)" +
        // "\n\n2 - Low-tilted Dices - 100dkp" +
        // "\n   Low numbers seem oddly favorable? (3 uses)" +
        // "\n\n3 - High-tilted Dices - 100dkp" +
        // "\n   High numbers seem to come more often? (3 uses)" +
        "\n```";
      this.sendMessage(channelID, botMessage);
    }
    this.saveScoresToJSON();
  }

  dkp_command_sellSoul(user, channelID) {
    let users = this.dkpScores.users;
    let userIndex = this.findOrCreateUser(user);
    let newUser = false;

    if (!users[userIndex].sellsoul) {
      users[userIndex].sellsoul = {};
      newUser = true;
    }

    let now = new Date(new Date().toJSON().split("T")[0]);
    // let then = new Date(
    //   new Date(newUser || "2018-05-04T00:00:00.000Z").toJSON().split('T')[0]);

    let then = new Date(
      new Date(newUser || users[userIndex].sellsoul.lastUpdate)
        .toJSON()
        .split("T")[0]
    );
    if (Math.abs(now - then) >= 86400000 && users[userIndex].dkp == 0) {
      let dice = Math.floor(Math.random() * 1000) + 1;
      if (dice >= 666 && dice <= 999) {
        this.sendMessage(
          channelID,
          `You sold your Soul to the Devil and got 666 demons which you converted to DKP.`,
          "green"
        );
        users[userIndex].dkp += 666;
      } else {
        this.sendMessage(
          channelID,
          `You sold your Soul to the Devil and got nothing to show for it.`,
          "red"
        );
      }
      users[userIndex].sellsoul.lastUpdate = now;
      this.saveScoresToJSON();
    } else if (users[userIndex].dkp > 0) {
      this.sendMessage(
        channelID,
        `You must be desperate to be dealing with the Devil, come back when you are.`,
        "red"
      );
    } else if (!Math.abs(now - then)) {
      this.sendMessage(
        channelID,
        `You have already sold your Soul today.`,
        "red"
      );
    }
  }

  dkp_command_dice(user, channelID, commands) {
    let users = this.dkpScores.users;
    let userIndex = this.findOrCreateUser(user);
    let amount = parseInt(commands.split(" ")[1]);
    let choice = commands.split(" ")[2];

    if (
      (choice == "high" ||
        choice == "h" ||
        choice == "low" ||
        choice == "l" ||
        choice == 7) &&
      users[userIndex].dkp >= amount
    ) {
      let msgColor = "green";
      users[userIndex].dkp -= amount;
      let diceOne = Math.floor(Math.random() * 6) + 1;
      let diceTwo = Math.floor(Math.random() * 6) + 1;
      let diceSum = diceOne + diceTwo;

      //custom emojis added ass :d1: :d2: etc. from img folder
      let diceMapping = [
        "<:d1:432210697318039552>",
        "<:d2:432210699427643393>",
        "<:d3:432210699540758543>",
        "<:d4:432210696902803467>",
        "<:d5:432210696965586954>",
        "<:d6:432210699264196625>"
      ];

      let botMessage = `You place a ${amount} DKP bet on ${
        choice == "h" || choice == "l"
          ? choice == "h"
            ? (choice = "high")
            : (choice = "low")
          : choice
      }\n\n`;
      botMessage += `${diceMapping[diceOne - 1]} on first dice\n${
        diceMapping[diceTwo - 1]
      } on second dice\n\nGiving you a totalt of ${diceSum}\n\n`;

      let winnings = 0;
      if (choice == 7 && diceSum == 7) {
        //win if item number 1 has charges
        winnings = amount * 4;
        users[userIndex].dkp += winnings;
        botMessage += `Holy smokes, you just won ${winnings} DKP, `;
      } else if (
        (choice == "high" || choice == "h") &&
        (diceSum > 7 || (diceSum == 7 && users[userIndex].inventory[1] >= 1))
      ) {
        if (diceSum == 7) {
          users[userIndex].inventory[1] -= 1;
        }
        winnings = amount * 2;
        users[userIndex].dkp += winnings;
        botMessage += `High win, you just won ${winnings} DKP, `;
      } else if (
        (choice == "low" || choice == "l") &&
        (diceSum < 7 || (diceSum == 7 && users[userIndex].inventory[1] >= 1))
      ) {
        if (diceSum == 7) {
          users[userIndex].inventory[1] -= 1;
        }
        winnings = amount * 2;
        users[userIndex].dkp += winnings;
        botMessage += `Low win, you just won ${winnings} DKP, `;
      } else {
        botMessage += "You loose your hard earned DKP, ";
        msgColor = "red";
      }
      botMessage += "setting your total to " + users[userIndex].dkp;
      this.sendMessage(channelID, botMessage, msgColor);
      this.saveScoresToJSON();
      log.notice(
        `${user} bet ${amount} on ${choice} and ${
          winnings > 1 ? "winning " + winnings : "loosing it"
        } (DKP:${users[userIndex].dkp})`
      );
    } else {
      if (users[userIndex].dkp <= amount)
        this.sendMessage(
          channelID,
          `\`\`\`diff\n- Not enough DKP, you have ${
            users[userIndex].dkp
          }\`\`\``,
          "red"
        );
      else
        this.sendMessage(
          channelID,
          `\`\`\`diff\n- Invalid command\`\`\``,
          "red"
        );
    }
  }

  dkp_command_giveOrTake(currentUser, channelID, command) {
    let botMessage;
    let modifier = command.split(" ")[0];
    let amount = parseInt(command.split(" ")[1]);
    let targetUser = command.split(" ")[2];
    let num = 3;
    while (command.split(" ")[num]) {
      targetUser += ` ${command.split(" ")[num]}`;
      num += 1;
    }

    if (amount > this.maxDailyDKP * 2) {
      botMessage = `\`\`\`diff\n- Too much DKP, max ${this.maxDailyDKP *
        2}\`\`\``;
      this.sendMessage(channelID, botMessage, "red");
      return;
    }
    RegExp(`^${targetUser}$`, "i").test(currentUser);
    if (RegExp(`^${targetUser}$`, "i").test(currentUser)) {
      botMessage = `\`\`\`diff\n- That would be silly, you silly goose.\`\`\``;
      this.sendMessage(channelID, botMessage, "red");
      return;
    }

    let users = this.dkpScores.users;
    let targetUserIndex = this.findOrCreateUser(targetUser);
    let userIndex = this.findOrCreateUser(currentUser);
    let msgColor = "pink";
    if (targetUserIndex >= 0 && userIndex >= 0) {
      let now = new Date(new Date().toJSON().split("T")[0]);
      let then = new Date(
        new Date(users[userIndex].bank.lastUpdate).toJSON().split("T")[0]
      );
      if (Math.abs(now - then) >= 86400000) {
        let dkpToGive =
          currentUser == this.getTopDkpUser().username
            ? this.maxDailyDKP * 2
            : this.maxDailyDKP;
        users[userIndex].bank.dkp = dkpToGive;
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
        this.saveScoresToJSON();

        log.notice(
          `${currentUser} ${modifier} ${amount} to/from ${targetUser}`
        );
      } else {
        botMessage = `\`\`\`diff\n- Not enough DKP, you only have ${
          users[userIndex].bank.dkp
        }\`\`\``;
        msgColor = "red";
      }
    } else {
      botMessage = `\`\`\`diff\n- Did not find the username ${targetUser}\`\`\``;
      msgColor = "red";
    }
    this.sendMessage(channelID, botMessage, msgColor);
  }

  saveScoresToJSON() {
    this.dkpScores.users.sort(this.dynamicSort("-dkp"));
    let json = JSON.stringify(this.dkpScores);
    fs.writeFile("dkp.json", json, "utf8");
  }

  dynamicSort(property) {
    var sortOrder = 1;
    if (property[0] === "-") {
      sortOrder = -1;
      property = property.substr(1);
    }
    return function(a, b) {
      var result =
        a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
      return result * sortOrder;
    };
  }

  getTopDkpUser() {
    let bestScorer = { dkp: -900000 };
    for (let user of this.dkpScores.users) {
      if (bestScorer.dkp < user.dkp) {
        bestScorer = user;
      }
    }
    return bestScorer;
  }

  dkp_command_default() {
    let botMessage =
      "Dragon Killing Master God is: <@" +
      this.getTopDkpUser().id +
      ">\n```diff\n" +
      "You can give and take a total of " +
      this.maxDailyDKP +
      " DKP every day.\nUnless you are top scorer, then it's " +
      this.maxDailyDKP * 2 +
      " DKP!" +
      "\n\ncommands:" +
      "\n!dkp - show dkp commands" +
      "\n!dkp list - list all users and their DKP" +
      "\n!dkp give/g <amount> <user> - give DKP" +
      "\n!dkp take/t <amount> <user> - take DKP (50% DR)" +
      "\n!dkp dice/d <amount> h/high/l/low/7 - feeling lucky?" +
      "\n\nexamples:" +
      "\n!dkp give 200 Tin" +
      "\n!dkp g 200 Tin" +
      "\n!dkp take 100 Lazoul" +
      "\n!dkp t 100 Lazoul" +
      "\n!dkp dice 500 l" +
      "\n!dkp d 300 h" +
      "\n!dkp d 500 7" +
      "\n\ndaily commands:" +
      "\n!dkp bless - bless the leaderboard" +
      "\n!dkp curse - curse the leadeboard" +
      "\n!dkp sellsoul/ss - sell your soul (only at 0 DKP)" +
      "```";
    return botMessage;
  }
};
