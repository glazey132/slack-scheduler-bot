"use strict";

var WebClient = require('@slack/client').WebClient;
var RtmClient = require('@slack/client').RTMClient;
var token = process.env.SLACK_BOT_TOKEN || '';
var dialogflow = require('./dialogflow');

var rtm = new RtmClient(token);
var web = new WebClient(token);
rtm.start();

setTimeout(() => {
  console.log(rtm.connected, rtm.authenticated)
}, 1000)

rtm.on('team_join', function greetAndGooglePrompt(team) {
  console.log('user id is ', team.user.id)
  web.chat.postMessage({token: token, channel: team.user.id, text: 'Welcome to the group'})
  // rtm.sendMessage('Welcome to the group!', team.user.id)
  .then((result) => {
    console.log(result)
  })
  .catch((err) => {
    console.log(err)
  })
});

rtm.on('message', function handleRtmMessage(message) {
  console.log('Message: ', message);
  console.log(message.text)
  // web.chat.postMessage(token, message.channel, `You said: ${message.text}`)
  dialogflow.interpretUserMessage(message.text, message.user)
  .then(function(res) {
    console.log('message.text IS:::: ', message.text, 'message.user is: ', message.user)
    // var { data } = res;
    console.log('res is ', res)
    console.log('res.result is the dialogeflow response: ', res.result)
    var reminderAtt = [
        {
            "fields": [
                {
                    "title": "Subject",
                    "value": res.result.parameters.subject,
                    "short": true
                },
                {
                    "title": "Day",
                    "value": res.result.parameters.date,
                    "short": true
                }
            ]
        },
        {
            "title": "Is this reminder right?",
            "color": "#3AA3E3",
            "actions": [
                {
                    "name": "yes",
                    "text": "Yes",
                    "type": "button",
                    "value": "yes"
                },
                {
                    "name": "cancel",
                    "text": "Cancel",
                    "type": "button",
                    "value": "cancel",
                    "style": "danger"
                }
            ]
        }
      ]

    if (res.result.actionIncomplete){
      // web.chat.postMessage({token: token, channel: message.channel, text: res.result.fulfillment.speech});
      rtm.sendMessage(res.result.fulfillment.speech, message.channel)
    } else {
      // check if user exists in database
      // if no user exists, send oAuth link and once they click yes, schedule their event
      // if user does exist, go to their calendar and scheudle their event 
      // web.chat.postMessage({token: token, channel: message.channel, text: "Awesome! So I'll create a reminder for you :tada:", attachments: JSON.stringify(reminderAtt)});
      rtm.sendMessage(`ACTION COMPLETE :white_check_mark: Set up your google calendar: http://localhost:3000/setup`, message.channel)
    }
  })
  .catch(function(err) {
    console.log('Error sending message to Dialogflow', err);
  });
});
