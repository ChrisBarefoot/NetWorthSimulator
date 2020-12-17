
$(document).ready(function() {
  populateNumbers();
  runNumbers();
  $("#simulateButton").on("click", simulateANewYear); 
  $("#monteCarloButton").on("click", monteCarloSim);
});

function populateNumbers()
{
    for(var i = 0; i < currentNW.length; i++)
    {
        $("#" + currentNW[i][0]).val(currentNW[i][1]);
    }
}

function simulateANewYear()
{
  var year = parseInt($("#simulateYear").val());
  runNumbers(year);
}

function monteCarloSim()
{
  var year = parseInt($("#simulateYear").val());
  simulateAllYears();
}

function simulateAllYears()
{
  readValues();

  var numProjectYrs = project / 12;
  var numMarketYrs = numYaleData() / 12; //should be 50
  var numSims = numMarketYrs - numProjectYrs;

  var data = [];
  var labels = ["Date"];

  for(var i = 0; i < numSims; i++)
  {
    labels.push((1871 + i) + "");  
  }
  var thisYear = 1871;
  var thisMonth = currMonth;
  for(var j = 0; j < project; j++)
  {
    data.push([j/12]);
    thisMonth++;
      if(thisMonth > 11)
      {
        thisMonth = 0;
        thisYear++;
      }
  }

  for(var i = 0; i < numSims; i++)
  {
    readValues();
    var thisYear = 1871 + i;
    currYear = thisYear;

    for(var j = 0; j < project; j++)
    {

      var total = his401kVal + her401kVal + taxableVal - mortgageVal - autoLoanVal + houseVal + carVal + cashVal + hisRothVal;
      data[j].push(total);       
      
      stockPerc += stockInc;
      bondPerc += bondPerc;
      
      calcValues(currMonth, currYear, thisYear);

      currMonth++;
      firstOfYear = false;
      if(currMonth > 11)
      {
        currMonth = 0;
        currYear++;
        
        firstOfYear = true;
      }
    }
  }

  console.log(data);

  
    new Dygraph(document.getElementById("div_g"), data,
    {
      labels: labels,
      ylabel: 'Amount ($)',
      axes: {
      // x: {
      //   axisLabelFormatter: function(x) {
      //     return 'x' + x;
      //   }
      // },
      y: {
          axisLabelFormatter: function(y) {
          return y/1000000 + 'm';
        }
      }
    }
  });
}

function runNumbers(diffYear)
{
  readValues();
  $("#results").html("<tr><th>Date</th><th>Cash</th><th>Mortgage</th><th>AutoLoans</th><th>His 401k</th><th>Her 401k</th><th>His Roth</th><th>Taxable</th><th>House Value</th><th>Cars</th><th>Net Worth</th></tr>");

  var firstOfYear = true;
  var data = [];
  if(diffYear)
  {
    currYear = diffYear;
    origYear = currYear;
  }
  
  for(var i = 0; i < project; i++)
  {
    var total = his401kVal + her401kVal + taxableVal - mortgageVal - autoLoanVal + houseVal + carVal + cashVal + hisRothVal;
    var rowClass = firstOfYear?'firstYear':'otherYear';
    $("#results").append("<tr class='" + rowClass + "'>" +
      "<td>" + getPrettyDate(currMonth, currYear) + "</td>" + 
      "<td>" + mon(cashVal) + "</td>" + 
      "<td>" + mon(mortgageVal) + "</td>" + 
      "<td>" + mon(autoLoanVal) + "</td>" +
      "<td>" + mon(his401kVal) + "</td>" +
      "<td>" + mon(her401kVal) + "</td>" +
      "<td>" + mon(hisRothVal) + "</td>" +
      "<td>" + mon(taxableVal) + "</td>" +
      "<td>" + mon(houseVal) + "</td>" +
      "<td>" + mon(carVal) + "</td>" + 
      "<td>" + mon(total) + "</td>" +
      "</tr>");
    
    var thisrow = [new Date(currYear, currMonth, 1), cashVal, mortgageVal, autoLoanVal, his401kVal, her401kVal, hisRothVal, taxableVal, houseVal, carVal];
    data.push(thisrow);
    
    stockPerc += stockInc;
    bondPerc += bondPerc;
    
    calcValues(currMonth, currYear, diffYear);

    currMonth++;
    firstOfYear = false;
    if(currMonth > 11)
    {
      currMonth = 0;
      currYear++;
      
      firstOfYear = true;
    }

  }    
    new Dygraph(document.getElementById("div_g"),
      data
      ,
      {
        labels: [ "Date", "Cash", "Mortgage", "AutoLoan", "His401k", "Her401k", "HisRoth", "Taxable", "House", "Cars" ],
        ylabel: 'Amount ($)',
        axes: {
                      // x: {
                      //   axisLabelFormatter: function(x) {
                      //     return 'x' + x;
                      //   }
                      // },
                      y: {
                        axisLabelFormatter: function(y) {
                          return y/1000000 + 'm';
                        }
                      }
              }
      });
  
}

