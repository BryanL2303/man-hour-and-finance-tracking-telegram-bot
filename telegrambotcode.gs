//This code must be deployed through Google Apps Script
//It runs the telegram bot that has to be created through telegram bot father prior
//The telegram bot must also be set up prior to make this code work properly

var token = ""; //<Input the token given by telegram bot father 
var telegramUrl = "https://api.telegram.org/bot" + token; 
var webAppUrl = "https://script.google.com/macros/s/AKfycbw11jWxXmum_tGZ3nuhZHY2N5gFR3Zi-oaftOT1eMoG7FqdDbCjed46aOvUKpDpVHcg/exec"
var expenseLogSheet = SpreadsheetApp.openByUrl("") //<Input the url of the empty Google Spreadsheet created
var manHourLogSheet = SpreadsheetApp.openByUrl("") //<Input the url of the empty Google Spreadsheet created

//This variable must be the same as the one in spreadsheetcreator.gs and up to date with the spreadsheet
var manHourRows = { "sleep": 2,
  "brush_teeth": 3,
  "toilet": 4,
  "shower": 5,
  "breakfast": 6,
  "lunch": 7,
  "dinner": 8,
  "break": 9,
  "running": 11,
  "reading": 12,
  "weight_training": 13,
  "journaling": 14,
  "reflection": 15,
  "house_cleaning": 18,
  "studying": 19,
  "active_recall": 21,
  "active_practise": 22,
  "programming": 23,
  "cooking": 25,
  "planning": 26,
  "errands": 27,
  "general_tasking": 28,
  "work": 30,
  "travelling": 32,
  "relax": 33,
  "transition": 34,
  "shows": 37 }
var manHourSession = manHourLogSheet.getSheetByName("SummarySheet").getDataRange().getCell(4,4).getValue();

function setWebhook() {
var url = telegramUrl + "/setWebhook?url=" + webAppUrl;
var response = UrlFetchApp.fetch(url);
}

function sendMessage(chat_id, text, keyboard = []) {
  var keyBoard = {
    "inline_keyboard": keyboard
  }
  var data = {
    method: "post",
    payload: {
      method: "sendMessage",
      chat_id: String(chat_id),
      text: text,
      parse_mode: "HTML",
      reply_markup: JSON.stringify(keyBoard)
    }
  }
  UrlFetchApp.fetch(telegramUrl + "/", data)
}


function doPost(e) {
  var contents = JSON.parse(e.postData.contents);

  if(contents.message){
    var chat_id = contents.message.from.id; 
    var text = contents.message.text;
    
    var command = text.split("/")
    if(command[0] == "" && (command[1] in manHourRows || command[1] == "balance"))
    {
      if (text == "/balance"){
        sendBalance(chat_id)
      }
      else{
        logManHour(chat_id, command[1])
      }
    }
    else{
      if(manHourSession == "0"){
        var item = text.split("-"); 
        if(parseFloat(item[1]) > 0){
          logExpense(chat_id, item)
        } 
        else{
          sendMessage(chat_id, "Input error please type in the correct format of item - price.")  
        }
      }
      else{
        if(parseInt(text) > 0){
          logManHour(chat_id, manHourSession, text)
        }
        else{
          sendMessage(chat_id, "Input error please only input integers representing minutes.")  
        }
      }
    }
  }
}

function logExpense(chat_id, item){
  var nowDate = new Date();
  nowDate.setTime(nowDate.getTime() + (1000*60*60*12))
  var date = nowDate.getFullYear() + "/" + (nowDate.getMonth() + 1) + "/" + nowDate.getDate();
  var logSheet = expenseLogSheet.getSheetByName("logsheet");
  logSheet.appendRow([nowDate.getMonth() + 1, nowDate.getDate(), item[0], parseFloat(item[1])]);
  sendMessage(chat_id, "Expense of " + item[1] + " for " + item[0] + " on " + date + " is recorded.")
}

function sendBalance(chat_id){
  var nowDate = new Date();
      nowDate.setTime(nowDate.getTime() + (1000*60*60*12))
      var logSheet = expenseLogSheet.getSheetByName("logsheet");
      var budget = logSheet.getDataRange().getCell(2,2).getValue();
      var spending = logSheet.getDataRange().getCell(3,2).getValue();
      var balance = logSheet.getDataRange().getCell(4,2).getValue();
      sendMessage(chat_id, "Your budget: " + budget + 
                          "\n" + "Your spending: " + spending +
                          "\n" + "Your balance: " + balance)
}

function logManHour(chat_id, manHour = manHourSession, timing = false){
  if(timing == false){
    manHourLogSheet.getSheetByName("SummarySheet").getDataRange().getCell(4,4).setValue(manHour)
    sendMessage(chat_id, "Please input the number of minutes spent on " + manHourLogSheet.getSheetByName("SummarySheet").getDataRange().getCell(4,4).getValue())
  }
  else{
    var nowDate = new Date();
    nowDate.setTime(nowDate.getTime() + (1000*60*60*12))
    var time = String(nowDate.getHours() + ":" + nowDate.getMinutes())
    manHourLogSheet.getSheetByName("SummarySheet").getDataRange().getCell(3,2).setValue((nowDate.getMonth()+1) + "/" + nowDate.getDate())
    var date = nowDate.getFullYear() + "/" + (nowDate.getMonth() + 1) + "/" + nowDate.getDate();
    var dayOfTheWeek = nowDate.getDay()
    if(dayOfTheWeek != 0){
      nowDate.setDate(nowDate.getDate() - dayOfTheWeek)
    }
    manHourLogSheet.getSheetByName("SummarySheet").getDataRange().getCell(2,2).setValue((nowDate.getMonth()+1) + "/" + nowDate.getDate())
    var logSheet = manHourLogSheet.getSheetByName((nowDate.getMonth()+1) + "/" + nowDate.getDate());    
    logSheet.getDataRange().getCell(manHourRows[manHour], dayOfTheWeek + 2).setValue(parseInt(logSheet.getDataRange().getCell(manHourRows[manHour], dayOfTheWeek + 2).getValue()) + parseInt(timing))
    var millisecondCount = manHourLogSheet.getSheetByName("SummarySheet").getDataRange().getCell(4,3).getValue()
    nowDate.setHours(0,0,0,0)
    nowDate.setMilliseconds(nowDate.getMilliseconds() + millisecondCount)
    var currentTime = String(nowDate.getHours() + ":" + nowDate.getMinutes())
    sendMessage(chat_id, "Man hour of " + manHour + " for " + timing + " minutes on " + date + " at " + time+ " is recorded."
    + "\n" + "Current time is " + currentTime)
    manHourLogSheet.getSheetByName("SummarySheet").getDataRange().getCell(4,4).setValue("0")
  }
}
