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

function makeLogisticGrowthFunction(originalValue, usageOfThisInPercent){
  //return normalizedValue;
  let newValue = 1.0 / (1 + Math.pow(Math.E, (-4*originalValue+2)*4));
  return newValue * usageOfThisInPercent + originalValue * (1-usageOfThisInPercent);
  //return ((-1) * Math.pow(Math.sin(Math.PI/2 * normalizedValue + Math.PI/2),exponent)) + 1;
}

// ***************************************************************************************************************************************************
// Color nightmare. Someone who knows js is sure to get the nonsense here down better.
// ***************************************************************************************************************************************************

/**
 * Converts an RGB color value to HSV. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and v in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSV representation
 */
 function rgbToHsv(r, g, b) {
  r /= 255, g /= 255, b /= 255;

  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, v = max;

  var d = max - min;
  s = max == 0 ? 0 : d / max;

  if (max == min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }

  return [ h, s, v ];
}

/**
 * Converts an HSV color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes h, s, and v are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  v       The value
 * @return  Array           The RGB representation
 */
function hsvToRgb(h, s, v) {
  var r, g, b;

  var i = Math.floor(h * 6);
  var f = h * 6 - i;
  var p = v * (1 - s);
  var q = v * (1 - f * s);
  var t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }

  return [ r * 255, g * 255, b * 255 ];
}


function getColor(proximityArray, useLogisticGrowthInPercent) {
  if (typeof theCanvas !== 'undefined') {
    weightedColorArry = [];
    weightedColorArry.push(getWeightetColor(color_A, makeLogisticGrowthFunction(proximityArray[0], useLogisticGrowthInPercent)));
    weightedColorArry.push(getWeightetColor(color_B, makeLogisticGrowthFunction(proximityArray[1], useLogisticGrowthInPercent)));
    weightedColorArry.push(getWeightetColor(color_C, makeLogisticGrowthFunction(proximityArray[2], useLogisticGrowthInPercent)));
    weightedColorArry.push(getWeightetColor(color_D, makeLogisticGrowthFunction(proximityArray[3], useLogisticGrowthInPercent)));

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

    hsv = rgbToHsv(newColor[0], newColor[1], newColor[2]);
    hsv[2] = Math.sqrt(hsv[2]);
    //hsv[1] = 1;
    theEnlightedColor = hsvToRgb(hsv[0], hsv[1], hsv[2]);
    return theEnlightedColor.join(', ')
  }
}

function getWeightetColor(color, weight) {
  var thecolor = color.split(',');
  thecolor[0] *= weight;
  thecolor[1] *= weight;
  thecolor[2] *= weight;
  return thecolor.join(', ');
}