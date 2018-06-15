window.onload = function() {
  RGBCatcher.run();
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

// This will hold the DOM object of our canvas element
var canvas;

// This will hold the Canvas 2D API object
var context;

// This object will hold pressed keys to check against
var keyOn = [];

// [object definitions]

/////////////////////// RGBCatcher ////////////////////////////

RGBCatcher = new function() {
  // Public
  this.colors = [
    '#f00',
    '#0f0',
    '#00f',
  ];
  // The amount of blocks there should be per level (example: level 3 equals has (3*4) 12 blocks to process)
  var blocksPerLevel = 4;
  // The time in seconds there should be between the fall of a new block. This value decreases when the user goes up a level
  var blocksSpawnSec;
  // The amount of blocks already spawned
  var blocksSpawned;
  // The amount of blocks currently on the canvas
  var blocksOnScreen;
  // The array which holds the blocks to process
  var blocks = [];

  // A DOM Element of the info screen
  var info;
  // Should the info screen be changed?
  var infoScreenChange = true;

  var startTime = 0;
  var frameTime = 0;
  var targetFPS = 1000;

  var basket;
  // Private
  var basketData = [
    ['width', 30],
    ['height', 10],
    ['xSpeed', 1.1],
    ['color', '#f00'],
    ['oldColor', '#f00']
  ];

  var blockData = [
    ['width', 10], // Width in pixels of this block
    ['height', 10], // Height in pixels of this block
    ['ySpeed', 1], // Vertical movement speed in pixels
    ['color', undefined] // The color of this block
  ];

  var interval;

  this.run = function() {
    // Set the global 'canvas' object to the #canvas DOM object to be able to access its width, height and other attributes are
    canvas = document.getElementById('canvas');

    // Set the local 'info' object to the #info DOM object
    info = document.getElementById('info');

    // This is where it's all about; getting a new instance of the C2A object — pretty simple huh?
    context = canvas.getContext('2d');

    // Add an eventListener for the global keydown event
    document.addEventListener('keydown', function(event) {
      // Add the keyCode of this event to the global keyOn Array
      // We can then easily check if a specific key is pressed by simply checking whether its keycode is set to true
      keyOn[event.keyCode] = true;
    }, false);

    // Add another eventListener for the global keyup event
    document.addEventListener('keyup', function(event) {
      // Set the keyCode of this event to false, to avoid an inifinite keydown appearance
      keyOn[event.keyCode] = false;
    }, false);

    // Instantiate the basket object and feed it the required basketData
    basket = new Basket(basketData);
    health = new Health();
    score = new Score();

    // Go to the title screen at 30 frames per second
    interval = setInterval(titleScreen, 30 / 1000);
  }

  function resetGame() {
    basket.reset();
    score.reset(); // old definition: score = 0;
    health.reset(); // old definition: health = 100;

    blocksSpawnSec = 2;
    blocksSpawned = 0;
    blocksOnScreen = 0;
    blocks = [];

    level = 1;

    startTime = new Date().getTime();
  }

  function gameLoop() {

    frameTime = new Date().getTime();

    if (health < 1) {
      basket.alive = false;

      clearInterval(interval);
      interval = setInterval(gameOver, 1000 / targetFPS);

      return;
    }

    // blocksSpawnSec * 1000 because the timer values are in miliseconds
    if (frameTime >= startTime + (blocksSpawnSec * 1000)) {
      // If all blocks have been added
      if (addBlock() === false) {

        // Increase difficulty
        blocksSpawnSec *= 0.99;
        blockData['ySpeed'] *= 1.01;
        basketData['xSpeed'] *= 1.02;

        // Reset level specific variables
        resetLevel();
      }

      // The timer is finished, reset it
      startTime = frameTime;

    }
    context.clearRect(0, 0, canvas.width, canvas.height);

    basket.update();
    health.update();
    score.update();


    updateBlocks();

  }

  function addBlock() {
    if (blocksSpawned != blocksPerLevel * level) {
      // Add a new block the the blocks array
      blocks[blocks.length] = new Block(blockData);

      // Both increase the amount of blocks on the screen and the amount of spawned blocks
      blocksSpawned++;
      blocksOnScreen++;
    } else {
      // Check whether all blocks have been processed
      if (blocksOnScreen == 0)
        return false;
    }

    // Return true if there's still something to work with
    return true;
  }

  function updateBlocks() {
    for (var i = 0; i < blocks.length; i++) {
      // Assign a local copy
      var block = blocks[i];

      block.update();
      checkCollision(block);
    }
  }

  // By passing a reference of the block object to the function, we can use the current very block to perform our collision detection
  function checkCollision(block) {
    // If the block is not defined or not alive, return
    if (block === undefined || block.alive === false)
      return;

    // If the block hasn't passed the vertical line the basket resides on, we're not dealing with a collision (yet)
    if (block.y + block.height < basket.y)
      return;

    // If the block's x-coordinate is in the range of the basket's width, then we've got a collision
    if (block.x >= basket.x && block.x + block.width <= basket.x + basket.width) {
      // Whether it's a correctly colored block or not, the current block should disappear and the amount of blocks on the screen should decrease with one
      if (block.alive == true) {
        block.alive = false;
        blocksOnScreen--;
      }

      // If the block's color matches the basket's current color, we've got a correct catch
      if (block.color === basket.color)
        // So give the player some points
        score.change(block.strength);
      else
        // Otherwise, inflict damage to the health of the player
        health.change(-block.strength);
    }
    // If it's not, the block has missed the basket and will thus, eventually, collide with the ground
    else {
      // The player missed a correctly colored block and no damage has been inflicted yet
      if (block.color === basket.color && block.strength > 0) {
        // So lets inflict damage to the health of the player
        health.change(-block.strength);

        // To prevent this block from inflicting damage again, we set its strength to 0
        block.strength = 0;
      }

      // If the block's y coordinate is greater than the canvas's height, it has disappeared from the viewport and can be removed
      if (block.alive === true && block.y > canvas.height) {
        block.alive = false;
        blocksOnScreen--;
      }
    }
  }

  function titleScreen() {
    // Should the info screen be updated?
    if (infoScreenChange) {
      // Set the HTML value of the info DOM object so it displays a fancy titlescreen
      info.innerHTML = '<p><span class="red">R</span><span class="green">G</span><span class="blue">B</span>Catcher</p> <p>Press spacebar to start</p>';

      // Only update the info screen once
      infoScreenChange = false;
    }

    // 32 is the key code representation of a press on the spacebar
    if (keyOn[32]) {
      // Set the infoScreenChange variable to its default value again
      infoScreenChange = true;

      // Set the CSS 'display' rule of the info element to none so it disappears
      info.style.display = 'none';

      // The player wants to start playing so the current 'titleScreen loop' will be cleared
      clearInterval(interval);

      // Reset the game
      resetGame();

      // And enter the game loop at 30 frames per second
      interval = setInterval(gameLoop, 30 / 1000)
    }
  }

  function gameOverScreen() {
    frameTime = new Date().getTime();

    // Should the info screen be changed?
    if (infoScreenChange) {
      // First clear the canvas with the basket and blocks from the background
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Change the text of the info screen and show it
      info.innerHTML = '<p>Game over!</p>';
      info.style.display = 'block';

      // Do not update the info screen again
      infoScreenChange = false;
    }

    // If three seconds have passed
    if (frameTime > startTime + (3 * 1000)) {
      // A new info screen should be pushed next time
      infoScreenChange = true;

      // Reset the timer
      startTime = frameTime;

      // Quit this loop and set a new the loop for the title screen
      clearInterval(interval);
      interval = setInterval(titleScreen, 30 / 1000);
    }
  }

  function resetLevel() {
    basket.reset();

    health = 100;

    blocksSpawned = 0;
    blocksOnScreen = 0;
    blocks = [];
  }

};

/////////////////////// Moveable ////////////////////////////

// Add a parameter called 'data' so we can access the contents of an argument used at the instantiation of the Player object in the constructor
var Movable = function(data) {
  if (data === undefined)
    return;

  for (var i = 0; i < data.length; i++) {
    var setting = data[i];

    // By accessing 'this' (which refers to this very instance) as an array, we can set a new object-specific variable with the name of 'setting' to 'setting' its value
    this[setting[0]] = setting[1];
  }

  // When this object is succesfully instantiated; it's alive!
  this.alive = true;
}
Movable.prototype.update = function() {
  if (this.alive) {
    this.move();
    this.draw();
  }
}
Movable.prototype.draw = function() {
  context.fillStyle = this.color;
  context.fillRect(this.x, this.y, this.width, this.height);
};


/////////////////////// Basket ////////////////////////////

var Basket = function(data) {
  Movable.call(this, data);
}
Basket.prototype = new Movable();
Basket.prototype.reset = function() {
  // Reset the position
  this.x = canvas.width / 2 - this.width / 2;
  this.y = canvas.height - this.height;

  // Reset the color
  while (this.color == this.oldColor)
    this.color = RGBCatcher.colors[Math.round(rand(0, (RGBCatcher.colors.length - 1)))];

  // Change the old color to the current color (so that the while loop will stil work the next time this method is called)
  this.oldColor = this.color;
}
Basket.prototype.move = function() {
  // 37 is the keycode representation of a left keypress
  if (keyOn[37])
    this.x -= this.xSpeed;

  // 39 is the keycode representation of a right keypress
  if (keyOn[39])
    this.x += this.xSpeed;

  // If the x coordinate is lower than 0, which is less than the outer left position of the canvas, move it back to the outer left position of the canvas
  if (this.x < 0)
    this.x = 0;

  // If the x coordinate plus the basket's width is greater than the canvas's width, move it back to the outer right position of the canvas
  if (this.x + this.width > canvas.width)
    this.x = canvas.width - this.width;
}
Basket.prototype.draw = function() {
  // The Basket object's 'color' atribute holds the color which our basket needs to be
  context.fillStyle = this.color;

  // The C2A fillRect method draws a filled rectangle (with fillStyle as its fill color) at position (x, y) with a set height and width.
  // All these arguments can be found in the atributes of our basket object
  context.fillRect(this.x, this.y, this.width, this.height);
};



/////////////////////// Block ////////////////////////////



var Block = function(data) {
  Movable.call(this, data);

  this.initPosition();
  this.initColor();
}
Block.prototype = new Movable();
Block.prototype.initPosition = function() {
  // Only allow to set the position of this block once
  if (this.x !== undefined || this.y !== undefined)
    return;

  // By picking a rounded number between 0 and the canvas.width subtracted by the block's width, we have a position for this block which is still inside the block's viewport
  this.x = Math.round(rand(0, canvas.width - this.width));

  // By setting the vertical position of the block to 0 subtracted by the block's height, the block will look like it slides into the canvas's viewport
  this.y = 0 - this.height;
}
Block.prototype.initColor = function() {
  if (this.color !== undefined)
    return;

  this.color = RGBCatcher.colors[Math.round(rand(0, (RGBCatcher.colors.length - 1)))];
}
Block.prototype.move = function() {
  // Add the vertical speed to the block's current position to move it
  this.y += this.ySpeed;
};

/////////////////////// Countable ////////////////////////////

var Countable = function() {
  this.x = 0;
  this.y = 0;

  this.speed = 2;

  this.value = 0;
  this.targetValue = 0;
}
Countable.prototype.change = function(amount) {
  this.targetValue += amount;
}
Countable.prototype.move = function() {
  // If the difference between the target and actual value is lower than the animation speed, set the value to the target value
  if (Math.abs(this.value - this.targetValue) < this.speed)
    this.value = this.targetValue;
  else if (this.targetValue > this.value)
    this.value += this.speed;
  else
    this.value -= this.speed;
};
// Countable.prototype = {
//   update: function(){
//     this.draw();
//   }
// };

/////////////////////// Health ////////////////////////////


var Health = function() {
  Countable.call(this);

  this.x = canvas.width - 52 - 10;
  this.y = 10;
}
Health.prototype = new Countable();
Health.prototype.reset = function() {
  // If we would leave it at a default of 0, the game would immediately end as it equals a loss of the game
  this.value = 100;
  this.targetValue = 100;
}
Health.prototype.draw = function() {
  // The container
  context.fillStyle = '#fff';
  context.strokeRect(this.x, this.y, 50 + 2, 5 + 2);

  // The bar
  if (this.value >= 50)
    context.fillStyle = '#00ff00';
  else if (this.value >= 25)
    context.fillStyle = '#fa6600';
  else if (this.value >= 0)
    context.fillStyle = '#ff0000';

  context.rect(this.x + 1, this.y + 1, this.value * (50 / 100), 5);

  // The text
  context.fillStyle = '#000';
  context.textBaseline = 'top';
  context.fillText('HP', this.x - 25, this.y - 3);
}
Health.prototype.update = function() {
  this.draw();
}



/////////////////////// Score ////////////////////////////

var Score = function() {
  Countable.call(this);

  this.x = canvas.width - 52 - 10;
  this.y = 10 + 7 + 5;
}
Score.prototype = new Countable();
Score.prototype.reset = function() {
  this.value = this.targetValue = 0;
}
Score.prototype.draw = function() {
  context.textBaseline = 'top';
  context.fillStyle = '#000';
  context.fillText(this.value, this.x, this.y);
  context.fillText('PT', this.x - 25, this.y);
}
Score.prototype.update = function() {
  this.draw();
}
