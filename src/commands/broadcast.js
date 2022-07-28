const { MessageActionRow, MessageSelectMenu } = require('discord.js')
const axios = require('axios')
const setLeagueRaceBroadcast = require('../actions/setLeagueRaceBroadcast')
const { SlashCommandBuilder } = require('@discordjs/builders')

const baseUrl = process.env.NODE_ENV === 'production'
	? 'https://api.simracerhub.com'
	: 'http://localhost:3000'

module.exports = {
	data: new SlashCommandBuilder()
		.setName('broadcast')
		.setDescription('Set broadcast embed for race')
		.addStringOption(option =>
			option.setName('url')
				.setDescription('YouTube embed URL')
				.setRequired(true)
		)
		.setDefaultPermission(false),
	async execute(interaction) {
		
		await interaction.deferReply({ 
			ephemeral: true//process.env.NODE_ENV !== 'production' 
		})
		
		// Get events for current season
		const response = await axios(`${baseUrl}/series/6842/schedule`)

		const rows = paginate(response.data.events, 25).map(
			(r, i) => {
				return new MessageActionRow()
					.addComponents([
						new MessageSelectMenu()
							.setCustomId(`event-${i}`)
							.setPlaceholder(`Select an event`)
							.addOptions(
								r.filter(({ raceNumber, raceId }) => raceNumber > 0 && raceId).map(event => ({
									label: `${event.raceDate} – ${event.eventName ?? event.trackName}`,
									value: event.raceNumber.toString(),
								}))
							)
					])
			}
		)
			
		interaction.editReply({ components: rows })

		// Respond to select menu with individual applicant(s)
		const menuCollector = interaction.channel.createMessageComponentCollector({
			filter: i => {
				i.deferUpdate()
				return i.user.id === interaction.user.id
			},
			componentType: 'SELECT_MENU', 
			time: 15000,
			max: 1
		})
			
		menuCollector.on('collect', async i => {
			try {
				let [raceNumber] = i.values
				raceNumber = Math.floor(raceNumber)
				const event = response.data.events.find(event => event.raceNumber === raceNumber)
				const url = interaction.options.getString('url')
				
				const match = url.match(/(https:\/\/www.youtube.com\/(watch\?v=|embed\/))?(?<id>[a-zA-Z0-9]+)/)
				
				if (!match?.groups?.id)
					return i.editReply({ content: 'Video ID could not be parsed from URL.', embeds: [], components: [] })	
				
				await setLeagueRaceBroadcast(`https://www.youtube.com/embed/${match.groups.id}`, event, response.data)
				
				i.editReply({ content: 'Done!', embeds: [], components: [] })	
			} 
			catch(error) {
				console.error(error)
				i.editReply({ content: 'Failed to add url to event', embeds: [], components: [] })
			}
		})
		
		return false
		
	},
}

const paginate = (array, n) => {
	const pageSize = Math.ceil(array.length / n)
 
	return Array.from({ length: pageSize }, (_, index) => {
		const start = index * n
		return array.slice(start, start + n)
	})
}
