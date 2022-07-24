import { Position, applyDirection, states, Board } from "./scripts";

class AStarNode {
    pos: Position;
    parent: AStarNode | undefined;
    target: Position;
    cost: number;
    estimatedEndCost: number;
    estimatedTotalCost: number;
    
    constructor(pos: Position, target: Position, parent: AStarNode | undefined = undefined) {
        this.pos = pos;
        this.target = target;
        this.parent = parent;
        this.calculateCosts();
    }

    calculateCosts(origin: AStarNode | undefined = undefined) {
        // Trace path back if the origin is not supplied
        if (origin === undefined) origin = this.getOrigin();
        this.cost = (this.parent !== undefined ? this.parent.cost + 1 : 1);
        this.estimatedEndCost = this.getEuclideanDistance();
        this.estimatedTotalCost = this.cost + this.estimatedEndCost;
    }

    getEuclideanDistance(target: Position | undefined = undefined): number {
        if(target === undefined) target = this.target;
        return Math.sqrt((this.pos.y-target.y)*(this.pos.y - target.y) + (this.pos.x - target.x)*(this.pos.x - target.x))
    }

    equals(other: AStarNode): boolean {
        return (this.pos.equals(other.pos, false));
    }

    getOrigin(): AStarNode {
        let origin: AStarNode | undefined = this;
        while(origin?.parent !== undefined) {
            origin = origin?.parent
        }
        return origin;
    }

    getAdjacent() {
        let children: AStarNode[] | undefined = [];
        for (let offset of [[-1, 0], [1, 0], [0, 1], [0, -1]]) {
            children.push(new AStarNode(applyDirection(this.pos, offset), this.target, this));
        }
        return children;
    }

}

class AStar {
    board: Board;
    path: Position[];
    target: Position;

    constructor(board: Board) {
        this.board = board;
        this.path = [];
        for (let row of board.board) {
            for(let col of row) {
                console.log(col.value);
                if(col.value === states["FOOD"]) {
                    this.target = col.copy();
                }
            }
        }
    }

    getPath() {
        let open: AStarNode[] = [new AStarNode(this.board.snake[0].copy(), this.target)];
        let closed: AStarNode[] = []; 
        let currentNode: AStarNode;
        while (open.length > 0) {
            currentNode = this.getMin(open);
            if (open.indexOf(currentNode) === -1) console.error("oopsy i made a fucky-wucky");
            open.splice(open.indexOf(currentNode), 1);

            if (currentNode.pos.equals(this.target)) {
                return currentNode;
            }

            let children: AStarNode[] = currentNode.getAdjacent();
            outer: for(let child of children) {
                if (!this.board.isValidPosition(child)) continue;
                if (this.board[child.pos.y][child.pos.x] === states["SNAKE"]) {
                    for (let i = 0; i < this.board.snake.length; i++) {
                        if(this.board.snake[i].equals(child, false) && (child.cost <= (this.board.snake.length - i))) continue outer;
                    }
                }

                for (let closedPos of closed) {
                    if (child.equals(closedPos)) continue outer;
                } 

                for(let openPos of open) {
                    if (child.equals(openPos) && child.estimatedTotalCost >= openPos.estimatedTotalCost) continue outer;
                }
                open.push(child);
            } 
        }
        console.error("No valid path.");
    }

    calculatePath() {
        let node: AStarNode | undefined = this.getPath();
        if(node === undefined) return false;
        while(node !== undefined) {
            this.path.splice(0, 0, node.pos);
            node = node.parent;
        }
        return true;
    }

    getMin(positions: AStarNode[]): AStarNode {
        let min: AStarNode = positions[0];
        for(let position of positions) {
            if(position.estimatedTotalCost < min.estimatedTotalCost) min = position;
        }
        return min;
    }

    getNextDirection() {
        let currentPos: Position = this.board.snake[0];
        let nextPos: Position = this.path[0];
        if (nextPos.y === currentPos.y) {
            if(nextPos.x + 1 === currentPos.x) return directions["DOWN"];
            else if (nextPos.x - 1 === currentPos.x) return directions["UP"];
            else {
                this.getPath();
                this.getNextDirection();
            }
        }
        else if (nextPos.x === currentPos.x) {
            if(nextPos.y + 1 === currentPos.y) return directions["DOWN"];
            else if (nextPos.y - 1 === currentPos.y) return directions["UP"];
            else {
                this.getPath();
                this.getNextDirection();
            }
        }
        else throw new Error("Invalid path.");

        this.advancePath();
    }

    advancePath() {
        this.path.splice(0, 1);
    }
}