// ***************************************************************************************************************************************************
// *** Ctor Canvas
// ***************************************************************************************************************************************************
function Canvas() {
  this.el = domCanvas;
  this.ctx = this.el.getContext('2d');
  this.dpr = window.devicePixelRatio || 1;
  this.centerShiftPosition = new Vector(0, 0);
  this.target = new Vector(0, 0);

  this.el.style.cursor = 'none';

  this.updateDimensions();
  window.addEventListener('resize', this.updateDimensions.bind(this), false);
  this.resetTarget();

  if (isTouch) {
    // touch
    this.el.addEventListener('touchstart', this.touchMove.bind(this), false);
    this.el.addEventListener('touchmove', this.touchMove.bind(this), false);
    this.el.addEventListener('touchend', this.resetTarget.bind(this), false);
  } else {
    // Mouse
    window.addEventListener('mousemove', this.mouseMove.bind(this), false);
    this.el.addEventListener('mouseenter', this.mouseEnter.bind(this), false);
    this.el.addEventListener('mouseleave', this.resetTarget.bind(this), false);
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
  this.target.x = event.clientX * this.dpr;
  this.target.y = event.clientY * this.dpr;

  //Calculates the relative proximity of the target to the corners of the canvas. 
  this.calculatePromities();
  // console.info(this.target);
  // console.info(this.proximity);
  // console.info(getColor(this.proximity, factorForUsingLogisticColorFunction))
}

Canvas.prototype.mouseEnter = function (event) {
  maximumOrbitWhenInteraction = maximumOrbit;
}

// Reset to center when the mouse moved out of browser window
Canvas.prototype.resetTarget = function () {
  this.target.x = this.width / 2;
  this.target.y = this.height / 2;
  maximumOrbitWhenInteraction = Math.min(this.width, this.height) * 0.5;
  this.calculatePromities();
}

// Set this.taget to the touch position
Canvas.prototype.touchMove = function (event) {
  if (event.touches.length === 1) { event.preventDefault(); }

  this.target.x = event.touches[0].pageX * this.dpr;
  this.target.y = event.touches[0].pageY * this.dpr;
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

Canvas.prototype.doClostestStuff = function () {
  for (let index = 0; index < this.particles.length; index++) {
    var actualParticle = this.particles[index];

    // Remove particles that are further away than the maximum distance.
    var removeMe = [];
    for (const [key, closeParticle] of actualParticle.closest) {
      var distance = actualParticle.position.distanceTo(closeParticle.position);
      if (distance > maximumLinkDistances) {
        removeMe.push(key);
      }
    }
    removeMe.forEach(indexToDelete => {
      actualParticle.closest.delete(indexToDelete);
      actualParticle.opacities.delete(indexToDelete);
    });

    // Start at a random particle and walk through all existing particles to find the first 
    // "maximumNumberOfLines" particles that are closer to actualParticle than "maximumLinkDistance". 
    let randomParticleStartOfLoop = getRandom(0, this.particles.length - 1) | 0;

    // CHECKE diese Zeugs hier!!!

    let indexOfInnerParticle = randomParticleStartOfLoop;
    do {

      // Do nothing if the maximum number of connected particles has already been reached with a certain distance.
      if (actualParticle.closest.size >= maximumNumberOfLines) {
        break;
      }

      var innerParticle = this.particles[indexOfInnerParticle];

      if (actualParticle.index !== innerParticle.index) {
        var distance = actualParticle.position.distanceTo(innerParticle.position);
        if (distance < maximumLinkDistances) {

          if ((innerParticle.closest.size < maximumNumberOfLines)) {
            var opacity = (1 - (distance / maximumLinkDistances));
            actualParticle.opacities.set(innerParticle.index, opacity);
            innerParticle.opacities.set(actualParticle.index, opacity);

            if (!(actualParticle.index in innerParticle.closest)) {
              actualParticle.closest.set(innerParticle.index, innerParticle);
              innerParticle.closest.set(actualParticle.index, actualParticle);
            }
          }
        }
      }


      indexOfInnerParticle = (indexOfInnerParticle + 1) % this.particles.length;
    } while (indexOfInnerParticle != randomParticleStartOfLoop)
  }
}

// ***************************************************************************************************************************************************
// *** Loop
// *** Framrate is ~50 FPS. This is probably related to your computer and/or your browser.
// ***************************************************************************************************************************************************
Canvas.prototype.loop = function () {
  this.ctx.globalCompositeOperation = "source-over";
  this.ctx.globalAlpha = globalAlpha;

  this.ctx.rect(0, 0, this.width, this.height);
  this.ctx.fillStyle = globalFillStyle;
  this.ctx.fill();

  if (maximumLinkDistances > 0) {
    //this.findClosest();
    this.doClostestStuff();
  }
  this.draw();
  this.drawCenter();
  window.requestAnimationFrame(_.bind(this.loop, this));
}

Canvas.prototype.clear = function () {
  this.ctx.clearRect(0, 0, this.width, this.height);
}

// Draw
// Function is called in a loop
Canvas.prototype.draw = function () {
  this.ctx.globalCompositeOperation = "source-over";

  // All lines must be removed BEFORE repaint, otherwise lines coulde be removed accidently
  this.particles.forEach(particle => { particle.lines.clear(); })

  for (let index = 0; index < this.particles.length; index++) {
    var actualParticle = this.particles[index];
    actualParticle.update(this.target, index);

    if (typeof actualParticle.color !== 'undefined' && !actualParticle.color.includes("NaN")) {
      // Paints a 360° (2*PI) circle at particle position and fills it
      // So yes, this paints the particle.
      this.ctx.fillStyle = 'rgb(' + actualParticle.color + ')';
      this.ctx.beginPath();
      for (let i = 0; i < 1; i++) {
        this.ctx.arc(actualParticle.position.x, actualParticle.position.y, actualParticle.size * this.dpr, 0, PI2, false);
      }
      this.ctx.closePath();
      this.ctx.fill();

      if (maximumLinkDistances > 0) {
        this.drawLines(actualParticle);
      }
    }
  }
}

// Draw connecting lines
Canvas.prototype.drawLines = function (particle) {
  this.ctx.lineCap = 'round';

  for (const [indexOfClosest, closeParticle] of particle.closest) {

    if (!particle.lines.has(closeParticle.index)) {
      particle.lines.set(closeParticle.index, true);
      closeParticle.lines.set(particle.index, true);
      // super duper gradient. perfprmance issue.
      var gradient = this.ctx.createLinearGradient(
        particle.position.x,
        particle.position.y,
        closeParticle.position.x,
        closeParticle.position.y);
      gradient.addColorStop(0, 'rgb(' + particle.color + ', ' + particle.opacities.get(indexOfClosest) * 0.8 + ')');
      gradient.addColorStop(1, 'rgba(' + closeParticle.color + ', ' + particle.opacities.get(indexOfClosest) * 0.1 + ')');
      this.ctx.strokeStyle = gradient;

      //this.ctx.strokeStyle = 'rgba(' + particle.color + ', ' + particle.opacities[indexOfClosest]*0.4 + ')';
      this.ctx.beginPath();
      this.ctx.moveTo(particle.position.x, particle.position.y);
      // cp1 = new Vector(particle.position.x/2, particle.position.y/2);
      // cp2 = new Vector(closeParticle.position.x+10, closeParticle.position.y+10);
      // this.ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, closeParticle.position.x, closeParticle.position.y);
      this.ctx.lineTo(closeParticle.position.x, closeParticle.position.y);
      this.ctx.lineWidth = 1 //;particle.size * this.dpr * particle.opacities[indexOfClosest]; // thats the shit.- if width !=1 you need gpu as hell
      this.ctx.stroke();
    }
  }
}


Canvas.prototype.drawCenter = function () {
  this.centerShiftPosition.x += (this.target.x - this.centerShiftPosition.x) * followMouseSpeed;
  this.centerShiftPosition.y += (this.target.y - this.centerShiftPosition.y) * followMouseSpeed;

  if (Math.abs(this.centerShiftPosition.x - this.target.x) > 5 &&
    Math.abs(this.centerShiftPosition.x - this.target.x) > 5) {
    this.ctx.fillStyle = 'rgb(' + [111, 111, 255] + ')';
    this.ctx.beginPath();
    this.ctx.arc(this.target.x, this.target.y, 1 * this.dpr, 0, PI2, false);
    this.ctx.closePath();
    this.ctx.fill();
  }
}

// ***************************************************************************************************************************************************
// *** Ctor Particle
// ***************************************************************************************************************************************************
function Particle(options, index) {
  options = _.clone(options || {});
  this.options = _.defaults(options, this.options);
  this.index = index;
  this.closest = new Map(); // Use this as map/dict for linked particles with a certain maximum distance to paint lines between those particles.
  this.opacities = new Map(); // Every added particle must have its own opacity without sideeffects.
  this.lines = new Map();
  this.color = '255,255,255';

  // Here, Ike either made a significant mistake or did it on purpose.
  // original code: this.position = this.shift = new Vector(this.options.x, this.options.y);
  this.position = new Vector(this.options.x, this.options.y);
  this.particleShift = new Vector(this.options.x, this.options.y);
  this.angle = this.options.angle;

  // Speed
  this.speed = getRandom(minimumParticleSpeed, maximumParticleSpeed);
  this.particleSpeedChangeRate = particleSpeedChangeRate * changeSignRandom();

  // Size
  this.size = getRandom(minimumParticleSize, maximumParticleSize);
  this.particleSizeGrowthRate = particleSizeGrowthRate * changeSignRandom();

  // Orbit
  this.orbitX = getRandom(minimumOrbit, maximumOrbitWhenInteraction);
  this.orbitY = getRandom(minimumOrbit, maximumOrbitWhenInteraction);
  this.orbitChangeRateX = orbitChangeRateX * changeSignRandom() * getRandom(0.6, 1.4);
  this.orbitChangeRateY = orbitChangeRateY * changeSignRandom() * getRandom(0.6, 1.4);

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
  let orbitHelper = GetIncreasedValue(this.orbitX, this.orbitChangeRateX, minimumOrbit, maximumOrbitWhenInteraction);
  this.orbitX = orbitHelper.theValue;
  this.orbitChangeRateX = orbitHelper.growthRate;
  orbitHelper = GetIncreasedValue(this.orbitY, this.orbitChangeRateY, minimumOrbit, maximumOrbitWhenInteraction);
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
  if (typeof this.proximity !== 'undefined') {
    this.color = getColor(this.proximity, factorForUsingLogisticColorFunction);
  }
  else {
    this.color = '255,255,255';
  }
}

// Main program starts here
var PI2 = Math.PI * 2;
var HALF_PI = Math.PI / 2;
var isTouch = 'ontouchstart' in window;
var isSafari = !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);

const dpr = window.devicePixelRatio || 1;
const globalAlpha = 1;
const globalFillStyle = 'rgba(1,1,1,0.4)';

const particleCount = 45;
const followMouseSpeed = 0.03;             // 1.0 means 100%. Percentage speed of orbital center to follow the mouse cursor position

// That is very imprecise. This speed is the increment of the angular velocity in radians (Remember 2*Pi = 360°).
const minimumParticleSpeed = 0.005;
const maximumParticleSpeed = 0.015;         // don't set it higher than 0.03 (3% of framerate), otherwise animation won't look smooth.
const particleSpeedChangeRate = 0.00001;

// Minimal and maximal size of particles in pixel
const minimumParticleSize = 1;
const maximumParticleSize = 3;
const particleSizeGrowthRate = 0.01;       // the size is changing and this is the rate in pixels

// Orbitsizes and changerate
const minimumOrbit = 10 ;
const maximumOrbit = 300 ;
var maximumOrbitWhenInteraction = maximumOrbit;
const orbitChangeRateX = 0.9;
const orbitChangeRateY = 1.1;

// Ellipsoidal angle of rotation
//const theta = 0;
const thetaChangerate = 0.1;

const maximumLinkDistances = 400 * dpr;      // maximum length of connection lines between particles in pixels.
const maximumNumberOfLines = 4;        // Thats not correct. Have to figure it out.

const color_A = [10, 200, 10];
const color_B = [255, 200, 10];
const color_C = [255, 10, 10];
const color_D = [10, 10, 255];

// 1-> Colour calculation with logistic growth function
// 0-> colour calculation with normalised, linear distance function
// 0.4 is a good value for a balanced colour image
const factorForUsingLogisticColorFunction = 0.4;

const domCanvas = document.getElementsByTagName('canvas')[0];
var theCanvas = new Canvas();

