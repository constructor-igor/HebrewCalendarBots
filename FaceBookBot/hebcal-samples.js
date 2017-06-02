var request = require('request');

// var requestSample = "http://www.hebcal.com/shabbat/?cfg=json&m=0&geo=city&city=IL-Jerusalem"
var requestSample = "http://www.hebcal.com/shabbat/?cfg=json&m=0&geo=city&city=IL-Modiin"
//var requestSample = "http://www.hebcal.com/shabbat/?cfg=json&m=0&b=18&geo=zip&zip=90210"
//var requestSample = "http://www.hebcal.com/hebcal/?v=1&cfg=json&maj=on&min=on&mod=on&nx=on&year=now&month=x&ss=on&mf=on&c=on&geo=geoname&geonameid=3448439&m=50&s=on"
request.get(requestSample,
    { json: { key: 'value' } },
        function (error, response, body) {
        if (!error && response.statusCode == 200) {
            if (!body.error) {
                console.log("Title: " + body.title);
                console.log("Date: " + body.date);
                body.items.forEach(function(element) {
                    console.log(element.category + ": " + element.title)
                }, this);
                candlesItem = body.items.find(function(value, index){
                    return value.category == "candles"                
                });
                console.log("candles: " + JSON.stringify(candlesItem))
                //console.log(JSON.stringify(body));
            } else{
                console.warn("error: " + body.error);
            }
        }
    }
);



// //var user_input = "c 2017 05 30";
// var user_input = "c 1914 08 01";

// user_input = user_input.toLowerCase();
// if (user_input.startsWith("c ")) {    
//     var items = user_input.split(" ");
//     if (items[0] == "c" && items.length == 4){
//         var g_year = items[1];
//         var g_month = items[2];
//         var g_day = items[3];

//         var definedDate = new Date(g_year, g_month-1, g_day);
//         console.log("Defined date: ", definedDate.toDateString());

//         var now_date = new Date()
//         var now_year = now_date.getFullYear();
//         var years_difference = now_year - g_year;
//         if (years_difference!=0) {
//             console.log("Defined year: %d, current year: %d", g_year, now_year)
//         } 

//         var requestConvertDate = "http://www.hebcal.com/converter/?cfg=json&gy="+g_year+"&gm="+g_month+"&gd="+g_day+"&g2h=1"
//         request.post(
//             requestConvertDate,
//             { json: { key: 'value' } },
//             function (error, response, body) {
//                 if (!error && response.statusCode == 200) {
//                     console.log("Hebrew Date: " + body.hd + " " + body.hm + " " + body.hy + " Events: " + body.events);

//                     if (years_difference!=0) {
//                         var h_year = body.hy + years_difference;
//                         var h_month = body.hm;
//                         var h_day = body.hd;

//                         var requestConvertDate = "http://www.hebcal.com/converter/?cfg=json&hy="+h_year+"&hm="+h_month+"&hd="+h_day+"&h2g=1";
//                         request.post(requestConvertDate,
//                             { json: { key: 'value' } },
//                             function (error, response, body) {
//                                 if (!error && response.statusCode == 200) {
//                                     var thisYearDate = new Date(body.gy, body.gm, body.gd);
//                                     console.log("Gregorian Date (this year): " + thisYearDate.toDateString() + ", Events: " + body.events);
//                                 }
//                             }
//                         )
//                     }
//                 }
//             }
//         );
//     }
// }