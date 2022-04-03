const { MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js')
const { SlashCommandBuilder } = require('@discordjs/builders')
const { getRows } = require('../lib/google')
const iracing = require('../lib/iracing-membersite-api')
const getDriverEntry = require('../actions/getDriverEntry')
const { leagueId } = require('../constants.json')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('boot')
		.setDescription('Remove a member from the league')
		.setDefaultPermission(false)
		.addUserOption(option =>
			option.setName('member')
				.setDescription('Member to remove')
				.setRequired(true)
		)
		.addStringOption(option =>
			option.setName('reason')
				.setDescription('Reason for removal')
				.setRequired(false)
		),
	async execute(interaction) {
	
		await interaction.deferReply({ 
			ephemeral: process.env.NODE_ENV !== 'production' 
		})	
		
		// Get driver entry from discord link
		const entry = getDriverEntry({ 
			discordId: interaction.options.getUser('member').id 
		})
		
		// Remove from iRacing
		await iracing.removeLeagueMember(
			leagueId, 
			entry.fields.custId['en-US'],
		)

		// Remove from Discord
		await interaction.options.getUser('member').kick(interaction.options.getString('reason') ?? 'none')
	
		// Update to Kicked on spreadsheet
		const rows = await getRows(
			row => row.custId === entry.fields.custId['en-US']
		)

		if (rows.length > 0)
			rows.forEach(r => {
				r.Approved = 'KICKED'
				r['Reason for approve / deny / kicked'] = interaction.options.getString('reason') ?? 'none' 
				row.save()
			})
		
		interaction.editReply('Done!')
		
	}
}