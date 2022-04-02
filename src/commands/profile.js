const { SlashCommandBuilder } = require('@discordjs/builders')
const iracing = require('../lib/iracing-membersite-api')
const getCustId = require('../actions/getCustId')
const ProfileEmbed = require('../embeds/profile')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('profile')
		.setDescription('Get iRacing profile for specified member')
		.setDefaultPermission(true)
		.addStringOption(option =>
			option.setName('name')
				.setDescription('Full iRacing member name')
				.setRequired(true)
		),
	async execute(interaction) {

		await interaction.deferReply()

		const custid = await getCustId(
			interaction.options.getString('name')
		)
		
		const embed = await ProfileEmbed(custid)

		interaction.editReply({ embeds: [embed] })
		
	},
}
