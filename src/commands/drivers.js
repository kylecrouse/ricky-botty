const { SlashCommandBuilder } = require('@discordjs/builders')
const api = require('../lib/iracing-data-api')
const DriversEmbed = require('../embeds/drivers')
const { leagueId } = require('../constants.json')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('drivers')
		.setDescription('Display a list of active drivers with numbers')
		.setDefaultPermission(true),
	async execute(interaction) {

		await interaction.deferReply({ 
			ephemeral: true//process.env.NODE_ENV !== 'production' 
		})
		
		const { roster } = await api.getLeague(leagueId)
		
		if (!roster) 
			return interaction.editReply({ content: 'No members found' })
			
		const embed = await DriversEmbed(roster)

		await interaction.editReply({ embeds: [embed] })
		
	},
}
