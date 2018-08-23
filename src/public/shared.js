"use strict";

const GUESS_NO = 0;
const GUESS_ROCK = 1;
const GUESS_PAPER = 2;
const GUESS_SCISSORS = 3;

/**
 * The game board.
 */
class GameBoard {
    constructor(rows, cols) {
        this.r = rows;
        this.c = cols;

        this.tiles = [];
        this.createBoard();

    }

    /**
     * Create the board.
     */
    createBoard() {
        for(let i = 0; i < this.r; i++) {
            this.tiles[i] = [];
            for(let j = 0; j < this.c; j++) {
                this.tiles[i][j] = new BoardTile(j, i);
            }
        }
    }

    /**
     * Get board tile.
     * @param {number} x
     * @param {number} y
     * @returns {BoardTile}
     */
    getBoardTile(x, y) {
        return this.tiles[y][x];
    }
}

/**
 * A tile on the board.
 */
class BoardTile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.owner = undefined;
    }

    /**
     * Set the owner.
     * @param p
     */
    setOwner(p) {
        this.owner = p;
    }
}