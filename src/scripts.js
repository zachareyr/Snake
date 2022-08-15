"use strict";

const UPDATES_PER_SECOND = 10;

const directions = {
    "UP": [-1, 0],
    "RIGHT": [0, 1],
    "DOWN": [1, 0],
    "LEFT": [0, -1],
    "NONE": [0, 0],
}

const states = {
    "EMPTY" : 0,
    "SNAKE" : 1,
    "FOOD" : 2,
    "PATH" : 3,
}

const applyDirection = (pos, direction) => {
    return new Position(pos.y + direction[0], pos.x + direction[1], pos.value);
}

// inclusive
const randint = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const handleKeyPress = (k) => {
    if (k.key === "ArrowUp") {
        board.tryChange(directions["UP"])
        k.preventDefault();
    }  else if (k.key === "ArrowRight") {
        board.tryChange(directions["RIGHT"])
        k.preventDefault();
    } else if (k.key === "ArrowDown") {
        board.tryChange(directions["DOWN"])
        k.preventDefault();
    }  else if (k.key === "ArrowLeft") {
        board.tryChange(directions["LEFT"])
        k.preventDefault();
    }
}

const create2DArray = (height, width, item=undefined) => {
    let arr = new Array(height);

    for(let i = 0; i < height; i++) {
        arr[i] = new Array(width).fill(item);
    }
    return arr;
}

let createHTMLElement = (tag, classList=undefined, id=undefined) => {
    let element = document.createElement(tag);
    if (id != undefined)
        element.id = id;
    if (classList != undefined)
    classList.forEach((item) => { element.classList.add(item)});
    return element;
}


class Board {
    constructor(height, width, ups, htmlContainer) {

        this.buffer = [];
        this.actionHasBeenApplied = true;
        
        this.height = height;
        this.width = width;
        this.ups = ups;
        this.board = create2DArray(this.height, this.width, 0);
        for(let i = 0; i < this.height; i++) {
            for(let j = 0; j < this.width; j++) {
                this.board[i][j] = new Position(i, j, 0);
            }
        }
        this.colors = ["none", "green", "red", "blue"]; 
        this.snake = [];
        this.starting_length = 4;
        let tmp = new Position(Math.floor(height/2), Math.floor(width/2), states["SNAKE"]);
        for (let i = 0; i < this.starting_length; i++) {
            this.snake.push(tmp)
            tmp = applyDirection(tmp, directions["DOWN"])
        }
        this.direction = directions["NONE"];

        this.score = 0;
        this.highscore = 0;


        this.containerHTML = htmlContainer;
        this.scoreContainer = document.getElementById("score-container");
        this.scoreHTML = document.getElementById("score");
        this.highscoreHTML = document.getElementById("highscore");
        this.scoreContainer.appendChild(this.scoreHTML);
        this.scoreContainer.appendChild(this.highscoreHTML);

        this.applePos = this.getRandomEmptyPosition(states["FOOD"]);

        this.rowsHTML = []
        this.spacesHTML = create2DArray(this.height, this.width);
        let rowContainer, space;
        for(let i = 0; i < height; i++) {
            rowContainer = createHTMLElement("div", ["row", `row-${i+1}`]);
            this.rowsHTML.push(rowContainer);
            this.containerHTML.appendChild(rowContainer);
            for (let j = 0; j < width; j++) {
                space = createHTMLElement("div", ["space", `space-${j+1}`]);
                rowContainer.appendChild(space);
                this.spacesHTML[i][j] = space;
            }
        }

        this.updateBoard();
        this.updateHTML();

        // for some reason, this only works if i do it like this
        // i have no idea why...
        let me = this;
        // this.update();
        this.interval = setInterval(function() {
            me.update();
        }, 1000/this.ups)
    }

