const { SlashCommandBuilder } = require('@discordjs/builders')
const dotenv = require('dotenv').config()
const moment = require('moment-timezone')
const iracing = require('../lib/iracing-membersite-api')
const SessionEmbed = require('../embeds/session')
const { leagueId } = require('../constants.json')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('next')
		.setDescription('Announces next scheduled league session')
		.setDefaultPermission(false),
	async execute(interaction) {

		await interaction.deferReply({ 
			ephemeral: process.env.NODE_ENV !== 'production' 
		})
		
		const { rows = null } = await iracing.getLeagueSessions(leagueId)
		
		if (!rows) 
			return interaction.editReply({ content: 'No sessions are scheduled' })

		const embeds = await Promise.all(rows.slice(0, 1).map(SessionEmbed))
		
		await interaction.editReply({ embeds })
		
	},
}
