// ***************************************************************************************************************************************************
// *** Ctor Canvas
// ***************************************************************************************************************************************************
function Canvas(options) {
  this.options = options;
  this.el = domCanvas;
  this.ctx = this.el.getContext('2d');
  this.dpr = window.devicePixelRatio || 1;
  this.centerShiftPosition = new Vector(0, 0);

  this.updateDimensions();
  window.addEventListener('resize', this.updateDimensions.bind(this), false);
  this.resetTarget();

  if (isTouch) {
    // touch
    this.el.addEventListener('touchstart', this.touchMove.bind(this), false);
    this.el.addEventListener('touchmove', this.touchMove.bind(this), false);
    //   	this.el.addEventListener('touchend', this.resetTarget.bind(this), false);
  } else {
    // Mouse
    window.addEventListener('mousemove', this.mouseMove.bind(this), false);
    window.addEventListener('mouseout', this.resetTarget.bind(this), false);
  }

  this.calculatePromities();
  this.setupParticles();
  this.loop();
}

// ***************************************************************************************************************************************************
// *** updateDimensions
// ***************************************************************************************************************************************************
Canvas.prototype.updateDimensions = function () {
  this.width = window.innerWidth * this.dpr;
  this.height = window.innerHeight * this.dpr;

  this.el.width = this.width;
  this.el.height = this.height;

  this.A = new Vector(0, 0);
  this.B = new Vector(this.width, 0);
  this.C = new Vector(this.width, this.height);
  this.D = new Vector(0, this.height);
}

// Set this.taget to the mouse corsor position
Canvas.prototype.mouseMove = function (event) {
  this.target = new Vector(event.clientX * this.dpr, event.clientY * this.dpr);

  //Calculates the relative proximity of the target to the corners of the canvas. 
  this.calculatePromities();
  // console.info(this.target);
  // console.info(this.proximity);
  // console.info(getColor(this.proximity, factorForUsingLogisticColorFunction))
}

// Reset to center when the mouse moved out of browser window
Canvas.prototype.resetTarget = function () {
  this.target = new Vector(this.width / 2, this.height / 2);
  this.calculatePromities();
}

// Set this.taget to the touch position
Canvas.prototype.touchMove = function (event) {
  if (event.touches.length === 1) { event.preventDefault(); }

  this.target = new Vector(event.touches[0].pageX * this.dpr, event.touches[0].pageY * this.dpr);

  //Calculates the relative proximity of the target to the corners of the canvas. 
  this.calculatePromities();
}

// ***********************************************************************************************
// *** Calculate proximity of target to the corner points.
// ***********************************************************************************************
Canvas.prototype.calculatePromities = function () {
  this.proximity = new Array(
    getCornerPointValue(this.width, this.height, this.A, this.target),
    getCornerPointValue(this.width, this.height, this.B, this.target),
    getCornerPointValue(this.width, this.height, this.C, this.target),
    getCornerPointValue(this.width, this.height, this.D, this.target));

  this.sumProximity = 0;
  this.proximity.forEach(element => {
    this.sumProximity += element
  });
}

// ***************************************************************************************************************************************************
// *** Canvas.setupParticles
// ***************************************************************************************************************************************************
Canvas.prototype.setupParticles = function () {
  this.particles = [];
  var distanceBetweenPaerticles = PI2 / particleCount;

  for (let index = 0; index < particleCount; index++) {
    // All particles are arranged equidistantly on a circle around the centre of the canvas. The start positions of the particles are outside the 
    // visible area. This has the effect that when this spectacle is started, all particles fly towards the centre of the canvas like inverted sunbeams. 
    var max = Math.max(this.width, this.height);
    var angle = index * distanceBetweenPaerticles; // This is the angle in radians
    var x = Math.cos(angle) * max;
    x += this.width / 2;
    var y = Math.sin(angle) * max;
    y += this.height / 2;

    var particle = new Particle({
      x: x,
      y: y,
      angle: angle,
    }, index);

    this.particles.push(particle);
  }
}

