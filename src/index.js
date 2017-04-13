'use strict';
let rendererSize = 500;

//Create the renderer
var renderer = PIXI.autoDetectRenderer(rendererSize, rendererSize);

//Add the canvas to the HTML document
document.body.appendChild(renderer.view);

//Create a container object called the `stage`
let stage, gameOver, mainGame;
let state;
let loader = PIXI.loader;
let sprite = PIXI.Sprite;
let container = PIXI.Container;
let resources = PIXI.loader.resources;
let text = PIXI.Text;
let player, healthText;
let playerHealth = 10;
let enemyCount = 1;
let enemyArray = [];
let enemyPool = [];
let keziaArray = [];

loader.add(['./24.png', './pixi_files/23.png']).load(setup);

function setup() {
    setupContainers();
    setupPlayer();
    setupGuiText();
    setupEnemies();
    // Begin the game
    state = play;
    gameLoop();
}

function setupContainers() {
    stage = new container();
    renderer.render(stage);

    mainGame = new container();
    stage.addChild(mainGame);

    gameOver = new container();
    stage.addChild(gameOver);
    gameOver.visible = false;
}

function setupPlayer() {
    player = new sprite(resources['./24.png'].texture);

    // Set anchor
    player.anchor.set(0.5, 0.5);

    //Capture the keyboard arrow keys
    var left = keyboard(37),
        up = keyboard(38),
        right = keyboard(39),
        down = keyboard(40);

    //Left arrow key `press` method
    left.press = function () {
        //Change the player's velocity when the key is pressed
        player.vx = -5;
    };
    //Left arrow key `release` method
    left.release = function () {
        if (right.isUp) {
            player.vx = 0;
        }
    };
    //Up
    up.press = function () {
        player.vy = -5;
    };
    up.release = function () {
        if (down.isUp) {
            player.vy = 0;
        }
    };
    //Right
    right.press = function () {
        player.vx = 5;
    };
    right.release = function () {
        if (left.isUp) {
            player.vx = 0;
        }
    };
    //Down
    down.press = function () {
        player.vy = 5;
    };
    down.release = function () {
        if (up.isUp) {
            player.vy = 0;
        }
    };
    // Some variables
    player.x = rendererSize / 2;
    player.y = rendererSize / 2;
    player.vx = 0;
    player.vy = 0;
    player.scale.set(0.2, 0.2);
    // Add to stage
    mainGame.addChild(player);
}

function setupGuiText() {
    healthText = new text(
        `Health:${playerHealth}`,
        { fontFamily: "Arial", fontSize: 20, fill: "white" }
    );

    healthText.position.set(10, 10);
    mainGame.addChild(healthText);

    let message = new text(
        "The End!",
        { font: "64px Futura", fill: "white" }
    );

    message.x = 120;
    message.y = stage.height / 2 - 32;

    gameOver.addChild(message);
}

function setupEnemies() {
    for (let i = 0; i < enemyCount; i++) {
        let enemy = spawnEnemy();
        // Position the enemy randomly
        enemy.x = enemy.width / 2 + 10 + (enemy.width * randomInt(0, 9) * 1.9);
        enemy.y = randomInt(0 + enemy.height / 2, rendererSize - enemy.height / 2);
    }
}

function spawnEnemy() {
    // If an enemy exists in the pool, reuse it
    let enemy = (enemyPool.length !== 0) ? reuseEnemy() : newEnemy();
    setEnemyAi(enemy);
    return enemy;
}

function newEnemy() {
    // New enemy from the pixi loader
    let newEnemy = new sprite(resources['./pixi_files/23.png'].texture);
    // Set anchor and scale
    newEnemy.anchor.set(0.5, 0.5);
    newEnemy.scale.set(0.1, 0.1);
    // Attach the new enemy to the view
    mainGame.addChild(newEnemy);
    // Add it to the array of active enemies
    enemyArray.push(newEnemy);
    // Return
    return newEnemy;
}

function reuseEnemy() {
    // Get and remove the first enemy from the pool array
    let reused = enemyPool.pop();
    // Add it to the array of active enemies
    enemyArray.push(reused);
    // Make it visible
    reused.visible = true;
    // Return
    return reused;
}

function setEnemyAi(enemy) {
    let choice = randomInt(0, 0);
    if (choice === 0) {
        keziaArray.push(enemy);
    }
}

