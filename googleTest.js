////---------------------系統參數設定區塊
var hostURL = 'http://google.com';

var readFileName =    'readFile_20180718';
var moduleName =      'ModuleName(log)_' + readFileName;
var csvPath =         'D:/nightwatch/TEST/' + readFileName + '.csv';
var writeCsvPath =    'D:/nightwatch/TEST/logs/';

var DEFAULT_MIDDLE_WAIT_SEC = 20; //(sec)
//---------------------系統參數設定區塊 (end)

/*  
作者				版本資訊  備註
-------------------------------------------------------------------------------------
John				20180718  initial
-------------------------------------------------------------------------------------

*/

// Converter Class 
var Converter = require("csvtojson").Converter;
var converter = new Converter({
  checkType: false //此行很重要,拿掉會把全數值的字串前置 "0" 去掉
});

//read from file 
var fs = require('fs');
fs.createReadStream(csvPath, [{flags: 'rs+'}]).pipe(converter);

var moment = require('moment');
var now = moment().format("YYYYMMDD_HHmmss");

var writeStreamReport = fs.createWriteStream(writeCsvPath + moduleName + '_' + now +".csv", [{flags: 'rs+'}]);

var seq = 1; //writing count

var self = module.exports = { 
  moduleName : function (browser) { 
    converter.on("end_parsed", function (jsonArray){

      browser.useXpath()
      for (caseNo in jsonArray){

        !function outer(caseNo){      
         
          browser.click('//body', function(result){ //start 讀檔範圍

            console.log('~~~~~ caseNo: (' + caseNo + ') ~~~~~')

            var address = jsonArray[caseNo]['addr']
            var outCsv = {
              beforeAddress: address,
              afterAddress: '',
              portalCode: '',
              afterCity: '',
              afterTownship: '',
              errorCode: ''
            }

            browser
            .url(hostURL)
            browser.pause(2000)            
            .clearValue('//*[@id="txt_Addr"]')
            .setValue('//*[@id="txt_Addr"]', address)
            .click('//*[@id="btn_Run"]')

            //*[@id="txt_AddrNew"]

            browser.pause(3000)

            browser
            .getValue('//*[@id="txt_AddrNew"]', function(getAddrNew){
              outCsv.afterAddress = getAddrNew.value.toString();             
              console.log('afterAddress: '+ outCsv.afterAddress);
            })
            .getValue('//*[@id="txt_Array0"]', function(getPortalCode){
              outCsv.portalCode = getPortalCode.value.toString();     
              console.log('portalCode: '+ outCsv.portalCode);             
            })
            .getValue('//*[@id="txt_Array1"]', function(getAfterCity){
              outCsv.afterCity = getAfterCity.value.toString();                  
            })
            .getValue('//*[@id="txt_Array2"]', function(getAfterTownship){
              outCsv.afterTownship = getAfterTownship.value.toString();                  
            })
            .getValue('//*[@id="txt_Array13"]', function(getErrorCode){
              outCsv.errorCode = getErrorCode.value.toString();     
              writeOutputCSV(outCsv);             
            }) 
          }) //end 讀檔範圍
        }(caseNo) //[caseNo]outer 
      } //[CaseNo]for 
      browser.closeWindow()
    }) //onverter.on   
  } //function
}; //module.exports

function splitDetail(hitDetail, key){

  var result = '';  
  var detailParts = hitDetail.split(" | ");

  for(var i = 0; i < detailParts.length; i++){
    if(key == detailParts[i].substring(detailParts[i].indexOf(key), (detailParts[i].indexOf(key) + key.length))){

      var columnParts = detailParts[i].substring(detailParts[i].indexOf(key), detailParts[i].indexOf(key).length).replace(/[[]/gmi, '|[').split("|");
      //result = columnParts[1]; //含欄位標頭

      //console.log("noTitle: "+ columnParts[1].substring(columnParts[1].indexOf(key)+ key.length+1));
      result = columnParts[1].substring(columnParts[1].indexOf(key)+ key.length+1); //不含欄位標頭
    }
  }
  return result;
}

//\r is "Carriage Return" (CR, ASCII character 13), \n is "Line Feed" (LF, ASCII character 10). 
function trimCRLF(v){
  var r = v;

  try{
    r = v.replace(/[^\x20-\x7E]/gmi, ' | ');
  }
  catch(e){
    r = v;
  }

  return r;
}

var outputLine = 0;
function writeOutputCSV(outCsv){

  var dumpFields = [
    outCsv.beforeAddress
    , outCsv.afterAddress
    , outCsv.portalCode
    , outCsv.afterCity
    , outCsv.afterTownship
    , outCsv.errorCode
  ];

    if(seq++ == 1){
      writeStreamReport.write('beforeAddress`afterAddress`portalCode`afterCity`afterTownship`errorCode'); 
      writeStreamReport.write('\r\n');
    }  

    outputLine++;
    //writeStreamReport.write(outputLine>0 ? '\r\n' : '');
    for(var i=0; i<dumpFields.length; i++){
      //var key = i;
      //var val = dumpFields[i];
      console.log('*** writeOutputCSV(' + outputLine + ', [' + i + ']) = [' + dumpFields[i] + ']');
      writeStreamReport.write(i>0 ? '`' : '');
      writeStreamReport.write('' + dumpFields[i] + '');
    }  

  writeStreamReport.write('\r\n');

  console.log('-'.repeat(100));
}

function getTableRowSize(browser, objXPath, callback){
  browser
  .elements('xpath', objXPath, function(result) {
    var rowSize = 0;
    if(result != -1){
      rowSize = result.value.length;
    }//if
    console.log('getTableRowSize(' + objXPath + '): ' + rowSize);
    callback(rowSize);
  })  
} //getTableRowSize

function waitVisible(browser, objPath, sec){
  if(objPath != null){
    var msec = (sec==null ? DEFAULT_MIDDLE_WAIT_SEC : sec) * 1000;

    browser
    //.useXpath() /*** 重要 ***/
    .waitForElementVisible(objPath, msec)
  }

  return browser
} //waitVisible

function replaceStr(s){
  var r = null;
  
  if(s != null){
    r = s.toString().replace(/\'/g, "");
  }

  return r;
} //replaceStr