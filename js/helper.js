// **********************************************************************************
// Helper functioin to get some movement in simple parameters like size, speed, obribt etc.
// **********************************************************************************
function GetIncreasedValue(theValue, growthRate, min, max) {
  theValue+=growthRate;
  if (theValue < min || theValue > max){
    growthRate*=(-1);
  }
    return {theValue, growthRate};
  }
  
// **********************************************************************************
// Returns a random decimal number beetween min and max
// **********************************************************************************
  function getRandom(min, max) {
    return Math.random() * (max - min) + min;
  }

  
// **********************************************************************************
// Helper class
// **********************************************************************************
  function Vector(x, y) {
    this.x = x;
    this.y = y;
  }
  
// **********************************************************************************
// Returns a random decimal number beetween min and max
// **********************************************************************************
  Vector.prototype.distanceTo = function (vector, abs) {
    var distance = Math.sqrt(Math.pow(this.x - vector.x, 2) + Math.pow(this.y - vector.y, 2));
    return abs || false ? Math.abs(distance) : distance;
  };
  