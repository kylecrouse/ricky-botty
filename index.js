const fs = require('fs')
const { Collection } = require('discord.js')
const client = require('./src/lib/discord')

client.commands = new Collection()

const commandFiles = fs.readdirSync(`./src/commands`)
	.filter(file => file.endsWith('.js'))
	
for (const file of commandFiles) {
	const command = require(`./src/commands/${file}`)
	client.commands.set(command.data.name, command)
}

const eventFiles = fs.readdirSync('./src/events')
	.filter(file => file.endsWith('.js'))

for (const file of eventFiles) {
	const event = require(`./src/events/${file}`)
	if (event.once)
		client.once(event.name, (...args) => event.execute(...args))
	else
		client.on(event.name, (...args) => event.execute(...args))
}
