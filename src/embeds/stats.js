const { MessageEmbed, MessageAttachment } = require('discord.js')
const axios = require('axios')
const sharp = require('sharp')
const moment = require('moment')
const cda = require('../lib/contentful')

module.exports = async (member) => {

	// Get contentful entry for member
	const { items: [entry] } = await cda.getEntries({
		content_type: 'driver',
		'fields.discordId': member.user.id,
	})
	
	const embed = new MessageEmbed()
		.setTitle(`**${member.displayName ?? member.user.username}'s League Stats**`)
		.setTimestamp()
	
	let files = []
	
	const { custId, media, numberArt } = entry.fields
	
	await axios(`https://api.simracerhub.com/participation/${custId}/1710`)
		.then(({ data }) => {
			[
				{ 
					title: 'OVERALL STATS',
					types: null,
					inline: false
				},
				{
					title: 'OVAL STATS',
					types: ['Short Track', '1 mile', 'Intermediate', '2+ mile', 'Superspeedway'],
					inline: true,
				},
				{
					title: 'ROAD STATS',
					types: ['Road Course'],
					inline: true,
				},
				{
					title: 'DIRT STATS',
					types: ['Dirt Oval', 'Dirt Road'],
					inline: true,
				},
			].forEach(({ title, types, inline }) => {
				const stats = getSummary(
					types 
						? data.items.filter(({ trackType }) => types.includes(trackType))
						: data.items
				)
				embed.addField(
					title, 
					`**Starts:** ${stats.starts}
**W:** ${stats.wins} (${stats.winPct})
**T5:** ${stats.top5s} (${stats.top5Pct})
**T10:** ${stats.top10s} (${stats.top10Pct})
**P:** ${stats.poles} (${stats.polePct})
**Laps:** ${stats.lapsCompleted}
**Led:** ${stats.lapsLed} (${stats.lapsLedPct})
**Inc/Race:** ${stats.incidentsPerRace.toFixed(2)}
**Inc/Lap:** ${stats.incidentsPerLap.toFixed(2)}
**Inc/Crnr:** ${stats.incidentsPerCorner.toFixed(2)}
`,
					inline
				)
				
			})
			
			embed.addField(
				'Recent Races',
				data.items.slice(0,10).reduce((str, item) => {
					return `${str}\u000a**${moment(item.raceDate).format('MMM DD')}** - ${item.trackName} (P${item.finishPos})`
				}, '')
			)
		})
		
	if (numberArt) {
		const { contentType, url } = numberArt.fields.file
		if (contentType === 'image/svg+xml') {
			const response = await axios(`https:${url}`, { responseType: 'arraybuffer' })
			const buffer = await Buffer.from(response.data, 'binary')
			files.push(
				new MessageAttachment(
					await sharp(buffer).toBuffer(),
					'number.png', 
				)
			)
			embed.setThumbnail('attachment://number.png')
		} 
		else 
			embed.setThumbnail(`https:${url}`)
	}
	
	if (media) 
		embed.setImage(`https:${media[0].fields.file.url}`)

	return { embeds: [embed], files }

}

const getSummary = (data) => {
	let starts = 0,
			wins = 0,
			podiums = 0,
			top5s = 0,
			top10s = 0,
			poles = 0,
			lapsCompleted = 0,
			lapsLed = 0,
			corners = 0,
			distance = 0,
			incidents = 0,
			totalQualifyPos = 0,
			totalQualifyAttempts = 0,
			totalFinishPos = 0,
			totalRating = 0

	// Calculate basic statistics			
	for (const race of data) {
		
		if (race.provisional) 
			continue
		
		if (race.finishPos !== null)
			starts++
			
		if (race.finishPos === 1)
			wins++
			
		if (race.finishPos <= 3)
			podiums++
			
		if (race.finishPos <= 5)
			top5s++
			
		if (race.finishPos <= 10)
			top10s++
			
		if (race.qualifyPos === 1)
			poles++
			
		lapsCompleted += race.lapsCompleted ?? 0
		lapsLed += race.lapsLed ?? 0
		corners += race.corners ?? 0
		distance += race.distance ?? 0
		incidents += race.incidents ?? 0
		totalFinishPos += race.finishPos ?? 0
		totalRating += race.raceLoopStat?.rating ?? 0
		
		if (race.qualifyTime > 0 && race.qualifyPos > 0) {
			totalQualifyPos += race.qualifyPos
			totalQualifyAttempts++
		}
		
	}

	// Append percentages and other fields calculated from basics
	return {
		starts,
		avgStartPos: round(totalQualifyPos / totalQualifyAttempts, 2),
		avgFinishPos: round(totalFinishPos / starts, 2),
		wins,
		winPct: `${Math.floor(wins / starts * 100)}%`,
		podiums,
		podiumPct: `${Math.floor(podiums / starts * 100)}%`,
		top5s,
		top5Pct: `${Math.floor(top5s / starts * 100)}%`,
		top10s,
		top10Pct: `${Math.floor(top10s / starts * 100)}%`,
		poles,
		polePct: `${Math.floor(poles / starts * 100)}%`,
		lapsCompleted,
		lapsLed,
		lapsLedPct: `${Math.floor(lapsLed / lapsCompleted * 100)}%`,
		corners,
		distance: round(distance, 1),
		incidents,
		incidentsPerRace: round(incidents / starts, 2),
		incidentsPerLap: round(incidents / lapsCompleted, 2),
		incidentsPerCorner: round(incidents / corners, 2),
		rating: round(totalRating / starts, 1),
	}
}

const round = (number, decimalPlaces) => {
	const factorOfTen = Math.pow(10, decimalPlaces)
	return Math.round(number * factorOfTen) / factorOfTen
}
