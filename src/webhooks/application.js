// {"authMode":"FULL","namedValues":{"Timestamp":["12/15/2020 17:23:09"],"Email":["kyle.crouse@gmail.com"],"How did you hear about us?":["iRacing Forum"],"Name Of Member Who Referred You":["test racer"],"Tell Us About Yourself":["test is test for test"],"Rules":["I have read and understood the league rules."],"Name":["Kyle F Crouse"]},"range":{"columnEnd":10,"columnStart":4,"rowEnd":81,"rowStart":81},"source":{},"triggerUid":"5539633","values":["12/15/2020 17:23:09","Kyle F Crouse","kyle.crouse@gmail.com","I have read and understood the league rules.","iRacing Forum","test racer","test is test for test"]}

const WEBHOOK_URL = 'https://discord.com/api/webhooks/951930505606070332/9X_1vgF37srRX9Hj4LpvRpJ155pYPeWRLcJ-iEIel-m1pzgNV7vjR3WQa-J5LsUl8oI5';

function onSubmit(e) {
	const applicant = e.namedValues['Name'][0],
				source = e.namedValues['How did you hear about us?'][0],
				referral = e.namedValues['Name Of Member Who Referred You'][0],
				bio = e.namedValues['Tell Us About Yourself'][0]
				
	let payload = { 
		content:
			`**${applicant}**` +
			' applied after hearing about ORL from ' +
			`${source === 'Referred By Current Member' ? referral : source}.\u000a` +
			`> ${bio}`
	}
	
	let options = {
		"method": "post",
		"contentType": "application/json",
		"payload": JSON.stringify(payload)
	}

	UrlFetchApp.fetch(WEBHOOK_URL, options)
}
