"use strict";

var models = require('../models/index.js')
var WebClient = require('@slack/client').WebClient;
var RtmClient = require('@slack/client').RTMClient;
var token = process.env.SLACK_BOT_TOKEN || '';
var dialogflow = require('./dialogflow');

var rtm = new RtmClient(token);
var web = new WebClient(token);
rtm.start();


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
  dialogflow.interpretUserMessage(message.text, message.user)
  .then(function(res) {

    var reminderAtt = [
        {
            "fields": [
                {
                    "title": "Subject",
                    "value": res.result.parameters.subject[0],
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
    console.log('res.result is ', res.result)
    if (res.result.actionIncomplete){
      console.log('action is incomplete')
      web.chat.postMessage({token: token, channel: message.channel, text: res.result.fulfillment.speech});
      // rtm.sendMessage(res.result.fulfillment.speech, message.channel)
    } else {
      console.log('action is complete')
      console.log('message is ', message)
      models.User.find({userId: message.user})
      .then(user => {
        console.log('user is: ', user)
        if (user.length === 0){
          web.chat.postMessage({token: token, channel: message.channel, text: "If you  haven't authorized access to google Cal: http://localhost:3000/setup Otherwise, Awesome! So I'll create a reminder for you :tada:", attachments: JSON.stringify(reminderAtt)});
          web.chat.postMessage({token: token, channel: message.channel, text: "If you  haven't authorized access to google Cal: http://localhost:3000/setup Otherwise, Awesome! So I'll create a reminder for you :tada:", attachments: JSON.stringify(reminderAtt)});
        }
      })
      // check if user exists in database
      // if no user exists, send oAuth link and once they click yes, schedule their event
      // if user does exist, go to their calendar and scheudle their event
      // rtm.sendMessage(`ACTION COMPLETE :white_check_mark: Set up your google calendar: http://localhost:3000/setup`, message.channel)
    }
  })
  .catch(function(err) {
    console.log('Error sending message to Dialogflow', err);
  });
});
