const client = require('../src/lib/discord')
const { getRows } = require('../src/lib/google')
const getCustId = require('../src/actions/getCustId')
const setApplicantStats = require('../src/actions/setApplicantStats')

client.once('ready', async () => {
	console.log(`Logged in as ${client.user.tag}!`)
	
	const rows = await getRows(
		row => row.Approved?.toLowerCase() === 'pending'
	)

	await Promise.all(rows.map(async row => {	
		const custid = await getCustId(row.Name)
			
		await setApplicantStats(row.Name, custid)
			.catch(err => console.dir(err))
			
	}))
	
	exit()
})

function exit() {
	client.destroy()
	process.exit(0)
}