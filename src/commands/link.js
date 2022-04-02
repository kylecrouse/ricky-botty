const { MessageActionRow, MessageSelectMenu } = require('discord.js')
const { SlashCommandBuilder } = require('@discordjs/builders')
const api = require('../lib/iracing-data-api')
const setLeagueMemberDiscordId = require('../actions/setLeagueMemberDiscordId')
const { leagueId } = require('../constants.json')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('link')
		.setDescription('Link a Discord member to a league member')
		.addUserOption(option =>
			option.setName('member')
				.setDescription('The Discord member')
				.setRequired(true)
		)
		.setDefaultPermission(false),
	async execute(interaction) {

		await interaction.deferReply({ 
			ephemeral: true//process.env.NODE_ENV !== 'production' 
		})
		
		let { roster } = await api.getLeague(leagueId)
		
		if (!roster) 
			return interaction.editReply({ content: 'No members found' })
			
		roster.sort((a, b) => {
			const na = a.display_name.toUpperCase()
			const nb = b.display_name.toUpperCase()
			if (na < nb)
				return -1
			if (na > nb)
				return 1
			return 0
		})
		
		const rows = paginate(roster, 25).map(
			(r, i) => {
				const first = r[0].display_name.charAt(0)
				const last = r[r.length - 1].display_name.charAt(0)
				return new MessageActionRow()
					.addComponents([
						new MessageSelectMenu()
							.setCustomId(`member-${i}`)
							.setPlaceholder(`Select a league member to link (${first}–${last})`)
							.addOptions(
								r.map(member => ({
									label: member.nick_name ?? member.display_name,
									value: member.cust_id.toString(),
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
				let [custId] = i.values
				custId = Math.floor(custId)
				const driver = roster.find(({ cust_id }) => cust_id === custId)
				const member = interaction.options.getUser('member')

				await setLeagueMemberDiscordId(driver, member)
				
				i.editReply({ content: 'Done!', embeds: [], components: [] })	
			} 
			catch(error) {
				console.error(error)
				i.editReply({ content: 'Failed to link Discord user to league member.', embeds: [], components: [] })
			}
		})

		
	},
}

const paginate = (array, n) => {
	const pageSize = Math.ceil(array.length / n)
 
	return Array.from({ length: pageSize }, (_, index) => {
		const start = index * n
		return array.slice(start, start + n)
	})
}
