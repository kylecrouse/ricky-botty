const { MessageEmbed } = require('discord.js')
const dotenv = require('dotenv').config()
const moment = require('moment-timezone')

module.exports = ({ rules, updated }) => {

	const embed = new MessageEmbed()
		.setTitle('Rulebook')
		.setURL(`https://outputracing.com/rules/`)
		.setDescription(`Last updated ${moment(updated).format('MMMM Do, YYYY')}`)
		.setThumbnail('http://output-racing.s3-website.us-west-2.amazonaws.com/logo-stacked.png')
		.setTimestamp()

	const fields = rules.reduce(
		(fields, { nodeType, content }) => {
			content = content
				.map(({ data, nodeType, value, content }) => {
					if (nodeType === 'text') 
						return value
					else if (nodeType === 'hyperlink') 
						return `[${content[0].value}](${data.uri})`
					else 
						return ''
				})
				.join('')
			if (nodeType === 'heading-3')
				fields.push({ name: content, value: [] })
			else if (nodeType === 'paragraph')
				fields[fields.length - 1].value.push(`\u2022\u00a0${content}`)
				
			return fields
		}, 
		[]
	)

	embed.addFields(
		fields.map(
			({ name, value }) => ({ name, value: value.join('\u000a') })
		)
	)
		
	return embed

}