var bot = require('./index.js');
var req = {}
var event = {message:{mid:"mid", text:"help"}, sender:{id:"1"}, recipient:{id:"2"}, timestamp:"100"}
req.body = {object:"page", entry:[{id:"id", time:"time", messaging:[event]}]}
var res = "{}"
bot.HebrewCalendarBot(req, res)

console.log("hello")
