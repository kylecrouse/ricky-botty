const cma = require('../lib/contentful-management')

module.exports = async (driver, member) => {
	const { items: [entry] } = await cma.entry.getMany({
		query: {
			'fields.custId': driver.cust_id,
			content_type: 'driver',					
		}
	})
	
	// Update existing entry
	if (entry) {
		entry.fields.discordId = { 'en-US': member.id }
		await cma.entry.update({ entryId: entry.sys.id }, entry)
			.then(entry => cma.entry.publish({ entryId: entry.sys.id }, entry))
	}
	// Create new entry
	else {
		let fields = {
			name: { 'en-US': driver.display_name },
			custId: { 'en-US': driver.cust_id },
			discordId: { 'en-US': member.id },
			active: { 'en-US': true }
		}
		
		if (driver.nick_name)
			fields.nickname = { 'en-US': driver.nick_name }
			
		if (driver.car_number)
			fields.number = { 'en-US': driver.car_number }
			
		await cma.entry.create({ contentTypeId: 'driver' }, { fields })
			.then(entry => cma.entry.publish({ entryId: entry.sys.id }, entry))
	}	
}