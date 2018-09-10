"use strict";

/**
 * User sessions
 * @param {Set} users
 */
const users = new Set();

/**
 * Randomize starting positions.
 * @param u1
 * @param u2
 */
function startGame(u1, u2) {
    const coinFlip = (Math.floor(Math.random() * 2) == 0);
    if (coinFlip) {
        new Game(u1, u2).start();
    } else {
        new Game(u2, u1).start();
    }
}

/**
 * Find opponent for a user
 * @param {User} user
 */
function findOpponent(user) {
	for (let opponent of users) {
	    if (user !== opponent &&
            opponent.opponent === null) {
            startGame(user, opponent);
        }
    }
}

/**
 * Start game with BasicAI.
 * @param user
 */
function startGameWithBasicAI(user) {
    startGame(user, new BasicAI());
}

/**
 * Start game with BetterAI.
 * @param user
 */
function startGameWithBetterAI(user) {
    startGame(user, new BetterAI());
}

/**
 * Remove user session
 * @param {User} user
 */
function removeUser(user) {
	users.delete(user);
}

/**
 * Game class
 */
class Game {

	/**
	 * @param {User} user1 
	 * @param {User} user2 
	 */
	constructor(user1, user2) {
		this.user1 = user1;
		this.user2 = user2;

		this.user1.playerNo = PLAYER_1;
		this.user2.playerNo = PLAYER_2;

		this.turn = Math.floor(Math.random() * 2);
        this.gameboard = new RectGameBoard(8, 6, false);
        this.gameboard.createBoard();
	}

	/**
	 * Start new game
	 */
	start() {
		this.user1.start(this, this.user2);
		this.user2.start(this, this.user1);
	}

	/**
	 * Is game ended
	 * @return {boolean}
	 */
	ended() {
	    return this.gameboard.isBoardFilled() ||
            (this.user1.passed && this.user2.passed)
	}

    /**
     * Increment turn.
     */
	doTurn() {
        this.turn = (this.turn + 1) % NUM_PLAYERS;
    }

	/**
	 * Final score
	 */
	score() {
		const score = this.gameboard.getScores();
        if (score[this.user1.playerNo] > score[this.user2.playerNo]) {
            this.user1.win();
            this.user2.lose();
        } else if (score[this.user1.playerNo] < score[this.user2.playerNo]) {
            this.user2.win();
            this.user1.lose();
        } else {
            this.user1.draw();
            this.user2.draw();
        }
	}

}

/**
 * User session class
 */
class User {

	/**
	 * @param {Socket} socket
	 */
	constructor(socket) {
		this.socket = socket;
		this.playerNo = null;
		this.game = null;
		this.opponent = null;
		this.passed = false;
	}

	/**
	 * Start new game
	 * @param {Game} game
	 * @param {User} opponent
	 */
	start(game, opponent) {
		this.game = game;
		this.opponent = opponent;
		this.socket.emit("start", this.game.gameboard, this.playerNo);
	}

	/**
	 * Terminate game
	 */
	end() {
		this.game = null;
		this.opponent = null;
		this.socket.emit("end");
	}

    /**
     * Emit wait event.
     */
    wait() {
        this.socket.emit("wait",
            this.game.gameboard,
            this.game.gameboard.getScores());
    }

    /**
	 * Emit turn event.
     */
	turn() {
        this.socket.emit("turn",
            this.game.gameboard,
            this.game.gameboard.getScores(),
            this.game.gameboard.getValidMoves(this.playerNo));
    }

	/**
	 * Trigger win event
	 */
	win() {
		this.socket.emit("win", this.opponent.guess);
	}

	/**
	 * Trigger lose event
	 */
	lose() {
		this.socket.emit("lose", this.opponent.guess);
	}

	/**
	 * Trigger draw event
	 */
	draw() {
		this.socket.emit("draw", this.opponent.guess);
	}
}

/**
 * Basic AI player.
 */
class BasicAI extends User {

    constructor() {
        super(null);
        this.playerNo = null;
        this.game = null;
        this.opponent = null;
        this.passed = false;
    }

    /**
     * Start new game
     * @param {Game} game
     * @param {User} opponent
     */
    start(game, opponent) {
        this.game = game;
        this.opponent = opponent;
    }

    /**
     * Terminate game
     */
    end() {
        this.game = null;
        this.opponent = null;
    }

    /**
     * Emit wait event.
     */
    wait() {

    }

