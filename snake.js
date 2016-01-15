var game = (function () {

    var canvas = document.getElementById("canvas");
    var context = canvas.getContext("2d");
    var nextFrame = null;
    var scoreToIncreaseLevel = 10;
    var framerate = 1000 / 40;
    var framecount = 0;

    var snake_def;

    var keys = {
        up: 0,
        down: 0,
        left: 0,
        right: 0
    };

    var offset = {
        x: 0,
        y: 40
    };
    
    var grid = {
        x: 32,
        y: 32
    };

    var unit = {
        x: (canvas.width - offset.x) / grid.x,
        y: (canvas.height - offset.y) / grid.y
    };
    
    var treasure = {
        location: {
            x: 5,
            y: 5
        },
        size: 8,
        min_size: 6,
        max_size: 8,
        step: 0.1
    };

    var  fontsize = 30;    
    context.font = fontsize + "px Verdana";
    
    /* setup keyhandlers */
    document.addEventListener("keyup", keyUpHandler, false);
    document.addEventListener("keydown", keyDownHandler, false);

    /* reset the snake, and start animating */    
    function start() {
        snake_def = {
            level: 1,
            length: 2,
            score: 0,
            initial_length: 2,
            speed: 3,
            initial_speed: 3,
            increase_speed: 0.05,
            head: {x: 1, y: 1},
            body: [],
            size: unit.x / 2,
            color: 'orange',
            lookat: {x: 1, y: 0 },
            direction: {x: 1, y: 0}
        };
        nextFrame = tick;
        prevTick = Date.now();
        tick();
    }

    /* called (once) on gameover */
    function idle() {
    }

    /* called when game is running */
    function tick() {
        if(framecount > (framerate / snake_def.speed)) {
            moveSnake(snake_def);
            framecount = 0;
        }
        tickSnake(snake_def);
        drawGame (context, snake_def);
        framecount++;
        requestAnimationFrame(nextFrame);
    }

    /* draw game elements */
    function drawGame(ctx, snake) {
        clearCanvas(ctx, 0, 0, canvas.width, canvas.height, '#eeffee');         // clear screen
        
        var w = unit.x * grid.x;
        var h = unit.y * grid.y;
        drawRect(ctx,1,offset.y+1,w-2, h-2, 'black');                           // draw borders
        
        snake.body.forEach(function(e) {                                        // draw snake body parts         
            drawSnakeBody(ctx, snake, e);
        });
        drawTreasure(ctx, treasure);                                            // draw treasure
        drawSnakeHead(ctx, snake);                                              // draw snake head                                                
        drawSnakeEyes(ctx, snake, 'white', 'black');                            // draw snake eyes
        drawScore(ctx, snake);                                                  // draw score
    }

    /* check keys and adjust lookat accordingly */
    function tickSnake(snake) {
        var l = snake.lookat;
        var d = snake.direction;

        if(keys.left > 0) {
            if(d.x === 0)
            {
                l.x = -1;
                l.y = 0;
                keys.left = -1;
            }
        }
        if(keys.up > 0) {
            if(d.y === 0)
            {
                l.x = 0;
                l.y = -1;
                keys.up = -1;
            }
        }
        if(keys.right > 0) {
            if(d.x == 0)
            {
                l.x = 1;
                l.y = 0;
                keys.right = -1;
            }
        }
        if(keys.down > 0) {
            if(d.y === 0)
            {
                l.y = 1;
                l.x = 0;
                keys.down = -1;
            }
        }
    }

    /* generate a random position on the map (for treasure) */
    function randomGridPosition() {
        return {
            x: 2 + (Math.floor(Math.random() * (grid.x-4))),
            y: 2 + (Math.floor(Math.random() * (grid.y-4)))
        };
    }

    /* see if snake head is on same position as treasure */    
    function checkTreasure(snake) {
        if (snake.head.x === treasure.location.x && snake.head.y === treasure.location.y) {
            treasure.location = randomGridPosition();
            return true;
        }
        return false;
    }

    /* called when snake is at treasure */
    function ate(snake) {
        snake.score++;
        if(handlers.started && handlers.ate) {
            handlers.ate(snake);
        }
    }

    /* called when snake is leveled */
    function leveled(snake) {
        snake.speed += snake.increase_speed;
        if(handlers.started && handlers.leveled) {
            handlers.leveled(snake);
        }
    }

    /* called on gameover */        
    function gameOver(snake) {
        nextFrame = idle;
        if(handlers.started) {
            handlers.started = false;
            if(handlers.gameOver) {
                handlers.gameOver(snake);
            }
        }
    }
    
    /* called when eating treasure */
    function growSnake(snake) {
        snake.body.push({
            x: snake.head.x,
            y: snake.head.y
        });
        trimSnake(snake);
    }

    /* trim old snake body parts - after moving*/    
    function trimSnake(snake) {
        while(snake.body.length > snake.length) {
            snake.body.shift();
        }
    }

    function moveSnake(snake) {
        /* see if snake head is on treasure */
        if (checkTreasure(snake)) {
            snake.length++;
            ate(snake);
            if( (1+snake.length) % scoreToIncreaseLevel === 0) {
                snake.level++;
                leveled(snake);                
            }
        }
        
        /* move snake */
        growSnake(snake);
        snake.direction.x = snake.lookat.x;
        snake.direction.y = snake.lookat.y;
        snake.head.x += snake.direction.x;
        snake.head.y += snake.direction.y;
        wrapSnake(snake);

        /* check snake head / body collisions */        
        snake.body.forEach(function(e) {
            if(e.x === snake.head.x && e.y === snake.head.y) {
                gameOver(snake);
            }
        });
    }

    /* check snake head / border collisions */        
    function wrapSnake(snake) {
        if (snake.head.x > grid.x) {
            snake.head.x = 0;
            gameOver(snake);
        }

        if (snake.head.y > grid.y) {
            snake.head.y = 0;
            gameOver(snake);
        }

        if (snake.head.y < 0) {
            snake.head.y = grid.y;
            gameOver(snake);
        }

        if (snake.head.x < 0) {
            snake.head.x = grid.x;
            gameOver(snake);
        }
    }

    /* draw (pulsating) treasure */        
    function drawTreasure(ctx, treasure) {
        drawCircle(ctx, offset.x + treasure.location.x * unit.x, offset.y + treasure.location.y * unit.y, treasure.size, 'blue');
        drawCircle(ctx, offset.x + treasure.location.x * unit.x, offset.y + treasure.location.y * unit.y, treasure.size-1, 'yellow');
        treasure.size += treasure.step;
        if(treasure.size > treasure.max_size || treasure.size < treasure.min_size) {
            treasure.step *= -1;
        }
    }

    /* draw snake body part */        
    function drawSnakeBody(ctx, snake, body) {
        drawCircle(ctx, offset.x + body.x * unit.x, offset.y + body.y * unit.y, snake.size + 2, snake.color);
    }

    /* draw snake head */        
    function drawSnakeHead(ctx, snake) {
        drawCircle(ctx, offset.x + snake.head.x * unit.x, offset.y + snake.head.y * unit.y, snake.size + 4, snake.color);
    }

    /* draw snake eyes */        
    function drawSnakeEyes(ctx, snake, outercolor, innercolor) {
        var d = snake.direction;
        var x = 0, y = 0;
        var s = 1.6;
        var s2 = s * 3;
        if(d.x) {
            // horizontal
            x = unit.x / s2 * d.x;
            y = unit.y / s2;
            drawCircle(ctx, offset.x + x + snake.head.x * unit.x, offset.y + y + snake.head.y * unit.y, snake.size / s, outercolor);
            drawCircle(ctx, offset.x + x + snake.head.x * unit.x, offset.y - y + snake.head.y * unit.y, snake.size / s, outercolor);
            x += d.x * s;
            drawCircle(ctx, offset.x + x + snake.head.x * unit.x, offset.y + y + snake.head.y * unit.y, snake.size / s2, innercolor);
            drawCircle(ctx, offset.x + x + snake.head.x * unit.x, offset.y - y + snake.head.y * unit.y, snake.size / s2, innercolor);
        }
        else {
            // vertical
            x = unit.x / s2;
            y = unit.y / s2 * d.y;
            drawCircle(ctx, offset.x + x + snake.head.x * unit.x, offset.y + y + snake.head.y * unit.y, snake.size / s, outercolor);
            drawCircle(ctx, offset.x - x + snake.head.x * unit.x, offset.y + y + snake.head.y * unit.y, snake.size / s, outercolor);
            y += d.y * s;
            drawCircle(ctx, offset.x + x + snake.head.x * unit.x, offset.y + y + snake.head.y * unit.y, snake.size / s2, innercolor);
            drawCircle(ctx, offset.x - x + snake.head.x * unit.x, offset.y + y + snake.head.y * unit.y, snake.size / s2, innercolor);
        }
    }

    /* draw game score */        
    function drawScore(ctx, snake) {
        ctx.fillStyle = 'black';
        ctx.fillText('score:'  + snake.score, 102, fontsize);
        ctx.fillText('level:'  + snake.level, canvas.width - 202, fontsize);
    }

    /* empty canvas */        
    function clearCanvas(ctx, x, y, w, h, color) {
        fillRect(ctx, x, y, w, h, color);
    }

    /* draw a filled rectangle */        
    function fillRect(ctx, x, y, w, h, c) {
        ctx.fillStyle = c;
        ctx.fillRect(x, y, w, h);
    }

    /* draw a rectangle */        
    function drawRect(ctx, x, y, w, h, c) {
        ctx.strokeStyle = c;
        ctx.strokeRect(x, y, w, h);
    }

    /* draw a filled circle */        
    function drawCircle(ctx, x, y, r, color) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI*2, false);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
    }

    /* handle keydown events */        
    function keyDownHandler(e) {
        if(e.keyCode == 37) {
            keys.left = 1;
        }
        else if(e.keyCode == 38) {
            keys.up = 1;
        }
        else if(e.keyCode == 39) {
            keys.right = 1;
        }
        else if(e.keyCode == 40) {
            keys.down = 1;
        }
    }

    /* handle keyup events */        
    function keyUpHandler(e) {
        if(e.keyCode == 37) {
            keys.left = 0;
        }
        else if(e.keyCode == 38) {
            keys.up = 0;
        }
        else if(e.keyCode == 39) {
            keys.right = 0;
        }
        else if(e.keyCode == 40) {
            keys.down = 0;
        }
    }

    /* publicly exposed members */     
    var handlers = {
        started: false,
        ate: null,
        leveled: null,
        gameOver: null,
        start: function() {
            this.started = true;    
            start();
        }
    };
    return handlers;
})();