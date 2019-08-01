const rp = require('request-promise');
const table = require("text-table");

module.exports = class Warframe {
    constructor() {
    }
    nightwave(channelID, client) {
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
                ["[Rep]| [Description]"]
            ];

            let lazyDoOnce = true;
            const challenges = res.activeChallenges.sort((a, b) => b.reputation - a.reputation)
                .reduce((acc, challenge) => {
                    if (challenge.reputation < 2000 && lazyDoOnce) {
                        acc.push(["[Daily challenges]"])
                        lazyDoOnce = false;
                    }
                    acc.push([`${challenge.reputation} | ${challenge.desc}`])
                    return acc
                }, usersTable)
                console.log(table(challenges, {
                    align: ["l", "r"]
                }))
            let botMessage = codeBlock(table(challenges, {
                align: ["l"]
            }), 'css')
            botMessage += codeBlock("[Nightwave challenges reset: " + ends + "]", 'ini')
            client.sendMessage(channelID, botMessage);
        })
    }

    baro(channelID, client) {
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
            client.sendMessage(channelID, botMessage, msgColor);
        })
    }

    cetus(channelID, client) {
        rp({
            method: "GET",
            uri: `https://api.warframestat.us/pc/cetusCycle`,
            json: true
        }).then(res => {
            const timeOfDay = res.isDay ? 'day' : 'night';
            const msgColor = res.isDay ? 'red' : 'green';
            client.sendMessage(channelID, `\`\`\`diff\nIt's currently ${timeOfDay} with ${res.timeLeft} left\`\`\``, msgColor);
        })
    }

    sortie(channelID, client) {
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
            client.sendMessage(channelID, botMessage);
        });
    }
}

function codeBlock(content, type) {
    return `\`\`\`${type}\n${content}\`\`\``
  }