    updateHTML() {  
        for(let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                this.spacesHTML[i][j].style.background = this.colors[this.board[i][j].value];
            }
        }
        this.scoreHTML.innerHTML = `Score: ${this.score}`;
        this.highscoreHTML.innerHTML = `Highscore: ${this.highscore}`
    }

    updateBoard() {
        // console.log("Updating board");
        this.resetBoard();
        this.board[this.applePos.y][this.applePos.x].value = states["FOOD"];
        for(let position of this.snake) {
            this.board[position.y][position.x].value = states["SNAKE"];
        }
    }

    resetBoard() {
        for(let i = 0; i < this.height; i++) {
            for(let j = 0; j < this.width; j++) {
                this.board[i][j].value = states["EMPTY"];
            }
        }
    }

    canChangeTo(direction) {
        let newPos = applyDirection(this.snake[0], direction) 
        return this.board[newPos.y][newPos.x].value !== states["SNAKE"];
    }

    update() {
        let tmp = false;
        if(this.direction !== directions["NONE"]) {
            if (this.actionHasBeenApplied && this.buffer.length > 0) {
                this.tryChange(this.buffer[0]);
                this.buffer.splice(0, 1);
            } else {
                this.actionHasBeenApplied = true;
            }
            if (!this.snake[0].applyDirection(this.direction, false).equals(this.applePos, false)) {
                for (let i = this.snake.length-1; i > 0; i--) {

                    this.snake[i] = this.snake[i-1].copy();
                }              
                this.snake[0] = applyDirection(this.snake[0], this.direction);
            } else {
                this.snake.splice(0, 0, this.applePos);
                this.snake[0].value = states["SNAKE"];
                this.applePos = this.getRandomEmptyPosition();

                tmp = true;
                this.score++;
            }
            
        } else {
            console.log("didn't update")
        }
        if (!this.isValidPosition(this.snake[0]) || (this.board[this.snake[0].y][this.snake[0].x].value === states["SNAKE"] && this.direction !== directions["NONE"])) {
            console.log("game over");
            this.reset();
            return;
        }
        this.updateBoard();
        this.updateHTML();

    }

    reset() {        
        this.direction = directions["NONE"];
        if (this.score > this.highscore)
            this.highscore = this.score
        this.score = 0;
        this.buffer = [];
        this.actionHasBeenApplied = true;   
        this.snake = [];
        this.applePos = this.getRandomEmptyPosition();
        this.starting_length = 4;
        let tmp = new Position(Math.floor(this.height/2), Math.floor(this.width/2), states["SNAKE"]);
        for (let i = 0; i < this.starting_length; i++) {
            this.snake.push(tmp)
            tmp = applyDirection(tmp, directions["DOWN"]);
        }
        this.updateBoard();
        this.updateHTML();

    }

    tryChange(dir) {
        let newPos = applyDirection(this.snake[0], dir) 

        if (!this.isValidPosition(newPos) || this.board[newPos.y][newPos.x].value !== states["SNAKE"]) {
            if (this.actionHasBeenApplied) {
                this.direction = dir;
                this.actionHasBeenApplied = false;
            } else {
                if (this.buffer.length < 3 && (this.direction !== dir || (this.buffer.length > 1 && this.buffer[-1] !== dir)))
                    this.buffer.push(dir);
            }
        }
    }

    isValidPosition(pos) {
        return pos.x > -1 && pos.x < this.width && pos.y > -1 && pos.y < this.height;
    }
    
    getRandomEmptyPosition(state = undefined) {
        if(this.snake.length >= this.height * this.width) return; //the snake takes up the whole place
        let position = new Position(0, 0, state);
        do {
            position.y = randint(0, this.height-1)
            position.x = randint(0, this.width-1);
        } while (this.board[position.y][position.x].value !== states["EMPTY"]);
        return position;
    }
}

class Position {
    constructor(y, x, value=undefined) {
        this.value = value;
        this.y = y;
        this.x = x;
    }

    equals(other, compareValue=true) {
        return this.y === other.y && this.x === other.x && (this.value === other.value || !compareValue);
    }

    applyDirection(dir, inPlace = true) {
        if (inPlace) {
            let tmp = applyDirection(this, dir);
            this.y = tmp.y;
            this.x = tmp.x;
        } else {
            return applyDirection(this.copy(), dir);
        }
    }

    copy() {
        return new Position(this.y, this.x, this.value);
    }


}


let allContainer = document.getElementById("all-container");
let board = new Board(20, 20, UPDATES_PER_SECOND, document.getElementById("board-container"));
document.addEventListener("keydown", handleKeyPress);

