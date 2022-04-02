const { MessageEmbed } = require('discord.js')
const moment = require('moment-timezone')
const api = require('../lib/iracing-data-api')

module.exports = async (custid, applicationDate = null) => {

	const { members: [member] } = await api.getMembers(custid, true)
	
	if (!member) 
		return null
	
	const { stats } = await api.getStatsMemberCareer(custid)
	const { this_year } = await api.getStatsMemberSummary(custid)
	const { races } = await api.getStatsMemberRecentRaces(custid)
	
	let memberSince = moment(member.member_since).format('MMM YYYY')

	const embed = new MessageEmbed()
		.setTitle(`**${member.display_name}'s iRacing Profile**`)
		.setURL(`https://members.iracing.com/membersite/member/CareerStats.do?custid=${custid}`)
		.addField('Member Since', memberSince, applicationDate !== null)
		.setTimestamp()
		
	if (applicationDate)
		embed
			.addField('Application Date', moment(applicationDate, 'MM/DD/YYYY hh:mm:ss').format('MMM YYYY'), true)
			.addField('\u200b', '\u200b', true)
	
	member.licenses.slice(0,2).forEach((license, i) => {
		embed.addField(
			`${license.category.toUpperCase()} STATS`, 
			`**License:** ${license.group_name.replace('Class ', '')} ${license.safety_rating}
			 **iRating:** ${license.irating}
			 **Starts:** ${stats[i].starts}
			 **Inc/Race:** ${stats[i].avg_incidents.toFixed(2)}
			 **Wins:** ${stats[i].win_percentage}%
			`,
			true
		)
	})
	
	embed.addField('\u200b', '\u200b', true)
	
	embed.addField(
		`${(new Date()).getFullYear()} Summary`,
		`**Leagues:** ${this_year.num_league_sessions} starts (${this_year.num_league_wins} wins)
		**Officials:** ${this_year.num_official_sessions} starts (${this_year.num_official_wins} wins)
		`
	)
	
	embed.addField(
		'Recent Races',
		races.reduce((str, race) => {
			return `${str}\u000a**${moment(race.session_start_time).format('MMM \'YY')}** - ${race.series_name} (P${race.finish_position}, ${race.incidents}x, ${race.strength_of_field} SOF)`
		}, '')
	)

	return embed

}