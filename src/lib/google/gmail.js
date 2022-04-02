const dotenv = require('dotenv').config()
const fs = require('fs/promises')
const { google } = require('googleapis')
const http = require('http')
const open = require('open')
const path = require('path')

const oauth2Client = new google.auth.OAuth2(
	process.env.GOOGLE_CLIENT_ID,
	process.env.GOOGLE_CLIENT_SECRET,
	`http://localhost:3000/oauth2callback`
)

oauth2Client.on('tokens', (tokens) => {
	if (tokens.refresh_token) {
		// store the refresh_token in my database!
		console.log(tokens.refresh_token)
	}
	console.log(tokens.access_token)
	fs.writeFile('oauth-tokens.json', JSON.stringify(tokens))
})

const gmail = google.gmail({
	version: 'v1',
	auth: oauth2Client
})

const send = async (name, email, inviteCode) => {	
	// You can use UTF-8 encoding for the subject using the method below.
	// You can also just use a plain string if you don't need anything fancy.
	const subject = 'Output Racing League';
	const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
	const messageParts = [
		'From: Output Racing League <outputracing@gmail.com>',
		`To: ${name} <${email}>`,
		'Content-Type: text/html; charset=utf-8',
		'MIME-Version: 1.0',
		`Subject: ${utf8Subject}`,
		'',
		`<p><b>Welcome to Output Racing League, ${name}!</b></p>`,
		`<p>Please <a href="https://members.iracing.com/membersite/member/LeagueInvites.do">go to iRacing</a> and accept your league invitation to join upcoming sessions, and <a href="https://discord.gg/${inviteCode}">join our Discord server</a> to complete your registration, get league information and chat with fellow drivers.</p>`,
		`<p>Our <a href="https://outputracing.com">website</a> is updated regularly with schedule, results and standings for both Tuesday night Output oval and Thursday Night Owl road series, in addition to being available on Discord.</p>`,
		`<p>Please be sure to read and understand the <a href="https://outputracing.com/rules">rules</a> thoroughly before joining your first session.</p><p>If you have any questions or concerns, feel free to contact myself or one of our admins (Bryan Pizzichemi or Corey Steinhauser).</p>`,
	];
	const message = messageParts.join('\n');

	// The body needs to be base64url encoded.
	const encodedMessage = Buffer.from(message)
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');

	const res = await gmail.users.messages.send({
		userId: 'me',
		requestBody: {
			raw: encodedMessage,
		},
	});
	
	return res.data
}

const auth = async () => {
	let resolve
	const p = new Promise(_resolve => {
		resolve = _resolve
	})
	
	// generate a url that asks permissions to send email
	const scopes = [
		'https://www.googleapis.com/auth/gmail.send'
	]
	
	const url = oauth2Client.generateAuthUrl({
		// 'online' (default) or 'offline' (gets refresh_token)
		access_type: 'offline',
	
		// If you only need one scope you can pass it as a string
		scope: scopes
	})
		
	const server = http.createServer((req, res) => {
		if (req.url.indexOf('/oauth2callback') === 0) {
			const url = new URL(req.url, 'http://localhost')
			const code = url.searchParams.get('code')
			resolve(code)
			res.writeHead(200)
			res.end(`Done`)		
		}
		else {
			res.writeHead(200)
			res.end(`Hello, world!`)		
		}
	})
	server.listen(3000)
	
	// Open browser to initiate authorization
	await open(url)
	
	const code = await p
	
	const { tokens } = await oauth2Client.getToken(code)
	oauth2Client.setCredentials(tokens)
	
	server.close()
}

module.exports = (name, email, inviteCode) => {
	return fs.readFile(path.join(__dirname, '../../../oauth-tokens.json'))
		.then(tokens => oauth2Client.setCredentials(JSON.parse(tokens)))
		// .catch(() => auth())
		.then(() => send(name, email, inviteCode))
		.catch(console.error)	
}
