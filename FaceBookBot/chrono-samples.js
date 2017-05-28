var chrono = require('chrono-node')

var test_date = new Date(1495979370142); // 2017-05-28, ~16:50
var t_month = test_date.getMonth() + 1;
console.log("test_date: " + test_date)
console.log("test_year: " + test_date.getFullYear())
console.log("test_month: " + t_month)
console.log("test_day: " + test_date.getDate())
console.log("test_hours: " + test_date.getHours())
console.log("test_minutes: " + test_date.getMinutes())
console.log("test_day_of_the week: " + test_date.getDay())
console.log();

var ref1 = new Date(2017, 5, 28);
console.log("reference date #1:", chrono.parseDate('Today', ref1));
var ref2 = new Date(2017, 5, 29);
console.log("reference date #2:", chrono.parseDate('Today', ref2));

var user_input = "c Today";
user_input = user_input.substring(2, user_input.length);
console.log("user_input: " + user_input);

var inputs = ['An appointment on Sep 12-13', "Today", "Yesterday", "yesterday", "2017/05/27", "Tomorrow", "2015 05 27", "2015-05-27"];
for (i = 0; i < inputs.length; i++) { 
    var single_input = inputs[i]
    var single_output = chrono.parseDate(single_input)
    if (single_output == null) {
        console.log("'" + single_input + '" cannot be parsed as a Date')
        continue;
    }
    var g_year = single_output.getFullYear();
    var g_month = single_output.getMonth() + 1;
    var g_day = single_output.getDate();
    console.log(single_input + ": Year:" + g_year + ", Month:" + g_month +", Day:" + g_day)
}

// var parsedDate = chrono.parseDate('An appointment on Sep 12-13') 
// console.log('An appointment on Sep 12-13: ' + parsedDate);