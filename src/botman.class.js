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
    fs.readFile("score.json", (err, data) => {
      if (err) throw err;
      this.latinumScores = JSON.parse(data);
    });
    fs.readFile("rulesOfAcquisition.json", (err, data) => {
      if (err) throw err;
      this.rulesOfAcquisition = JSON.parse(data);
    });
    this.maxDailyLatinum = 500000;
  }

  dabo(user, channelID, message) {


    const iconMap = {
      nBH: '<:BH:569203914025598997>',
      nDS: '<:DS:569203914071605259>',
      nQW: '<:QW:569203914088513551>',
      nSW: '<:SW:569203914025598977>',

      RC1: '<:RC1:569195523655860224>',
      RC2: '<:RC2:569195538390450187>',
      RC3: '<:RC3:569195549048307712>',
      GC1: '<:GC1:569195564894519306>',
      GC2: '<:GC2:569195576747360269>',
      GC3: '<:GC3:569195589380603999>',
      BC1: '<:BC1:569195616756957229>',
      BC2: '<:BC2:569195629017038859>',
      BC3: '<:BC3:569195640748245073>',
      WC1: '<:WC1:569195653247402104>',
      WC2: '<:WC2:569195662973992992>',
      WC3: '<:WC3:569195673799360512>',

      RT1: '<:RT1:569233706129293323>',
      RT2: '<:RT2:569233706338746388>',
      RT3: '<:RT3:569233706254860291>',
      GT1: '<:GT1:569233706120904704>',
      GT2: '<:GT2:569233706238083074>',
      GT3: '<:GT3:569233706145808395>',
      BT1: '<:BT1:569233704141062146>',
      BT2: '<:BT2:569233704971534366>',
      BT3: '<:BT3:569233704682258452>',
      WT1: '<:WT1:569233706716495882>',
      WT2: '<:WT2:569233706649125024>',
      WT3: '<:WT3:569233706729078785>',

      RS1: '<:RS1:569233706372562944>',
      RS2: '<:RS2:569233706275962880>',
      RS3: '<:RS3:569233706288414721>',
      GS1: '<:GS1:569233704426405920>',
      GS2: '<:GS2:569233704510029854>',
      GS3: '<:GS3:569233705781035009>',
      BS1: '<:BS1:569233702727581706>',
      BS2: '<:BS2:569233702593363990>',
      BS3: '<:BS3:569233704497578014>',
      WS1: '<:WS1:569233706569564209>',
      WS2: '<:WS2:569233706288676865>',
      WS3: '<:WS3:569233706187882509>'
    }
    const wheel = [
      'SW', 'T1', 'T2', 'S3', 'C1', 'BH', 'S2', 'C3', 'S3',
      'S1', 'DS', 'S2', 'T1', 'C1', 'T3', 'C1', 'SW', 'S3',
      'C2', 'BH', 'S2', 'T3', 'DS', 'S1', 'T2', 'C2', 'T3',
      'QW', 'C3', 'T1', 'C2', 'BH', 'T3', 'DS', 'S1', 'C3'
    ]
    const colorsMap = [
      'n', 'B', 'R', 'G', 'B', 'n', 'R', 'G', 'B',
      'R', 'n', 'B', 'G', 'R', 'B', 'G', 'n', 'R',
      'B', 'n', 'G', 'R', 'n', 'B', 'G', 'R', 'G',
      'n', 'B', 'R', 'G', 'n', 'B', 'n', 'G', 'R'
    ];
    const minimumPlayAmount = 300;
    let users = this.latinumScores.users;
    let userIndex = this.findOrCreateUser(user);
    let commands = message.split(/(!dabo|!d)\s*/i)[2];
    let chosenAmount = commands.split(" ")[0];
    let chosenSlot = commands.split(" ")[1];
    let forbiddenSlots = new Set([5, 6, 7, 17, 18, 19, 29, 30, 31]);

    if (chosenAmount == 'help') {
      this.sendMessage(channelID, 'See all we know about Dabo here\nhttps://sto.gamepedia.com/Dabo')
      return
    }
    if (chosenAmount == 'payouts') {
      this.sendMessage(channelID, 'See full table of payouts here\nhttps://imgur.com/a/GI80CaF')
      return
    }
    // if(channelID == "356243839796903947"){
    //   this.sendMessage(channelID,"Playing forbidden in this chat channel. Try another channel")
    //   return
    // }

    if (!/^\s*(\d+)\s*$/.test(chosenAmount)) {
      this.sendMessage(channelID, 'Invalid command\n!dabo 100 0,1,2 - bet 100 bars on 0,1,2 (total of 300 bars)\n!dabo rules - for rules\n!dabo payouts - for winning combos')
      return
    }
    if (typeof chosenSlot == 'undefined') {
      chosenSlot = "0"
    }

    if(/,$/.test(chosenSlot)){
      this.sendMessage(channelID, 'Invalid command\n\n!dabo 100 0,1,2 - bet 100 bars on 0,1,2 (total of 300 bars)')
      return
    }

    let playPositions = chosenSlot.split(",")

    if (chosenAmount.includes(','))
      chosenAmount = chosenAmount.replace(/,/g, '')

    chosenAmount = parseInt(chosenAmount)

    if(chosenAmount < minimumPlayAmount){
      this.sendMessage(channelID, 'Minimum play amount is ' + minimumPlayAmount, 'red')
      return
    }

    if (playPositions.length > 3) {
      this.sendMessage(channelID, 'You can only play on 3 slots', 'red')
      return
    }

    if (users[userIndex].latinum  < (chosenAmount * playPositions.length)) {
      this.sendMessage(channelID, 'Not enough Latinum', 'red')
      return
    }

    let usedForbiddenSlot = false;
    let usedNotExistingSlot = false;
    let forbiddenFound = ""
    playPositions.forEach(choice => {
      choice = parseInt(choice)

      if (forbiddenSlots.has(choice)) {
        forbiddenFound += choice;
        usedForbiddenSlot = true;
      }

      if(choice > 35 || choice < 0){
        usedNotExistingSlot = true;
      }
      
    })

    if (usedForbiddenSlot) {
      this.sendMessage(channelID,
        forbiddenFound.split('').length > 1 ?
        forbiddenFound.split('').join(',') + ' are forbidden play slots\nForbidden slots are 5-7, 17-19, 29-31' :
        forbiddenFound + ' is a forbidden play slot\nForbidden slots are 5-7, 17-19, 29-31',
        'red');
      return
    }

    if (chosenAmount <= 0) {
      this.sendMessage(channelID, 'Need to bet more than ' + chosenAmount + ' bars of Latinum.', 'red')
      return
    }

    if (usedNotExistingSlot) {
      this.sendMessage(channelID, 'Invalid play slot\nAllowed play slots range from 0-35\nForbidden slots are 5-7, 17-19, 29-31', 'red')
      return
    }

    let botMessage = `\`\`\`md\n<DABO WHEEL> for ${user} <${chosenAmount * playPositions.length}>\n`;
    botMessage += `<${chosenAmount}> bars each on ${playPositions}\`\`\`\n`

    const roll1 = Math.floor(Math.random() * 36)
    const roll2 = Math.floor(Math.random() * 36)
    const roll3 = Math.floor(Math.random() * 36)
    let winMultiplier = 0;

    playPositions.forEach(playPosition => {
      playPosition = parseInt(playPosition)
      let allColors = {
        R: 0,
        G: 0,
        B: 0,
        n: 0
      };
      let allShapes = {
        S: 0,
        C: 0,
        T: 0,
        DS: 0,
        SW: 0,
        QW: 0
      };
      let allCount = {
        1: 0,
        2: 0,
        3: 0
      };

      const slotPosition = (rolledNumber) => {
        let tmp = 0;
        if (rolledNumber + playPosition > 35) {
          tmp = ((rolledNumber + playPosition) - 36)
          allColors[colorsMap[tmp]] += 1
          return tmp
        }
        return rolledNumber + playPosition
      }

      const innerWheelRoll = slotPosition(roll1)
      const centerWheelRoll = slotPosition(roll2)
      const outerWheelRoll = slotPosition(roll3)
      const allWheels = [wheel[innerWheelRoll], wheel[centerWheelRoll], wheel[outerWheelRoll]]
      let blackHoles = 0

      allWheels.forEach(wheel => {
        if (wheel == 'DS' ||
          wheel == 'SW' ||
          wheel == 'QW') {
          allShapes[wheel] += 1
        } else if (wheel == 'BH') {
          blackHoles += 1
        } else  {
          allShapes[wheel.split(/(^[A-Z0-9])/)[1]] += 1
          allCount[wheel.split(/(^[A-Z0-9])/)[2]] += 1
        }
      })

      const getMax = (obj) => {
        return Math.max.apply(Math, Object.values(obj).map(function (o) {
          return o
        }))
      }

      const shapes = getMax(allShapes);
      delete allColors['n'];
      const colors = getMax(allColors);
      const counts = getMax(allCount);

      let innerRowPrefix = wheel[innerWheelRoll]

      if (
        innerRowPrefix !== 'DS' &&
        innerRowPrefix !== 'SW' &&
        innerRowPrefix !== 'QW' &&
        innerRowPrefix !== 'BH') {
        innerRowPrefix = 'W' + innerRowPrefix
      } else {
        innerRowPrefix = 'n' + innerRowPrefix
      }

      let innerRowClean = iconMap[innerRowPrefix];
      let centerRowClean = iconMap[colorsMap[centerWheelRoll] + wheel[centerWheelRoll]];
      let outerRowClean = iconMap[colorsMap[outerWheelRoll] + wheel[outerWheelRoll]];

      botMessage += `${innerRowClean} ${centerRowClean} ${outerRowClean}\n`;
      botMessage += `\`\`\`md\n<${playPosition}`;

      users[userIndex].latinum -= chosenAmount;

      if (allShapes['DS'] == 3) {
        botMessage += " Deep Space Dabo!!>"
        winMultiplier += 2000
      } else if (allShapes['SW'] == 3) {
        botMessage += " Swirl Dabo!!>"
        winMultiplier += 1000
      } else if (allShapes['QW'] == 3) {
        winMultiplier += 150
        botMessage += " Quarks Dabo!!>"
      } else if (shapes == 3 && colors == 2 && counts == 3) {
        botMessage += " DABO!!"
        winMultiplier += 10
      } else if (allShapes['QW'] == 2) {
        botMessage += " Quarks two of a kind!>"
        winMultiplier += 5
      } else if (allShapes['DS'] == 2) {
        botMessage += " Deep Space two of a kind!>"
        winMultiplier += 4
      } else if (counts == 3 || ((allShapes['SW'] + blackHoles) == 3)) {
        botMessage += " Three of a kind!>"
        winMultiplier += 2
      } else if (colors == 2 && counts == 3) {
        botMessage += " Three of a kind!>"
        winMultiplier += 2
      } else if (shapes == 3 && counts == 3) {
        botMessage += " Three of a kind!>"
        winMultiplier += 2
      } else if (shapes == 2 && colors == 2 && counts == 3) {
        botMessage += " Three of a kind!>"
        winMultiplier += 2
      } else if (shapes == 2 && counts == 3) {
        botMessage += " Three of a kind!>"
        winMultiplier += 2
      } else if (shapes == 3) {
        botMessage += " Three of a kind!>"
        winMultiplier += 1.5
      } else if (shapes == 3 && colors == 2) {
        botMessage += " Three of a kind!>"
        winMultiplier += 1.5
      } else if (shapes == 3 && counts == 2) {
        botMessage += " Three of a kind!>"
        winMultiplier += 1.5
      } else if (shapes == 3 && colors == 2 && counts == 2) {
        botMessage += " Three of a kind!>"
        winMultiplier += 1.5
      } else if (colors == 2) {
        botMessage += " Two of a kind!>"
        winMultiplier += 0.2
      } else if (colors == 2 && counts == 2) {
        botMessage += " Two of a kind!>"
        winMultiplier += 0.2
      } else if (shapes == 2 && colors == 2) {
        botMessage += " Two of a kind!>"
        winMultiplier += 0.2
      } else if (shapes == 2 && colors == 2 && counts == 2) {
        botMessage += " Two of a kind!>"
        winMultiplier += 0.2
      } else if (counts == 2) {
        botMessage += " Two of a kind!>"
        winMultiplier += 0.15
      } else if (shapes == 2 && counts == 2) {
        botMessage += " Two of a kind!>"
        winMultiplier += 0.15
      } else if (shapes == 2) {
        botMessage += " Two of a kind!>"
        winMultiplier += 0.1
      } else {
        botMessage += " Quark Wins>"
      }
      botMessage += '```\n'
    })

    const profit = Math.floor((chosenAmount * playPositions.length) * winMultiplier);
    botMessage += `\`\`\`md\n<${Math.floor(winMultiplier * 100)}%> return of <${profit}> ${profit <= 1 ? profit == 1 ? 'bar of Latinum' : '' : 'bars of Latinum'}`
    users[userIndex].latinum += profit;
    this.saveScoresToJSON();
    this.sendMessage(channelID,
      botMessage + `\`\`\``, 'purple');
  }

  messageHandler() {
    this.bot.on("message", (user, userID, channelID, message, evt) => {
      if (
        !/^!/.test(message) ||
        RegExp(`^${user}$`, "i").test(this.bot.username)
      )
        return;

      let command = message.substring(1).split(" ")[0].toLowerCase();
      if (/so+rti+e+/.test(command)) command = "sortie";
      const activeCommands = {
        roll: () => {
          this.command_roll(user, channelID, message);
        },
        r: () => {
          this.rules(channelID, message);
        },
        d: () => {
          this.dabo(user, channelID, message);
        },
        dabo: () => {
          this.dabo(user, channelID, message);
        },
        rule: () => {
          this.rules(channelID, message);
        },
        rules: () => {
          this.rules(channelID, message);
        },
        p: () => {
          this.play_commands(user, channelID, message);
        },
        play: () => {
          this.play_commands(user, channelID, message);
        },
        c: () => {
          this.cetus(channelID);
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
        s: () => {
          this.sortie(channelID);
        },
        sortie: () => {
          this.sortie(channelID);
        },
        god: () => {
          if (!(userID == "201004098600828928")) {
            //this.sendMessage(channelID, "```diff\n- Invalid command```", "red");
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
        default: () => {
          //this.sendMessage(channelID, "```diff\n- Invalid command```", "red");
        }
      };
      typeof activeCommands[command] == "function" ?
        activeCommands[command]() :
        activeCommands["default"]();
    });
  }

  sendMessage(channelID, botMessage, color = "pink") {
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
    let users = this.latinumScores.users;
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
            latinum: 0,
            bank: {
              lastUpdate: new Date(new Date().toJSON().split("T")[0]),
              latinum: this.maxDailyLatinum
            },
            sellsoul: {
              lastUpdate: new Date(0)
            },
            investOrScam: {
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
    let commands = message.split(/^(!play|!p)\s+/i)[2];
    let command = message.split(/^(!play|!p)\s+/i)[2];

    if (typeof commands != "undefined") {
      command = commands.split(" ")[0];
    }

    // if(channelID == "356243839796903947"){
    //   this.sendMessage(channelID,"Playing forbidden in this chat channel. Try another channel")
    //   return
    // }

    const activeCommands = {
      shop: () => {
        this.play_command_shop(user, channelID, commands);
      },
      s: () => {
        this.play_command_shop(user, channelID, commands);
      },
      invest: () => {
        this.play_command_invest_or_scam(user, channelID, command);
      },
      scam: () => {
        this.play_command_invest_or_scam(user, channelID, command);
      },
      list: () => {
        this.play_command_list(channelID);
      },
      l: () => {
        this.play_command_list(channelID);
      },
      sellsoul: () => {
        this.play_command_sellSoul(user, channelID);
      },
      ss: () => {
        this.play_command_sellSoul(user, channelID);
      },
      dice: () => {
        // this.play_command_dice(user, channelID, commands);
        this.sendMessage(channelID, 'Use !dabo instead')
      },
      d: () => {
        // this.play_command_dice(user, channelID, commands);
        this.sendMessage(channelID, 'Use !dabo instead')
      },
      give: () => {
        this.play_command_giveOrTake(user, channelID, commands);
      },
      g: () => {
        this.play_command_giveOrTake(user, channelID, commands);
      },
      take: () => {
        this.play_command_giveOrTake(user, channelID, commands);
      },
      t: () => {
        this.play_command_giveOrTake(user, channelID, commands);
      },
      default: () => {
        this.sendMessage(channelID, this.play_command_default());
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
      "<:d3:569194984033746984>",
      "<:d4:432210696902803467>",
      "<:d5:432210696965586954>",
      "<:d6:432210699264196625>"
    ];

    let botMessage = `**${user}** rolls the dices.\n\n${diceMapping[diceOne]} ${diceMapping[diceTwo]}\n\nTotal: **${diceSum}**`;
    this.sendMessage(channelID, botMessage);
  }

  play_command_invest_or_scam(user, channelID, command) {
    let users = this.latinumScores.users;
    let userIndex = this.findOrCreateUser(user);
    let newUser = false;

    if (!users[userIndex].investOrScam) {
      users[userIndex].investOrScam = {};
      newUser = true;
    }
    let now = new Date(new Date().toJSON().split("T")[0]);
    let then = new Date(
      new Date(newUser || users[userIndex].investOrScam.lastUpdate)
      .toJSON()
      .split("T")[0]
    );
    if (Math.abs(now - then) >= 86400000) {
      users.forEach(user => {
        if (user.latinum > 0) {
          if (command == "invest") {
            user.latinum += Math.round(user.latinum * 0.05);
          } else {
            user.latinum -= Math.round(user.latinum * 0.05);
          }
        }
      });
      if (command == "invest") {
        this.sendMessage(
          channelID,
          user +
          " invest in a Hupyrian beetle farm that benefits the whole sector. (+5% Latinum)",
          "green"
        );
      } else {
        this.sendMessage(
          channelID,
          user +
          " has terrible lobes for business and made everybody loose Latinum. (-5% Latinum)",
          "red"
        );
      }
      users[userIndex].investOrScam.lastUpdate = now;
      this.saveScoresToJSON();
    } else {
      this.sendMessage(
        channelID,
        user +
        ", you have already signed your daily contract."
      );
    }
  }

  play_command_list(channelID) {
    let botMessage = '';
    let userIndex = this.findOrCreateUser(user);
    let usersTable = [
      ['', '', '.'],
      ['#', 'CITIZENS WEALTH', '#'],
      ['', '', '']
    ];
    for (let user of this.latinumScores.users) {
      if (user.latinum == 0) {
        continue;
      }
      usersTable.push([user.username, '', (user.latinum).toLocaleString()]);
    }

    let recordHolderTable = [
      ['', '', ''],
      ['#', '----------------------------', '#'],
      ['#', 'LARGEST LOBES EVER SEEN', '#'],
      ['#', '----------------------------', '#'],
      ['', '', ''],
      [' ', this.latinumScores.record.username + ' - ' + (this.latinumScores.record.latinum).toLocaleString(), ''],
      ['', '', '.']
    ];

    let bothTables = [...usersTable, ...recordHolderTable]

    botMessage += codeBlock(table(bothTables, {
      align: ["l", "c", "r"]
    }), 'glsl');
    this.sendMessage(channelID, botMessage);
  }

  play_command_shop(user, channelID, commands) {
    let users = this.latinumScores.users;
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
          users[userIndex].latinum >= cost &&
          (choiceNr >= 1 && choiceNr <= numberOfShopItems)
        ) {
          users[userIndex].latinum -= cost;
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
      let botMessage = codeBlock(
        "Shop commands:" +
        "\n!play shop/s buy/b <#> <amount> - Buy item nr # and the amount" +
        "\n!play inventory/i               - Shows you your inventory\n" +
        "\nExample: " +
        "\n!play s b 1 3 - Will buy you 3x of item nr 1" +
        "\n!play s i     - Will show you your inventory", 'diff')
      botMessage += "```glsl\n\nOffers:\n";
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
      // "\n\n1 - Lucky Number 7 - 100latinum" +
      // "\n   The number 7 seems to be both high and low (3 uses)" +
      // "\n\n2 - Low-tilted Dices - 100latinum" +
      // "\n   Low numbers seem oddly favorable? (3 uses)" +
      // "\n\n3 - High-tilted Dices - 100latinum" +
      // "\n   High numbers seem to come more often? (3 uses)" +
      this.sendMessage(channelID, botMessage);
    }
    this.saveScoresToJSON();
  }

  play_command_sellSoul(user, channelID) {
    let users = this.latinumScores.users;
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
    if (Math.abs(now - then) >= 86400000 && users[userIndex].latinum == 0) {
      let dice = Math.floor(Math.random() * 1000) + 1;
      if (dice >= 666 && dice <= 999) {
        this.sendMessage(
          channelID,
          `You signed a contract selling your sould for 666999666 bars of Latinum.`,
          "green"
        );
        users[userIndex].latinum += 666999666;
      } else {
        this.sendMessage(
          channelID,
          `You sold your Soul to the Devil and only got 666666 bars of Latinum for it.`,
          "red"
        );
        users[userIndex].latinum += 666666;
      }
      users[userIndex].sellsoul.lastUpdate = now;
      this.saveScoresToJSON();
    } else if (users[userIndex].latinum > 0) {
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

  play_command_dice(user, channelID, commands) {
    let users = this.latinumScores.users;
    let userIndex = this.findOrCreateUser(user);
    let amount = commands.split(" ")[1];
    let choice = commands.split(" ")[2];

    if (amount.includes(','))
      amount = amount.replace(/,/g, '')

    amount = parseInt(amount)

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
      users[userIndex].latinum >= amount
    ) {
      let msgColor = "green";
      users[userIndex].latinum -= amount;
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

      let botMessage = `${user} places a ${amount.toLocaleString()} bars of Latinum bet on ${
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
        users[userIndex].latinum += winnings;
        botMessage += `Holy smokes, you just won ${winnings.toLocaleString()} bars of Latinum, `;
      } else if (
        (choice == "high" || choice == "h") &&
        (diceSum > 7 || (diceSum == 7 && users[userIndex].inventory[1] >= 1))
      ) {
        if (diceSum == 7) {
          users[userIndex].inventory[1] -= 1;
        }
        winnings = amount * 2;
        users[userIndex].latinum += winnings;
        botMessage += `High win, you just won ${winnings.toLocaleString()} bars of Latinum, `;
      } else if (
        (choice == "low" || choice == "l") &&
        (diceSum < 7 || (diceSum == 7 && users[userIndex].inventory[1] >= 1))
      ) {
        if (diceSum == 7) {
          users[userIndex].inventory[1] -= 1;
        }
        winnings = amount * 2;
        users[userIndex].latinum += winnings;
        botMessage += `Low win, you just won ${winnings.toLocaleString()} bars of Latinum, `;
      } else {
        botMessage += "You loose your hard earned Latinum, ";
        msgColor = "red";
      }
      botMessage += "setting your total to " + (users[userIndex].latinum).toLocaleString();
      this.sendMessage(channelID, botMessage, msgColor);
      this.saveScoresToJSON();
      log.notice(
        `${user} bet ${amount} on ${choice} and ${
        winnings > 1 ? "winning " + winnings : "loosing it"
        } (Latinum:${users[userIndex].latinum})`
      );
    } else {
      if (users[userIndex].latinum <= amount)
        this.sendMessage(
          channelID,
          `\`\`\`diff\n- Not enough Latinum, you have ${
          users[userIndex].latinum
          }\`\`\``,
          "red"
        );
      // else
      // this.sendMessage(
      //   channelID,
      //   `\`\`\`diff\n- Invalid command\`\`\``,
      //   "red"
      // );
    }
  }

  play_command_giveOrTake(currentUser, channelID, command) {
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

    // if (amount > this.maxDailyLatinum * 2) {
    //   botMessage = `\`\`\`diff\n- Too much Latinum, max ${this.maxDailyLatinum *
    //     2}\`\`\``;
    //   this.sendMessage(channelID, botMessage, "red");
    //   return;
    // }

    if (RegExp(`^${targetUser}$`, "i").test(currentUser)) {
      botMessage = `\`\`\`diff\n- That would be silly, you silly goose.\`\`\``;
      this.sendMessage(channelID, botMessage, "red");
      return;
    }

    let users = this.latinumScores.users;
    let targetUserIndex = this.findOrCreateUser(targetUser);
    let userIndex = this.findOrCreateUser(currentUser);
    let msgColor = "pink";
    if (targetUserIndex >= 0 && userIndex >= 0) {
      let now = new Date(new Date().toJSON().split("T")[0]);
      let then = new Date(
        new Date(users[userIndex].bank.lastUpdate).toJSON().split("T")[0]
      );
      if (Math.abs(now - then) >= 86400000) {
        let latinumToGive =
          currentUser == this.getTopLatinumUser().username ?
          this.maxDailyLatinum * 2 :
          this.maxDailyLatinum;
        users[userIndex].bank.latinum = latinumToGive;
        users[userIndex].bank.lastUpdate = now;
      }

      if ((users[userIndex].bank.latinum + users[userIndex].latinum) >= amount) {

        if (users[userIndex].bank.latinum < amount) {
          users[userIndex].latinum -= amount - users[userIndex].bank.latinum
          users[userIndex].bank.latinum = 0
        } else {
          users[userIndex].bank.latinum -= amount;
        }

        if (modifier == "give" || modifier == "g") {
          users[targetUserIndex].latinum += amount;
          botMessage = `\`\`\`diff\n+ Gave ${amount} bars of Latinum to `;
        } else if (modifier == "take" || modifier == "t") {
          users[targetUserIndex].latinum -= Math.floor(amount / 2);
          botMessage = `\`\`\`diff\n+ Took ${Math.floor(amount / 2)} bars of Latinum from `;
        }
        botMessage += `${targetUser}, you now have ${
          users[userIndex].bank.latinum
          } more bars of Latinum to give or take from your daily quota today.\`\`\``;
        this.saveScoresToJSON();

        log.notice(
          `${currentUser} ${modifier} ${amount} to/from ${targetUser}`
        );
      } else {
        botMessage = `\`\`\`diff\n- Not enough bars of Latinum, you have ${
          users[userIndex].bank.latinum
          }\`\`\``;
        msgColor = "red";
      }
    } else {
      botMessage = `\`\`\`diff\n- Did not find the username ${targetUser}\`\`\``;
      msgColor = "red";
    }
    this.sendMessage(channelID, botMessage, msgColor);
  }


  rules(channelID, message) {
    const number = message.split(/^(!rule|!rules|!r)\s+/)[2];
    let botMessage = ""
    if (this.rulesOfAcquisition[number]) {
      botMessage = codeBlock(`# Rule of Acquisition ${number}\n${this.rulesOfAcquisition[number]}`, 'md')
      this.sendMessage(channelID, botMessage);
    } else if (number) {
      this.sendMessage(channelID, "Unfortunately our database does not have this Rule of Acquisition")
    } else {
      const length = Object.entries(this.rulesOfAcquisition).length
      const amountOfRandomRules = 3;
      let exampleRules = []
      for (let i = 0; i < amountOfRandomRules; i++) {
        exampleRules.push(Object.entries(this.rulesOfAcquisition)[Math.floor(Math.random() * length)])
      }

      botMessage = codeBlock(`# The Rules of Acquisition\n` +
        exampleRules.map(rule => {
          return `${rule[0]}. - ${rule[1]}\n`
        }).join("") +
        `\n!rule digit to look for a specific rule.`, 'md')
      this.sendMessage(channelID, botMessage)
    }
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

      let botMessage = codeBlock(table(challenges, {
        align: ["l", "r"]
      }), 'css')
      botMessage += codeBlock("[Nightwave challenges reset: " + ends + "]", 'ini')
      this.sendMessage(channelID, botMessage);
    })
  }

  baro(channelID) {
    let botMessage = "";
    let msgColor = "red"
    let inventoryTable = [
      ["[Item]", "[Ducats]"]
    ];

    rp({
      uri: `https://api.warframestat.us/pc/voidTrader`,
      json: true
    }).then(res => {
      if (res.active) {
        botMessage += codeBlock("Baro Ki'Teer is here on [" + res.location + "]", 'ini');
        msgColor = "green"

        const items = res.inventory.sort((a, b) => b.ducats - a.ducats)
          .reduce((acc, item) => {
            /** Mark primed blue with [] */
            if (item.item.includes('Primed')) {
              acc.push(['[' + item.item + ']', '[' + item.ducats + ']'])
            } else {
              acc.push([item.item, item.ducats])
            }
            return acc;
          }, inventoryTable)

        botMessage += codeBlock(table(items, {
          align: ["l", "r"]
        }), 'ini');
        botMessage += codeBlock("He's leaving in [" + res.endString + "]", 'ini');
      } else {
        botMessage += codeBlock("Baro will be here in [" + res.startString + "]\nAnd will land on [" + res.location + "]", 'ini');
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

  sortie(channelID) {
    rp({
      method: "GET",
      uri: "https://api.warframestat.us/pc/sortie",
      json: true
    }).then(res => {
      const {
        variants,
        eta,
        boss,
        faction
      } = res;
      let botMessage = "```css\n";
      variants.forEach(variant => {
        botMessage += (table([
          [variant.missionType, variant.node]
        ], {
          align: ["l", "r"]
        }) + "\n");
        botMessage += (variant.modifier + "\n");
        botMessage += (variant.modifierDescription + "\n");
        botMessage += "\n";
      });
      botMessage += ("Faction: " + faction + "\n");
      botMessage += ("Boss: " + boss + "\n");
      botMessage += ("Time left: " + eta + "```");
      this.sendMessage(channelID, botMessage);
    });
  }

  saveScoresToJSON() {
    this.getTopLatinumUser();
    this.latinumScores.users.sort(this.dynamicSort("-latinum"));
    let json = JSON.stringify(this.latinumScores);
    fs.writeFile("score.json", json, "utf8", err => {
      if (err) console.log("Error saving to file. this.latinumScores:", this.latinumScores)
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

  getTopLatinumUser() {
    let bestScorer = {
      latinum: -900000
    };
    for (let user of this.latinumScores.users) {
      if (bestScorer.latinum < user.latinum) {
        bestScorer = user;
      }
    }
    if (this.latinumScores.record.latinum < bestScorer.latinum) {
      this.latinumScores.record.username = bestScorer.username;
      this.latinumScores.record.latinum = bestScorer.latinum;
    }
    return bestScorer;
  }

  play_command_default() {
    let botMessage =
      "Grand Nagus: <@" +
      this.getTopLatinumUser().id +
      ">\n```diff\n" +
      "You can give and take a total of " +
      this.maxDailyLatinum +
      " Latinum every day.\nUnless you are wealthiest, then it's " +
      this.maxDailyLatinum * 2 +
      " Latinum!" +
      "\n\ncommands:" +
      "\n!play list/l           - list users with latinum" +
      "\n!dabo <amount> <slots> - test your luck on the Dabo wheel" +
      "\n!play shop/s           - Go to the shop" +
      "\n\nexamples:" +
      "\n!play g 200 Tin    - Gives 200 bars of Latinum to Tin" +
      "\n!play t 100 Lazoul - Takes 50 bars of Latinum from Lazol" +
      "\n!dabo 500 0,1,2    - Dices 500, 1500 in total, bars of Latinum on slots 0,1 and 2" +
      "\n\ndaily commands:" +
      "\n!play invest/scam  - invest or scam the whole sector" +
      "\n!play sellsoul/ss  - sell your soul (only at 0 Latinum)" +
      "```";
 

      // let botMessage = '';
      // let grandNagusTable = [
      //   ['', '', '.'],
      //   ['#', 'GRAND NAGUS', '#'],
      //   ['', this.getTopLatinumUser().name , ''],
      //   ['', '', '.']
      // ];
  
      // let commandsTable = [
      //   ['', '', ''],
      //   ['#', 'commands', '#'],
      //   ['!play list/l', '', 'list users with latinum'],
      //   ['', '', ''],
      //   ['', '', ''],
      //   ['', '', ''],

      // ];
  
      // let bothTables = [...grandNagusTable, ...commandsTable]
  
      // botMessage += codeBlock(table(bothTables, {
      //   align: ["l", "c", "r"]
      // }), 'glsl');

    return botMessage;
  }

};

function codeBlock(content, type) {
  return `\`\`\`${type}\n${content}\`\`\``
}