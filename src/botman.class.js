const Discord = require("discord.io");
const fs = require("fs");
const table = require("text-table");
const schedule = require("node-schedule");
const Log = require("log");
const rp = require('request-promise');
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

  nightwave(channelID) {
    rp({
      uri: `https://api.warframestat.us/pc/nightwave`,
      json: true
    }).then(res => {
      var options = {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        hour: 'numeric',
        minute: 'numeric'
      }
      const ends = new Date(res.activeChallenges.slice(-1)[0].expiry).toLocaleString("sv-SE", options)
      let usersTable = [
        ["[Description]", "[Reputation]"]
      ];

      let lazyDoOnce = true;
      const challenges = res.activeChallenges.sort((a, b) => b.reputation - a.reputation)
        .reduce((acc, challenge) => {
          if (challenge.reputation < 2000 && lazyDoOnce) {
            acc.push(["[Daily challenges]", ""])
            lazyDoOnce = false;
          }
          acc.push([challenge.desc, challenge.reputation])
          return acc
        }, usersTable)
      let botMessage = "```css\n";
      botMessage += table(challenges, {
        align: ["l", "r"]
      }) + "```\n";
      botMessage += "```ini\n[Nightwave ends: " + ends + "]```"
      this.sendMessage(channelID, botMessage);
    })
  }

  baro(channelID) {
    rp({
      uri: `https://api.warframestat.us/pc/voidTrader`,
      json: true
    }).then(res => {
      let botMessage = "";
      let msgColor = "red"

      if (res.active) {
        botMessage += "```ini\nBaro Ki'Teer is here on [" + res.location + "]```";
        msgColor = "green"
      } else {
        botMessage += "```ini\nBaro will be here in [" + res.startString + "]\nAnd will land on [" + res.location + "]```";
      }
      this.sendMessage(channelID, botMessage, msgColor);
    })
  }

  cetus(channelID) {
    rp({
      method: "GET",
      uri: `https://api.warframestat.us/pc/cetusCycle`,
      json: true
    }).then(res => {
      const timeOfDay = res.isDay ? 'day' : 'night';
      const msgColor = res.isDay ? 'red' : 'green';
      this.sendMessage(channelID, `\`\`\`diff\nIt's currently ${timeOfDay} with ${res.timeLeft} left\`\`\``, msgColor);
    })
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
          exec(`C:\\Program Files (x86)\\TeamViewer\\TeamViewer.exe`, function (
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
        play: () => {
          this.play_commands(user, channelID, message);
        },
        cetus: () => {
          this.cetus(channelID);
        },
        nw: () => {
          this.nightwave(channelID);
        },
        nightwave: () => {
          this.nightwave(channelID);
        },
        b: () => {
          this.baro(channelID);
        },
        baro: () => {
          this.baro(channelID);
        },
        default: () => {
          this.sendMessage(channelID, "```diff\n- Invalid command```", "red");
        }
      };
      typeof activeCommands[command] == "function" ?
        activeCommands[command]() :
        activeCommands["default"]();
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
            },
            sellsoul: {
              lastUpdate: new Date(0)
            },
            blessOrCurse: {
              lastUpdate: new Date(0)
            },
            inventory: {
              1: 0
            }
          });
          index = users.length - 1;
          break;
        }
      }
    }
    return index;
  }

  play_commands(user, channelID, message) {
    let commands = message.split("!play ")[1];
    let command = message.split("!play ")[1];
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

    typeof activeCommands[command] == "function" ?
      activeCommands[command]() :
      activeCommands["default"]();
  }


  command_roll(user, channelID, message) {
    let diceOne = Math.floor(Math.random() * 6);
    let diceTwo = Math.floor(Math.random() * 6);
    let diceSum = (diceOne + diceTwo) + 2;

    //custom emojis added ass :d1: :d2: etc. from img folder
    let diceMapping = [
      "<:d1:432210697318039552>",
      "<:d2:432210699427643393>",
      "<:d3:432210699540758543>",
      "<:d4:432210696902803467>",
      "<:d5:432210696965586954>",
      "<:d6:432210699264196625>"
    ];

    let botMessage = `**${user}** rolls the dices.\n\n${diceMapping[diceOne]} ${diceMapping[diceTwo]}\n\nTotal: **${diceSum}**`;
    this.sendMessage(channelID, botMessage);
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
    let count = 1;
    let topDkp = this.getTopDkpUser();
    let botMessage = '';

    let usersTable = [
      ["#", "User", "DKP"]
    ];
    for (let user of this.dkpScores.users) {
      if (user.dkp == 0) {
        continue;
      }
      usersTable.push([count, user.username, (user.dkp).toLocaleString()]);
      count++;
    }
    botMessage += "```glsl\n";
    botMessage += table(usersTable, {
      align: ["l", "l", "r"]
    }) + "```";

    // let dragonGodTable = [ ['# Dragon Killing God'],
    //                         ['#', 'DKP'],
    //                   ['1  '+topDkp.username, (topDkp.dkp).toLocaleString()]]
    // botMessage += `\`\`\`glsl\n`
    // botMessage += table(dragonGodTable, { align: ['l', 'r']}) + "```";

    let recordHolderTable = [
      ['#  All-time best DKP'],
      ['#', 'DKP'],
      ['   ' + this.dkpScores.record.username, (this.dkpScores.record.score).toLocaleString()]
    ]
    botMessage += `\`\`\`glsl\n`
    botMessage += table(recordHolderTable, {
      align: ['l', 'r']
    }) + "```";
    this.sendMessage(channelID, botMessage);
  }

  dkp_command_shop(user, channelID, commands) {
    let users = this.dkpScores.users;
    let userIndex = this.findOrCreateUser(user);

    let cost = 1000;
    let amountPerPurchase = 3;

    let items = {
      1: {
        name: 'Lucky Number 7',
        description: 'Wins with 7 on high and low.'
      }
    }

    let numberOfShopItems = Object.keys(items).length;


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
        let botMessage = "```glsl\n";
        let inventoryTable = [
          ["", "Inventory", ""],
          ["#", "Item", "Amount"]
        ];
        for (let i = 1; i <= numberOfShopItems; i++) {
          if (users[userIndex].inventory[i]) {
            inventoryTable.push([i, items[i].name, users[userIndex].inventory[i]])
          }
        }
        botMessage += table(inventoryTable, {
          align: ["l", "l", "r"]
        }) + "```";
        this.sendMessage(channelID, botMessage);
      }
    } else {
      let botMessage =
        "\n```diff\n" +
        "\nShop commands:" +
        "\n!play shop/s buy/b <#> <amount> - Buy item nr # and the amount" +
        "\n!play inventory/i               - Shows you your inventory\n\nExample: " +
        "\n!play s b 1 3 - Will buy you 3x of item nr 1" +
        "\n!play s i     - Will show you your inventory```" +
        "```glsl\n\nOffers:\n";
      let offersTable = [
        ['#', 'Name', 'Description']
      ];

      for (let i = 1; i <= numberOfShopItems; i++) {
        offersTable.push([i, items[i].name, items[i].description])
      }
      botMessage += table(offersTable, {
        align: ["l", "l", "l"]
      }) + "```";
      // "\n\nOffers:" +
      // "\n\n1 - Lucky Number 7 - 100dkp" +
      // "\n   The number 7 seems to be both high and low (3 uses)" +
      // "\n\n2 - Low-tilted Dices - 100dkp" +
      // "\n   Low numbers seem oddly favorable? (3 uses)" +
      // "\n\n3 - High-tilted Dices - 100dkp" +
      // "\n   High numbers seem to come more often? (3 uses)" +
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

    if (amount.includes(','))
      amount = amount.replace(/,/g, '')

    //quick bugfix
    if (!users[userIndex].inventory) {
      users[userIndex].inventory = {
        1: 0
      }
    }

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

      let botMessage = `${user} places a ${amount.toLocaleString()} DKP bet on ${
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
        botMessage += `Holy smokes, you just won ${winnings.toLocaleString()} DKP, `;
      } else if (
        (choice == "high" || choice == "h") &&
        (diceSum > 7 || (diceSum == 7 && users[userIndex].inventory[1] >= 1))
      ) {
        if (diceSum == 7) {
          users[userIndex].inventory[1] -= 1;
        }
        winnings = amount * 2;
        users[userIndex].dkp += winnings;
        botMessage += `High win, you just won ${winnings.toLocaleString()} DKP, `;
      } else if (
        (choice == "low" || choice == "l") &&
        (diceSum < 7 || (diceSum == 7 && users[userIndex].inventory[1] >= 1))
      ) {
        if (diceSum == 7) {
          users[userIndex].inventory[1] -= 1;
        }
        winnings = amount * 2;
        users[userIndex].dkp += winnings;
        botMessage += `Low win, you just won ${winnings.toLocaleString()} DKP, `;
      } else {
        botMessage += "You loose your hard earned DKP, ";
        msgColor = "red";
      }
      botMessage += "setting your total to " + (users[userIndex].dkp).toLocaleString();
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

    //perhaps it tried give/take <username> <amount> instead
    //worth a try since otherwise the command is invalid anyway
    if (!amount) {
      targetUser = command.split(" ")[1]
      amount = parseInt(command.split(" ")[2])
    }

    let num = 3;
    while (command.split(" ")[num]) {
      targetUser += ` ${command.split(" ")[num]}`;
      num += 1;
    }

    // if (amount > this.maxDailyDKP * 2) {
    //   botMessage = `\`\`\`diff\n- Too much DKP, max ${this.maxDailyDKP *
    //     2}\`\`\``;
    //   this.sendMessage(channelID, botMessage, "red");
    //   return;
    // }

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
          currentUser == this.getTopDkpUser().username ?
          this.maxDailyDKP * 2 :
          this.maxDailyDKP;
        users[userIndex].bank.dkp = dkpToGive;
        users[userIndex].bank.lastUpdate = now;
      }

      if ((users[userIndex].bank.dkp + users[userIndex].dkp) >= amount) {

        if (users[userIndex].bank.dkp < amount) {
          users[userIndex].dkp -= amount - users[userIndex].bank.dkp
          users[userIndex].bank.dkp = 0
        } else {
          users[userIndex].bank.dkp -= amount;
        }

        if (modifier == "give" || modifier == "g") {
          users[targetUserIndex].dkp += amount;
          botMessage = `\`\`\`diff\n+ Gave ${amount} DKP to `;
        } else if (modifier == "take" || modifier == "t") {
          users[targetUserIndex].dkp -= Math.floor(amount / 2);
          botMessage = `\`\`\`diff\n+ Took ${Math.floor(amount / 2)} DKP from `;
        }
        botMessage += `${targetUser}, you now have ${
          users[userIndex].bank.dkp
          } more DKP to give or take from your daily quota today.\`\`\``;
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
    this.getTopDkpUser();
    this.dkpScores.users.sort(this.dynamicSort("-dkp"));
    let json = JSON.stringify(this.dkpScores);
    fs.writeFile("dkp.json", json, "utf8", err => {
      if (err) console.log("Error saving to file. this.dkpScores:", this.dkpScores)
    });
  }

  dynamicSort(property) {
    var sortOrder = 1;
    if (property[0] === "-") {
      sortOrder = -1;
      property = property.substr(1);
    }
    return function (a, b) {
      var result =
        a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
      return result * sortOrder;
    };
  }

  getTopDkpUser() {
    let bestScorer = {
      dkp: -900000
    };
    for (let user of this.dkpScores.users) {
      if (bestScorer.dkp < user.dkp) {
        bestScorer = user;
      }
    }
    if (this.dkpScores.record.score < bestScorer.dkp) {
      this.dkpScores.record.username = bestScorer.username;
      this.dkpScores.record.score = bestScorer.dkp;
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
      "\n!play list/l                 - list all users and their DKP" +
      "\n!play dice/d <amount> h/l/7  - feeling lucky?" +
      "\n!play shop/s                 - Go to the shop" +
      "\n\nexamples:" +
      "\n!play g 200 Tin    - Gives 200 DKP to Tin" +
      "\n!play t 100 Lazoul - Takes 50 DKP from Lazol" +
      "\n!play d 500 h      - Dices 500DKP on High" +
      "\n\ndaily commands:" +
      "\n!play bless       - bless the leaderboard" +
      "\n!play curse       - curse the leadeboard" +
      "\n!play sellsoul/ss - sell your soul (only at 0 DKP)" +
      "```";
    return botMessage;
  }

};