(function () {
  app = angular.module('dv', [])
    .controller('mainController', mainController)
    .service('Boxes', boxService);

  var MONGO_API_URL = null;
  var POLLING_INTERVAL = 3 * 1000; // every 3 seconds

  function mainController($scope, $http, Boxes) {
    _init();
    //_testOffline();

    function _testOffline() {
      $scope.environments = JSON.parse('[{"envName":"prod","boxes":[{"color":"#038505","environment":"prod","age":1.6,"instanceId":1},{"color":"#038505","environment":"prod","age":1.6,"instanceId":2}],"$$hashKey":"object:550"},{"envName":"prod2","boxes":[{"color":"#038505","environment":"prod2","age":1.6,"instanceId":1},{"color":"#038505","environment":"prod2","age":1.6,"instanceId":2}],"$$hashKey":"object:550"},{"envName":"beta","boxes":[{"color":"#038505","environment":"beta","age":1.6,"instanceId":1},{"color":"#038505","environment":"beta","age":1.6,"instanceId":2}],"$$hashKey":"object:548"},{"envName":"local","boxes":[{"color":"#038505","environment":"local","age":1.5,"instanceId":1}],"$$hashKey":"object:549"},{"envName":"test","boxes":[{"color":"#038505","environment":"test","age":5.5,"instanceId":1},{"color":"#038505","environment":"test","age":5.5,"instanceId":2},{"color":"#038505","environment":"test","age":1.5,"instanceId":3}],"$$hashKey":"object:551"}]');
      $scope.environments.shift();
      $scope.environments.shift();
      $scope.environments.shift();
    }

    function _init() {
      _getMongoApiUrl(function (err) {
        if (err)
          console.log('Error while getting the MONGO_API_URL: ', err);
        else {
          _updateBoxes();
        }
      });
    }

    function _getMongoApiUrl(next) {
      $http({
        method: 'GET',
        url: '/api/MONGO_API_URL'
      })
        .then(
          function (response) {
            MONGO_API_URL = response.data.MONGO_API_URL;
            return next();
          },
          function (err) {
            return next(err);
          }
        );
    }

    function _updateBoxes() {
      Boxes.get(function (err, environments) {
        if (err)
          console.log('err', err);
        else
          $scope.environments = environments;

        _.delay(_updateBoxes, POLLING_INTERVAL);
      });
    }
  }

  function boxService($http) {
    return {
      get: function (callback) {
        $http({
          method: 'GET',
          url: MONGO_API_URL
        })
          .then(
            function (response) {
              var boxes = _.chain(response.data)
                .map(function (dbObj) {
                  var now = new Date().getTime();
                  var boxUpdatedAt = new Date(dbObj.updatedAt.$date).getTime();
                  var age = Math.round(10 * (now - boxUpdatedAt) / 1000) / 10;
                  console.log('age of ', dbObj.environment, ' is ', age);
                  return new Box(dbObj.color, dbObj.environment, age);
                })
                .groupBy('environment')
                .each(function (envBoxes, envName) {
                  _.each(envBoxes, function (envBox, index) {
                    envBox.instanceId = index + 1;
                  });
                })
                .map(function (value, key) {
                  var obj = {};
                  obj.envName = key;
                  obj.boxes = value;
                  return obj;
                })
                .value();
              callback(null, boxes);
            },
            function (err) {
              callback(err);
            }
          );
      }
    };
  }

  function Box(color, environment, age, instanceId) {
    this.color = color;
    this.environment = environment;
    this.age = age;
    this.instanceId = instanceId;
  }
})();
