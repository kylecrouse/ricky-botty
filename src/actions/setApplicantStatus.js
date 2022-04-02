const { getRows } = require('../lib/google')

module.exports = async (custid, status, inviteCode = null) => {
	const rows = await getRows(row => row.custId === custid)
	const row = Array.isArray(rows) ? rows.pop() : null
	
	if (!row) 
		throw new Error('No matching custid in applications')
	
	if (inviteCode)
		row.inviteCode = inviteCode
	
	row.Approved = status
	
	await row.save()
	
	const trigger = row.Trigger

	console.log(trigger)
	
	return row
}