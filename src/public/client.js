"use strict";

// Get a regular interval for drawing to the screen
window.requestAnimFrame = (function (callback) {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimaitonFrame ||
        function (callback) {
            window.setTimeout(callback, 1000/60);
        };
})();

(function () {

    let socket, //Socket.IO client
        intro, //Intro wrapper
        game, //Game wrapper
        findHuman, //Find human button
        basicAI, //Basic AI button
        status, //Status element
        message, //Message element
        score, //Score element
        points = [0, 0],
        canvas, // The game canvas
        playerNo,
        engine;

    var gameboard, // The game board
        moves;

    /**
     * Set the status text.
     * @param {string} text
     */
    function setStatus(text) {
        status.innerHTML = `<h2>${text}</h2>`;
    }

    /**
     * Set message text
     * @param {string} text
     * @param {string} clazz
     */
    function setMessage(text, clazz) {
        message.innerHTML = `<h2 class='${clazz}'>${text}</h2>`;
    }

    /**
     * Set score text
     */
    function displayScore() {
        score.innerHTML = [
            "<h2>" + "The score" + "</h2>",
            "Blue: " + points[playerNo], " -- ",
            "Red: " + points[(playerNo + 1) % NUM_PLAYERS], "<br>"
        ].join("");
    }

    /**
     * Show intro element.
     */
    function showIntro() {
        intro.style.display = "block";
    }

    /**
     * Hide intro element.
     */
    function hideIntro() {
        intro.style.display = "none";
    }

    /**
     * Show game element
     */
    function showGame() {
        game.style.display = "block"
    }

    /**
     * Hide game element.
     */
    function hideGame() {
        game.style.display = "none";
    }

    /**
     * Binde Socket.IO and button events
     */
    function bind() {

        socket.on("start", (b, n) => {
            gameboard = b;
            playerNo = n;
            showGame();
            hideIntro();
            // console.log(gameboard, playerNo);
            setMessage("Game Start!");
            engine.start();
        });

        socket.on("turn", (b, p, m) => {
            gameboard = b;
            moves = m;
            points = p;
            // console.log("turn", playerNo, p, moves);

            if (moves.length > 0) {
                setMessage("Your turn!", "zoom");
            } else {
                // console.log("Passing");
                setMessage("You passed!");
                socket.emit("pass")
            }

            displayScore();
        });

        socket.on("wait", (b, p) => {
            gameboard = b;
            moves = [];
            points = p;
            // console.log("wait", playerNo, p);
            setMessage("Opponents turn!");
            displayScore();
        });

        socket.on("win", () => {
            setMessage("You win!", "zoom");
            displayScore();
        });

        socket.on("lose", () => {
            setMessage("You lose!");
            displayScore();
        });

        socket.on("draw", () => {
            setMessage("Draw!");
            displayScore();
        });

        socket.on("end", () => {
            hideGame();
            showIntro();
            setStatus("Waiting for opponent...");
        });

        socket.on("connect", () => {
            hideGame();
            showIntro();
            setStatus("Connected to server.");
        });

        socket.on("disconnect", () => {
            hideGame();
            showIntro();
            setStatus("Connection lost!");
        });

        socket.on("error", () => {
            hideGame();
            showIntro();
            setStatus("Connection error!");
        });

        findHuman.addEventListener("click", function (e) {
            setStatus("Waiting for opponent...");
            socket.emit("find-human");
        }, false);

        findHuman.addEventListener("click", function (e) {
            setStatus("Waiting for opponent...");
            socket.emit("find-human");
        }, false);

        basicAI.addEventListener("click", function (e) {
            socket.emit("start-basic-ai");
        }, false);
    }

    /**
     * Client module init
     */
    function init() {
        socket = io({ upgrade: false, transports: ["websocket"] });
        intro = document.getElementById("intro-wrapper");
        game = document.getElementById("game-wrapper");
        findHuman = document.getElementById("find-human");
        basicAI = document.getElementById("start-basic-ai");
        status = document.getElementById("status");
        message = document.getElementById("message");
        score = document.getElementById("score");
        canvas = document.getElementById("game");
        engine = setupEngine(320, 400, canvas);
        gameboard = undefined;
        bind();
    }

    window.addEventListener("load", init, false);

    /**
     * Setup the game engine.
     * @param width
     * @param height
     * @param canvas
     * @returns {Engine}
     */
    function setupEngine(width, height, canvas) {
        const engine = new Engine(width, height, canvas);

        const preloader = new PreloaderStage(width, height);
        engine.setStage(preloader);

        engine.setStageTransition(() => {
            if (engine.stage instanceof PreloaderStage) {
                const stage = new GameBoardStage(width, height);
                engine.setStage(stage);
            }
        });

        return engine;
    }

    /**
     * A point.
     */
    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }

    /**
     * Calculate distance between two points.
     * @param {Point} pointA
     * @param {Point} pointB
     * @returns {number}
     */
    function dist(pointA, pointB) {
        return Math.sqrt(Math.pow(pointB.x - pointA.x, 2) + Math.pow(pointB.y - pointA.y, 2));
    }

    /**
     * Get the position of the mouse relative to the canvas.
     * @param {HTMLCanvasElement} canvas
     * @param {MouseEvent} mouseEvent
     * @returns {Point}
     */
    function getMousePos(canvas, mouseEvent) {
        const rect = canvas.getBoundingClientRect();
        return new Point(
            mouseEvent.clientX - rect.left,
            mouseEvent.clientY - rect.top
        );
    }

    // Get the position of a touch relative to the canvas
    function getTouchPos(canvas, touchEvent) {
        const rect = canvas.getBoundingClientRect();
        return new Point(
            touchEvent.touches[0].clientX - rect.left,
            touchEvent.touches[0].clientY - rect.top
        );
    }

    /**
     * Image Loader singleton.
     * Singleton pattern;  http://www.adam-bien.com/roller/abien/entry/singleton_pattern_in_es6_and
     */
    class ImageLoader {
        /**
         * Constructor.
         * @returns {ImageLoader} instance if already initialized
         */
        constructor() {
            if (ImageLoader.instance) {
                return ImageLoader.instance;
            }

            this.numOfImages = 0;
            this.numComplete = 0;
            this.images = {};
            ImageLoader.instance = this;
        }

        /**
         * Load an img and assign it to a given key.
         * @param {string} key the key for the img
         * @param {string} src the src for the img
         */
        loadImage(key, src) {
            this.numOfImages++;
            const downloadingImage = new Image();
            downloadingImage.onload = () => {
                ImageLoader.instance.images[key] = downloadingImage;
                ImageLoader.instance.numComplete++;
            };
            downloadingImage.src = src;
        }

        /**
         * Get the img associated with the given key.
         * @param {string} key - the key for the img
         * @returns {Image}
         */
        getImage(key) {
            const image = this.images[key];
            if (image instanceof Image) {
                return image;
            }
            throw new Error(key + ' is not a valid key');
        }

        /**
         * Get percentage of assets loaded.
         * @returns {number} percentage of load loading completed
         */
        getProgress() {
            return this.numComplete / this.numOfImages;
        }

        /**
         * Check whether loading is complete.
         * @returns {boolean} true if loading is done.
         */
        loadingIsCompleted() {
            if (this.numOfImages === 0) {
                return true;
            }
            return this.getProgress() === 1;
        }
    }

    /**
     * The game engine.
     */
    class Engine {

        /**
         * Engine constructor.
         * @param {number} width
         * @param {number} height
         * @param {HTMLCanvasElement} canvas
         */
        constructor(width, height, canvas) {
            this.w = width;
            this.h = height;

            this.canvas = canvas;
            this.canvas.width = this.w;
            this.canvas.height = this.h;

            this.ctx = this.canvas.getContext('2d');
            this.stage = undefined;
        }

        /**
         * Set the current stage.
         * @param {Stage} stage
         */
        setStage(stage) {
            this.stage = stage;
            this.stage.ctx = this.ctx;
            this.stage.init();
        }

        /**
         * Set a stage transition function.
         * @param {() => void} fun
         */
        setStageTransition(fun) {
            this.transitionFun = fun;
        }

        /**
         * Start the game engine.
         */
        start() {
            this.running = true;

            const engine = this;
            function tick() {
                const timeNow = Date.now();
                const dt = timeNow - engine.currentTime;
                engine.currentTime = timeNow;

                if (engine.running) {
                    engine.update(dt / 1000);
                }
                engine.render();

                window.requestAnimFrame(tick);
            }
            window.requestAnimFrame(tick);
        }

        /**
         * Stop the game engine.
         */
        stop() {
            this.running = false;
        }

        /**
         * Update function.
         * @param {number} dt
         */
        update(dt) {
            // Run transition function if currentStage is marked as 'finished'
            if (this.stage.finished && this.transitionFun !== undefined) {
                this.transitionFun();
            }

            // Update stage
            if (this.stage !== undefined) {
                this.stage.update(dt);
            }
        }

        /**
         * Render function.
         */
        render() {
            // Clear reset canvas
            this.ctx.save();
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();

            // Render stage
            if (this.stage !== undefined) {
                this.stage.render();
            }
        }
    }

    /**
     * The game stage.
     */
    class Stage {

        /**
         * Stage constructor.
         * @param {number} width
         * @param {number} height
         */
        constructor(width, height) {
            this.w = width;
            this.h = height;
            this.ctx = undefined;
            this.finished = false;
            this.actors = [];
        }

        /**
         * Add an actor to the stage and initialise.
         * @param {Actor} actor
         */
        addActor(actor) {
            actor.stage = this;
            actor.init();
            this.actors.push(actor);
        }

        /**
         * Initialize the stage.
         */
        init() {
            this.finished = false;
        }

        /**
         * Update all actors on stage.
         * @param {number} dt
         */
        update(dt) {
            this.actors = this.actors.filter(a => !a.remove);
            this.sortActorsByLayer();

            for (const actor of this.actors) {
                actor.update(dt);
            }
        }

        /**
         * Render all actors on stage.
         */
        render() {
            for (const actor of this.actors) {
                actor.render();
            }
        }

        /**
         * Sort actor list by layer.
         */
        sortActorsByLayer() {
            this.actors.sort((a, b) => {
                return a.layer - b.layer;
            });
        }
    }

    /**
     * Stage for rendering ImageLoader progress.
     */
    class PreloaderStage extends Stage {

        /**
         * Basic constructor taking currentStage w and h.
         * @param {number} width - The currentStage w.
         * @param {number} height - The currentStage h.
         */
        constructor(width, height) {
            super(width, height);
            this.assetLoader = new ImageLoader();
            this.progress = this.assetLoader.getProgress();
        }

        /**
         * Overriding update function.
         * @param {number} step - The number of steps to update for.
         */
        update(step) {
            super.update(step);
            this.progress = this.assetLoader.getProgress();
            if (this.assetLoader.loadingIsCompleted()) {
                this.finished = true;
            }
        }

        /**
         * Overriding drawMazeParts function.
         */
        render() {
            super.render();
            this.ctx.save();
            this.drawProgress();
            this.ctx.restore();
        }

        /**
         * Draw progress as a bar.
         */
        drawProgress() {
            const minX = 20;
            const maxX = this.w - minX * 2;
            const barHeight = 50;
            const fill = maxX * this.progress;

            this.ctx.strokeRect(minX, this.h / 2 - barHeight / 2, maxX, barHeight);
            this.ctx.fillRect(minX, this.h / 2 - barHeight / 2, fill, barHeight);
        }
    }

    /**
     * An actor class.
     */
    class Actor {

        /**
         * Actor constructor.
         * @param {Point} origin
         * @param {object} options - layer, stage, debugcolour
         */
        constructor(origin, options) {
            this.pos = origin;
            this.layer = options.layer ? options.layer : 0;
            this.stage = options.stage ? options.stage : undefined;
            this.debugColour = options.debugColour ? options.debugColour : '#000000';
            this.remove = false;
        }

        /**
         * Initialize the actor.
         */
        init() {
        }

        /**
         * Update the actor.
         * @param {number} dt
         */
        update(dt) {
        }

        /**
         * Render the actor.
         */
        render() {
            this.debugDraw();
        }

        /**
         * Draw the debug version of the actor.
         */
        debugDraw() {
        }
    }

    /**
     * A circle shaped actor.
     */
    class CircleActor extends Actor {
        /**
         * Constructor.
         * @param {Point} origin
         * @param {number} radius
         * @param {object} options - layer, stage, debugcolour
         */
        constructor(origin, radius, options) {
            super(origin, options);
            this.r = radius;
        }

        /**
         * @inheritDoc
         */
        debugDraw() {
            const ctx = this.stage.ctx;
            ctx.beginPath();
            ctx.fillStyle = this.debugColour;
            ctx.arc(this.pos.x, this.pos.y, this.r, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    /**
     * The stage with the gameboard.
     */
    class GameBoardStage extends Stage {
        /**
         * Constructor.
         * @param {number} w
         * @param {number} h
         */
        constructor(w, h) {
            super(w, h);
            this.mesh = [];
            this.tileSize = 20;
            this.gap = 50;
            this.paddingX = this.tileSize + 2;
            this.paddingY = this.tileSize + 8;
        }

        /**
         * @inheritDoc
         */
        init() {
            super.init();

            // Setup gameboard
            for(let i = 0; i < gameboard.r; i++) {
                for(let j = 0; j < gameboard.c; j++) {
                    if (gameboard.tiles[i][j] === null) {
                        continue;
                    }

                    const tile = gameboard.tiles[i][j];
                    const x = tile.c * this.gap + this.paddingX + (this.gap / 2) * (i % 2);
                    const y = tile.r * this.gap + this.paddingY;
                    this.addActor(new GameTile(new Point(x, y), this.tileSize, tile));
                }
            }

            // Setup event listener
            canvas.addEventListener("mousedown", (e) => {
                const pos = getMousePos(canvas, e);

                const selected = this.actors
                    .filter(a => a instanceof GameTile)
                    .filter(a => a.doesIntersect(pos));

                if (selected[0] !== undefined) {
                    const tile = selected[0].tile;
                    socket.emit("move", {r: tile.r, c: tile.c});
                }
            });
            canvas.addEventListener("touchstart", (e) => {
                const pos = getTouchPos(canvas, e);

                const selected = this.actors
                    .filter(a => a instanceof GameTile)
                    .filter(a => a.doesIntersect(pos));

                if (selected[0] !== undefined) {
                    const tile = selected[0].tile;
                    socket.emit("move", {r: tile.r, c: tile.c});
                }
            });


            // Init gameboard mesh
            for(let i = 0; i < gameboard.r; i++) {
                for(let j = 0; j < gameboard.c; j++) {
                    if (gameboard.tiles[i][j] === null) {
                        continue;
                    }
                    const tile = gameboard.tiles[i][j];
                    const gameTile = new BoardTile(tile.r, tile.c);
                    gameTile.getSiblings()
                        .filter(b => gameboard.tiles[b.r] !== undefined)
                        .map(b => gameboard.tiles[b.r][b.c])
                        .filter(b => b)
                        .forEach(b => {
                            const mx = tile.c * this.gap + this.paddingX + (this.gap / 2) * (i % 2);
                            const my = tile.r * this.gap + this.paddingY;
                            // ctx.moveTo(mx, my);

                            const lx = b.c * this.gap + this.paddingX + (this.gap / 2) * (b.r % 2);
                            const ly = b.r * this.gap + this.paddingY;
                            // ctx.lineTo(lx, ly);
                            // ctx.stroke();
                            this.mesh.push({from: new Point(mx, my), to: new Point(lx, ly)})
                        })
                }
            }

        }

        /**
         * @inheritDoc
         */
        update(dt) {
            super.update(dt);
        }

        /**
         * @inheritDoc
         */
        render() {
            const ctx = this.ctx;

            for(const m of this.mesh) {
                const from = m.from;
                const to = m.to;
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(from.x, from.y);
                ctx.lineTo(to.x, to.y);
                ctx.stroke();

            }
            super.render();
        }
    }

    /**
     * Game tile.
     */
    class GameTile extends CircleActor {
        constructor(origin, size, tile) {
            super(origin, size, {layer: tile.y});
            this.tile = tile;
            this.accum = 0;
        }

        /**
         * Does point intersect with underlying circle.
         * @param {Point} point
         * @returns {boolean}
         */
        doesIntersect(point) {
            return dist(point, this.pos) < this.r;
        }


        /**
         * @inheritDoc
         */
        update(dt) {
            this.accum = (this.accum + dt) % Math.PI;
        }

        /**
         * @inheritDoc
         */
        render() {
            this.tile = gameboard.tiles[this.tile.r][this.tile.c];
            const ctx = this.stage.ctx;

            if (this.tile.owner === playerNo) {
                this.debugColour = "#0000FF";
            } else if (this.tile.owner !== undefined) {
                this.debugColour = "#FF0000";
            } else {
                this.debugColour = "#000000";
            }

            super.render();

            if (this.tile.score > 1) {
                ctx.fillStyle = "#FFFF00";
                ctx.font = "20px Arial";
                ctx.globalAlpha = 1 - (Math.sin(this.accum) / 2);
                ctx.fillText("+" + this.tile.score, this.pos.x - 10, this.pos.y + 5);
                ctx.globalAlpha = 1;
            }

            if (moves.filter(t => t.r === this.tile.r &&
                t.c === this.tile.c).length > 0) {

                ctx.strokeStyle = "#777777";
                ctx.lineWidth = 5;
                ctx.globalAlpha = 1 - (Math.sin(this.accum) / 2);
                ctx.beginPath();
                ctx.arc(this.pos.x, this.pos.y, this.r - 3, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }
    }

})();
