const { SlashCommandBuilder } = require('@discordjs/builders')
const dotenv = require('dotenv').config()
const moment = require('moment-timezone')
const iracing = require('../lib/iracing-data-api')
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
		
		const { sessions: leagueSessions = [] } = await iracing.getLeagueSessions()

		const seasons = await Promise.all(
			leagueId.map(id => iracing.getLeagueSeasons(id))
		).then(seasons => seasons.reduce((a, b) => a.concat(b.seasons), []))

		const sessions = await Promise.all(
			seasons.map(({ league_id, season_id }) =>
				iracing.getLeagueSeasonSessions(league_id, season_id)
			)
		).then(sessions =>
			sessions.reduce(
				(a, b) =>
					a.concat(
						b.sessions.map(session => ({
							...session,
							...leagueSessions.find(
								({ private_session_id }) =>
									private_session_id === session.private_session_id
							),
						}))
					),
				[]
			)
		)

		if (!sessions?.length)
			return interaction.editReply({ content: 'No sessions are scheduled' })

		const embeds = await Promise.all(sessions.slice(0, 1).map(SessionEmbed))
		
		await interaction.editReply({ embeds })
		
	},
}
