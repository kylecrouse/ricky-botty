module.exports = {
	name: 'ready',
	once: true,
	execute: (client) => {
		console.log(`Logged in as ${client.user.tag}!`)
		// const user = await client.users.fetch('697817102534311996')
		// const channel = await user.createDM()
		// await channel.send(`Hello, ${user.username}!`)
	}
}