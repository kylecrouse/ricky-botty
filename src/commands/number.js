const { MessageActionRow, MessageButton } = require('discord.js')
const { SlashCommandBuilder } = require('@discordjs/builders')
const cma = require('../lib/contentful-management')
const api = require('../lib/iracing-data-api')
const membersite = require('../lib/iracing-membersite-api')
const setLeagueMemberNumber = require('../actions/setLeagueMemberNumber')
const { leagueId } = require('../constants.json')
const { channelId, roleId } = require('../../config.json')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('number')
		.setDescription('Request car number')
		.addIntegerOption(option =>
			option.setName('number')
				.setDescription('The car number (0-99 only)')
				.setMinValue(0)
				.setMaxValue(99)
				.setRequired(true)
		)
		.addUserOption(option =>
			option.setName('member')
				.setDescription('Assign to Discord member (admin only)')
				.setRequired(false)
		)
		.setDefaultPermission(true),
	async execute(interaction) {

		await interaction.deferReply({ 
			ephemeral: true//process.env.NODE_ENV !== 'production' 
		})
		
		const number = interaction.options.getInteger('number'),
					member = interaction.options.getUser('member')
						? (interaction.member.roles.cache.has(roleId.admin) || interaction.member.roles.cache.has(roleId.driversCouncil))
								? interaction.options.getUser('member')
								: null
						: interaction.member
						
		if (!member)
			return interaction.editReply({ content: 'Number assignment is only for league admins.' })
		
		let { roster } = await api.getLeague(leagueId)
		const numbers = roster.reduce(
			(a, { car_number }) => car_number ? [...a, Math.floor(car_number)] : a, 
			[]
		)
		
		if (numbers.includes(number)) 
			return interaction.editReply({ content: 'Number already in use. Try another.' })
			
		// Update the number on iRacing and Contentful if admin requested
		if (interaction.member.roles.cache.has(roleId.admin) || interaction.member.roles.cache.has(roleId.driversCouncil)) {
			await setLeagueMemberNumber(member, number)
			interaction.editReply({ content: 'Done!' })			
		}
		
		// Otherwise ask for admin approval before updating
		else {
			const channel = interaction.client.channel.get(channelId['drivers-council'])
			
			const collector = channel.createMessageComponentCollector({
				filter: i => { 
					i.deferUpdate()
					return true
				},
				componentType: 'BUTTON', 
				time: 900000,
				max: 1
			})
			
			collector.on('collect', async i => {
				if (i.customId === 'approve') {
					await setLeagueMemberNumber(member, number)
					interaction.editReply({ content: 'Done!' })
					i.deleteReply()
				}
				else
					interaction.editReply({ content: 'Number request denied. Please try another.'})
			})
			
			channel.send({ 
				content: `<@${member.id}> requested car number **${number}**`,
				components: [new MessageActionRow()
					.addComponents([
						new MessageButton()
							.setCustomId(`approve`)
							.setLabel('Approve')
							.setStyle('SUCCESS'),
						new MessageButton()
							.setCustomId(`deny`)
							.setLabel('Deny')
							.setStyle('DANGER')
					])
				]
			})
		}

	},
}

const paginate = (array, n) => {
	const pageSize = Math.ceil(array.length / n)
 
	return Array.from({ length: pageSize }, (_, index) => {
		const start = index * n
		return array.slice(start, start + n)
	})
}
