"use strict";


/**
 * Player enum
 */
const PLAYER_1 = 0;
const PLAYER_2 = 1;

/**
 * Direction enums.
 */
const E = 0;
const SE = 1;
const S = 2;
const SW = 3;
const W = 4;
const NW = 5;
const N = 6;
const NE = 7;


/**
 * TODO hexagonal board
 */
class HexGameBoard {
    /**
     * Constructor.
     * @param {number} d
     */
    constructor(d) {
        this.d = d;

        this.tiles = [];
        this.createBoard();

    }

    /**
     * Create the board.
     */
    createBoard() {
        for(let i = 0; i < this.d; i++) {
            this.tiles[i] = [];
            for(let j = 0; j < this.d; j++) {
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
 * The rect game board.
 */
class RectGameBoard {
    /**
     * Constructor.
     * @param {number} cols
     * @param {number} rows
     * @param {boolean} cut - trim the corners
     */
    constructor(cols, rows, cut) {
        this.r = rows;
        this.c = cols;
        this.cut = cut;

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
        if (this.cut) {
            this.tiles[0][0] = null;
            this.tiles[this.r - 1][this.c - 1] = null;
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