const { MessageActionRow, MessageButton } = require('discord.js')
const moment = require('moment-timezone')
const iracing = require('../lib/iracing-membersite-api')
const setApplicantStats = require('../actions/setApplicantStats')
const ProfileEmbed = require('../embeds/profile')

module.exports = async (message) => {
	// Extract the applicant name from the message
	const [, applicant] = message.content.match(/\*\*([a-z|0-9|\s]*)\*\*/i)
	
	// Search for the applicant's custid
	const { searchRacers = [] } = await iracing.getDriverStatus(applicant)
		
	if (!searchRacers?.length > 0)
		return message.reply(`I couldn't find this person on iRacing`)
		
	const [{ custid }] = searchRacers
	
	await setApplicantStats(applicant, custid)
		.catch(err => console.dir(err))

	const embed = await ProfileEmbed(custid)
	
	const row = new MessageActionRow()
		.addComponents([
			new MessageButton()
				.setCustomId(`YES::${custid}`)
				.setLabel('Accept')
				.setStyle('SUCCESS'),
			new MessageButton()
				.setCustomId(`NO::${custid}`)
				.setLabel('Reject')
				.setStyle('DANGER')

		])
	
	return message.reply({ embeds: [embed]/*, components: [row]*/ })
}