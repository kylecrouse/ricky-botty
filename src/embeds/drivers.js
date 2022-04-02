const { MessageEmbed } = require('discord.js')

module.exports = async (roster) => {
		
	const embed = new MessageEmbed()
		.setTitle(`**League Roster**`)
		.setURL(`https://outputracing.com/output-series/drivers`)
		.setDescription(
			roster
				.sort((a, b) => 
					(a.car_number ? Math.floor(a.car_number) : 1000) 
						- (b.car_number ? Math.floor(b.car_number): 1000)
				)
				.map(driver => {
					const number = driver.car_number ?? '--'
					const name = driver.nick_name ?? driver.display_name
					return `**${number}** ${name}`
				})
				.join('\n')
		)
		.setThumbnail('http://output-racing.s3-website.us-west-2.amazonaws.com/logo-stacked.png')
		.setTimestamp()
		
	return embed
}
