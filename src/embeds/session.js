const { MessageEmbed } = require('discord.js')
const moment = require('moment-timezone')
const iracing = require('../lib/iracing-data-api')
const { timeOfDay } = require('../constants.json')

module.exports = async (session) => {

	const tracks = await iracing.getTracks()
	
	const sessionLaunch = moment(session.launchat).tz("America/Los_Angeles")
	
	const tod = session.timeOfDay === 4 
		? moment(decode(session.simulatedstarttime)).format('ddd, MMM Do YYYY @ h:mma z')
		: timeOfDay[session.timeOfDay]
		
	const embed = new MessageEmbed()
		.setTitle(`**${decode(session.league_season_name)}**`)
		.setThumbnail(`https://images-static.iracing.com${tracks[session.trackid]?.logo}`)
		.addField(
			`**${sessionLaunch.format('dddd, MMMM Do')}**`,
			`Practice: ${sessionLaunch.format('h:mma z')} (${session.practicedur} min)\u000a` +
			`Qual: ${sessionLaunch.add(session.practicedur, 'm').format('h:mma z')} ` +
				`(${session.qualtype == 'L' ? `${session.qualifylaps} laps solo` : `${session.qualifylength} min open`})\u000a` +
			`Grid: ${sessionLaunch.add(session.qualifylength, 'm').format('h:mma z')}`
		)
		.addField(
			`\u200B\u000A**${session.track_name.replace(/\+/g, ' ')}**`, 
			`Time of Day: ${tod}\u000A` +
			`${session.config_name ? `Configuration: ${decode(session.config_name)}\u000A` : ''}` +
			`Distance: ${session.racelaps > 0 ? `${session.racelaps} laps` : `${session.racelength} minutes`}\u000A` +
			`Weather: ${session.weather_type == 1 ? 'dynamic weather/sky' : `${session.weather_temp_value}°F`}\u000A` +
			`Conditions: practice ${session.rubberlevel_practice == -1 ? 'automatically generated' : `${session.rubberlevel_practice}%`}, ` +
				`qual ${session.rubberlevel_qualify == -1 ? 'carries over' : `${session.rubberlevel_qualify}%`}, ` + 
				`race ${session.rubberlevel_race == -1 ? 'carries over' : `${session.rubberlevel_race}%`}\u000A` +
			`Cautions: ${session.fullcoursecautions == 1 ? 'on' : 'local only' }` +
			`${session.fullcoursecautions == 1 ? `\u000AG/W/C: ${session.gwclimit} attempts` : ''}`
		)
		.addField(
			'\u200B\u000A',
			`**${session.cars.length > 1 ? 'Cars' : 'Car'}:** ${makeCommaSeparatedString(session.cars.map(car => decode(car.car_name)))}\u000A` +
			`**Setup:** ${session.fixedSetup ? `fixed (${session.cars[0].racesetupfilename})` : 'open'}\u000A` +
			`**Fuel:** ${session.cars[0].max_pct_fuel_fill}%\u000A` +
			`**Tires:** ${session.cars[0].max_dry_tire_sets != 0 ? `${session.cars[0].max_dry_tire_sets} sets ` +
				`(starting + ${session.cars[0].max_dry_tire_sets - 1})` : 'unlimited'}\u000A` +
			`**Fast Repairs:** ${session.numfasttows >= 0 ? session.numfasttows == 0 ? 'none' : session.numfasttows : 'unlimited'}\u000A` +
			`**Incidents:** ${session.incident_warn_mode ? `penalty @ ${session.incident_warn_param1}x${session.incident_warn_param2 > 0 ? ` then every ${session.incident_warn_param2}x` : ''}\u000a` : ''}` +
				`${session.incident_limit > 0 ? `disqualify @ ${session.incident_limit}x` : ''}`
		)
		.setTimestamp()

	return embed

}

function decode(string) {
	return decodeURIComponent(string.replace(/\+/g, ' '))
}

function makeCommaSeparatedString(arr, useOxfordComma) {
	const listStart = arr.slice(0, -1).join(', ');
	const listEnd = arr.slice(-1);
	const conjunction = arr.length <= 1 ? '' :
		useOxfordComma && arr.length > 2 ? ', and ' : ' and ';

	return [listStart, listEnd].join(conjunction);
}