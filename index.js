const fs = require('fs')
const path = require('path')
const { Collection } = require('discord.js')
const client = require('./src/lib/discord')

client.commands = new Collection()

const commandFiles = fs.readdirSync(path.join(__dirname, `./src/commands`))
	.filter(file => file.endsWith('.js'))
	
for (const file of commandFiles) {
	const command = require(path.join(__dirname, `./src/commands/${file}`))
	client.commands.set(command.data.name, command)
}

const eventFiles = fs.readdirSync(path.join(__dirname, './src/events'))
	.filter(file => file.endsWith('.js'))

for (const file of eventFiles) {
	const event = require(path.join(__dirname, `./src/events/${file}`))
	if (event.once)
		client.once(event.name, (...args) => event.execute(...args))
	else
		client.on(event.name, (...args) => event.execute(...args))
}
