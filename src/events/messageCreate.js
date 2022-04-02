const ApplicationReply = require('../replies/application')
const { webhookId } = require('../../config.json')

module.exports = {
	name: 'messageCreate',
	once: false,
	execute: (message) => {
		if (message.webhookId === webhookId.applications) 
			return ApplicationReply(message)
	}
}