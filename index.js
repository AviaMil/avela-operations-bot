// This script was made by migue802#6690, and it was oredered by Mil#2020

/*   USING FOR FIRST TIME PLEASE READ HERE FOR INSTRUCTIONS

    1. Open the console, go to the bot's folder and type: npm install 
       This will automatically install everything you need to run the code

    2. Go to the bottom of the script and fill the bot's token with your bot's token

    KEEP READING COMMENTS BELOW

    
    HOW TO RUN BOT WHEN YOU FILLED ALL TOKENS: Just go to your console and run: "npm start" OR "node index.js"
*/

const Discord = require('discord.js');
var intents = Discord.Intents.FLAGS;
const client = new Discord.Client({ intents: [intents.GUILDS, intents.GUILD_MESSAGES, intents.GUILD_MESSAGE_REACTIONS, intents.DIRECT_MESSAGES]});
var axios = require('axios').default;
const Trello = require('trello');

const { MongoClient } = require('mongodb');
const uri = ""; // Replace with your MongoDB URI
const dbClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
dbClient.connect();
const db = dbClient.db("").collection("");

// MAKE SURE TO GET THE TOKEN FROM AN ALT ACCOUNT AS SOMEONE CAN STEAL THEM AND MAKE MALICIOUS THINGS HAPPEN
// Also make sure to be joined on the board OR make the board public
const trello = new Trello(/*Key*/"", /*Token*/""); // https://developer.atlassian.com/cloud/trello/guides/rest-api/api-introduction/#authentication-and-authorization
var listsid = [/*Upcoming flights*/"", /*In Progress*/"", /*Done*/""]; // Once you went to the bottom of the script, inserted bot's token and executed script, run on your server ".trelloLists BOARD_URL" with your board's url
var prefix = ".";
var flightListEmbed = [/*Channel ID*/"", /*Message ID*/""]; // Once you went to the bottom of the script, inserted bot's token and executed script, run on your server ".makeEmbed #your-ann-channel"
var flightListEmbedScheme = new Discord.MessageEmbed()
    .setTitle("Upcoming Flights")
    .setDescription("All scheduled flights at Westjet will be posted below with the relevant information.")
    .setFooter("All flights are in your timezone. This list is updated every 2 minutes.");


client.on("ready", () => {
    console.log("Ready");

    // Here the script checks every 2 minutes all the cards on the "Upcoming flights" list
    setInterval(async () => {
        if (flightListEmbed[0] == "" || flightListEmbed[1] == "" || flightListEmbed[0] == undefined || flightListEmbed[1] == undefined) return;
        var cards = await trello.getCardsOnList(listsid[0])
            .catch(err => console.log(err.response.statusMessage));
        
        if (cards[0] == undefined) {
            flightListEmbedScheme.setFields([{name: "Empty", value: "There are not upcomming flights."}]);
            var channel = await client.channels.fetch(flightListEmbed[0]);
            var msg = await channel.messages.fetch(flightListEmbed[1]);
            msg.edit({embeds: [flightListEmbedScheme]})
            flightListEmbedScheme.setFields([]);
            return;
        }

        var flights = [];
        const date = require('date-and-time');
        await cards.forEach(card => {
            var nameSplit = card.name.split(":");
            var descSplitDraft = card.desc.split("\n");
            // DESC SPLIT: 0 = Host, 1 = Aircraft, 2 = Gate
            var descSplit = ["Host: Not Defined", "Aircraft: Not Defined", "Gate: Not Defined"];
            descSplit.forEach((value, i) => {
                value = value.split(":")[0]
                descSplitDraft.forEach(desc => {
                    if (desc.startsWith(value) != true) return;
                    descSplit[i] = desc;
                })
            })
            var flightInfo = {
                id: nameSplit[0], 
                route: "Route: " + nameSplit[1], 
                date: "Date: " + date.format(new Date(card.due), "MM/DD/YYYY"), 
                time: "Time: " + date.format(new Date(card.due), "HH:mm"), 
                host: descSplit[0], 
                aircraft: descSplit[1], 
                gate: descSplit[2]
            };
            flights.push(flightInfo);
        });
        if (flights.length > 10) flights.splice(10, 1000);
        console.log(flights)
        await flights.forEach(async flight => {
            flightListEmbedScheme.addField(flight.id, flight.host + "\n" + flight.date + "\n" + flight.time + "\n" + flight.route + "\n" + flight.aircraft + "\n" + flight.gate);
        });
        var channel = await client.channels.fetch(flightListEmbed[0]);
        var msg = await channel.messages.fetch(flightListEmbed[1]);
        msg.edit({embeds: [flightListEmbedScheme]})
        flightListEmbedScheme.setFields([]);
    }, /*120000*/3000)
})