// Findet den am nächsten liegenden Partikel oder mehrere
Canvas.prototype.findClosest = function () {
  for (let index = 0; index < this.particles.length; index++) {
    this.particles[index].closest = [];

    for (let closestIndex = 0; closestIndex < this.particles.length; closestIndex++) {
      var closest = this.particles[closestIndex];
      var distance = this.particles[index].position.distanceTo(closest.position);
      if (distance < maximumLinkDistances) {
        var vector = new Vector(closest.position.x, closest.position.y);
        vector.opacity = 1 - 0.7 * (distance / maximumLinkDistances);
        vector.distance = distance;
        this.particles[index].closest.push(vector);
      }
    }
  }
}

// ***************************************************************************************************************************************************
// *** Loop
// *** Framrate is ~50 FPS. This is probably related to your computer and/or your browser.
// ***************************************************************************************************************************************************
Canvas.prototype.loop = function () {
  if (isTouch || isSafari) {
    this.ghost();
  } else {
    this.ghostGradient();
  }
  if (maximumLinkDistances > 0) {
    this.findClosest();
  }
  this.draw();
  //this.drawCenter();
  window.requestAnimationFrame(_.bind(this.loop, this));
}

Canvas.prototype.clear = function () {
  this.ctx.clearRect(0, 0, this.width, this.height);
}

Canvas.prototype.ghost = function () {
  this.ctx.rect(0, 0, this.width, this.height);
  if (typeof this.options.background === 'string') {
    this.ctx.fillStyle = "rgb(" + this.options.background + ")";
  } else {
    this.ctx.fillStyle = "rgb(" + this.options.background[0] + ")";
  }
  this.ctx.fill();
}

// Sicher nicht für den Schweif verantwortlich. Das ist nur die Hintergrundfarbe des Canvas
Canvas.prototype.ghostGradient = function () {
  var gradient;

  if (typeof this.options.background === 'string') {
    this.ctx.fillStyle = 'rgb(' + this.options.background + ')';
  } else {
    var gradient = this.ctx.createRadialGradient(this.width / 2, this.height / 2, 0, this.width / 2, this.height / 2, Math.max(this.width, this.height) / 2);

    var length = this.options.background.length;
    for (var i = 0; i < length; i++) {
      gradient.addColorStop((i + 1) / length, 'rgb(' + this.options.background[i] + ')');
    }
    this.ctx.fillStyle = gradient;
  }

  this.ctx.globalOpacity = 0.1;
  //this.ctx.fillStyle = 'rgb(' + [15, 15, 22] + ')';

  this.ctx.globalCompositeOperation = "darken";
  this.ctx.fillRect(0, 0, this.width, this.height);
}

// Draw
// Function is called in a loop
Canvas.prototype.draw = function () {
  this.ctx.globalAlpha = 0.3;
  this.ctx.globalCompositeOperation = "screen";

  for (let index = 0; index < this.particles.length; index++) {
    var actualParticle = this.particles[index];
    var color = actualParticle.color || this.options.color;
    actualParticle.update(this.target, index);

    if (typeof color !== 'undefined' && color.split(',')[0] != "NaN") {
      // Paints a 360° (2*PI) circle at particle position and fills it
      // So yes, this paints the particle.
      var gradient = this.ctx.createRadialGradient(
        actualParticle.position.x,
        actualParticle.position.y,
        minimumParticleSize,
        actualParticle.position.x,
        actualParticle.position.y,
        actualParticle.size);

      gradient.addColorStop(0, 'rgb(' + color + ')');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      for (let lightMe = 0; lightMe < 5; lightMe++) {
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(actualParticle.position.x, actualParticle.position.y, actualParticle.size * this.dpr, 0, PI2, false);
        this.ctx.closePath();
        this.ctx.fill();
      }

      if (maximumLinkDistances > 0) {
        this.drawLines(actualParticle, color);
      }
    }
  }
}

