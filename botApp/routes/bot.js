"use strict";

var WebClient = require('@slack/client').WebClient;
var RtmClient = require('@slack/client').RTMClient;

var token = process.env.SLACK_BOT_TOKEN || '';

var dialogflow = require('./dialogflow');

var rtm = new RtmClient(token);
var web = new WebClient(token);
rtm.start();

rtm.on('message', function handleRtmMessage(message) {
  console.log('Message: ', message);
  console.log(message.text)
  // web.chat.postMessage(token, message.channel, `You said: ${message.text}`)
  dialogflow.interpretUserMessage(message.text, message.user)
  .then(function(res) {
    console.log('message.text IS:::: ', message.text, 'message.user is: ', message.user)
    // var { data } = res;
    console.log('res is ', res)
    console.log('res.data is the dialogeflow response: ', res.result)
    if (res.result.actionIncomplete){
      rtm.sendMessage(res.result.fulfillment.speech, message.channel)
    } else {
      rtm.sendMessage(`ACTION COMPLETE :white_check_mark:`, message.channel)
    }
  })
  .catch(function(err) {
    console.log('Error sending message to Dialogflow', err);
  });
});
