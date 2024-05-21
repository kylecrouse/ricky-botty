import 'dotenv/config'
import pThrottle from 'p-throttle'
import api from '../src/lib/iracing-data-api/index.js'
import constants from '../src/constants.json' assert { type: "json" }

const throttle = pThrottle({
  limit: 5,
  interval: 1000
})

async function main() {
  const { roster } = await api.getLeague(constants.leagueId, true)
		
  const drivers = await Promise.all(roster.sort((a, b) => b.licenses[0].irating - a.licenses[0].irating).map(throttle(async (driver) => {
    const { stats = [] } = await api.getStatsMemberCareer(driver.cust_id)
    return `${driver.display_name},${driver.licenses[0].irating},${stats[0].avg_finish_position},${stats[0].starts},${stats[0].wins} (${stats[0].win_percentage}%),${stats[0].top5} (${stats[0].top5_percentage}%)`
  })))
  console.log(drivers.join('\n'))
  
  exit()
}

function exit() {
	process.exit(0)
}

main()