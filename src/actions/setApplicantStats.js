const { getRows } = require('../lib/google')
const api = require('../lib/iracing-data-api')

module.exports = async (name, custid) => {
	const rows = await getRows(row => row.Name === name)
	const row = Array.isArray(rows) ? rows.pop() : null

	if (!row) 
		throw new Error('No matching custid in applications')

	const { members: [member] } = await api.getMembers(custid, true)
	const { stats } = await api.getStatsMemberCareer(custid)
	
	row['Overall inc / Current IR, SR, Class'] = member.licenses.slice(0,2).reduce(
		(a, l, i) => `${a}${i > 0 ? '; ' : ''}${stats[i].category}: ${l.group_name.replace('Class ', '')}${l.safety_rating.toFixed(1)}, ${Math.floor(l.irating/100)/10}k, ${stats[i].avg_incidents.toFixed(2)}x`,
		``	
	)
	row.custId = custid
	row.Approved = 'PENDING'
	
	await row.save()
	
	return row
}