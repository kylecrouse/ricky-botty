const { SlashCommandBuilder } = require('@discordjs/builders')
const client = require('../lib/contentful')
const RulesEmbed = require('../embeds/rules')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rules')
		.setDescription('Display league rulebook or specified section')
		.setDefaultPermission(true)
		.addStringOption(option =>
			option.setName('section')
				.setDescription('The section heading of the rulebook to return')
				.addChoice('General', 'general')
				.addChoice('New Members', 'new members')
				.addChoice('Attendance', 'attendance')
				.addChoice('Numbers', 'numbers')
				.addChoice('Race Start', 'race start')
				.addChoice('Restarts', 'restarts')
				.addChoice('Caution', 'caution')
				.addChoice('Competition Cautions', 'competition cautions')
				.addChoice('Pit Lane', 'pit lane')
				.addChoice('Aggressive Driving', 'aggressive driving')
				.addChoice('Black Flags', 'black flags')
				.addChoice('Practice', 'practice')
				.addChoice('Start and Park', 'start and park')
				.addChoice('Radio', 'radio')
				.addChoice('Broadcast', 'broadcast')
				.addChoice('Paint Schemes', 'paint schemes')
				.addChoice('Protests', 'protests')
				.setRequired(true)
		),
	async execute(interaction) {

		await interaction.deferReply({ 
			ephemeral: process.env.NODE_ENV !== 'production' 
		})
		
		// Get contentful entry for league
		const { sys, fields } = await client.getEntry('1710')
		
		let rules = fields.rules.content
		
		// Slice content around the desired heading if provided
		const section = interaction.options.getString('section')
		if (section) {
			let startIndex = rules.findIndex(
				item => item.nodeType === 'heading-3' && item.content[0].value.toLowerCase() === section.toLowerCase()
			)
			let endIndex = rules.findIndex(
				(item, index) => index > startIndex && item.nodeType === 'heading-3'
			)
			rules = rules.slice(startIndex, endIndex)
		}
		
		if (!rules) 
			return interaction.editReply({ content: 'The rulebook doesn\'t cover that' })

		const embed = RulesEmbed({ rules, updated: sys.updatedAt })
		
		await interaction.editReply({ embeds: [embed] })
		
	},
}
