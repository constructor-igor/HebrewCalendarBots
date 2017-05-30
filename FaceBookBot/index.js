/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */

const 
	request = require('request'),
 	chrono = require('chrono-node');

const PAGE_ACCESS_TOKEN = "PAGE_ACCESS_TOKEN from FB";
const VERIFY_TOKEN = "VERIFY_TOKEN from FB";

const COMMAND_HELP = "help";
const COMMAND_TODAY = "today";
const COMMAND_JERUSALEM = "jerusalem";
const COMMAND_COMMANDS = "?";
const HELP_MESSAGE = "Hebrew Calendar Bot\nCommands:\n * help\t - Show help\n * ?\t - List of commands\n * today\t - Hebrew date\n * Jerusalem\t - Jerusalem's date\n * c <date>\t - Convert to Hebrew date";

var simulation = false;

function civ2heb_v1(day, month, year) {
	return civ2heb(day, month, year);
}

exports.simulation = simulation;
exports.HebrewCalendarBot = function HebrewCalendarBot(req, res) {
	simulation = this.simulation
	
	if (req.method === 'GET') {
      console.log('Received a verify request with token', req.query['hub.verify_token']);
      if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
        return res.send(req.query['hub.challenge']);
      }
      return res.send('Error, wrong validation token');
  }
    
  var data = req.body;
  if (data.object === 'page') {
  	data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else if (event.postback) {
			receivedPostback(event);
		}else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });
  }
  
//  const messagingEvents = flatten(req.body.entry.map(entry => entry.messaging));
//  console.log(`Recieved ${messagingEvents.length} messages`);
  res.sendStatus(200);
};

function receivedMessage0(event) { 
  // Putting a stub for now, we'll expand it in the following steps
  console.log("Message data: ", event.message);
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = new Date(event.timestamp);
  var postback = event.postback;

  console.log("Received postback for user '%d' and page '%d' at '%s' with message:", senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(postback));

  var commandText = postback.payload;
  if (commandText) {
	switch (commandText.toLowerCase()) {
		case COMMAND_HELP:
			sendTextMessage(senderID, HELP_MESSAGE);
			break;
	  	case COMMAND_TODAY:
	    	sendTodayMessage(senderID, timeOfMessage);
			break;
	  	case COMMAND_JERUSALEM:
	    	sendJerusalemDate(senderID);
			break;
	  	case COMMAND_COMMANDS:
	    	sendCommandsMessage(senderID);
			break;
    	default:
		console.warn("unknown command: '%s'", commandText)
        	sendTextMessage(senderID, "echo: " + messageText);		
	}  
  }
}

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = new Date(event.timestamp);
  var message = event.message;

  console.log("Received message for user '%d' and page '%d' at '%s' with message:", senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {
    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText.toLowerCase()) {
      case 'generic':
        sendGenericMessage(senderID);
        break;
	  case COMMAND_HELP:
		sendTextMessage(senderID, HELP_MESSAGE);
		break;
	  case COMMAND_TODAY:
	    sendTodayMessage(senderID, timeOfMessage);		
		break;
	  case COMMAND_JERUSALEM:
	    sendJerusalemDate(senderID);
		break;
	  case COMMAND_COMMANDS:
	    sendCommandsMessage(senderID);
		break;
      default:
	  	if (messageText.toLowerCase().startsWith("c ")){
			convertGrigorianToHebrew(senderID, messageText, timeOfMessage);
		  } else {
        	sendTextMessage(senderID, "echo: " + messageText);
		  }
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function sendGenericMessage(recipientId, messageText) {
  // To be expanded in later sections
}

function sendTextMessage(recipientId, messageText) {
	console.log("Response '%s' for user '%d'", messageText, recipientId);
  	
	var messageData = {
    	recipient: {
      		id: recipientId
    	},
    	message: {
      		text: messageText
    	}
  	};

  callSendAPI(messageData);
}

function convertGrigorianToHebrew(recipientId, user_input, timeOfMessage){
	user_input = user_input.toLowerCase();
	if (user_input.startsWith("c ")) {

    	// var items = user_input.split(" ");
    	// if (items[0] == "c" && items.length == 4){
        	// var g_year = items[1];
        	// var g_month = items[2];
        	// var g_day = items[3];

		user_input.substring(2, user_input.length);
		var user_date = chrono.parseDate(user_input, timeOfMessage)
		if (user_date!=null) {
    		var g_year = user_date.getFullYear();
    		var g_month = user_date.getMonth() + 1;
    		var g_day = user_date.getDate();

			var now_date = new Date()
        	var now_year = now_date.getFullYear();
        	var years_difference = now_year - g_year;

        	var requestConvertDate = "http://www.hebcal.com/converter/?cfg=json&gy="+g_year+"&gm="+g_month+"&gd="+g_day+"&g2h=1"
        	request.post(
            	requestConvertDate,
            	{ json: { key: 'value' } },
            	function (error, response, body) {
                	if (!error && response.statusCode == 200) {
						var message = "Hebrew Date: " + body.hd + " " + body.hm + " " + body.hy;
						var events = "Events: " + body.events;
						//sendTextMessage(recipientId, message + "\n" + events);
						var fullMessage = message + "\n" + events;
						
						if (years_difference == 0) {
							sendTextMessage(recipientId, fullMessage);
						} else {
                        	var h_year = body.hy + years_difference;
                        	var h_month = body.hm;
                        	var h_day = body.hd;

							var requestConvertToGregorianDate = "http://www.hebcal.com/converter/?cfg=json&hy="+h_year+"&hm="+h_month+"&hd="+h_day+"&h2g=1";
							console.log("Convert to Gregorian date: " + requestConvertToGregorianDate);
                        	request.post(requestConvertToGregorianDate,
                            	{ json: { key: 'value' } },
                            	function (error, response, body) {
                                	if (!error && response.statusCode == 200) {
                                    	var thisYearDate = new Date(body.gy, body.gm, body.gd);
                                    	var thisYearMessage = "Gregorian Date (this year): " + thisYearDate.toDateString() + "\nEvents: " + body.events;
										sendTextMessage(recipientId, fullMessage + "\n" + thisYearMessage);
                                	} else{
										sendTextMessage(recipientId, fullMessage);
      									console.error("Unable to send message (statusCode=%d).", response.statusCode);
      									console.error("response: \n" + JSON.stringify(response));
	  									console.error("body: \n" + JSON.stringify(body));
	  									if (error)
      										console.error("error:" + JSON.stringify(error));
									}
                            	}
                        	)
						}						
                	}
            	}
        	); 
    	}
	}
}

function sendTodayMessage(recipientId, timeOfMessage){
	convertGrigorianToHebrew(recipientId, "c today", timeOfMessage)

	// var tday = timeOfMessage.getDate();
	// var tmonth = timeOfMessage.getMonth() + 1;
	// var tyear = timeOfMessage.getFullYear();

	// var hebDate = civ2heb_v1(tday, tmonth, tyear);
	// var currentData = hebDateToString(hebDate);

	// sendTextMessage(recipientId, currentData)
}
function sendJerusalemDate(recipientId){
	var JerusalemTime = getLocalTime(+3);
	convertGrigorianToHebrew(recipientId, "c " + JerusalemTime)
}

function sendCommandsMessage(recipientId){
	var messageData = {
    	recipient: {
      		id: recipientId
    	},
    	message: {
      		attachment: {
				  type: "template",
				  "payload":{
        			"template_type":"button",
        			"text":"What do you want to do next?",
        			"buttons":[
          				{
            				"type":"postback",
            				"title":"Today",
            				"payload":COMMAND_TODAY
          				},
          				{
            				"type":"postback",
            				"title":"Jerusalem",
            				"payload":COMMAND_JERUSALEM
          				},
          				{
            				"type":"postback",
            				"title":"Help",
            				"payload":COMMAND_HELP
          				}
        			]
      			}
			}
    	}
  	};

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
	console.log("response: " + JSON.stringify(messageData));
	if (simulation)
		return;
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", messageId, recipientId);
    } else {
      console.error("Unable to send message (statusCode=%d).", response.statusCode);
      console.error("response: \n" + JSON.stringify(response));
	  console.error("body: \n" + JSON.stringify(body));
	  if (error)
      	console.error("error:" + JSON.stringify(error));
    }
  });
}

