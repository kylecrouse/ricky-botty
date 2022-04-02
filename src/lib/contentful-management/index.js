const contentful = require('contentful-management')
const dotenv = require('dotenv').config()

const client = contentful.createClient(
	{
		accessToken: process.env.CONTENTFUL_MANAGEMENT_ACCESS_TOKEN,
	},
	{
		type: 'plain',
		defaults: {
			spaceId: '38idy44jf6uy',
			environmentId: 'master',
		},
	}
)
// const client = contentful.createClient({
// 	space: '38idy44jf6uy',
// 	accessToken: process.env.CONTENTFUL_MANAGEMENT_ACCESS_TOKEN
// })

module.exports = client