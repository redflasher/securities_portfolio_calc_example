var calcApp = angular.module('calcApp', ['ngRoute']);

calcApp.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {

    $routeProvider
      .when('/all', {
        templateUrl: 'views/all.html'
      })
      .when('/profit', {
        templateUrl: 'views/profit.html'
      })
      .when('/loss', {
        templateUrl: 'views/loss.html'
      })
      .when('/summary', {
        templateUrl: 'views/summary.html'
      })
      .otherwise({redirectTo:"/all"});


}]);


//FILTERS

calcApp.filter("profitFilter",function()
{
  return function (items,profit) {
    var filtered = {};
    for(var item in items)
    {
      if(profit == "low"){
        if(items[item].profit <= 0){
          filtered[items[item].name] = items[item];
        }
      } else if(profit=="high") {
        if(items[item].profit > 0){
          filtered[items[item].name] = items[item];
        }
      }
    }
    return filtered;
  };
});

//фильтр для вывода результата по сводке портфеля
calcApp.filter("summaryFilter",function()
{
  return function (items) {
    var filtered = [];
    var totalInvestment = 0;
    //вычисления для сводки по портфелю
    for(var item in items){
      filtered.push(items[item]);
      filtered[item] = items[item];
      filtered[item].percent = 0;
      filtered[item].totalCost = 0;
      filtered[item].totalProfit = 0;
      for(var i in items[item].history){
        filtered[item].totalCost += items[item].history[i].buyingPrice*items[item].history[i].amount;
      }
      filtered[item].totalProfit = items[item].profit;
      totalInvestment += filtered[item].totalCost;
    }
    //подсчет процента от стоимости портфеля
    for(var item in items) {
      filtered[item].percent = filtered[item].totalCost / totalInvestment;
      filtered[item].percent *= 100;
    }
    //сортируем по убыванию
    sortByPercent(filtered);
    return filtered;
  };

function sortByPercent(data) {
    var tmp;
    for (var i = data.length - 1; i > 0; i--) {
        for (var j = 0; j < i; j++) {
            if (data[j].percent < data[j+1].percent) {
                tmp = data[j];
                data[j] = data[j+1];
                data[j+1] = tmp;
            }
        }
    }
    return data;
}

});

//end FILTERS