client.on("messageCreate", async message => {
    if (message.author.bot) return;
    var args = message.content.split(" ");
    var cmd = args.shift().toLowerCase();
    if (cmd.startsWith(prefix) != true) return;
    cmd = cmd.replace(prefix, "")

    // Flight embed configuration commands
    if (cmd == "makeembed" /*This command makes the flights embed*/) {
        if (message.mentions.channels.first() == undefined) return message.channel.send("Please, specify channel where to send your embed.");
        flightListEmbedScheme.setTimestamp()
            .setFields([{name: "Empty", value: "There are not upcomming flights."}]);
        var msg = await message.mentions.channels.first().send({embeds: [flightListEmbedScheme]});

        message.channel.send(`Embed is now sent! Here are your values to set it into the script.\n\nMessage ID: ${msg.id}\nChannel Id: ${message.mentions.channels.first().id}`)
    } else if (cmd == "trellolists" /*This command shows you all the lists and IDs of a board that is indicated*/) {
        var msg = await message.channel.send("Please wait until we connect to Trello servers...\n**If you still see this message consider seeing your bot logs.**");
        if (args[0].startsWith("https://trello.com/b/") != true) return msg.edit("Please, insert a board link to get the list IDs.");
        var board = await axios.get(args[0] + `.json?key=${trello.key}&token=${trello.token}`)
            .catch(err => {msg.edit("ERROR: " + err.response.data)});
        if (board.data == undefined || board.data.id == undefined) return;
        board = board.data;
        console.log(board.id);
        var lists = await trello.getListsOnBoard(board.id);
        var string = "Done! Here are all the IDs:\n\n"
        lists.forEach(list => {
            string += list.name + ": " + list.id + "\n"
        });
        msg.edit(string);
    } 

    // Announcement command
    if (cmd == "announce") {
        message.channel.send({ embeds: [{description: "You've got e-mail! :mailbox_with_mail:"}] });

        var msg = await message.author.send("Please, send the channel name were you want to send the message.");

        const filter = m => m.author.id == message.author.id;
        var channelCollected = await msg.channel.awaitMessages({ filter, max: 1, time: 60_000, errors: ['time'] })
            .catch(collected => msg.channel.send(`Collector error or timeout.`));
        if (channelCollected.content) return;

        await message.guild.channels.fetch();
        var channel = message.guild.channels.cache.filter(chann => chann.name == channelCollected.first().content.replace("#", "")).first()

        msg.edit("Please set the title of the announcement.");

        var titleCollected = await msg.channel.awaitMessages({ filter, max: 1, time: 60_000, errors: ['time'] })
            .catch(collected => msg.channel.send(`Collector error or timeout.`));
        if (titleCollected.content) return;

        var title = titleCollected.first().content;

        msg.edit("Please now say what the announcement should say.");

        var descCollected = await msg.channel.awaitMessages({ filter, max: 1, time: 120_000, errors: ['time'] })
            .catch(collected => msg.channel.send(`Collector error or timeout.`));
        if (descCollected.content) return;

        var description = descCollected.first().content;

        msg.edit("Loading...");
        channel.send({embeds: [{title: title, description: description, footer: {text: "Announcement made by " + message.author.tag}}]})
        msg.edit("Done!")
    }
    
    // Points System
    if (cmd == "points") {
        if (args[0] == undefined) return message.channel.send("Please, specify an action.")
        switch (args[0]) {
            case "clear":
                if (args[1] == undefined || message.mentions.users.first() == undefined) {
                    var msg = await message.channel.send("Are you sure you want to clear all the users? (If you want to clear only one user, please run the command again mentioning the user)");
                    msg.react('✅');
                    const filter = (reaction, user) => {
                        return reaction.emoji.name == '✅' && user.id === message.author.id;
                    };            
                    msg.awaitReactions({ filter, max: 1, time: 10_000, errors: ['time'] })
	                    .then(async collected => {
		                    const reaction = collected.first();

		                    if (reaction.emoji.name === '✅') {
                                var allPoints = await db.find();
                                var finalString = "";
                                msg.edit("Please wait...");
                                await allPoints.forEach(async value => {
                                    await client.users.fetch(value.id);
                                    finalString += client.users.cache.get(value.id).tag + ": H-" + value.hostPoints + ", A-" + value.points + "\n";
                                })
			                    await db.deleteMany();
                                setTimeout(() => {
                                    if (finalString.length >= 1800) {
                                        msg.edit("Done! Here is a list with all the points.");
                                        message.channel.send({files: [new Discord.MessageAttachment(Buffer.from(finalString, 'utf-8'), 'longList.txt')] });
                                        return;
                                    }
                                    msg.edit("Done! Here is a list with all the points:\n\n" + finalString);
                                    msg.reactions.removeAll();
                                }, 1000)
		                    } else {
                                // You should not have this error.
			                    message.reply('Impossible error???');
		                    }
	                    })
	                    .catch(collected => {
		                    message.reply('Prompt cancelled.');
	                    }); 
                    return;
                }
            break;

            case "check":
                if (args[1] == undefined || message.mentions.users.first() == undefined) return message.channel.send("Please, specify a target.");
                var user = await db.findOne({id: message.mentions.users.first().id});
                if (user == undefined) return message.channel.send("Uh oh... It seems that this user doesn't have records. It might be because nobody assigned this user any points.");
                message.channel.send({embeds: [ {title: "Points of " + message.mentions.users.first().tag, description: "Host Points: " + user.hostPoints + "\nAttendance points: " + user.points + "\n\n**Total reward: " + ((user.hostPoints * 20) + (user.points * 10)) + " R$**"} ]})
            break;
        
            default:
                break;
        }
    } else if (cmd == "attendance") {
        if (args[0] == undefined || message.mentions.users.first() == undefined) return message.channel.send("Please, specify a target.");
        var msg = await message.channel.send({embeds: [{description: "Loading, please wait...", color: 16777215}]})
        var user = await db.findOne({id: message.mentions.users.first().id});
        if (user == null) {
            msg.edit({embeds: [{description: "User not detected on Database. Adding a new user...", color: 16777215}]})
            await db.insertOne({id: message.mentions.users.first().id, hostPoints: 0, points: 0});
            user = await db.findOne({id: message.mentions.users.first().id});
        }
        msg.edit({embeds: [{description: "Adding points...", color: 16777215}]})
        await db.replaceOne({id: message.mentions.users.first().id}, {id: message.mentions.users.first().id, hostPoints: user.hostPoints, points: user.points + 1});
        msg.edit({embeds: [{description: "Done! Attendance point added. Now haves " + (user.points + 1) + " points.", color: 16777215}]})
    } else if (cmd == "host") {
        if (args[0] == undefined || message.mentions.users.first() == undefined) return message.channel.send("Please, specify a target.");
        var msg = await message.channel.send({embeds: [{description: "Loading, please wait...", color: 16777215}]})
        var user = await db.findOne({id: message.mentions.users.first().id});
        if (user == null) {
            msg.edit({embeds: [{description: "User not detected on Database. Adding a new user...", color: 16777215}]})
            await db.insertOne({id: message.mentions.users.first().id, hostPoints: 0, points: 0});
            user = await db.findOne({id: message.mentions.users.first().id});
        }
        msg.edit({embeds: [{description: "Adding points...", color: 16777215}]})
        await db.replaceOne({id: message.mentions.users.first().id}, {id: message.mentions.users.first().id, hostPoints: user.hostPoints + 1, points: user.points});
        msg.edit({embeds: [{description: "Done! Host point added. Now haves " + (user.hostPoints + 1) + " points.", color: 16777215}]})
    }

    // Developer Things (REMOVE WHEN SENDING FILE)
    if (cmd == "eval") {
        const clean = async (text) => {
            if (text && text.constructor.name == "Promise")
              text = await text;
            
            if (typeof text !== "string")
              text = require("util").inspect(text, { depth: 1 });
        
            text = text
              .replace(/`/g, "`" + String.fromCharCode(8203))
              .replace(/@/g, "@" + String.fromCharCode(8203));
            
            return text;
        }

        try {
            const evaled = eval(args.join(" "));
      
            const cleaned = await clean(evaled);
      
            message.channel.send(`\`\`\`js\n${cleaned}\n\`\`\``);
          } catch (err) {
            const cleaned = await clean(err);
            message.channel.send(`\`ERROR\` \`\`\`xl\n${cleaned}\n\`\`\``);
          }
    }
})

client.login("") // Here goes your discord's bot token, the most important thing!