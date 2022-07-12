const { MessageActionRow, MessageButton } = require('discord.js')
const { SlashCommandBuilder } = require('@discordjs/builders')
const StatsEmbed = require('../embeds/stats')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('Get league stats for member')
		.addUserOption(option =>
			option.setName('member')
				.setDescription('League member')
				.setRequired(false)
		)
		.setDefaultPermission(true),
	async execute(interaction) {

		await interaction.deferReply()
		
		const member = interaction.options.getUser('member') ?? interaction.member

		const embed = await StatsEmbed(member)
		
		interaction.editReply(embed)

	},
}