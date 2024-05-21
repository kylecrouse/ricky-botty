import { Client, Intents } from 'discord.js'
import 'dotenv/config'

const client = new Client({ 
	intents: [
		Intents.FLAGS.GUILDS, 
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_INVITES,
	] 
})

client.login(process.env.DISCORD_ACCESS_TOKEN)

export default client