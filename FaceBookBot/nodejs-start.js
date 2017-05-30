var request = require('request');

var bot = require('./index.js');
bot.simulation = true;

function MyResponse () {
  var privateVariable; // private member only available within the constructor fn

  this.privilegedMethod = function () { // it can access private members
    //..
  };
}
MyResponse.prototype.sendStatus = function (status) {
    console.log("Received status '%d'", status);
};

var req = {}
var res = new MyResponse();
// var event = {message:{mid:"mid", text:"help"}, sender:{id:"1"}, recipient:{id:"2"}, timestamp:"100"}
// req.body = {object:"page", entry:[{id:"id", time:"time", messaging:[event]}]}
// bot.HebrewCalendarBot(req, res)

// var event = {message:{mid:"mid", text:"today"}, sender:{id:"1"}, recipient:{id:"2"}, timestamp:"100"}
// req.body = {object:"page", entry:[{id:"id", time:"time", messaging:[event]}]}
// bot.HebrewCalendarBot(req, res)

// var event = {message:{mid:"mid", text:"commands"}, sender:{id:"1"}, recipient:{id:"2"}, timestamp:"100"}
// req.body = {object:"page", entry:[{id:"id", time:"time", messaging:[event]}]}
// bot.HebrewCalendarBot(req, res)

// var event = {message:{mid:"mid", text:"c today"}, sender:{id:"1"}, recipient:{id:"2"}, timestamp:"100"}
// req.body = {object:"page", entry:[{id:"id", time:"time", messaging:[event]}]}
// bot.HebrewCalendarBot(req, res)

// var event = {message:{mid:"mid", text:"Jerusalem"}, sender:{id:"1"}, recipient:{id:"2"}, timestamp:"100"}
// req.body = {object:"page", entry:[{id:"id", time:"time", messaging:[event]}]}
// bot.HebrewCalendarBot(req, res)

var event = {message:{mid:"mid", text:"c 1914/08/01"}, sender:{id:"1"}, recipient:{id:"2"}, timestamp:"100"}
req.body = {object:"page", entry:[{id:"id", time:"time", messaging:[event]}]}
bot.HebrewCalendarBot(req, res)
