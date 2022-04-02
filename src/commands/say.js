const { SlashCommandBuilder } = require('@discordjs/builders')
const dotenv = require('dotenv').config()
const moment = require('moment-timezone')
const SessionEmbed = require('../embeds/session')
const { channelId } = require('../../config.json')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('say')
		.setDescription('Send a message from Ricky Botty')
		.setDefaultPermission(false)
		.addStringOption(option => {
			option.setName('channel')
				.setDescription('The channel to send the message in')
				.setRequired(true)			
			Object.entries(channelId).forEach(([channel, id]) => {
				option.addChoice(`#${channel}`, id)
			})
			return option
		})
		.addStringOption(option =>
			option.setName('message')
				.setDescription('The message you want the Ricky to say')
				.setRequired(true)
		),
	async execute(interaction) {
		
		const channel = await interaction.client.channels.fetch(interaction.options.getString('channel'))

		await channel.send(interaction.options.getString('message'))
		
		await interaction.reply({ content: 'Sent', ephemeral: true })
		
	},
}
