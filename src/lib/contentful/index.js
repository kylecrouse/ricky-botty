const contentful = require('contentful')
const dotenv = require('dotenv').config()

const client = contentful.createClient({
	space: '38idy44jf6uy',
	accessToken: process.env.CONTENTFUL_ACCESS_TOKEN
})

module.exports = client