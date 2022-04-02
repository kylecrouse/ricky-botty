const cma = require('../lib/contentful-management')
const api = require('../lib/iracing-data-api')
const membersite = require('../lib/iracing-membersite-api')
const { leagueId } = require('../constants.json')

module.exports = async (member, number) => {
	const { items: [entry] } = await cma.entry.getMany({
		query: {
			'fields.discordId': member.id,
			content_type: 'driver',					
		}
	})
	
	if (!entry)
		throw new Error('Unable to match league member')

	// iRacing
	await membersite.updateLeagueMemberCarNumber(
		leagueId, 
		entry.fields.custId['en-US'], 
		number
	)
	
	// Contentful
	entry.fields.number = { 'en-US': number.toString() }
	return cma.entry.update({ entryId: entry.sys.id }, entry)
		.then(entry => cma.entry.publish({ entryId: entry.sys.id }, entry))

}