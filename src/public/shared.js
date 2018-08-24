"use strict";

/**
 * Direction enums.
 */
const N = 0;
const NE = 1;
const E = 2;
const SE = 3;
const S = 4;
const SW = 5;
const W = 6;
const NW = 7;

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