const iracing = require('../lib/iracing-data-api')

module.exports = async name => {
	const result = await iracing.getDriverLookup(name)

	if (!result?.length > 0)
		return null

	const [{ cust_id }] = result

	return cust_id ?? null
}