function calcValues(currMonth, currYear, diffYear)
{
    var marketGrowth = flatGrowth / 12;
    if(diffYear)
    {
        marketGrowth = getYaleData(currMonth, currYear);
        if(marketGrowth == null)
            marketGrowth = flatGrowth / 12;
    }
    
    //Mortgage Handling
    if(mortgageVal > 0)
      mortgageVal = mortgageVal - getMortgagePrincipal(mortgageValOrig, mortgageIntVal, mortgageTermVal) - mortgageExtraVal;
    if(mortgageVal <= 0)
      mortgageVal = 0;
    if((currYear - origYear) == mortgageNewYear && currMonth == 0 && mortgageNewVal > 0)
    {
      var originMort = getMortgagePayment(mortgageValOrig, mortgageIntVal, mortgageTermVal);
      mortgageVal = mortgageVal - houseVal + mortgageNewVal;
      mortgageTermVal = 12*15;
      mortgageIntVal = 4.0/100;

      newMortDiff = originMort - getMortgagePayment(mortgageVal, mortgageIntVal, mortgageTermVal) ;

      mortgageValOrig = mortgageVal;
      houseVal = mortgageNewVal;
    }

    //Auto Loan Handling
    if(autoLoanVal > 0)
      autoLoanVal = autoLoanVal - getMortgagePrincipal(autoLoanOrig, autoLoanRate, autoLoanTerm);
    if(autoLoanVal <= 0)
      autoLoanVal = 0;
    if(currMonth == 0 && carCount++ == newCarFreq)
    {
      autoLoanVal = autoLoanVal + newCarPrice;
      autoLoanOrig = autoLoanVal;
      autoLoanTerm = 48;
      carVal += newCarPrice;
      carCount = 0;
    }

    //Cash
    cashVal = calculateInvestment(cashVal, 0, cashGrowth, 1.0) + (cashAddition/12 * (hisSalary + herSalary)) + newMortDiff;

    //401k Handling
    his401kVal = calculate401k(his401kVal, his401kAdd, marketGrowth, hisSalary, his401kMatch, stockPerc, bondPerc);
    her401kVal = calculate401k(her401kVal, her401kAdd, marketGrowth, herSalary, her401kMatch, stockPerc, bondPerc);

    //Taxable
    taxableVal = calculateInvestment(taxableVal, taxableAddition, marketGrowth, stockPerc, bondPerc);

    //Roth
    hisRothVal = calculateInvestment(hisRothVal, hisRothAddition, marketGrowth, stockPerc, bondPerc);

    //House
    houseVal = houseVal + (houseVal * (houseGrowth/12));

    //Car
    carVal = carVal - (carVal * (carDepreciation/12));

    if(currMonth == 3)
    {
      //401k profit sharing
      his401kVal += (hisSalary * (his401kProfit));
      her401kVal += (herSalary * (her401kProfit));

      //Salary/raises
      herSalary += herSalary * salaryGrowth;
      hisSalary += hisSalary * salaryGrowth;
    }
}

function calculate401k(value, add, growth, salary, match, stock, bond)
{
  return calculateInvestment(value, add, growth, stock, bond) + (salary * (match/12));
}

function calculateInvestment(value, add, growth, stock, bond)
{
  return value + add + (value * growth * stock);
}

function getMortgagePayment(value, rate, months)
{
    var payment = (value * (rate/12) / (1 - Math.pow((1 + (rate/12)), -1 * months)));
    return payment;
}

function getMortgagePrincipal(value, rate, months)
{
    return getMortgagePayment(value, rate, months) - (value*(rate/12));
}

function mon(num)
{
  return "$" + num.toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");;
}

