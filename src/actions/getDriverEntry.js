const cma = require('../lib/contentful-management')

module.exports = async fields => {
	fields = Object.fromEntries(
		Object.values(fields).map(
			([key, val]) => [`fields.${key}`, val]
		)
	)

	const { items: [entry] } = await cma.entry.getMany({
		query: {
			...fields,
			content_type: 'driver',					
		}
	})
	
	if (!entry)
		throw new Error('Unable to match league member')

	return entry
}