    /**
     * Emit turn event.
     */
    turn() {
        const user = this;
        if (user.game.ended()) {
            user.game.score();
            return;
        }
        setTimeout(function () {
            const moves = user.game.gameboard.getValidMoves(user.playerNo);
            if (moves.length > 0) {
                let bestMove = undefined;
                let bestScore = -Number.MAX_SAFE_INTEGER;

                moves.forEach((m, index) => {
                    const clonedBoard = user.game.gameboard.copy();
                    clonedBoard.doMove(m.r, m.c, user.playerNo);

                    const score = alphabeta(
                        clonedBoard,
                        0,
                        -Number.MAX_SAFE_INTEGER,
                        Number.MAX_SAFE_INTEGER,
                        false,
                        user.playerNo);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = index;
                    }
                });
                user.game.gameboard.doMove(moves[bestMove].r, moves[bestMove].c, user.playerNo);
                user.passed = false;
            } else {
                user.passed = true;
            }
            user.opponent.turn();
            user.wait();
            user.game.doTurn();

            if (user.game.ended()) {
                user.game.score();
            }
        }, 1000);
    }

    /**
     * Trigger win event
     */
    win() {

    }

    /**
     * Trigger lose event
     */
    lose() {

    }

    /**
     * Trigger draw event
     */
    draw() {

    }
}

/**
 * Basic AI player.
 */
class BetterAI extends User {

    constructor() {
        super(null);
        this.playerNo = null;
        this.game = null;
        this.opponent = null;
        this.passed = false;
    }

    /**
     * Start new game
     * @param {Game} game
     * @param {User} opponent
     */
    start(game, opponent) {
        this.game = game;
        this.opponent = opponent;
    }

    /**
     * Terminate game
     */
    end() {
        this.game = null;
        this.opponent = null;
    }

    /**
     * Emit wait event.
     */
    wait() {

    }

    /**
     * Emit turn event.
     */
    turn() {
        const user = this;
        if (user.game.ended()) {
            user.game.score();
            return;
        }
        setTimeout(function () {
            const moves = user.game.gameboard.getValidMoves(user.playerNo);
            if (moves.length > 0) {
                let bestMove = undefined;
                let bestScore = -Number.MAX_SAFE_INTEGER;

                moves.forEach((m, index) => {
                    const clonedBoard = user.game.gameboard.copy();
                    clonedBoard.doMove(m.r, m.c, user.playerNo);

                    const score = alphabeta(
                        clonedBoard,
                        2,
                        -Number.MAX_SAFE_INTEGER,
                        Number.MAX_SAFE_INTEGER,
                        false,
                        user.playerNo);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = index;
                    }
                });
                user.game.gameboard.doMove(moves[bestMove].r, moves[bestMove].c, user.playerNo);

                user.passed = false;
            } else {
                user.passed = true;
            }
            user.opponent.turn();
            user.wait();
            user.game.doTurn();

            if (user.game.ended()) {
                user.game.score();
            }
        }, 1000);
    }

    /**
     * Trigger win event
     */
    win() {

    }

    /**
     * Trigger lose event
     */
    lose() {

    }

    /**
     * Trigger draw event
     */
    draw() {

    }
}

/**
 * Minimax algorithm for AI.
 * @param {RectGameBoard} gameboard
 * @param {number} depth
 * @param {number} a
 * @param {number} b
 * @param {boolean} maximizingPlayer
 * @param {number} playerNo
 */
function alphabeta(gameboard, depth, a, b, maximizingPlayer, playerNo) {
    if (depth === 0 || gameboard.isBoardFilled()) {
        const score = gameboard.getScores();
        return score[playerNo] - score[(playerNo + 1) % NUM_PLAYERS];
    }

    let alpha = a;
    let beta = b;

    if (maximizingPlayer) {
        const moves = gameboard.getValidMoves(playerNo);
        // console.log("Max", depth, playerNo);

        if (moves.length > 0) {
            let value = -Number.MAX_SAFE_INTEGER;

            for(const m of moves) {
                const clonedBoard = gameboard.copy();
                clonedBoard.doMove(m.r, m.c, playerNo);

                value = Math.max(value,
                    alphabeta(clonedBoard, depth - 1, alpha, beta, false, playerNo));
                alpha = Math.max(alpha, value);
                if (alpha >= beta) break;
            }
            return value;
        } else {
            return alphabeta(gameboard, depth - 1, alpha, beta, false, playerNo)
        }
    } else {
        const opponent = (playerNo + 1) % NUM_PLAYERS;
        const moves = gameboard.getValidMoves(opponent);
        // console.log("Min", depth, opponent);

        if (moves.length > 0) {
            let value = Number.MAX_SAFE_INTEGER;

            for(const m of moves) {
                const clonedBoard = gameboard.copy();
                clonedBoard.doMove(m.r, m.c, opponent);

                value = Math.min(value,
                    alphabeta(clonedBoard, depth - 1, alpha, beta, true, playerNo));
                beta = Math.min(beta, value);
                if (alpha >= beta) break;
            }
            return value;
        } else {
            return alphabeta(gameboard, depth - 1, alpha, beta, true, playerNo)
        }
    }
}