function getLocalTime(offset) {
	var d = new Date();
    localTime = d.getTime();
    localOffset = d.getTimezoneOffset() * 60000;

    // obtain UTC time in msec
    utc = localTime + localOffset;
    // create new Date object for different city
    // using supplied offset
    var nd = new Date(utc + (3600000*offset));
	return nd;
}

/* kdate.js - Kaluach Javascript Hebrew date routines
 *   Version 0.03 (beta release)
 * Copyright (C) 5760 (2000 CE), by Abu Mami and Yisrael Hersch.
 *   All Rights Reserved.
 *   All copyright notices in this script must be left intact.
 * Based on the formula by Gauss
 * Terms of use:
 *   - Permission will be granted to use this script on personal
 *     web pages. All that's required is that you please ask.
 *     (Of course if you want to send a few dollars, that's OK too :-)
 *   - Use on commercial web sites requires a $50 payment.
 * website: http://www.kaluach.net
 * email: abu-mami@kaluach.net
 */

function getHebMonth_v1(hebMonthIndex) {
	return hebMonth[hebMonthIndex];
} 

function makeArray() {
	this[0] = makeArray.arguments.length;
	for (i = 0; i < makeArray.arguments.length; i = i + 1)
		this[i+1] = makeArray.arguments[i];
};

var hebMonth = new makeArray(
	'Nisan', 'Iyyar', 'Sivan', 'Tammuz', 'Av', 'Elul',
	'Tishrei', 'Cheshvan', 'Kislev', 'Tevet', 'Shevat',
	'Adar', 'Adar I', 'Adar II');

/*
		\u05EA\u05E9\u05E8\u05D9	// Tishrei
		\u05D7\u05E9\u05D5\u05DF	// Cheshvan
		\u05DB\u05E1\u05DC\u05D5	// Kislev
		\u05D8\u05D1\u05EA		// Tevet
		\u05E9\u05D1\u05D8		// Shevat
		\u05D0\u05D3\u05E8		// Adar
		\u05D0\u05D3\u05E8 1		// Adar 1
		\u05D0\u05D3\u05E8 2		// Adar 2
		\u05E0\u05D9\u05E1\u05DF	// Nisan
		\u05D0\u05D9\u05D9\u05E8	// Iyyar
		\u05E1\u05D9\u05D5\u05DF	// Sivan
		\u05EA\u05DE\u05D5\u05D6	// Tammuz
		\u05D0\u05D1			// Av
		\u05D0\u05DC\u05D5\u05DC	// Elul
*/

var hebMonthOnHebrew = new makeArray(
	'\u05E0\u05D9\u05E1\u05DF', 	// Nisan
	'\u05D0\u05D9\u05D9\u05E8', 	// Iyyar
	'\u05E1\u05D9\u05D5\u05DF', 	// Sivan
	'\u05EA\u05DE\u05D5\u05D6', 	// Tammuz
	'\u05D0\u05D1',			// Av 
	'\u05D0\u05DC\u05D5\u05DC',	// Elul
	'\u05EA\u05E9\u05E8\u05D9', 	// Tishrei
	'\u05D7\u05E9\u05D5\u05DF', 	// Cheshvan	
	'\u05DB\u05E1\u05DC\u05D5',	// Kislev
	'\u05D8\u05D1\u05EA', 		// Tevet
	'\u05E9\u05D1\u05D8',		// Shevat
	'\u05D0\u05D3\u05E8', 		// Adar
	'\u05D0\u05D3\u05E8\u0020\u05D0\u0027', 	// Adar I
	'\u05D0\u05D3\u05E8\u0020\u05D1\u0027');	// Adar II

