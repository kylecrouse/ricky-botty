const { MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js')
const { SlashCommandBuilder } = require('@discordjs/builders')
const { getRows } = require('../lib/google')
const sendInvitationEmail = require('../lib/google/gmail')
const iracing = require('../lib/iracing-membersite-api')
const setApplicationStatus = require('../actions/setApplicantStatus')
const ProfileEmbed = require('../embeds/profile')
const { channelId } = require('../../config.json')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pending')
		.setDescription('Get list of pending league applications')
		.setDefaultPermission(false)
		.addStringOption(option =>
			option.setName('name')
				.setDescription('Display profile for pending applicant')
				.setRequired(false)
		),
	async execute(interaction) {

		await interaction.deferReply({ 
			ephemeral: process.env.NODE_ENV !== 'production' 
		})

		const rows = await getRows(
			row => row.Approved?.toLowerCase() === 'pending'
				&& (
					!interaction.options.getString('name')
					|| row.Name.toLowerCase() === interaction.options.getString('name').toLowerCase()
				)
		)

		if (rows?.length === 1) {
			const embeds = await Promise.all(
				rows.map(row => ProfileEmbed(row.custId, row.Timestamp))
			)
			const row = new MessageActionRow()
				.addComponents([
					new MessageButton()
						.setCustomId(`YES::${rows[0].custId}`)
						.setLabel('Accept')
						.setStyle('SUCCESS'),
					new MessageButton()
						.setCustomId(`NO::${rows[0].custId}`)
						.setLabel('Reject')
						.setStyle('DANGER')
				])
			interaction.editReply({ embeds, components: [row] })
		}
		else if (rows?.length > 1) {
			const row = new MessageActionRow()
				.addComponents([
					new MessageSelectMenu()
						.setCustomId('applicants')
						.setPlaceholder('Choose an applicant to view details')
						.addOptions(
							rows.map(row => ({
								label: row.Name,
								description: row['Overall inc / Current IR, SR, Class'],
								value: row.custId,
							}))
						)
				])
			interaction.editReply({ components: [row] })
		}
		else
			interaction.editReply('There are no pending applications.')
			
		const filter = i => {
			i.deferUpdate()
			return i.user.id === interaction.user.id
		}
		
		// Respond to select menu with individual applicant(s)
		const menuCollector = interaction.channel.createMessageComponentCollector({
			filter,
			componentType: 'SELECT_MENU', 
			time: 15000,
			max: 1
		})
			
		menuCollector.on('collect', async i => {
			const embeds = await Promise.all(
				i.values.map(value => ProfileEmbed(value))
			)
			
			const row = new MessageActionRow()
				.addComponents([
					new MessageButton()
						.setCustomId(`YES::${i.values[0]}`)
						.setLabel('Accept')
						.setStyle('SUCCESS'),
					new MessageButton()
						.setCustomId(`NO::${i.values[0]}`)
						.setLabel('Reject')
						.setStyle('DANGER')
				])
				
			i.editReply({ embeds, components: [row] })	
		})
			
		const buttonCollector = interaction.channel.createMessageComponentCollector({
			filter,
			componentType: 'BUTTON', 
			time: 15000,
			max: 1
		})
			
		buttonCollector.on('collect', async i => {
			const [status, custId] = i.customId.split('::')
			
			try {
				let invite = null
				if (status === 'YES') {
					await iracing.sendLeagueRequest(custId, 2732)
					
					const channel = await i.guild.channels.fetch(channelId.welcome)
					invite = await channel.createInvite({
						unique: true,
						reason: `new member ${custId}`,
						maxUses: 1,
						maxAge: 0
					})
				}
				
				const applicant = await setApplicationStatus(custId, status, invite?.code)
				
				if (invite?.code)
					sendInvitationEmail(applicant.Name, applicant.Email, invite.code)
				
				i.editReply({ 
					content: `**${applicant.Name}** ${status === 'YES' ? 'accepted' : 'rejected'}`, 
					embeds: [], 
					components: [] 
				})				
			}
			catch(error) {
				console.log(error)
				i.editReply(`Error inviting applicant`)
			}
		})
	},
}