/**
 * Minimax algorithm for AI.
 * @param {RectGameBoard} gameboard
 * @param {number} depth
 * @param {boolean} maximizingPlayer
 * @param {number} playerNo
 *//*
function minimax(gameboard, depth, maximizingPlayer, playerNo) {
    if (depth === 0 || gameboard.isBoardFilled()) {
        const score = gameboard.getScores();
        return score[playerNo] - score[(playerNo + 1) % NUM_PLAYERS];
    }

    if (maximizingPlayer) {
        const moves = gameboard.getValidMoves(playerNo);
        // console.log("Max", depth, playerNo);

        if (moves.length > 0) {
            let value = -Number.MAX_SAFE_INTEGER;

            for(const m of moves) {
                const clonedBoard = gameboard.copy();
                clonedBoard.doMove(m.r, m.c, playerNo);

                value = Math.max(value, minimax(clonedBoard, depth - 1, false, playerNo));
            }
            return value;
        } else {
            return minimax(gameboard, depth - 1, false, playerNo)
        }
    } else {
        const opponent = (playerNo + 1) % NUM_PLAYERS;
        const moves = gameboard.getValidMoves(opponent);
        // console.log("Min", depth, opponent);

        if (moves.length > 0) {
            let value = Number.MAX_SAFE_INTEGER;

            for(const m of moves) {
                const clonedBoard = gameboard.copy();
                clonedBoard.doMove(m.r, m.c, opponent);

                value = Math.min(value, minimax(clonedBoard, depth - 1, true, playerNo));
            }
            return value;
        } else {
            return minimax(gameboard, depth - 1, true, playerNo)
        }
    }
}*/


/**
 * Socket.IO on connect event
 * @param {Socket} socket
 */
module.exports = {

	io: (socket) => {
		const user = new User(socket);

		socket.on("find-human", () => {
            console.log("Find Human: " + socket.id);

            users.add(user);
            findOpponent(user);

            if (user.opponent) {
                if (user.game.turn === user.playerNo) {
                    user.opponent.wait();
                    user.turn();
                } else {
                    user.opponent.turn();
                    user.wait();
                }
            }
        });

        socket.on("start-basic-ai", () => {
            console.log("Start basic AI: " + socket.id);

            removeUser(user);
            startGameWithBasicAI(user);

            if (user.opponent) {
                if (user.game.turn === user.playerNo) {
                    user.opponent.wait();
                    user.turn();
                } else {
                    user.opponent.turn();
                    user.wait();
                }
            }
        });

        socket.on("start-better-ai", () => {
            console.log("Start Better AI: " + socket.id);

            removeUser(user);
            startGameWithBetterAI(user);

            if (user.opponent) {
                if (user.game.turn === user.playerNo) {
                    user.opponent.wait();
                    user.turn();
                } else {
                    user.opponent.turn();
                    user.wait();
                }
            }
        });

		socket.on("disconnect", () => {
			console.log("Disconnected: " + socket.id);
			removeUser(user);
			if (user.opponent) {
				user.opponent.end();
			}
		});

		socket.on("move", (move) => {
            console.log("Move: " + socket.id);
            if (user.game.turn === user.playerNo) {
                // Execute move
                if (user.game.gameboard.doMove(move.r, move.c, user.playerNo)) {
                    user.passed = false;
                    user.wait();
                    user.opponent.turn();
                    user.game.doTurn()
                }

                if (user.game.ended()) {
                    user.game.score();
                }
            }
		});

		socket.on("pass", () => {
            console.log("Pass: " + socket.id);
            if (user.game.turn === user.playerNo) {
                // Execute pass
                user.passed = true;
                user.wait();
                user.opponent.turn();
                user.game.doTurn();

                if (user.game.ended()) {
                    user.game.score();
                }
            }
        });

		/*socket.on("guess", (guess) => {
			console.log("Guess: " + socket.id);
			if (user.setGuess(guess) && user.game.ended()) {
				user.game.score();
				user.game.start();
				storage.get('games', 0).then(games => {
					storage.set('games', games + 1);
				});
			}
		});*/

		console.log("Connected: " + socket.id);
	},

	stat: (req, res) => {
		storage.get('games', 0).then(games => {
			res.send(`<h1>Games played: ${games}</h1>`);
		});
	}

};