function removeEnemy(enemy, index) {
    // MAke the enemy invisible
    enemy.visible = false;
    // Remove it from the collision array
    enemyArray.splice(index, 1);
    // Move it outside of the renderer bounds
    enemy.x = -enemy.width * 2;
    // Add it to the enemy pool
    enemyPool.push(enemy);
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function keyboard(keyCode) {
    var key = {};
    key.code = keyCode;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    //The `downHandler`
    key.downHandler = function (event) {
        if (event.keyCode === key.code) {
            if (key.isUp && key.press) key.press();
            key.isDown = true;
            key.isUp = false;
        }
        event.preventDefault();
    };

    //The `upHandler`
    key.upHandler = function (event) {
        if (event.keyCode === key.code) {
            if (key.isDown && key.release) key.release();
            key.isDown = false;
            key.isUp = true;
        }
        event.preventDefault();
    };

    //Attach event listeners
    window.addEventListener(
        "keydown", key.downHandler.bind(key), false
    );
    window.addEventListener(
        "keyup", key.upHandler.bind(key), false
    );
    return key;
}

function playerMovement() {
    player.x += player.vx;
    player.y += player.vy;
    contain(player,
        {
            x: - player.width / 2,
            y: -player.height / 2,
            width: rendererSize + player.width / 2,
            height: rendererSize + player.height / 2
        });
}

function enemyColision() {
    enemyArray.forEach((enemy, index, array) => {
        if (hitTestRectangle(player, enemy)) {
            // Reduce health
            // playerHealth -= 1;
            // Reset health text
            healthText.text = `Health: ${playerHealth}`;
            // Remove the enemy from view and from the collision array
            removeEnemy(enemy, index);
            // Respawn the enemy
            let respawnedEnemy = spawnEnemy();
            // Position the enemy randomly
            enemy.x = enemy.width / 2 + 10 + (enemy.width * randomInt(0, 9) * 1.9);
            enemy.y = randomInt(0 + enemy.height / 2, rendererSize - enemy.height / 2);
        }
    });
}

function gameoverCheck() {
    if (playerHealth <= 0) {
        state = gameEnd;
    }
}

function gameEnd() {
    gameOver.visible = true;
    mainGame.visible = false;
}

function gameLoop() {
    // Run whatever state is currently active
    state();
    // Render the state
    renderer.render(stage);
}

function play() {
    //Loop this function at 60 frames per second
    requestAnimationFrame(gameLoop);
    playerMovement();
    enemyColision();
    enemyMovement();
    gameoverCheck();
}

function enemyMovement() {
    keziaAi();
}

function contain(sprite, container) {

    var collision = undefined;

    //Left 
    if (sprite.x - sprite.width < container.x) {
        sprite.x = container.x + sprite.width;
        collision = "left";
    }

    //Top
    if (sprite.y - sprite.height < container.y) {
        sprite.y = container.y + sprite.height;
        collision = "top";
    }

    //Right
    if (sprite.x + sprite.width > container.width) {
        sprite.x = container.width - sprite.width;
        collision = "right";
    }

    //Bottom
    if (sprite.y + sprite.height > container.height) {
        sprite.y = container.height - sprite.height;
        collision = "bottom";
    }

    //Return the `collision` value
    return collision;
}

function hitTestRectangle(r1, r2) {

    //Define the variables we'll need to calculate
    var hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

    //hit will determine whether there's a collision
    hit = false;

    //Find the center points of each sprite
    r1.centerX = r1.x;
    r1.centerY = r1.y;
    r2.centerX = r2.x;
    r2.centerY = r2.y;

    //Find the half-widths and half-heights of each sprite
    r1.halfWidth = r1.width / 2;
    r1.halfHeight = r1.height / 2;
    r2.halfWidth = r2.width / 2;
    r2.halfHeight = r2.height / 2;

    //Calculate the distance vector between the sprites
    vx = r1.centerX - r2.centerX;
    vy = r1.centerY - r2.centerY;

    //Figure out the combined half-widths and half-heights
    combinedHalfWidths = r1.halfWidth + r2.halfWidth;
    combinedHalfHeights = r1.halfHeight + r2.halfHeight;

    //Check for a collision on the x axis
    if (Math.abs(vx) < combinedHalfWidths) {

        //A collision might be occuring. Check for a collision on the y axis
        if (Math.abs(vy) < combinedHalfHeights) {

            //There's definitely a collision happening
            hit = true;
        } else {

            //There's no collision on the y axis
            hit = false;
        }
    } else {

        //There's no collision on the x axis
        hit = false;
    }

    //`hit` will be either `true` or `false`
    return hit;
}
let keziaRotationSpeed = 0.1;
function keziaAi() {
    keziaArray.forEach((kezia) => {
        // Identify the direction of the player
        let angleTowardsPlayer = Math.atan2(player.y - kezia.y, player.x - kezia.x);
        // Rotate toward the player
        kezia.rotation += lerp(kezia.rotation, angleTowardsPlayer, keziaRotationSpeed);
        // Move forwards

    });
}

function lerp(currentValue, intended, interp) {
    let value = currentValue - ((1 - interp) * intended);
    console.log(value);
    return value;
}