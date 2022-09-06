// **********************************************************************************
// Helper functioin to get some movement in simple parameters like size, speed, obribt etc.
// **********************************************************************************
function GetIncreasedValue(theValue, growthRate, min, max) {
  theValue += growthRate;
  if (theValue <= min || theValue >= max) {
    growthRate *= (-1);
  }
  return { theValue, growthRate };
}

// **********************************************************************************
// Returns a random decimal number beetween min and max
// **********************************************************************************
function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

// Returns randomly 1 and -1
function changeSignRandom() {
if (Math.random() < 0.5) return -1;
return 1;
}

// **********************************************************************************
// Returns a rotated point. Angle is in degree.
// **********************************************************************************
function rotate(rotationCenterX, rotationCenterY, x, y, angle) {
  var radians = (Math.PI / 180) * angle,
      cos = Math.cos(radians),
      sin = Math.sin(radians),
      newX = (cos * (x - rotationCenterX)) + (sin * (y - rotationCenterY)) + rotationCenterX,
      newY = (cos * (y - rotationCenterY)) - (sin * (x - rotationCenterX)) + rotationCenterY;
  return {newX, newY};
}

// **********************************************************************************
// Helper class vector
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


// ***************************************************************************************************************************************************
// Angenommen in jedem Eckpunkt herrscht eine Gewicht von 1.0 des jeweiligen Eckpunktes, wobei die restlichen drei
// Eckpunkte ein Gewicht von 0.0 haben. Je weiter ein pointOfInterest von einem Eckpunkt entfernt ist, desto weniger nimmt
// Eckpunkt auf den pointOfInterest Einfluss. Diese Funktion berechnet den Einfluss jedes Eckpunktes auf einen pointOfInterest.
// ***************************************************************************************************************************************************
function getCornerPointValue(width, height, cornerPoint, pointOfInterest) {
  cornerpointMaxLine = getCornerpointMaxLine(width, height, cornerPoint, pointOfInterest)
  let normalizedGravity = getNormalizedGravity(cornerPoint, pointOfInterest, cornerpointMaxLine);
  return normalizedGravity;
}

function getCornerpointMaxLine(width, height, cornerPoint, pointOfInterest) {
  transformatedPOI = new Vector(Math.abs(cornerPoint.x-pointOfInterest.x), Math.abs(cornerPoint.y-pointOfInterest.y))
  transforamtedCornerPoint = new Vector(0,0);
  m = (transformatedPOI.y - transforamtedCornerPoint.y) / (transformatedPOI.x - transforamtedCornerPoint.x);
  yValueOfLine = m * width;
  if (yValueOfLine > height) {
    xValueOfLine = height / m;
    return transforamtedCornerPoint.distanceTo(new Vector(xValueOfLine, height));
  }
  return transforamtedCornerPoint.distanceTo(new Vector(width, yValueOfLine));
}

function getNormalizedGravity(point, pointOfInterest, maxLength) {
  distanceToPoint = ((1.0) * point.distanceTo(pointOfInterest)) / maxLength;
  return 1 - distanceToPoint;
}

function makeSinusoidal(normalizedValue, exponent){
  //return normalizedValue;
  return ((-1) * Math.pow(Math.sin(Math.PI/2 * normalizedValue + Math.PI/2),exponent)) + 1;
}

// ***************************************************************************************************************************************************
// Color nightmare. Someone who knows js is sure to get the nonsense here down better.
// ***************************************************************************************************************************************************
function getColor(proximityArray, sumProximity) {
  if (typeof theCanvas !== 'undefined') {
    weightedColorArry = [];
    weightedColorArry.push(getWeightetColor(color_A, proximityArray[0]));
    weightedColorArry.push(getWeightetColor(color_B, proximityArray[1]));
    weightedColorArry.push(getWeightetColor(color_C, proximityArray[2]));
    weightedColorArry.push(getWeightetColor(color_D, proximityArray[3]));

    r = g = b = 0;
    for (let i = 0; i < weightedColorArry.length; i++) {
      var color = weightedColorArry[i].split(',');
      r += Math.round(parseInt(color[0]));
      g += Math.round(parseInt(color[1]));
      b += Math.round(parseInt(color[2]));
    }
    newColor = [];
    newColor.push(
      Math.min(r,255),
      Math.min(g,255),
      Math.min(b,255));
    //newColor.push(r / sumProximity, g / sumProximity, b / sumProximity);
    return newColor.join(', ')
  }
}

function getWeightetColor(color, weight) {
  var thecolor = color.split(',');
  thecolor[0] *= weight;
  thecolor[1] *= weight;
  thecolor[2] *= weight;
  return thecolor.join(', ');
}