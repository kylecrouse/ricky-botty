const dotenv = require('dotenv').config()
const moment = require('moment-timezone')
const client = require('../src/lib/discord')
const iracing = require('../src/lib/iracing-membersite-api')
const SessionEmbed = require('../src/embeds/session')
const { leagueId } = require('../src/constants.json')
const { channelId } = require('../config.json')

client.once('ready', async () => {
	console.log(`Logged in as ${client.user.tag}!`)
	
	const channel = process.env.NODE_ENV === 'production'
		? await client.channels.fetch(channelId.announcements)
		: await client.users.fetch('697817102534311996')
				.then(user => user.createDM())
	
	const { rows = null } = await iracing.getLeagueSessions(leagueId)
		
	if (!rows)
		return exit()
	
	const embeds = await Promise.all(
		rows
			.filter(session => moment().tz("America/Los_Angeles").isSame(session.launchat, 'day'))
			.map(SessionEmbed)
	)
	
	if (embeds.length > 0) 
		await channel.send({ content: '@everyone', embeds })
	else
		console.log(`No sessions scheduled for today.`)
	
	exit()
})

function exit() {
	client.destroy()
	process.exit(0)
}