// Draw connecting lines
Canvas.prototype.drawLines = function (particle, color) {
  color = color;
  this.ctx.lineCap = 'round';
  for (let index = 0; index < Math.min(particle.closest.length, maximumNumberOfLines); index++) {
    this.ctx.lineWidth = (particle.size * this.dpr) * particle.closest[index].opacity;
    this.ctx.strokeStyle = 'rgba(' + color + ', ' + particle.closest[index].opacity + ')';
    this.ctx.beginPath();
    this.ctx.moveTo(particle.position.x, particle.position.y);
    this.ctx.lineTo(particle.closest[index].x, particle.closest[index].y);
    this.ctx.stroke();
  }
}

Canvas.prototype.drawCenter = function () {
  this.centerShiftPosition.x += (this.target.x - this.centerShiftPosition.x) * followMouseSpeed;
  this.centerShiftPosition.y += (this.target.y - this.centerShiftPosition.y) * followMouseSpeed;

  this.ctx.lineCap = 'round';
  this.ctx.lineWidth = 1;
  this.ctx.strokeStyle = 'rgba(' + [255, 255, 255] + ', ' + [255] + ')';
  this.ctx.beginPath();
  this.ctx.moveTo(this.centerShiftPosition.x, this.centerShiftPosition.y);
  this.ctx.lineTo(this.target.x, this.target.y);
  this.ctx.stroke();
}

// ***************************************************************************************************************************************************
// *** Ctor Particle
// ***************************************************************************************************************************************************
function Particle(options, index) {
  options = _.clone(options || {});
  this.options = _.defaults(options, this.options);
  // Here, Ike either made a significant mistake or did it on purpose.
  // original code: this.position = this.shift = new Vector(this.options.x, this.options.y);
  this.position = new Vector(this.options.x, this.options.y);
  this.particleShift = new Vector(this.options.x, this.options.y);
  this.angle = this.options.angle;

  // Color
  if (this.options.color) {
    var color = this.options.color.split(',');
    var colorIndex = -1;
    while (++colorIndex < 3) {
      color[colorIndex] = Math.round(parseInt(color[colorIndex], 10) + (Math.random() * 100) - 50);

      // Clamp
      color[colorIndex] = Math.min(color[colorIndex], 255);
      color[colorIndex] = Math.max(color[colorIndex], 0);
    }
    this.color = color.join(', ');
  }

  // Speed
  this.speed = getRandom(minimumParticleSpeed, maximumParticleSpeed);
  this.particleSpeedChangeRate = particleSpeedChangeRate * changeSignRandom();

  // Size
  this.size = getRandom(minimumParticleSize, maximumParticleSize);
  this.particleSizeGrowthRate = particleSizeGrowthRate * changeSignRandom();

  // Orbit
  this.orbitX = getRandom(minimumOrbit, maximumOrbit);
  this.orbitY = getRandom(minimumOrbit, maximumOrbit);
  this.orbitChangeRateX = orbitChangeRateX * changeSignRandom();
  this.orbitChangeRateY = orbitChangeRateY * changeSignRandom();

  // Theta
  this.theta = getRandom(0, 360);
  this.thetaChangerate = thetaChangerate * changeSignRandom();

  this.proximityA = 0;
  this.proximityB = 0;
  this.proximityC = 0;
  this.proximityD = 0;
  this.sumProximity = this.proximityA + this.proximityB + this.proximityC + this.proximityD;
}

