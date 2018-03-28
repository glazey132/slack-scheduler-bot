//express server routes. we must run our app with a special command
//since index.js and users.js are run through .bin/www
var express = require('express');
var router = express.Router();
var google = require('../google');
var request = require('request')

// var RtmClient = require('@slack/client').RtmClient,
//     RTM_EVENTS = require('@slack/client').RTM_EVENTS;
//
// var rtm = new RtmClient(botAccessToken);
//
// rtm.start();
var models = require('../models');
var User = models.User;
var Task = models.Task;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/setup', function(req, res) {
  var url = google.generateAuthUrl();
  res.redirect(url);
})
router.get('/google/callback', function(req, res, next) {
  google.getToken(req.query.code)
    .then(function (tokens) {
      return google.createCalendarEvent(tokens, 'MY LAST TEST!! >:)', '2018-03-30')
    })
    .then(function() {
      res.send('CREATED YOUR EVENT!!! :)')
    })
    .catch(function (err) {
      console.log('ERROR receiving token', err);
      res.status(500).send('Sorry we were unable to receive the Google token')
    });
})

router.get('/redirect', (req, res) =>{
  console.log('in here')
    var options = {
        uri: 'https://slack.com/api/oauth.access?code='
            +req.query.code+
            '&client_id='+process.env.CLIENT_ID+
            '&client_secret='+process.env.CLIENT_SECRET+
            '&redirect_url=http://e05f110f.ngrok.io/redirect/getGoogle',
        method: 'GET'
    }
    request(options, (error, response, body) => {
        var JSONresponse = JSON.parse(body)
        if (!JSONresponse.ok){
            console.log(JSONresponse)
            res.send("Error encountered: \n"+JSON.stringify(JSONresponse)).status(200).end()
        }else{
            console.log(JSONresponse)
            // res.send("Success!")
            res.redirect('/redirect/getGoogle')
        }
    })
})


router.post('/testing', (req, res) => {
  // console.log('req is', req)
  console.log('request parameters are', req.body.result.parameters)
  console.log('resolvedQuery is ', req.body.resolvedQuery)
  // console.log('req.params is ', req.params)
  // console.log('req.query is ', req.query)

  // ***** check database for that slackUser id req.body.originalRequest.data.event.user
  // see if it exists in database AND if it has a googleAuth token
  // if it doesn't exist, add it and send link to google auth form
  // if it does exist but no googleAuth token send link to google auth form
  console.log('req.body.originalRequest.data is ', req.body.originalRequest.data)
  res.setHeader('Content-Type', 'application/json')
  res.send(JSON.stringify({"displayText": "Successfully sent custom response"}))
})

// router.post('/end', (req, res) => {
//   console.log('req.body is', req.body)
//   res.json(req.body.challenge)
// })
module.exports = router;
