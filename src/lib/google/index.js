const { GoogleSpreadsheet } = require('google-spreadsheet')
const dotenv = require('dotenv').config()

const doc = new GoogleSpreadsheet('1YwAKsEToADShutguF4tTztfg5gTsiFbRej5Yk4Tuj_4')

async function load() {
	await doc.useServiceAccountAuth({ 
		client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, 
		private_key: process.env.GOOGLE_PRIVATE_KEY,
	})
	
	await doc.loadInfo()	
}

module.exports = {
	getRows: async filter => {
		await load()
		const sheet = doc.sheetsByTitle['Applications']
		const rows = await sheet.getRows()
		return rows.filter(filter)
	}
}