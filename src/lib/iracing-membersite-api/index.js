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
			baseURL: 'https://members.iracing.com/membersite',
			httpAgent: new HttpCookieAgent({ jar }),
			httpsAgent: new HttpsCookieAgent({ jar }),
		})
		
		let hash = CryptoJS.SHA256(password + email.toLowerCase())
		let hashInBase64 = CryptoJS.enc.Base64.stringify(hash)
		
		// Authenticate if redirected to login page
		this.instance.interceptors.response.use(response => {
			if (response.headers['content-type'].indexOf('text/html') !== -1
					&& response.request.res.responseUrl.indexOf('login.jsp') !== -1)
				return this.authenticate(email, hashInBase64)
					.then(() => this.instance(response.config))
			else 
				return response
		}, function (error) {
			return Promise.reject(error)
		})
	}

	authenticate(username, password) {
		const date = new Date()
		const utcoffset = Math.round(Math.abs(date.getTimezoneOffset()))

		const params = serialize({ username, password, utcoffset, todaysdate: '' })
		
		return this.instance({
			method: 'post',
			url: `/Login`, 
			data: params.toString(),
			skipAuthRefresh: true
		})
	}
	
	getDriverStatus(searchTerms) {
		return this.instance(`/member/GetDriverStatus?searchTerms=${encodeURIComponent(searchTerms)}`)
			.then(({ data }) => data)
	}

	getLaps(subsessionid) {
		return this.instance(`/member/GetLapChart?subsessionid=${subsessionid}&carclassid=-1&simsesnum=0`)
			.then(({ data }) => data)
	}

	getLeagueSessions(leagueID) {
		return this.instance(`/member/GetLeagueSessions?ts=0&startRow=1&stopRow=20&leagueID=${leagueID}&rand=${Math.floor(Math.random()*1000000)}`)
			.then(({ data }) => data)
	}
	
	getSessionEvents(subsessionid) {
		return this.instance(`/member/EventResult.do?&subsessionid=${subsessionid}`)
			.then(({ data }) => {
				const match = data.match(/SubsessionEventLogging = (\[.*\]);/)
				return match?.length > 2 ? JSON.parse(match[1]) : []
			})
	}
	
	sendLeagueRequest(custid, leagueid) {
		return this.instance(`/member/SendLeagueRequest?leagueid=${leagueid}&custid=${custid}`)
			.then(({ data }) => data)
	}
	
	removeLeagueMember(leagueid, custid) {
		return this.instance({
			method: 'post',
			url: `/member/RemoveLeagueMember`,
			data: serialize({ leagueid, custid }).toString()
		})
	}
	
	updateLeagueMemberCarNumber(leagueID, memberID, theValue) {
		return this.instance({
			method: 'post',
			url: `/member/UpdateLeagueMemberCarNumber`,
			data: serialize({ leagueID, memberID, theValue }).toString()
		})
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