const dotenv = require('dotenv').config()
const client = require('../src/lib/discord')
const getCustId = require('../actions/getCustId')
const ProfileEmbed = require('../src/embeds/profile')
const { channelId } = require('../src/constants.json')

client.once('ready', async () => {
	console.log(`Logged in as ${client.user.tag}!`)
	
	const channel = process.env.NODE_ENV === 'production'
		? await client.channels.fetch(channelId.applications)
		: await client.users.fetch('697817102534311996')
				.then(user => user.createDM())
	
	const applicant = 'Kyle F Crouse'
	
	const custid = await getCustId(applicant)
	
	const embed = await ProfileEmbed(custid)
	
	await channel.send({ embeds: [embed] })
	
	exit()
})

function exit() {
	client.destroy()
	process.exit(0)
}