function getPrettyDate(month, year)
{
  if(month == 0)
    return 'Jan ' + year;
  else if(month == 1)
    return 'Feb ' + year;
  else if(month == 2)
    return 'Mar ' + year;
  else if(month == 3)
    return 'May ' + year;
  else if(month == 4)
    return 'Apr ' + year;
  else if(month == 5)
    return 'Jun ' + year;
  else if(month == 6)
    return 'Jul ' + year;
  else if(month == 7)
    return 'Aug ' + year;
  else if(month == 8)
    return 'Sep ' + year;
  else if(month == 9)
    return 'Oct ' + year;
  else if(month == 10)
    return 'Nov ' + year;
  else if(month == 11)
    return 'Dec ' + year;

}

function readValues()
{
  //grab years from a new field
  window.yearsToProject = parseInt($("#projectYear").val());
  window.flatGrowth = parseInt($("#flatGrowthInput").val()) / 100;
  window.project = yearsToProject * 12;

  window.currDate = new Date();
  window.currYear = currDate.getFullYear();
  window.origYear = currYear;
  window.currMonth = currDate.getMonth();

  //initiate values
  window.cashVal = parseInt($("#cashStart").val());
  window.cashAddition = parseInt($("#cashAddition").val()) / 100;
  window.cashGrowth = parseInt($("#cashGrowth").val()) / 100 / 12;

  window.mortgageVal = parseFloat($("#mortgageStartInput").val());
  window.mortgageValOrig = mortgageVal;
  window.mortgageIntVal = parseInt($("#mortgageInterestInput").val()) / 100;
  window.mortgageTermVal = $("#mortgageTermInput").val();
  window.mortgageExtraVal = parseInt($("#mortgageExtraInput").val());
  window.mortgageNewVal = parseInt($("#mortgageNewValue").val());
  window.mortgageNewYear = $("#mortgageNewYear").val();
  window.newMortDiff = 0;

  window.his401kStart = parseInt($("#his401kStart").val());
  window.his401kVal = his401kStart;
  window.his401kAdd = parseInt($("#his401kAdd").val());
  window.his401kProfit = parseInt($("#his401kProfit").val()) / 100;
  window.his401kMatch = parseInt($("#his401kMatch").val()) / 100;

  window.her401kStart = parseInt($("#her401kStart").val());
  window.her401kVal = her401kStart;
  window.her401kAdd = parseInt($("#her401kAdd").val());
  window.her401kProfit = parseInt($("#her401kProfit").val()) / 100;
  window.her401kMatch = parseInt($("#her401kMatch").val()) / 100;

  window.hisSalary = parseInt($("#hisSalary").val());
  window.herSalary = parseInt($("#herSalary").val());
  window.salaryGrowth = parseInt($("#salaryGrowth").val()) / 100;

  window.taxableStart = parseInt($("#taxableStart").val());
  window.taxableVal = taxableStart;
  window.taxableAddition = parseInt($("#taxableAddition").val());

  window.hisRothStart = parseInt($("#hisRothStart").val());
  window.hisRothVal = hisRothStart;
  window.hisRothAddition = parseInt($("#hisRothAddition").val());

  window.houseVal = parseInt($("#houseValueInput").val());
  window.houseGrowth = parseInt($("#houseValueGrowth").val()) / 100;

  window.startStockPerc = parseInt($("#startStockPerc").val()) / 100;
  window.startBondPerc = parseInt($("#startBondPerc").val()) / 100;
  window.endStockPerc = parseInt($("#endStockPerc").val()) / 100;
  window.endBondPerc = parseInt($("#endBondPerc").val()) / 100;

  window.carVal = parseInt($("#startCarValue").val());
  window.carDepreciation = parseInt($("#carDepreciation").val()) / 100;

  window.autoLoanVal = parseInt($("#autoLoanInput").val());
  window.autoLoanOrig = autoLoanVal;
  window.autoLoanRate = parseInt($("#autoLoanRate").val()) / 100;
  window.autoLoanTerm = parseInt($("#autoLoanTerm").val());
  window.newCarPrice = parseInt($("#newCarPrice").val());
  window.newCarFreq = parseInt($("#newCarFreq").val());
  window.carCount = 0;

  window.stockInc = (endStockPerc - startStockPerc) / project;
  window.bondInc = (endBondPerc - startBondPerc) / project;
  window.stockPerc = startStockPerc;
  window.bondPerc = endBondPerc;
}
