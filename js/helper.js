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


//
// Angenommen in jedem Eckpunkt herrscht eine Gewicht von 1.0 des jeweiligen Eckpunktes, wobei die restlichen drei
// Eckpunkte ein Gewicht von 0.0 haben. Je weiter ein pointOfInterest von einem Eckpunkt entfernt ist, desto weniger nimmt
// Eckpunkt auf den pointOfInterest Einfluss. Diese Funktion berechnet den Einfluss jedes Eckpunktes auf einen pointOfInterest.
//
function getCornerPointValue(theCanvas, cornerPoint, pointOfInterest) {
  cornerpointMaxLine = getCornerpointMaxLine(theCanvas, cornerPoint, pointOfInterest)
  return getNormalizedGravity(cornerPoint, pointOfInterest, cornerpointMaxLine);
}

function getCornerpointMaxLine(theCanvas, cornerPoint, pointOfInterest) {
  transformatedPOI = new Vector(Math.abs(cornerPoint.x-pointOfInterest.x), Math.abs(cornerPoint.y-pointOfInterest.y))
  transforamtedCornerPoint = new Vector(0,0);
  m = (transformatedPOI.y - transforamtedCornerPoint.y) / (transformatedPOI.x - transforamtedCornerPoint.x);
  yValueOfLine = m * theCanvas.width;
  if (yValueOfLine > theCanvas.height) {
    xValueOfLine = theCanvas.height / m;
    return transforamtedCornerPoint.distanceTo(new Vector(xValueOfLine, theCanvas.height));
  }
  return transforamtedCornerPoint.distanceTo(new Vector(theCanvas.width, yValueOfLine));
}

function getNormalizedGravity(point, pointOfInterest, maxLength) {
  distanceToPoint = ((1.0) * point.distanceTo(pointOfInterest)) / maxLength;
  return 1 - distanceToPoint;
}