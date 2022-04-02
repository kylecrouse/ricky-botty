const { MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js')
const { getRows } = require('../lib/google')
const api = require('../lib/iracing-data-api')
const setLeagueMemberDiscordId = require('../actions/setLeagueMemberDiscordId')
const setLeagueMemberNumber = require('../actions/setLeagueMemberNumber')
const ProfileEmbed = require('../embeds/profile')
const { leagueId } = require('../constants.json')
const { channelId } = require('../../config.json')

module.exports = {
	name: 'guildMemberAdd',
	once: false,
	execute: async (member) => {
		// https://discord.gg/QqhMjNZ9
		// Send "welcome to league" DM and introduce bot
		const channel = await member.createDM()
		await channel.send(`Welcome to Output Racing League!`)
		await channel.send(`I'm ${member.client.user.username} and I help Jaren out with league stuff so he can focus on winning.`)
		
		// Get open invites from guild
		const invites = await member.guild.invites.fetch()
		const codes = invites
			.filter(({ expiresAt }) => expiresAt > Date.now())
			.map(({ code }) => code)

		// Get accepted applicants who have outstanding inviteCode
		const rows = await getRows(
			row => row.Approved?.toLowerCase() === 'yes' && row.inviteCode
		)

		rows.filter(({ inviteCode }) => !codes.includes(inviteCode))
		
		if (!rows.length > 0)
			return channel.send(`Type \`/\` and check out my available commands for tasks and stats. If you're new to the league, check out https://outputracing.com/output-series/drivers and request an available number before your first race. See you on the track!`)
			
		let { roster } = await api.getLeague(leagueId),
				driver = null
		const numbers = roster.reduce(
			(a, { car_number }) => car_number ? [...a, Math.floor(car_number)] : a, 
			[]
		)
		const availableNumbers = Array.from({ length: 100 }, (v, i) => i)
			.filter(n => !numbers.includes(n))

		const applicantCollector = channel.createMessageComponentCollector({
			filter: i => {
				return i.customId === `applicant::${member.id}`
			},
			componentType: 'SELECT_MENU', 
			time: 360000,
			max: 1
		})
		
		applicantCollector.on('collect', async i => {
			i.deferUpdate()	
					
			const rowIndex = Math.floor(i.values[0])
			const [row] = await getRows(row => row.rowIndex === rowIndex)
	
			row.inviteCode = ''
			await row.save()
			
			driver = await api.getMembers(row.custId).then(({ members: [member] }) => member)
			
			await setLeagueMemberDiscordId(driver, member)
			
			i.editReply({ content: 'Profile created.', components: [] })
			
			const rows = paginate(availableNumbers, 25).map(
				(r, i) => {
					const first = r[0]
					const last = r[r.length - 1]
					return new MessageActionRow()
						.addComponents([
							new MessageSelectMenu()
								.setCustomId(`number::${member.id}::${i}`)
								.setPlaceholder(`Choose an available number (${first}–${last})`)
								.addOptions(
									r.map(n => ({
										label: `${n}`,
										value: `${n}`
									}))
								)
						])
				}
			)
			
			await channel.send({
				content: `What car number would you like to use?`,
				components: rows
			})
			
			applicantCollector.stop()
		})
		
		const numberCollector = channel.createMessageComponentCollector({ 
			filter: i => {
				return i.customId.indexOf(`number::${member.id}::`) === 0
			},
			componentType: 'SELECT_MENU', 
			time: 360000,
			max: 1
		})
		
		numberCollector.on('collect', async i => {
			i.deferUpdate()

			const number = Math.floor(i.values[0])			

			await setLeagueMemberNumber(member, number)
			
			await i.editReply({ content: `Number set!`, components: [] })
			
			// Update guild nickname to number + name.
			await member.setNickname(`#${number} ${driver.nick_name || driver.display_name}`, 'League guidelines')
			
			// Inform them of the nickname update.
			await channel.send(`I updated your Discord nickname to **#${number} ${driver.nick_name || driver.display_name}** so everyone knows who you are.`)
			await channel.send(`You can change it, but just make sure your assigned number and real name are in there, like **#26 Ricky Botty**.`)
		
			const chat = await member.client.channels.fetch(channelId['chat'])
			if (chat) {
				const embed = await ProfileEmbed(driver.cust_id)
				await chat.send({ content: `<@${member.id}> just joined the league!`, embeds: embed ? [embed] : [] })	
			}
			
			await channel.send(`You're all set. Thanks for joining Output Racing League. We look forward to seeing you on the track!`)
			
			numberCollector.stop()
		})

		await channel.send({
			content: 'Select your name from this list so I can match up your Discord and iRacing accounts. This will let you set your car number, get stats, etc.',
			components: [
				new MessageActionRow()
					.addComponents([
						new MessageSelectMenu()
							.setCustomId(`applicant::${member.id}`)
							.setPlaceholder(`Select your iRacing member name`)
							.addOptions(
								rows.map(r => ({
									label: r.Name,
									value: r.rowIndex.toString(),
								}))
							)
					])
			]
		})
	
	}	
}

const paginate = (array, n) => {
	const pageSize = Math.ceil(array.length / n)
 
	return Array.from({ length: pageSize }, (_, index) => {
		const start = index * n
		return array.slice(start, start + n)
	})
}