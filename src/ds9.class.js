module.exports = class DS9 {
    constructor() {

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
}