const fs = require('fs')
const dotenv = require('dotenv').config()
const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')
const { clientId, guildId } = require('./config.json')

const commands = []
const commandFiles = fs.readdirSync('./src/commands')
	.filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
	const command = require(`./src/commands/${file}`)
	commands.push(command.data.toJSON())
}

const rest = new REST({ version: '9' })
	.setToken(process.env.DISCORD_ACCESS_TOKEN)

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(commands => {
		const permissions = commands.map(
			({ id }) => ({
				id, 
				permissions: [
					{ id: '444243389131653121', type: 1, permission: true },
					{ id: '563049954256355331', type: 1, permission: true }
				]
			})
		)
		return rest.put(Routes.guildApplicationCommandsPermissions(clientId, guildId), { body: permissions })
	})
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error)