var hebDayOnEnglish = new makeArray(
	'Alef',		//  1
	'Bet',		//  2
	'Gimel',	//  3
	'Dalet',	//  4
	'He',		//  5
	'Vav',		//  6
	'Zayin',	//  7
	'Chet',		//  8
	'Tet',		//  9
	'Yod',		// 10
	'Yod-Alef',	// 11
	'Yod-Bet',	// 12
	'Yod-Gimel',	// 13
	'Yod-Dalet',	// 14
	'Tet-Vav',	// 15
	'Tet-Zayin',	// 16
	'Yod-Zayin',	// 17
	'Yod-Chet',	// 18
	'Yod-Tet',	// 19
	'Khaf',		// 20
	'Khaf-Alef',	// 21
	'Khaf-Bet',	// 22
	'Khaf-Gimel',	// 23
	'Khaf-Dalet',	// 24
	'Khaf-He',	// 25
	'Khaf-Vav',	// 26
	'Khaf-Zayin',	// 27
	'Khaf-Chet',	// 28
	'Khaf-Tet',	// 29
	'Lamed',     	// 30
	'Lamed-Alef',	// 31
	'Lamed-Bet',	// 32
	'Lamed-Gimel',	// 33
	'Lamed-Dalet',	// 34
	'Lamed-He',	// 35
	'Lamed-Vav',	// 36
	'Lamed-Zayin',	// 37
	'Lamed-Chet',	// 38
	'Lamed-Tet',	// 39
	'Mem',     	// 40
	'Mem-Alef',	// 41
	'Mem-Bet',	// 42
	'Mem-Gimel',	// 43
	'Mem-Dalet',	// 44
	'Mem-He',	// 45
	'Mem-Vav',	// 46
	'Mem-Zayin',	// 47
	'Mem-Chet',	// 48
	'Mem-Tet'	// 49
);
var hebDayOnHebrew = new makeArray(
	'\u05D0\u0027',       		// 'Alef',	//  1
	'\u05D1\u0027',       		// 'Bet',	//  2
	'\u05D2\u0027',       		// 'Gimel',	//  3
	'\u05D3\u0027',       		// 'Dalet',	//  4
	'\u05D4\u0027',       		// 'He',	//  5
	'\u05D5\u0027',       		// 'Vav',	//  6
	'\u05D6\u0027',       		// 'Zayin',	//  7
	'\u05D7\u0027',       		// 'Chet',	//  8
	'\u05D8\u0027',       		// 'Tet',	//  9
	'\u05D9\u0027',       		// 'Yod',	// 10
	'\u05D9\u0027\u0027\u05D0',	// 'Yod''Alef',	// 11
	'\u05D9\u0027\u0027\u05D1', 	// 'Yod-Bet',	// 12
	'\u05D9\u0027\u0027\u05D2', 	// 'Yod-Gimel',	// 13
	'\u05D9\u0027\u0027\u05D3', 	// 'Yod-Dalet',	// 14
	'\u05D8\u0027\u0027\u05D5', 	// 'Vav-Tet',	// 15
	'\u05D8\u0027\u0027\u05D6', 	// 'Tet-Zayin',	// 16
	'\u05D9\u0027\u0027\u05D6', 	// 'Yod-Zayin',	// 17
	'\u05D9\u0027\u0027\u05D7', 	// 'Yod-Chet',	// 18
	'\u05D9\u0027\u0027\u05D8', 	// 'Yod-Tet',	// 19
	'\u05DB\u0027', 		// 'Khaf',	// 20
	'\u05DB\u0027\u0027\u05D0', 	// 'Khaf-Alef',	// 21
	'\u05DB\u0027\u0027\u05D1', 	// 'Khaf-Bet',	// 22
	'\u05DB\u0027\u0027\u05D2', 	// 'Khaf-Gimel',// 23
	'\u05DB\u0027\u0027\u05D3', 	// 'Khaf-Dalet',// 24
	'\u05DB\u0027\u0027\u05D4', 	// 'Khaf-He',	// 25
	'\u05DB\u0027\u0027\u05D5', 	// 'Khaf-Vav',	// 26
	'\u05DB\u0027\u0027\u05D6', 	// 'Khaf-Zayin',// 27
	'\u05DB\u0027\u0027\u05D7', 	// 'Khaf-Chet',	// 28
	'\u05DB\u0027\u0027\u05D8', 	// 'Khaf-Tet',	// 29
	'\u05DC\u0027',			// 'Lamed'     	// 30
	'\u05DC\u0027\u0027\u05D0', 	// 'Lamed-Alef',	// 31
	'\u05DC\u0027\u0027\u05D1', 	// 'Lamed-Bet',	// 32
	'\u05DC\u0027\u0027\u05D2', 	// 'Lamed-Gimel',// 33
	'\u05DC\u0027\u0027\u05D3', 	// 'Lamed-Dalet',// 34
	'\u05DC\u0027\u0027\u05D4', 	// 'Lamed-He',	// 35
	'\u05DC\u0027\u0027\u05D5', 	// 'Lamed-Vav',	// 36
	'\u05DC\u0027\u0027\u05D6', 	// 'Lamed-Zayin',// 37
	'\u05DC\u0027\u0027\u05D7', 	// 'Lamed-Chet',	// 38
	'\u05DC\u0027\u0027\u05D8', 	// 'Lamed-Tet',	// 39
	'\u05DE\u0027',			// 'Mem'     	// 40
	'\u05DE\u0027\u0027\u05D0', 	// 'Mem-Alef',	// 41
	'\u05DE\u0027\u0027\u05D1', 	// 'Mem-Bet',	// 42
	'\u05DE\u0027\u0027\u05D2', 	// 'Mem-Gimel',// 43
	'\u05DE\u0027\u0027\u05D3', 	// 'Mem-Dalet',// 44
	'\u05DE\u0027\u0027\u05D4', 	// 'Mem-He',	// 45
	'\u05DE\u0027\u0027\u05D5', 	// 'Mem-Vav',	// 46
	'\u05DE\u0027\u0027\u05D6', 	// 'Mem-Zayin',// 47
	'\u05DE\u0027\u0027\u05D7', 	// 'Mem-Chet',	// 48
	'\u05DE\u0027\u0027\u05D8' 	// 'Mem-Tet',	// 49
);

