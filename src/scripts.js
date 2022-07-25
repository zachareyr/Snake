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

const IS_USER_CONTROLLED = false;
const handleKeyPress = (k) => {
    if(!IS_USER_CONTROLLED) return;
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
        this.ai = new AStar(this);

        // for some reason, this only works if i do it like this
        // i have no idea why...
        let me = this;
        // this.update();
        if(IS_USER_CONTROLLED) {
            this.interval = setInterval(function() {
                me.update();
            }, 1000/this.ups)
        } else {
            this.interval = setInterval(() => {
                me.getNextAction();
                me.update();
                me.ai.advancePath();
            }, 1000/this.ups);
            // document.addEventListener("click", () => {
            //     // console.log('test');
            //     me.getNextAction();
            //     me.update();
            //     me.ai.advancePath();
            // })
        }
    }

    getNextAction() {
        if(IS_USER_CONTROLLED) return;
        // if (this.ai.path.length === 0) {
        //     // console.log("Recalculating path...");
        //     this.ai.calculatePath();
        // }
        // console.log("PATH: " + JSON.stringify(this.ai.path));
        this.updateBoard();
        this.direction = this.ai.getNextDirection();
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
        this.ai = new AStar(this);

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



class AStarNode {
    constructor(pos, target, parent) {
        if (parent === void 0) { parent = undefined; }
        this.pos = pos.copy();
        this.target = target;
        this.parent = parent;
        this.cost = (this.parent !== undefined ? this.parent.cost + 1 : 0);
    }
    calculateCosts(origin) {
        if (origin === void 0) { origin = undefined; }
        // Trace path back if the origin is not supplied
        if (origin === undefined)
            origin = this.getOrigin();
        this.estimatedEndCost = this.getEuclideanDistance();
        this.estimatedTotalCost = this.cost + this.estimatedEndCost;
    }

    getEuclideanDistance(target = undefined) {
        if (target === undefined)
            target = this.target;
        return Math.sqrt((target.y - this.pos.y) * (target.y - this.pos.y) + (target.x - this.pos.x) * (target.x - this.pos.x));
    };

    equals(other) {
        return (this.pos.equals(other.pos, false));
    };
    getOrigin() {
        let origin = this;
        while ((origin === null || origin === void 0 ? void 0 : origin.parent) !== undefined) {
            origin = origin === null || origin === void 0 ? void 0 : origin.parent;
        }
        return origin;
    };

    getAdjacent() {
        let children = [];
        for (let _i = 0, _a = [[-1, 0], [1, 0], [0, 1], [0, -1]]; _i < _a.length; _i++) {
            let offset = _a[_i];
            children.push(new AStarNode(applyDirection(this.pos, offset), this.target, this));
        }
        return children;
    };
};

class AStar {
    constructor(board) {
        this.board = board;
        this.path = [];
        outer: for(let row of this.board.board) {
            for(let col of row) {
                if (col.value === states["FOOD"]) {
                    console.log("target found")
                    this.target = col.copy();
                    break outer;
                }
            }
        }
    }


    dfs(node, requiredCost, board) {
        if(node.cost >= requiredCost) {
            console.log("DFS complete.");
            // console.log(JSON.stringify(node))
            return node;
        }

        let results = []
        for (let newNode of node.getAdjacent()) {
            if(!this.board.isValidPosition(newNode.pos)) continue;
            if (board[newNode.pos.y][newNode.pos.x] !== states["SNAKE"]) {
                let result = this.dfs(newNode, requiredCost, board);
                if (result.cost >= requiredCost) return result;
                results.push(result);
            }
        }
        let max = results[0];
        for(let result of results) {
            if(result.cost > max.cost) max = result 
        }
        return max;
    }

    boardTo2DArray(b) {
        let arr = create2DArray(this.board.height, this.board.width);
        for(let i = 0; i < this.board.height; i++) {
            for (let j = 0; j < this.board.width; j++) {
                arr[i][j] = [this.board.board.value, 0];
            }
        }
        return arr;
    }

    getBoardAt(node) {
        let board = create2DArray(this.board.height, this.board.width, states["EMPTY"]);
        let snakeLength = this.board.snake.length;
        for (let i = 0; i < snakeLength; i++) {
            if(node !== undefined) {
                board[node.pos.y][node.pos.x] = states["SNAKE"];
                node = node.parent;
            } else {
                let snakePos = this.board.snake[this.board.snake.length-(i+1)];
                board[snakePos.y][snakePos.x] = states["SNAKE"];
            }
        }
        return board;
    }

    getPath() {
        let open = [];
        open.push(new AStarNode(this.board.snake[0].copy(), this.target))
        let closed = [];
        let currentNode;

        while (open.length > 0) {
            let minIndex = this.getMin(open);
            currentNode = open[minIndex];
            open.splice(minIndex, 1);

            closed.push(currentNode);

            if (currentNode.pos.x === this.target.x && currentNode.pos.y === this.target.y) {
                if(this.dfs(currentNode, this.board.snake.length, this.getBoardAt(currentNode)).cost >= this.board.snake.length) {
                    console.log("path found");
                    return currentNode;
                } else {
                    console.log("path rejected");
                }
            }
            

            let children = currentNode.getAdjacent();
            outer: for (let child of children) {
                if (!this.board.isValidPosition(child.pos)) {
                    continue;
                }

                for (let closedPos of closed) {
                    if (child.equals(closedPos)) {
                        continue outer;
                    }
                }

                child.calculateCosts();
                if (this.board.board[child.pos.y][child.pos.x].value === states["SNAKE"]) {
                    for (let i = 0; i < this.board.snake.length; i++) {
                        if (this.board.snake[i].equals(child.pos, false)) {
                            if (child.cost <= (this.board.snake.length - i))
                                continue outer;
                        }
                    }
                }
                
                for (let openPos of open) {
                    if (child.equals(openPos) && child.estimatedTotalCost >= openPos.estimatedTotalCost) {
                        continue outer;
                    }
                }
                open.push(child);
            }
        }
        console.log("No path found. Stalling.");    
        // return this.dfs(currentNode, this.board.snake.length, this.boardTo2DArray(this.board.board));
        return new AStarNode(applyDirection(this.board.snake[0].pos.copy(), directions["UP"]),this.target);

    };

    makeHead(node) {
        node.parent = undefined;
        console.log(JSON.stringify(node));
        return node;
    }

    calculatePath() {
        let node = this.getPath();
        this.path = [];
        if (node === undefined) {
            console.log("Path is not valid.");
            return false;
        }
        while (node.parent !== undefined) {
            let pathNode = node.pos;
            pathNode.value = states["EMPTY"];
            this.path.splice(0, 0, pathNode);
            node = node.parent;
        }
        return true;
    };
    getMin(positions) {
        let min = 0;
        for (let i = 0; i < positions.length; i++) {
            if (positions[i].estimatedTotalCost === undefined) positions[i].calculateCosts();
            if (positions[i].estimatedTotalCost < positions[min].estimatedTotalCost)
                min = i;
        }
        return min;
    };

    getNextDirection() {
        if (this.path.length <= 0) {
            this.recalculate();
            this.calculatePath();
        }
        
        let currentPos = this.board.snake[0];
        let nextPos = this.path[0]; 
        if (nextPos.y === currentPos.y) {
            if (nextPos.x === currentPos.x + 1)
                return directions["RIGHT"];
            else if (nextPos.x === currentPos.x - 1)
                return directions["LEFT"];

        }
        else if (nextPos.x === currentPos.x) {
            if (nextPos.y=== currentPos.y + 1)
                return directions["DOWN"];
            else if (nextPos.y === currentPos.y - 1)
                return directions["UP"];
        }
        else {
            throw new Error("Invalid path.");
        }
    };

    advancePath() {
        if (this.path.length > 0) {
            this.path.splice(0, 1);
        } else {
            console.log("Failed to advance path: no path")
        }
    };

    recalculate() {
        outer: for(let row of this.board.board) {
            for(let col of row) {
                if (col.value === states["FOOD"]) {
                    this.target = col.copy();
                    break outer;
                }
            }
        }
    }
};



let allContainer = document.getElementById("all-container");
board = new Board(20, 20, 100, document.getElementById("board-container"));
document.addEventListener("keydown", handleKeyPress);

