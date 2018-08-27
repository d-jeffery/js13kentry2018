"use strict";

(function () {

    let socket, //Socket.IO client
        buttons, //Button elements
        message, //Message element
        score, //Score element
        points = { //Game points
            draw: 0,
            win: 0,
            lose: 0
        },
        canvas, // The game canvas
        playerNo,
        engine;

    var gameboard, // The game board
        moves;

    /**
     * Disable all button
     */
    function disableButtons() {
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].setAttribute("disabled", "disabled");
        }
    }

    /**
     * Enable all button
     */
    function enableButtons() {
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].removeAttribute("disabled");
        }
    }

    /**
     * Set message text
     * @param {string} text
     */
    function setMessage(text) {
        message.innerHTML = text;
    }

    /**
     * Set score text
     * @param {string} text
     */
    function displayScore(text) {
        score.innerHTML = [
            "<h2>" + text + "</h2>",
            "Won: " + points.win,
            "Lost: " + points.lose,
            "Draw: " + points.draw
        ].join("<br>");
    }

    /**
     * Binde Socket.IO and button events
     */
    function bind() {

        socket.on("start", (b, n) => {
            gameboard = b;
            playerNo = n;
            console.log(gameboard, playerNo);
            enableButtons();
            setMessage("Game Start!");
            engine.start();
        });

        socket.on("turn", (b, m) => {
            gameboard = b;
            moves = m;
            console.log("turn", playerNo, moves);
            enableButtons();
            setMessage("Your turn!");
        });

        socket.on("wait", (b) => {
            gameboard = b;
            moves = [];
            console.log("wait", playerNo, moves);
            disableButtons();
            setMessage("Opponents turn!");
        });

        socket.on("win", () => {
            points.win++;
            displayScore("You win!");
        });

        socket.on("lose", () => {
            points.lose++;
            displayScore("You lose!");
        });

        socket.on("draw", () => {
            points.draw++;
            displayScore("Draw!");
        });

        socket.on("end", () => {
            disableButtons();
            setMessage("Waiting for opponent...");
        });

        socket.on("connect", () => {
            disableButtons();
            setMessage("Waiting for opponent...");
        });

        socket.on("disconnect", () => {
            disableButtons();
            setMessage("Connection lost!");
        });

        socket.on("error", () => {
            disableButtons();
            setMessage("Connection error!");
        });
    }

    /**
     * Client module init
     */
    function init() {
        socket = io({ upgrade: false, transports: ["websocket"] });
        buttons = document.getElementsByTagName("button");
        message = document.getElementById("message");
        score = document.getElementById("score");
        canvas = document.getElementById("game");
        engine = setupEngine(640, 320, canvas);
        gameboard = undefined;
        disableButtons();
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

                window.requestAnimationFrame(tick);
            }
            window.requestAnimationFrame(tick);
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
                    const x = tile.c * 50 + 30 + 20 * (i % 2);
                    const y = tile.r * 50 + 30;
                    this.addActor(new GameTile(new Point(x, y), tile));
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

            // Setup gameboard
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
                            ctx.strokeStyle = "#000000";
                            ctx.lineWidth = 2;
                            const mx = tile.c * 50 + 30 + 20 * (i % 2);
                            const my = tile.r * 50 + 30;
                            ctx.moveTo(mx, my);

                            const lx = b.c * 50 + 30 + 20 * (b.r % 2);
                            const ly = b.r * 50 + 30;
                            ctx.lineTo(lx, ly);
                            ctx.stroke();
                        })

                    // const x = tile.c * 50 + 30 + 20 * (i % 2);
                    // const y = tile.r * 50 + 30;

                }
            }

            super.render();
        }
    }

    /**
     * Game tile.
     */
    class GameTile extends CircleActor {
        constructor(origin, tile) {
            super(origin, 20, {layer: tile.y});
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