// ***************************************************************************************************************************************************
// *** Cyclic update of variable particle parameters like position, size, speed, color, orbit
// ***************************************************************************************************************************************************
Particle.prototype.update = function (target, index) {
  this.particleShift.x += (target.x - this.particleShift.x) * followMouseSpeed;
  this.particleShift.y += (target.y - this.particleShift.y) * followMouseSpeed;

  this.angle += this.speed;

  if (index % 2 === 0) {
    this.position.x = this.particleShift.x + Math.cos(this.angle) * this.orbitX;
    this.position.y = this.particleShift.y + Math.sin(this.angle) * this.orbitY;
  }
  else {
    this.position.x = this.particleShift.x + Math.sin(index + this.angle) * this.orbitX;
    this.position.y = this.particleShift.y + Math.cos(index + this.angle) * this.orbitY;
  }

  // Rotate
  positionHelper = rotate(this.particleShift.x, this.particleShift.y, this.position.x, this.position.y, this.theta);
  this.position.x = positionHelper.newX;
  this.position.y = positionHelper.newY;
  thetaHelper = GetIncreasedValue(this.theta, this.thetaChangerate, 0, 360);
  this.theta = thetaHelper.theValue;
  this.thetaChangerate = thetaHelper.growthRate;

  // Change orbit
  let orbitHelper = GetIncreasedValue(this.orbitX, this.orbitChangeRateX, minimumOrbit, maximumOrbit);
  this.orbitX = orbitHelper.theValue;
  this.orbitChangeRateX = orbitHelper.growthRate;
  orbitHelper = GetIncreasedValue(this.orbitY, this.orbitChangeRateY, minimumOrbit, maximumOrbit);
  this.orbitY = orbitHelper.theValue;
  this.orbitChangeRateY = orbitHelper.growthRate;

  // Change speed
  let speedHelper = GetIncreasedValue(this.speed, this.particleSpeedChangeRate, minimumParticleSpeed, maximumParticleSpeed);
  this.speed = speedHelper.theValue;
  this.particleSpeedChangeRate = speedHelper.growthRate;

  // Change the size per update
  let sizeHelper = GetIncreasedValue(this.size, this.particleSizeGrowthRate, minimumParticleSize, maximumParticleSize);
  this.size = sizeHelper.theValue;
  this.particleSizeGrowthRate = sizeHelper.growthRate;

  // Get Proximity for coloring every single particle
  if (typeof theCanvas !== 'undefined') {

    this.proximity = new Array(
      getCornerPointValue(theCanvas.width, theCanvas.height, theCanvas.A, this.position),
      getCornerPointValue(theCanvas.width, theCanvas.height, theCanvas.B, this.position),
      getCornerPointValue(theCanvas.width, theCanvas.height, theCanvas.C, this.position),
      getCornerPointValue(theCanvas.width, theCanvas.height, theCanvas.D, this.position));

    this.sumProximity = 0;
    this.proximity.forEach(element => {
      this.sumProximity += element
    });
  }
  // Color
  this.color = getColor(this.proximity, factorForUsingLogisticColorFunction);
}

// Main program starts here
var PI2 = Math.PI * 2;
var HALF_PI = Math.PI / 2;
var isTouch = 'ontouchstart' in window;
var isSafari = !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);

const particleCount = 90;
const followMouseSpeed = 0.03;             // 1.0 means 100%. Percentage speed of orbital center to follow the mouse cursor position

// That is very imprecise. This speed is the increment of the angular velocity in radians (Remember 2*Pi = 360°).
const minimumParticleSpeed = 0.001;
const maximumParticleSpeed = 0.03;         // don't set it higher than 0.03 (3% of framerate), otherwise animation won't look smooth.
const particleSpeedChangeRate = 0.00001;

// Minimal and maximal size of particles in pixel
const minimumParticleSize = 1;
const maximumParticleSize = 8;
const particleSizeGrowthRate = 0.01;       // the size is changing and this is the rate in pixels

// Orbitsizes and changerate
const minimumOrbit = 10;
const maximumOrbit = 550;
const orbitChangeRateX = 0.5;
const orbitChangeRateY = 0.4;

// Ellipsoidal angle of rotation
const theta = 0;
const thetaChangerate = 0.1;

const maximumLinkDistances = 150;      // maximum length of connection lines between particles in pixels.
const maximumNumberOfLines = 5;        // Thats not correct. Have to figure it out.

const color_A = '10,200,10';
const color_B = '255,200,10';
const color_C = '255,10,10';
const color_D = '10,10,255';

const factorForUsingLogisticColorFunction = 0.7; // Full color center will move for this amount of pixels towards the center

const domCanvas = document.getElementsByTagName('canvas')[0];

var canvasOptions = {
  background: ['10, 10, 4', '7,4,0', '0,0,3']
};

var theCanvas = new Canvas(canvasOptions);
console.info(canvasOptions);