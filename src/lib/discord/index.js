const { Client, Intents } = require('discord.js')
const dotenv = require('dotenv').config()

const client = new Client({ 
	intents: [
		Intents.FLAGS.GUILDS, 
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_INVITES,
	] 
})

client.login(process.env.DISCORD_ACCESS_TOKEN)

module.exports = client