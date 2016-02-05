import app from "../app";

export default app.controller("PersonController", ["$scope", ($scope) => {
  $scope.firstName = "";
  $scope.lastName = "";
  $scope.fullName = function() {
    return `${$scope.firstName} ${$scope.lastName}`;
  };
}]);
