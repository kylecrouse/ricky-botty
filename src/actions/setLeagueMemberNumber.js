const cma = require('../lib/contentful-management')

module.exports = async (member, number) => {
	const { items: [entry] } = await cma.entry.getMany({
		query: {
			'fields.discordId': member.id,
			content_type: 'driver',					
		}
	})
	
	if (!entry)
		throw new Error('Unable to match league member')

	// Contentful
	entry.fields.number = { 'en-US': number.toString() }
	return cma.entry.update({ entryId: entry.sys.id }, entry)
		.then(entry => cma.entry.publish({ entryId: entry.sys.id }, entry))

}