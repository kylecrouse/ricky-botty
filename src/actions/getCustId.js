const iracing = require('../lib/iracing-membersite-api')

module.exports = async name => {
	const { searchRacers = [] } = await iracing.getDriverStatus(name)
		
	if (!searchRacers?.length > 0)
		return null
		
	const [{ custid }] = searchRacers

	return custid ?? null
}