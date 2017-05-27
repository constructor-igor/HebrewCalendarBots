var chrono = require('chrono-node')

var inputs = ['An appointment on Sep 12-13', "Today", "Yesterday", "yesterday", "2017/05/27", "Tomorrow", "2015 05 27", "2015-05-27"];

for (i = 0; i < inputs.length; i++) { 
    var single_input = inputs[i]
    var single_output = chrono.parseDate(single_input)
    var g_year = single_output.getFullYear();
    var g_month = single_output.getMonth() + 1;
    var g_day = single_output.getDate();
    console.log(single_input + ": Year:" + g_year + ", Month:" + g_month +", Day:" + g_day)
}

// var parsedDate = chrono.parseDate('An appointment on Sep 12-13') 
// console.log('An appointment on Sep 12-13: ' + parsedDate);