calcApp.controller('TableController', ["$location","$scope", function($location,$scope) {
  //UI  
  $scope.buttons = [
    {name:"Все",isActive:"",url:"#/all"},
    {name:"Доходные",isActive:"",url:"#/profit"},
    {name:"Убыточные",isActive:"",url:"#/loss"},
    {name:"Сводка",isActive:"",url:"#/summary"}
  ];

  $scope.stocks = {};

  //переключаем подсветку кнопок, в зависимости от выбранного маршрута (url)
  $scope.setActive = function($index)
  {
    for(var i in $scope.buttons)
    {
      $scope.buttons[i].isActive="";
    }
    $scope.buttons[$index].isActive="active";
  };
  //END UI

  //LOGIC
  $scope.newStock = {};
  $scope.addNewStock = function()
  {
    if($scope.newStock.name != undefined && $scope.newStock.name !=""
        &&
        $scope.newStock.price != undefined && $scope.newStock.price >0
        &&
        $scope.newStock.amount != undefined && $scope.newStock.amount !="")
    {

      if( $scope.stocks[$scope.newStock.name] == undefined )//такой акции еще нет - добавляем ее первый раз
      {
        $scope.stocks[$scope.newStock.name] = {
          name: $scope.newStock.name,
          history:[
          {
            averagePrice:$scope.newStock.price,
            buyingPrice:$scope.newStock.price,
            amount:$scope.newStock.amount,
            currentPrice:$scope.newStock.price
          }],

          averagePrice:$scope.newStock.price,
          buyingPrice:$scope.newStock.price,
          amount:$scope.newStock.amount,
          currentPrice:$scope.newStock.price,

          profit:0,
          isEdit:false,
          isSetCurPrice:false,
        };
      }
      else//акция уже есть - корректируем ее значения
      {

        var oldTotalPrice = $scope.stocks[$scope.newStock.name].buyingPrice * $scope.stocks[$scope.newStock.name].amount;
        var newTotalPrice = $scope.newStock.price * $scope.newStock.amount;

        var oldAmount = $scope.stocks[$scope.newStock.name].amount;
        var newAmount = $scope.newStock.amount;
        var totalAmount = oldAmount + newAmount;

        var averagePrice = ((oldTotalPrice*oldAmount) + (newTotalPrice*newAmount)) / totalAmount;

        $scope.stocks[$scope.newStock.name].history.push({
          buyingPrice:$scope.newStock.price,
          amount:$scope.newStock.amount
        });

          var totalPrice = 0;
          var totalAmount = 0;
          for(var item in $scope.stocks[$scope.newStock.name].history)
          {
            var itemAmount = $scope.stocks[$scope.newStock.name].history[item].amount;
            var itemPrice = $scope.stocks[$scope.newStock.name].history[item].buyingPrice;
            totalPrice += itemAmount*itemPrice;
            totalAmount += itemAmount;
          }
          var averagePrice = totalPrice / totalAmount;

          //обновляем среднюю цену и количество
          $scope.stocks[$scope.newStock.name].averagePrice = averagePrice;
          $scope.stocks[$scope.newStock.name].amount = totalAmount;

          //пересчитываем доходность/убыточность
          $scope.updateProfitStatus($scope.newStock.name);

          $scope.newStock = {};
      }
    }
  };


  $scope.switchCurPriceBtn = function(name)
  {
    $scope.stocks[name].isEdit = !$scope.stocks[name].isEdit;
    $scope.stocks[name].isSetCurPrice = true;
    $scope.updateProfitStatus(name);
  };

  $scope.updateProfitStatus = function(name)
  {
    if( $scope.stocks[name].currentPrice > 0 
      && $scope.stocks[name].currentPrice != undefined 
      && $scope.stocks[name].currentPrice != ""){

      var totalAmount = $scope.stocks[name].amount;
      var averagePrice = $scope.stocks[name].averagePrice;
      var currentPrice = $scope.stocks[name].currentPrice;      
      var profit = (currentPrice - averagePrice) * totalAmount;

      //обновляем прибыльность
      $scope.stocks[name].profit = profit;

      //задаем цвет позиции, только если указана текущая цена
      if($scope.stocks[name].isSetCurPrice){      
        if($scope.stocks[name].profit >0){
          $scope.stocks[name].isProfitClass = "success";
        }else{
          $scope.stocks[name].isProfitClass = "danger";
        }  
      }
    }
  };


  //SUMMARY (Сводка)
  //всего бумаг
  $scope.getTotalStocks = function(){
    var count = 0;
    for (var item in $scope.stocks)count++;
    return count;
  };
//прибыльные бумаги
$scope.getTotalProfitStocks = function(){
    var count = 0;
    for (var item in $scope.stocks)
    {
      if($scope.stocks[item].profit>0)count++;
    }
    return count;
  };

//убыточные бумаги
$scope.getTotalNonProfitStocks = function(){
    var count = 0;
    for (var item in $scope.stocks)
    {
      if($scope.stocks[item].profit<=0)count++;
    }
    return count;
  };

// Текущий показатель прибыли/убытка
$scope.getTotalProfit = function(){
    var totalProfit = 0;
    for (var item in $scope.stocks)
    {
      totalProfit += $scope.stocks[item].profit;
    }
    return totalProfit;
  };


// Текущая цена портфеля (сколько было потрачено на его приобретение всегго)
$scope.getTotalCost = function(){
    var totalCost = 0;
    
    for(var stock in $scope.stocks)
    {    
      for(var item in $scope.stocks[stock].history)
      {
        var itemAmount = $scope.stocks[stock].history[item].amount;
        var itemPrice = $scope.stocks[stock].history[item].buyingPrice;
        totalCost += itemAmount*itemPrice;
      }
    }

    return totalCost;
  };


  //END LOGIC







  // INIT
  //устанавливаем подсветку Tab-кнопки, в соответствии со ссылкой
  for(var btn in $scope.buttons )
  {
    if($scope.buttons[btn].url == "#"+$location.url())  $scope.setActive(btn);
  }

}]);
