const cma = require('../lib/contentful-management')

module.exports = async (url, event, season) => {
	const { items: [entry] } = await cma.entry.getMany({
		query: {
			'fields.raceId': event.raceId,
			content_type: 'race',					
		}
	})
	
	// Update existing entry
	if (entry && entry.fields.raceId['en-US'] === event.raceId) {
		entry.fields.broadcast = { 'en-US': url }
		return cma.entry.update({ entryId: entry.sys.id }, entry)
			.then(entry => cma.entry.publish({ entryId: entry.sys.id }, entry))
	}
	// Create new entry
	else {
		let fields = {
			name: { 'en-US': `${season.seasonName} – ${event.trackName}` },
			raceId: { 'en-US': event.raceId },
			broadcast: { 'en-US': url },
		}
		
		return cma.entry.create({ contentTypeId: 'race' }, { fields })
			.then(entry => cma.entry.publish({ entryId: entry.sys.id }, entry))
	}	
}