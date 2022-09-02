// ***************************************************************************************************************************************************
// *** Ctor Canvas
// ***************************************************************************************************************************************************
function Canvas(options) {
  this.options = options;
  this.el = this.options.el;
  this.ctx = this.el.getContext('2d');
  this.dpr = window.devicePixelRatio || 1;

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

  this.setupParticles();
  this.loop();
}

// ***************************************************************************************************************************************************
// *** updateDimensions
// ***************************************************************************************************************************************************
Canvas.prototype.updateDimensions = function () {
  this.width = this.el.width = _.result(this.options, 'width') * this.dpr;
  this.height = this.el.height = _.result(this.options, 'height') * this.dpr;
  this.el.style.width = _.result(this.options, 'width') + 'px';
  this.el.style.height = _.result(this.options, 'height') + 'px';
}

// Set this.taget to the mouse corsor position
Canvas.prototype.mouseMove = function (event) {
  this.target = new Vector(event.clientX * this.dpr, event.clientY * this.dpr);
}

// Reset to center when the mouse moved out of browser window
Canvas.prototype.resetTarget = function () {
  this.target = new Vector(this.width / 2, this.height / 2);
}

// Set this.taget to the touch position
Canvas.prototype.touchMove = function (event) {
  if (event.touches.length === 1) { event.preventDefault(); }

  this.target = new Vector(event.touches[0].pageX * this.dpr, event.touches[0].pageY * this.dpr);
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

// Findet den am nächsten liegenden Partikel oder mehrere?
Canvas.prototype.findClosest = function () {
  for (let index = 0; index < this.particles.length; index++) {
    this.particles[index].closest = [];

    for (let closestIndex = 0; closestIndex < this.particles.length; closestIndex++) {
      var closest = this.particles[closestIndex];
      var distance = this.particles[index].position.distanceTo(closest.position);
      if (distance < maximumLinkDistances) {
        var vector = new Vector(closest.position.x, closest.position.y);
        vector.opacity = 1 - (distance / maximumLinkDistances);
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
  window.requestAnimationFrame(_.bind(this.loop, this));
}

Canvas.prototype.clear = function () {
  this.ctx.clearRect(0, 0, this.width, this.height);
}

Canvas.prototype.ghost = function () {
  this.ctx.globalCompositeOperation = "source-over";
  this.ctx.rect(0, 0, this.width, this.height);
  if (typeof this.options.background === 'string') {
    this.ctx.fillStyle = "rgb(" + this.options.background + ")";
  } else {
    this.ctx.fillStyle = "rgb(" + this.options.background[0] + ")";
  }
  this.ctx.fill();
}

// Das Zeug hier ist für den Schweif der Partikel zuständig. Vielleicht man sich dazu mal ein Tutorial anschauen.
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
  this.ctx.globalCompositeOperation = "darken";
  this.ctx.fillRect(0, 0, this.width, this.height);
}

// Draw
// Function is called in a loop
Canvas.prototype.draw = function () {
  for (let index = 0; index < this.particles.length; index++) {
    var actualParticle = this.particles[index];
    var color = actualParticle.color || this.options.color;
    actualParticle.update(this.target, index);

    // Paints a 360° (2*PI) circle at particle position and fills it
    // So yes, this paints the particle.
    this.ctx.globalAlpha = 0.3;
    this.ctx.globalCompositeOperation = "lighten";
    this.ctx.fillStyle = 'rgb(' + color + ')';
    this.ctx.beginPath();
    this.ctx.arc(actualParticle.position.x, actualParticle.position.y, actualParticle.size, 0, PI2, false);
    this.ctx.closePath();
    this.ctx.fill();

    if (maximumLinkDistances > 0) {
      this.drawLines(actualParticle, color);
    }
  }
}

// Draw connecting lines
Canvas.prototype.drawLines = function (particle, color) {
  color = color;
  this.ctx.globalAlpha = 0.3;
  this.ctx.globalCompositeOperation = "screen";
  this.ctx.lineCap = 'round';
  for (let index = 0; index < Math.min(particle.closest.length, maximumNumberOfLines); index++) {
    this.ctx.lineWidth = (particle.size) * particle.closest[index].opacity;
    this.ctx.strokeStyle = 'rgba(' + color + ', ' + particle.closest[index].opacity + ')';
    this.ctx.beginPath();
    this.ctx.moveTo(particle.position.x, particle.position.y);
    this.ctx.lineTo(particle.closest[index].x, particle.closest[index].y);
    this.ctx.stroke();
  }
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

  var color = defaultParticleColor.split(',');
  color[0] = this.position.x%255;
  color[1] = this.position.y%255;
  color[2] = 0;
  this.color = color.join(', ');

  // Speed
  this.speed = getRandom(minimumParticleSpeed, maximumParticleSpeed);

  // Size
  this.size = getRandom(minimumParticleSize, maximumParticleSize);
  this.particleSizeGrowthRate = particleSizeGrowthRate;

  //this.orbit = this.options.radius * 0.3 + (this.options.radius * 2 * Math.random());
  this.orbitX = (((index + 5) % 10) + 5) * particleReferenceOrbitSize * getRandom(0.5, 2);
  this.orbitY = (((index + 5) % 10) + 5) * particleReferenceOrbitSize * getRandom(0.5, 2);
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

  // Change the size per update
  let sizeHelper = GetIncreasedValue(this.size, this.particleSizeGrowthRate, minimumParticleSize, maximumParticleSize);
  this.size = sizeHelper.theValue;
  this.particleSizeGrowthRate = sizeHelper.growthRate;


  var color = defaultParticleColor.split(',');
  color[0] = (1.0*this.position.x/5)%255;
  color[1] = (1.0*this.position.y/5)%255;
  color[2] = 10;
  this.color = color.join(', ');
}




// Main program starts here
var PI2 = Math.PI * 2;
var HALF_PI = Math.PI / 2;
var isTouch = 'ontouchstart' in window;
var isSafari = !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);

const particleCount = 50;
const followMouseSpeed = 0.02;         // 1.0 means 100%. Percentage speed of orbital center to follow the mouse cursor position

// That is very imprecise. This speed is the increment of the angular velocity in radians (Remember 2*Pi = 360°).
const minimumParticleSpeed = 0.02;
const maximumParticleSpeed = 0.03;
// Minimal and maximal size of particles in pixel
const minimumParticleSize = 2;
const maximumParticleSize = 5;
const particleSizeGrowthRate = 0.02;         // the size is changing and this is the rate in pixels

const particleReferenceOrbitSize = 15; // References orbit size means a referential distance to the center (mouse cursor) position. In pixel.
const maximumLinkDistances = 200;      // maximum length of connection lines between particles in pixels.
const maximumNumberOfLines = 10;        // Thats not correct. Have to figure it out.

const defaultParticleColor = '0,255,0';

var canvasOptions = {
  el: document.getElementById('canvas'),
  width: function () { return window.innerWidth; },
  height: function () { return window.innerHeight; },
  background: ['0, 0, 5', '0,0,10']
};

new Canvas(canvasOptions);

console.info(canvasOptions);