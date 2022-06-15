const axios = require('axios')
const path = require('path')
const { CookieJar } = require('tough-cookie')
const { HttpCookieAgent, HttpsCookieAgent } = require('http-cookie-agent')
const dotenv = require('dotenv').config({ path: path.join(__dirname, '.env') })
const CryptoJS = require('crypto-js')

class Client {
	
	constructor(email, password) {
		const jar = new CookieJar()
		
		this.instance = axios.create({ 
			baseURL: 'https://members-ng.iracing.com',
			httpAgent: new HttpCookieAgent({ jar }),
			httpsAgent: new HttpsCookieAgent({ jar }),
		})

		let hash = CryptoJS.SHA256(password + email.toLowerCase())
		let hashInBase64 = CryptoJS.enc.Base64.stringify(hash)

		// Authenticate if responds unauthorized
		this.instance.interceptors.response.use(
			response => response,
			error => {
				const { config, response: { status }} = error
				switch (status) {
					case 401:
						return this.authenticate(email, hashInBase64)
							.then(() => this.instance(config))
					case 503:
						return Promise.reject(new Error('iRacing down for site maintenance'))
					default:
						return Promise.reject(error)
				}
			}
		)
	}

	authenticate(email, password) {
		return this.instance({
			method: 'post',
			url: '/auth', 
			data: serialize({ email, password }).toString()
		})
	}
	
	async getCars(ids = null) {
		const [cars, assets] = await Promise.all([
			this.get('/data/car/get'),
			this.get('/data/car/assets')
		])
		
		return ids 
			? ( !Array.isArray(ids) && (ids = [ids]), 
					cars.reduce(
						(a, car) => (!ids || (ids.includes(car.car_id)))
							? [...a, { ...car, ...assets[car.car_id] }]
							: a,
						[]	
					)
				)
			: cars
	}
	
	getLeague(league_id) {
		return this.get(`/data/league/get?league_id=${league_id}`)
	}
	
	getMembers(cust_ids, include_licenses = false) {
		if (!Array.isArray(cust_ids))
			cust_ids = [cust_ids]
			
		return this.get(`/data/member/get?cust_ids=${cust_ids.join(',')}&include_licenses=${include_licenses}`)
	}
	
	getStatsMemberCareer(cust_id) {
		return this.get(`/data/stats/member_career?cust_id=${cust_id}`)
	}
	
	getStatsMemberRecentRaces(cust_id) {
		return this.get(`/data/stats/member_recent_races?cust_id=${cust_id}`)
	}

	getStatsMemberSummary(cust_id) {
		return this.get(`/data/stats/member_summary?cust_id=${cust_id}`)
	}

	async getTracks(ids = null) {
		const [tracks, assets] = await Promise.all([
			this.get('/data/track/get'),
			this.getTrackAssets()
		])
		
		return tracks.reduce(
			(a, track) => (!ids || (Array.isArray(ids) && ids.includes(track.track_id)))
				? { 
						...a, 
						[track.track_id]: { ...track, ...assets[track.track_id] }
					}
				: a,
			{}
		)
	}
	
	getTrackAssets() {
		return this.get('/data/track/assets')
	}
	
	get(url) {
		return this.instance(url)
			.then(({ data: { link }}) => this.instance(link))
			.then(({ data }) => data)
			.catch(err => console.dir({err}))
	}

}

const serialize = (data) => {
	const params = new URLSearchParams()
	Object.entries(data).forEach(([key, value]) => {
		params.append(key, value)
	})
	return params
}

module.exports = new Client(process.env.IRACING_USERNAME, process.env.IRACING_PASSWORD)