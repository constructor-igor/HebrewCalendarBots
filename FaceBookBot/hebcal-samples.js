var request = require('request');

var user_input = "c 2017 05 26";

user_input = user_input.toLowerCase();
if (user_input.startsWith("c ")) {    
    var items = user_input.split(" ");
    if (items[0] == "c" && items.length == 4){
        var g_year = items[1];
        var g_month = items[2];
        var g_day = items[3];

        var requestConvertDate = "http://www.hebcal.com/converter/?cfg=json&gy="+g_year+"&gm="+g_month+"&gd="+g_day+"&g2h=1"

        request.post(
            requestConvertDate,
            { json: { key: 'value' } },
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log("events: " + body.events)
                    console.log("Hebrew Date: " + body.hd + " " + body.hm + " " + body.hy)
                }
            }
        ); 
    }
}