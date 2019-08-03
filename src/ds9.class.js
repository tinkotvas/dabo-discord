const fs = require("fs");
const table = require("text-table");
const db = require('./db.class');
module.exports = class DS9 {
  constructor() {
    db.getRules((res) => {
      this.rulesOfAcquisition = res;
    })

    db.getUser("153878692186161152")

  }

  rules(message) {
    const number = message.split(/^(!rule|!rules|!r)\s+/)[2];
    let botMessage = ""
    if (this.rulesOfAcquisition[number]) {
      botMessage = codeBlock(`# Rule of Acquisition ${number}\n${this.rulesOfAcquisition[number]}`, 'md')
      return botMessage;
    } else if (number) {
      return "Unfortunately our database does not have this Rule of Acquisition";
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
      return botMessage;
    }
  }

  roll(user) {
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
    return `**${user}** rolls the dices.\n\n${diceMapping[diceOne]} ${diceMapping[diceTwo]}\n\nTotal: **${diceSum}**`;
  }

  async dabo(user, userID, channelID, message, client) {

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
    const currentUser = await db.getUser(userID).then((res) => {
      if(res.data()){
        return res.data();
      }else{
        return { username: user, latinum: 10000000 }
      }
      
    });
    console.log(currentUser)


    let commands = message.split(/(!dabo|!d)\s*/i)[2];
    let chosenAmount = commands.split(" ")[0];
    let chosenSlot = commands.split(" ")[1];
    let forbiddenSlots = new Set([5, 6, 7, 17, 18, 19, 29, 30, 31]);

    if (chosenAmount == 'help') {
      client.sendMessage(channelID, 'See all we know about Dabo here\nhttps://sto.gamepedia.com/Dabo')
      return
    }
    if (chosenAmount == 'payouts') {
      client.sendMessage(channelID, 'See full table of payouts here\nhttps://imgur.com/a/GI80CaF')
      return
    }
    // if(channelID == "356243839796903947"){
    //   client.sendMessage(channelID,"Playing forbidden in this chat channel. Try another channel")
    //   return
    // }

    if (!/^\s*(\d+)\s*$/.test(chosenAmount)) {
      client.sendMessage(channelID, 'Invalid command\n!dabo 100 0,1,2 - bet 100 bars on 0,1,2 (total of 300 bars)\n!dabo rules - for rules\n!dabo payouts - for winning combos')
      return
    }
    if (typeof chosenSlot == 'undefined') {
      chosenSlot = "0"
    }

    if (/,$/.test(chosenSlot)) {
      client.sendMessage(channelID, 'Invalid command\n\n!dabo 100 0,1,2 - bet 100 bars on 0,1,2 (total of 300 bars)')
      return
    }

    let playPositions = chosenSlot.split(",")

    if (chosenAmount.includes(','))
      chosenAmount = chosenAmount.replace(/,/g, '')

    chosenAmount = parseInt(chosenAmount)

    if (chosenAmount < minimumPlayAmount) {
      client.sendMessage(channelID, 'Minimum play amount is ' + minimumPlayAmount, 'red')
      return
    }

    if (playPositions.length > 3) {
      client.sendMessage(channelID, 'You can only play on 3 slots', 'red')
      return
    }

    if (currentUser.latinum < (chosenAmount * playPositions.length)) {
      client.sendMessage(channelID, 'Not enough Latinum', 'red')
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

      if (choice > 35 || choice < 0) {
        usedNotExistingSlot = true;
      }

    })

    if (usedForbiddenSlot) {
      client.sendMessage(channelID,
        forbiddenFound.split('').length > 1 ?
          forbiddenFound.split('').join(',') + ' are forbidden play slots\nForbidden slots are 5-7, 17-19, 29-31' :
          forbiddenFound + ' is a forbidden play slot\nForbidden slots are 5-7, 17-19, 29-31',
        'red');
      return
    }

    if (chosenAmount <= 0) {
      client.sendMessage(channelID, 'Need to bet more than ' + chosenAmount + ' bars of Latinum.', 'red')
      return
    }

    if (usedNotExistingSlot) {
      client.sendMessage(channelID, 'Invalid play slot\nAllowed play slots range from 0-35\nForbidden slots are 5-7, 17-19, 29-31', 'red')
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
        } else {
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

      currentUser.latinum -= chosenAmount;

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
    currentUser.latinum += profit;
    await db.setUser(userID, currentUser);
    // client.saveScoresToJSON();
    client.sendMessage(channelID,
      botMessage + `\`\`\``, 'purple');
  }

  async latinum(channelID, client) {
    let botMessage = '';
    let recordHolderTable;
    let usersTable = [
      ['#', 'CITIZENS', ''],
    ];

    let users = await db.getUsers().then((res) => {
      if(res){
        return res.docs.map(doc => {
          return doc.data();
        }).sort((a, b) => b.latinum - a.latinum);
      }else{
        return []
      }
    });

    for (const [i, user] of users.entries()) {
      if (user.latinum == 0) {
        continue;
      }
      
      if(i == 0){
        recordHolderTable = [
          ['', '', ''],
          ['#', 'GRAND NAGUS', ''],
          ['', user.username, ''],
          ['', (user.latinum).toLocaleString()],
          ['', '', '']
        ];
      }else{
        usersTable.push([user.username, (user.latinum).toLocaleString()]);
      }
      
    }

    let bothTables = [ ...recordHolderTable, ...usersTable]

    botMessage += codeBlock(table(bothTables, {
      align: ["r", "l", "r"]
    }), 'glsl');
    client.sendMessage(channelID, botMessage, 'purple');
  }
}

function codeBlock(content, type) {
  return `\`\`\`${type}\n${content}\`\`\``
}