/*
\u05D0,\u05D1,\u05D2,\u05D3,\u05D4,\u05D5,\u05D6,\u05D7,\u05D8,\u05D9,
\u05D9\u05D0,
\u05D9\u05D1,\u05D9\u05D2,\u05D9\u05D3,
\u05D8\u05D5,\u05D8\u05D6,\u05D9\u05D6,\u05D9\u05D7,\u05D9\u05D8,
\u05DB,\u05DB\u05D0,\u05DB\u05D1,\u05DB\u05D2,\u05DB\u05D3,\u05DB\u05D4,\u05DB\u05D5,\u05DB\u05D6,\u05DB\u05D7,\u05DB\u05D8,
\u05DC
*/

var civMonth = new makeArray(
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December');

var weekDay = new makeArray(
	'Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Shabbat');

function Gauss(year) {
	var a,b,c;
	var m;
	var	Mar;	// "day in March" on which Pesach falls (return value)

	a = Math.floor((12 * year + 17) % 19);
	b = Math.floor(year % 4);
	m = 32.044093161144 + 1.5542417966212 * a +  b / 4.0 - 0.0031777940220923 * year;
	if (m < 0)
		m -= 1;
	Mar = Math.floor(m);
	if (m < 0)
		m++;
	m -= Mar;

	c = Math.floor((Mar + 3 * year + 5 * b + 5) % 7);
	if(c == 0 && a > 11 && m >= 0.89772376543210 )
		Mar++;
	else if(c == 1 && a > 6 && m >= 0.63287037037037)
		Mar += 2;
	else if(c == 2 || c == 4 || c == 6)
		Mar++;

	Mar += Math.floor((year - 3760) / 100) - Math.floor((year - 3760) / 400) - 2;
	return Mar;
}

function leap(y) {
	return ((y % 400 == 0) || (y % 100 != 0 && y % 4 == 0));
}

function civMonthLength(month, year) {
	if(month == 2)
		return 28 + leap(year);
	else if(month == 4 || month == 6 || month == 9 || month == 11)
	   return 30;
	else
		return 31;
}

function civ2heb(day, month, year) {
	var d = day;
	var	m = month;
	var y = year;
	var hy;
	var pesach;
	var anchor;
	var adarType;

	m -= 2;
	if (m <= 0) { // Jan or Feb
		m += 12;
		y -= 1;
	}

	d += Math.floor(7 * m / 12 + 30 * (m - 1)); // day in March
	hy = y + 3760;	// get Hebrew year
	pesach = Gauss(hy);
	if (d <= pesach - 15) { // before 1 Nisan
		anchor = pesach;
		d += 365;
		if(leap(y))
			d++;
		y -= 1;
		hy -= 1;
		pesach = Gauss(hy);
	}
	else
		anchor = Gauss(hy + 1);

	d -= pesach - 15;
	anchor -= pesach - 12;
	y++;
	if(leap(y))
		anchor++;

	for(m = 0; m < 11; m++) {
		var days;
		if(m == 7 && anchor % 30 == 2)
			days = 30; // Cheshvan
		else if(m == 8 && anchor % 30 == 0)
			days = 29; // Kislev
		else
			days = 30 - m % 2;
		if(d <= days)
			break;
		d -= days;
	}

	adarType = 0;			// plain old Adar
	if (m == 11 && anchor >= 30) {
		if (d > 30) {
			adarType = 2;	// Adar 2
			d -= 30;
		}
		else
			adarType = 1;	// Adar 1
	}

	if(m >= 6)		// Tishrei or after?
		hy++;		// then bump up year

	if(m == 11)			// Adar?
		m += adarType;	// adjust for Adars

	return (d + ' ' + m + ' ' + hy);
}


function Easter(Y) {
	// based on the algorithm of Oudin
    var C = Math.floor(Y / 100);
    var N = Y - 19 * Math.floor(Y / 19);
    var K = Math.floor((C - 17) / 25);
    var I = C - Math.floor(C / 4) - Math.floor((C - K) / 3) + 19 * N + 15;
    I = I - 30*Math.floor((I / 30));
    I = I - Math.floor(I / 28) * (1 - Math.floor(I / 28) * Math.floor(29 / (I + 1)) * Math.floor((21 - N) / 11));
    var J = Y + Math.floor(Y / 4) + I + 2 - C + Math.floor(C / 4);
    J = J - 7 * Math.floor(J / 7);
    var L = I - J;
    var M = 3 + Math.floor((L + 40) / 44);
    var D = L + 28 - 31 * Math.floor(M / 4);

	var ret = new Object();
	ret[1] = M;
	ret[2] = D;
	return ret;
}

function DOW(day,month,year) {
	var a = Math.floor((14 - month)/12);
	var y = year - a;
	var m = month + 12*a - 2;
	var d = (day + y + Math.floor(y/4) - Math.floor(y/100) +
			Math.floor(y/400) + Math.floor((31*m)/12)) % 7;
	return d + 1;
}

function NthDOW(nth,weekday,month,year) {
	if (nth > 0)
		return (nth - 1) * 7 + 1 + (7 + weekday - DOW((nth - 1) * 7 + 1, month, year)) % 7;
	var days = civMonthLength(month, year);
	return days - (DOW(days, month, year) - weekday + 7) % 7;
}

function holidays(cday, cmonth, cyear) {
	// American civil holidays and some major religious holiday
	if (cmonth == 1 && cday == 1)
		return "New Year's Day";
	else if (cmonth == 2 && cday == 12)
		return "Lincoln's Birthday";
	else if (cmonth == 2 && cday == 14)
		return "Valentine's Day";
	else if (cmonth == 2 && cday == NthDOW(3, 2, 2, cyear))
		return "President's Day";
	else if (cmonth == 3 && cday == 17)
		return "St. Patrick's Day";
	else if (cmonth == 3 || cmonth == 4) {
		var e = Easter(cyear);
	    if (cmonth == e[1] && cday == e[2])
			return "Easter";
	}
	else if (cmonth == 5 && cday == NthDOW(2, 1, 5, cyear))
		return "Mother's Day";
	else if (cmonth == 5 && cday == NthDOW(3, 7, 5, cyear))
		return "Armed Forces Day";
	else if (cmonth == 5 && cday == NthDOW(0, 2, 5, cyear))
		return "Memorial Day";
	else if (cmonth == 6 && cday == 14)
		return "Flag Day";
	else if (cmonth == 6 && cday == NthDOW(3, 1, 6, cyear))
		return "Father's Day";
	else if (cmonth == 7 && cday == 4)
		return "Independence Day";
	else if (cmonth == 9 && cday == NthDOW(1, 2, 9, cyear))
		return "Labor Day";
	else if (cmonth == 10 && cday == NthDOW(2, 2, 10, cyear))
		return "Columbus Day";
	else if (cmonth == 10 && cday == 31)
		return "Halloween";
	else if (cmonth == 11 && cday == 11)
		return "Veterans' Day";
	else if (cmonth == 11 && cday == NthDOW(4, 5, 11, cyear))
		return "Thanksgiving";
	else if (cmonth == 12 && cday == 25)
		return "Christmas";

	return "";
}

function moadim(cday, cmonth, cyear, hday, hmonth, dow) {
	if(hmonth == 6) {
		if(hday == 1 || hday == 2)
			return "Rosh Hashana"
		else if(hday == 3 && dow != 7)
			return "Fast of Gedalia";
		else if(hday == 4 && dow == 1)
			return "Fast of Gedalia";
		else if(hday == 10)
			return "Yom Kippur"
		else if(hday >= 15 && hday <= 22)
			return "Sukkot"
		else if(hday == 23)
			return "Isru Chag"
	}
	else if(hmonth == 8) {
		if(hday >= 25)
			return "Chanukkah"
	}
	else if(hmonth == 9) {
		if(hday <= 2) {
			return "Chanukkah"
		}
		else if(hday == 3) {
			// Kislev can be malei or chaser
			if(cday == 1) {
				cday = 29;
				cmonth = 11;
			}
			else if(cday == 2) {
				cday = 30;
				cmonth = 11;
			}
			else
				cday -= 3;
			var hdate = civ2heb(cday, cmonth, cyear);
			hd = parseInt(hdate.substring(0, hdate.indexOf(' ')));
			if(hd == 29)
				return "Chanukkah"
		}
		else if(hday == 10)
			return "Fast of Tevet"
	}
	else if(hmonth == 10) {
		if(hday==15)
			return "Tu b'Shvat"
	}
	else if(hmonth == 11 || hmonth == 13) {
		if(hday == 11 && dow == 5)
			return "Taanit Esther"
		else if(hday == 13 && dow != 7)
			return "Taanit Esther"
		else if(hday == 14)
			return "Purim"
		else if(hday == 15)
			return "Shushan Purim"
	}
	else if(hmonth == 0) {

		if(hday == 12 && dow == 5)
			return "Taanit Bechorot"
		else if(hday == 14 && dow != 7)
			return "Taanit Bechorot"
		else if(hday >= 15 && hday <= 21)
			return "Pesach"
		else if(hday == 22)
			return "Isru Chag" 
	}
	else if(hmonth == 1) {
		if(hday == 3 && dow == 5)
			return "Yom Ha'Atzmaut"
		else if(hday == 4 && dow == 5)
			return "Yom Ha'Atzmaut"
		else if(hday == 5 && dow != 6 && dow != 7)
			return "Yom Ha'Atzmaut"
		if(hday == 14)
			return "Pesah sheni"
		else if(hday == 18)
			return "Lag B'Omer"
		if(hday == 28)
			return "Yom Yerushalayim"
	}
	else if(hmonth == 2) {
		if(hday == 6)
			return "Shavuot"
		else if(hday == 7)
			return "Isru Chag"
	}
	else if(hmonth == 3) {
		if(hday == 17 && dow != 7)
			return "Fast of Tammuz"
		if(hday == 18 && dow == 1)
			return "Fast of Tammuz"
	}
	else if(hmonth == 4) {
		if(hday == 9 && dow != 7)
			return "Tisha B'Av"
		if(hday == 10 && dow == 1)
			return "Tisha B'Av"
		if(hday == 15)
			return "Tu B'Av"
	}

	return "";
}

var
  	hlNo = 0;
	hlRoshHashana = 1;
	hlFast_of_Gedalia1 = 2;
	hlFast_of_Gedalia2 = 3;
	hlYomKippur = 4;
	hlSukkot = 5;
	hlSukkotD = 6;
	hlChanukkah = 7;
	hlFast_of_Tevet = 8;
	hlTu_b_Shvat = 9;
	hlTaanitEsther = 10;
	hlPurim = 11;
	hlShushanPurim = 12;
    hlTaanitBechorot = 13;
	hlPesach = 14;
	hlPesachD = 15;
	hlYomHaAtzmaut = 16;
	hlPesahSheni = 17;
	hlLag_B_Omer = 18;
	hlYomYerushalayim = 19;
	hlShavuot = 20;
	hlShavuotD = 21;
	hlFast_of_Tammuz = 22;
	hlTisha_B_Av = 23;
	hlTu_B_Av = 24;
	hlShminiAzeretSimhatTora = 25;
	hlShminiAzeret = 26;
	hlSimhatTora = 27;
	hlPurimKatan = 28;
	hlShushanPurimKatan = 29;
	hlYomHashoah = 30;
	hlYomHazikaron = 31;
	
var moadimOnEnglish = new makeArray(
	'',				//  hlNo
	'Rosh Hashana',			//  hlRoshHashana 
	'Fast of Gedalia',		//  hlFast_of_Gedalia1 
	'Fast of Gedalia',		//  hlFast_of_Gedalia2 
	'Yom Kippur',			//  hlYomKippur 
	'Sukkot',			//  hlSukkot 
	'Isru Chag',			//  hlSukkotD 
	'Chanukkah',			//  hlChanukkah 
	'Fast of Tevet',		//  hlFast_of_Tevet
	'Tu b Shvat',			//  hlTu_b_Shvat
	'Taanit Esther',		//  hlTaanitEsther
	'Purim',			//  hlPurim
	'Shushan Purim',		//  hlShushanPurim
	'Taanit Bechorot',		//  hlTaanitBechorot
	'Pesach',			//  hlPesach
	'Isru Chag',			//  hlPesachD
	'Yom Ha Atzmaut',		//  hlYomHaAtzmaut
	'Pesah sheni',			//  hlPesahSheni
	'Lag B Omer',			//  hlLag_B_Omer
	'Yom Yerushalayim',		//  hlYomYerushalayim
	'Shavuot',			//  hlShavuot
	'Isru Chag',			//  hlShavuotD
	'Fast of Tammuz',		//  hlFast_of_Tammuz
	'Tisha B Av',			//  hlTisha_B_Av
	'Tu B Av',			//  hlTu_B_Av
	'Shmini Atzeret, Simchat Torah',//  hlShminiAzeretSimhatTora
	'Shmini Atzeret',		//  hlShminiAzeret
	'Simchat Torah',			//  hlSimhatTora
	'Purim Katan',				// hlPurimKatan
	'Shushan Purim Katan',		// hlShushanPurimKatan
	'Yom Hashoah',				// hlYomHashoah
	'Yom Hazikaron'				// hlYomHazikaron
);

var moadimOnHebrew = new makeArray(
	'',					//  hlNo
	'\u05E8\u05D0\u05E9\u0020\u05D4\u05E9\u05E0\u05D4',				//  hlRoshHashana 
	'\u05E6\u05D5\u05DD\u0020\u05D2\u05D3\u05DC\u05D9\u05D4',			//  hlFast_of_Gedalia1 
	'\u05E6\u05D5\u05DD\u0020\u05D2\u05D3\u05DC\u05D9\u05D4',			//  hlFast_of_Gedalia2 
	'\u05D9\u05D5\u05DD\u0020\u05DB\u05E4\u05D5\u05E8',				//  hlYomKippur 
	'\u05E1\u05D5\u05DB\u05D5\u05EA',						//  hlSukkot 
	'\u05D0\u05E1\u05E8\u05D5\u0020\u05D7\u05D2',					//  hlSukkotD 
	'\u05D7\u05E0\u05D5\u05DB\u05D4',	//  hlChanukkah 05D7 05E0 05D5 05DB 05D4
	'\u05E6\u05D5\u05DD \u05E2\u05E9\u05E8\u05D4 \u05D1\u05D8\u05D1\u05EA',		//  hlFast_of_Tevet (Tsom Asara BeTevet)
	'\u05E8\u05D0\u05E9\u0020\u05D4\u05E9\u05E0\u05D4\u0020\u05DC\u05D0\u05D9\u05DC\u05E0\u05D5\u05EA', //  hlTu_b_Shvat
	'\u05EA\u05BC\u05B7\u05E2\u05B2\u05E0\u05B4\u05D9\u05EA\u0020\u05D0\u05B6\u05E1\u05B0\u05EA\u05BC\u05B5\u05E8',//  hlTaanitEsther
	'\u05E4\u05BC\u05D5\u05BC\u05E8\u05B4\u05D9\u05DD', //  hlPurim
	'\u05E9\u05C1\u05D5\u05BC\u05E9\u05C1\u05B8\u05DF\u0020\u05E4\u05BC\u05D5\u05BC\u05E8\u05B4\u05D9\u05DD', //  hlShushanPurim
	'\u05EA\u05E2\u05E0\u05D9\u05EA\u0020\u05D1\u05DB\u05D5\u05E8\u05D5\u05EA',	//  hlTaanitBechorot
	'\u05E4\u05E1\u05D7',								//  hlPesach
	'\u05D0\u05E1\u05E8\u05D5\u0020\u05D7\u05D2',					//  hlPesachD
	'\u05D9\u05D5\u05DD\u0020\u05D4\u05E2\u05E6\u05DE\u05D0\u05D5\u05EA',		//  hlYomHaAtzmaut
	'\u05E4\u05E1\u05D7 \u05E9\u05E0\u05D9', 					//  hlPesahSheni
	'\u05Dc\u05F4\u05D2\u0020\u05D1\u05E2\u05D5\u05DE\u05E8',			//  hlLag_B_Omer
	'\u05D9\u05D5\u05DD\u0020\u05D9\u05E8\u05D5\u05E9\u05Dc\u05D9\u05DD',		//  hlYomYerushalayim
	'\u05E9\u05D1\u05D5\u05E2\u05D5\u05EA',						//  hlShavuot
	'\u05D0\u05E1\u05E8\u05D5\u0020\u05D7\u05D2',					//  hlShavuotD
	'\u05E6\u05D5\u05DD\u0020\u05EA\u05DE\u05D5\u05D6',				//  hlFast_of_Tammuz
	'\u05EA\u05E9\u05E2\u05D4\u0020\u05D1\u05D0\u05D1',				//  hlTisha_B_Av
	'\u05D8\u0022\u05D5\u0020\u05D1\u05D0\u05D1',					//  hlTu_B_Av
	'\u05E9\u05DE\u05D9\u05E0\u05D9\u0020\u05E2\u05E6\u05E8\u05EA, \u05E9\u05DE\u05D7\u05EA\u0020\u05EA\u05D5\u05E8\u05D4',	//  hlShminiAzeretSimhatTora
	'\u05E9\u05DE\u05D9\u05E0\u05D9\u0020\u05E2\u05E6\u05E8\u05EA',			//  hlShminiAzeret
	'\u05E9\u05DE\u05D7\u05EA\u0020\u05EA\u05D5\u05E8\u05D4',			//  hlSimhatTora
	'\u05E4\u05D5\u05E8\u05D9\u05DD\u0020\u05E7\u05D8\u05DF',				// hlPurimKatan
	'\u05E9\u05D5\u05E9\u05DF\u0020\u05E4\u05D5\u05E8\u05D9\u05DD\u0020\u05E7\u05D8\u05DF',		// hlShushanPurimKatan
	'\u05D9\u05D5\u05DD\u0020\u05D4\u05D6\u05DB\u05E8\u05D5\u05DF\u0020\u05DC\u05E9\u05D5\u05D0\u05D4\u0020\u05D5\u05DC\u05D2\u05D1\u05D5\u05E8\u05D4',	// hlYomHashoah
	'\u05D9\u05D5\u05DD\u0020\u05D4\u05D6\u05DB\u05E8\u05D5\u05DF\u0020\u05DC\u05D7\u05DC\u05DC\u05D9\u0020\u05DE\u05E2\u05E8\u05DB\u05D5\u05EA\u0020\u05D9\u05E9\u05E8\u05D0\u05DC' //hlYomHazikaron
);


function moadimInt(cday, cmonth, cyear, hday, hmonth, dow)
{
	if(hmonth == 6) {
		if(hday == 1 || hday == 2)
			return hlRoshHashana
		else if(hday == 3 && dow != 7)
			return hlFast_of_Gedalia1;
		else if(hday == 4 && dow == 1)
			return hlFast_of_Gedalia2;
		else if(hday == 10)
			return hlYomKippur
		else if(hday >= 15 && hday <= 21)
			return hlSukkot
		else if(hday == 22)
			return hlShminiAzeretSimhatTora
		else if(hday == 23)
			return hlSukkotD
	}
	else if(hmonth == 8) {
		if(hday >= 25)
			return hlChanukkah
	}
	else if(hmonth == 9) {
		if(hday <= 2) {
			return hlChanukkah
		}
		else if(hday == 3) {
			// Kislev can be malei or chaser
			if(cday == 1) {
				cday = 29;
				cmonth = 11;
			}
			else if(cday == 2) {
				cday = 30;
				cmonth = 11;
			}
			else
				cday -= 3;
			var hdate = civ2heb(cday, cmonth, cyear);
			hd = parseInt(hdate.substring(0, hdate.indexOf(' ')));
			if(hd == 29)
				return hlChanukkah
		}
		else if(hday == 10)
			return hlFast_of_Tevet
	}
	else if(hmonth == 10) {
		if(hday==15)
			return hlTu_b_Shvat
	}
	else if(hmonth == 11 || hmonth == 13) {
		if(hday == 11 && dow == 5)
			return hlTaanitEsther
		else if(hday == 13 && dow != 7)
			return hlTaanitEsther
		else if(hday == 14)
			return hlPurim
		else if(hday == 15)
			return hlShushanPurim
	}
	else if(hmonth == 12) {
		if(hday == 14)
			return hlPurimKatan
		else if (hday == 15)
			return hlShushanPurimKatan
	}
	else if(hmonth == 0) {
		if (hday == 12 && dow == 5)
			return hlTaanitBechorot
		else if(hday == 14 && dow != 7)
			return hlTaanitBechorot
		else if(hday >= 15 && hday <= 21)
			return hlPesach
		else if(hday == 22)
			return hlPesachD
//		if (hday == 27 && dow != 6 && dow !=1)
//			return hlYomHashoah
//		else if(hday == 26 && dow == 5)
//			return hlYomHashoah
//		else if(hday == 28 && dow == 1)
//			return hlYomHashoah
	}
	else if(hmonth == 1) {
//		if(hday == 3 && dow == 5)
//			return hlYomHaAtzmaut
//		else if(hday == 4 && dow == 5)
//			return hlYomHaAtzmaut
//		else if(hday == 5 && dow != 6 && dow != 7 && dow !=2)
//			return hlYomHaAtzmaut
//		else if(hday == 6 && dow == 3)
//			return hlYomHaAtzmaut

//		if(hday == 2 && dow == 4)
//			return hlYomHazikaron
//		else if(hday == 3 && dow == 4)
//			return hlYomHazikaron
//		else if(hday == 4 && dow != 5 && dow != 6 && dow != 7 && dow !=1)
//			return hlYomHazikaron
//		else if(hday == 5 && dow == 2)
//			return hlYomHazikaron
			
		if(hday == 14)
			return hlPesahSheni
		else if(hday == 18)
			return hlLag_B_Omer			
//		if(hday == 28)
//			return hlYomYerushalayim
	}
	else if(hmonth == 2) {
		if(hday == 6)
			return hlShavuot
		else if(hday == 7)
			return hlShavuotD
	}
	else if(hmonth == 3) {
		if(hday == 17 && dow != 7)
			return hlFast_of_Tammuz
		if(hday == 18 && dow == 1)
			return hlFast_of_Tammuz
	}
	else if(hmonth == 4) {
		if(hday == 9 && dow != 7)
			return hlTisha_B_Av
		if(hday == 10 && dow == 1)
			return hlTisha_B_Av
		if(hday == 15)
			return hlTu_B_Av
	}

	return hlNo
}

function GetCivilHolidayId(cday, cmonth, cyear, hday, hmonth, dow)
{
	if(hmonth == 0) {
		if (hday == 27 && dow != 6 && dow !=1)
			return hlYomHashoah
		else if(hday == 26 && dow == 5)
			return hlYomHashoah
		else if(hday == 28 && dow == 1)
			return hlYomHashoah
	}
	else if(hmonth == 1) {
		if(hday == 3 && dow == 5)
			return hlYomHaAtzmaut
		else if(hday == 4 && dow == 5)
			return hlYomHaAtzmaut
		else if(hday == 5 && dow != 6 && dow != 7 && dow !=2)
			return hlYomHaAtzmaut
		else if(hday == 6 && dow == 3)
			return hlYomHaAtzmaut

		if(hday == 2 && dow == 4)
			return hlYomHazikaron
		else if(hday == 3 && dow == 4)
			return hlYomHazikaron
		else if(hday == 4 && dow != 5 && dow != 6 && dow != 7 && dow !=1)
			return hlYomHazikaron
		else if(hday == 5 && dow == 2)
			return hlYomHazikaron
			
		if(hday == 28)
			return hlYomYerushalayim
	}

	return hlNo
}

function moadimIntInDiaspora(cday, cmonth, cyear, hday, hmonth, dow) {
	if(hmonth == 6) {
		if(hday == 1 || hday == 2)
			return hlRoshHashana
		else if(hday == 3 && dow != 7)
			return hlFast_of_Gedalia1;
		else if(hday == 4 && dow == 1)
			return hlFast_of_Gedalia2;
		else if(hday == 10)
			return hlYomKippur
		else if(hday >= 15 && hday <= 21)
			return hlSukkot
		else if(hday == 22)
			return hlShminiAzeret
		else if(hday == 23)
			return hlSimhatTora
	}
	else if(hmonth == 8) {
		if(hday >= 25)
			return hlChanukkah
	}
	else if(hmonth == 9) {
		if(hday <= 2) {
			return hlChanukkah
		}
		else if(hday == 3) {
			// Kislev can be malei or chaser
			if(cday == 1) {
				cday = 29;
				cmonth = 11;
			}
			else if(cday == 2) {
				cday = 30;
				cmonth = 11;
			}
			else
				cday -= 3;
			var hdate = civ2heb(cday, cmonth, cyear);
			hd = parseInt(hdate.substring(0, hdate.indexOf(' ')));
			if(hd == 29)
				return hlChanukkah
		}
		else if(hday == 10)
			return hlFast_of_Tevet
	}
	else if(hmonth == 10) {
		if(hday==15)
			return hlTu_b_Shvat
	}
	else if(hmonth == 11 || hmonth == 13) {
		if(hday == 11 && dow == 5)
			return hlTaanitEsther
		else if(hday == 13 && dow != 7)
			return hlTaanitEsther
		else if(hday == 14)
			return hlPurim
		else if(hday == 15)
			return hlShushanPurim
	}
	else if(hmonth == 0) {

		if(hday == 12 && dow == 5)
			return hlTaanitBechorot
		else if(hday == 14 && dow != 7)
			return hlTaanitBechorot
		else if(hday >= 15 && hday <= 22)
			return hlPesach
//		else if(hday == 22)
//			return hlPesachD
	}
	else if(hmonth == 1) {
//		if(hday == 3 && dow == 5)
//			return hlYomHaAtzmaut
//		else if(hday == 4 && dow == 5)
//			return hlYomHaAtzmaut
//		else if(hday == 5 && dow != 6 && dow != 7 && dow !=2)
//			return hlYomHaAtzmaut
//		else if(hday == 6 && dow == 3)
//			return hlYomHaAtzmaut
		if(hday == 14)
			return hlPesahSheni
		else if(hday == 18)
			return hlLag_B_Omer
		if(hday == 28)
			return hlYomYerushalayim
	}
	else if(hmonth == 2) {
		if(hday == 6)
			return hlShavuot
		else if(hday == 7)
			return hlShavuot		// hlShavuotD
	}
	else if(hmonth == 3) {
		if(hday == 17 && dow != 7)
			return hlFast_of_Tammuz
		if(hday == 18 && dow == 1)
			return hlFast_of_Tammuz
	}
	else if(hmonth == 4) {
		if(hday == 9 && dow != 7)
			return hlTisha_B_Av
		if(hday == 10 && dow == 1)
			return hlTisha_B_Av
		if(hday == 15)
			return hlTu_B_Av
	}

	return hlNo
}

function OmerDayInt(cday, cmonth, cyear, hday, hmonth, dow) 
{
	if(hmonth == 0) {
		if(hday>=15)
			return hday-15
	}
	if(hmonth == 1) {
		return hday+15
	}
	if(hmonth == 2) {
		if (hday <= 5)
			return hday+44
	}
	return 0;
}

var omerOnEnglish = new makeArray(
	'Chesed',					// 1st
	'Gevurah',
	'Tiferes',
	'Netzach',
	'Hod',
	'Yesod',
	'Malchus'
);	
var omerOnHebrew = new makeArray(
	'\u05D7\u05E1\u05D3',					// Chesed 
	'\u05D2\u05D1\u05D5\u05E8\u05D4',       // Gvura &#1490;&#1489;&#1493;&#1512;&#1492;
	'\u05EA\u05E4\u05D0\u05E8\u05EA',		// Tiferet &#1514;&#1508;&#1488;&#1512;&#1514;
	'\u05E0\u05E6\u05D7',					// Nezah &#1504;&#1510;&#1495;
	'\u05D4\u05D5\u05D3',					// Hod &#1492;&#1493;&#1491;
	'\u05D9\u05E1\u05D5\u05D3',				// Yesod &#1497;&#1505;&#1493;&#1491;
	'\u05DE\u05DC\u05DB\u05D5\u05EA'		// Malhut &#1502;&#1500;&#1499;&#1493;&#1514;
);	

function getHebMonthOnEnglish(hMonth)
{
	var monthName = getHebMonth_v1(hMonth);
	return monthName;
}
function getHebMonth(hMonth)
{
	return getHebMonthOnEnglish(hMonth);
}

function hebDateToString(hebDate)
{
	var hmS = hebDate.substring(hebDate.indexOf(' ')+1, hebDate.length);
	var hDay = parseInt(hebDate.substring(0, hebDate.indexOf(' ')));
	var hMonth = parseInt(hmS.substring(0, hmS.indexOf(' ')))+1;
	var hYear = hmS.substring(hmS.indexOf(' ')+1, hmS.length);
	var hYearStr = hYear;

	var hebMonthName = getHebMonth(hMonth);
	var fullDate = FormatDay_v1(hDay) + " " + hebMonthName;
	fullDate = fullDate + ", " + hYearStr;
	return fullDate;
}

function FormatDay_v1(hDay) {
	return FormatDay(hDay);
}

function FormatDay(hDay)
{
	var hDayStr = hDay + "th";
	if (hDay == 1)
		hDayStr = "1st";
	if (hDay == 2)
		hDayStr = "2nd";
	if (hDay == 3)
		hDayStr = "3rd";
	if (hDay == 21)
		hDayStr = "21st";
	if (hDay == 22)
		hDayStr = "22nd";
	if (hDay == 23)
		hDayStr = "23rd";
	if (hDay == 31)
		hDayStr = "31st";
	if (hDay == 32)
		hDayStr = "32nd";
	if (hDay == 33)
		hDayStr = "33rd";
	if (hDay == 41)
		hDayStr = "41st";
	if (hDay == 42)
		hDayStr = "42nd";
	if (hDay == 43)
		hDayStr = "43rd";
	return hDayStr;
}
