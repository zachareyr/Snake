var AStarNode = /** @class */ (function () {
    function AStarNode(pos, target, parent) {
        if (parent === void 0) { parent = undefined; }
        this.pos = pos;
        this.target = target;
        this.parent = parent;
        this.calculateCosts();
    }
    AStarNode.prototype.calculateCosts = function (origin) {
        if (origin === void 0) { origin = undefined; }
        // Trace path back if the origin is not supplied
        if (origin === undefined)
            origin = this.getOrigin();
        this.cost = (this.parent !== undefined ? this.parent.cost + 1 : 1);
        this.estimatedEndCost = this.getEuclideanDistance();
        this.estimatedTotalCost = this.cost + this.estimatedEndCost;
    };
    AStarNode.prototype.getEuclideanDistance = function (target) {
        if (target === void 0) { target = undefined; }
        if (target === undefined)
            target = this.target;
        return Math.sqrt((this.pos.y - target.y) * (this.pos.y - target.y) + (this.pos.x - target.x) * (this.pos.x - target.x));
    };
    AStarNode.prototype.equals = function (other) {
        return (this.pos.equals(other.pos, false));
    };
    AStarNode.prototype.getOrigin = function () {
        var origin = this;
        while ((origin === null || origin === void 0 ? void 0 : origin.parent) !== undefined) {
            origin = origin === null || origin === void 0 ? void 0 : origin.parent;
        }
        return origin;
    };
    AStarNode.prototype.getAdjacent = function () {
        var children = [];
        for (var _i = 0, _a = [[-1, 0], [1, 0], [0, 1], [0, -1]]; _i < _a.length; _i++) {
            var offset = _a[_i];
            children.push(new AStarNode(applyDirection(this.pos, offset), this.target, this));
        }
        return children;
    };
    return AStarNode;
}());
var AStar = /** @class */ (function () {
    function AStar(board) {
        this.board = board;
        this.path = [];
        for (var _i = 0, _a = board.board; _i < _a.length; _i++) {
            var row = _a[_i];
            for (var _b = 0, row_1 = row; _b < row_1.length; _b++) {
                var col = row_1[_b];
                console.log(col.value);
                if (col.value === states["FOOD"]) {
                    this.target = col.copy();
                }
            }
        }
    }
    AStar.prototype.getPath = function () {
        var open = [new AStarNode(this.board.snake[0].copy(), this.target)];
        var closed = [];
        var currentNode;
        while (open.length > 0) {
            currentNode = this.getMin(open);
            if (open.indexOf(currentNode) === -1)
                console.error("oopsy i made a fucky-wucky");
            open.splice(open.indexOf(currentNode), 1);
            if (currentNode.pos.equals(this.target)) {
                return currentNode;
            }
            var children = currentNode.getAdjacent();
            outer: for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
                var child = children_1[_i];
                if (!this.board.isValidPosition(child))
                    continue;
                if (this.board[child.pos.y][child.pos.x] === states["SNAKE"]) {
                    for (var i = 0; i < this.board.snake.length; i++) {
                        if (this.board.snake[i].equals(child, false) && (child.cost <= (this.board.snake.length - i)))
                            continue outer;
                    }
                }
                for (var _a = 0, closed_1 = closed; _a < closed_1.length; _a++) {
                    var closedPos = closed_1[_a];
                    if (child.equals(closedPos))
                        continue outer;
                }
                for (var _b = 0, open_1 = open; _b < open_1.length; _b++) {
                    var openPos = open_1[_b];
                    if (child.equals(openPos) && child.estimatedTotalCost >= openPos.estimatedTotalCost)
                        continue outer;
                }
                open.push(child);
            }
        }
        console.error("No valid path.");
    };
    AStar.prototype.calculatePath = function () {
        var node = this.getPath();
        if (node === undefined)
            return false;
        while (node !== undefined) {
            this.path.splice(0, 0, node.pos);
            node = node.parent;
        }
        return true;
    };
    AStar.prototype.getMin = function (positions) {
        var min = positions[0];
        for (var _i = 0, positions_1 = positions; _i < positions_1.length; _i++) {
            var position = positions_1[_i];
            if (position.estimatedTotalCost < min.estimatedTotalCost)
                min = position;
        }
        return min;
    };
    AStar.prototype.getNextDirection = function () {
        var currentPos = this.board.snake[0];
        var nextPos = this.path[0];
        if (nextPos.y === currentPos.y) {
            if (nextPos.x + 1 === currentPos.x)
                return directions["DOWN"];
            else if (nextPos.x - 1 === currentPos.x)
                return directions["UP"];
            else {
                this.getPath();
                this.getNextDirection();
            }
        }
        else if (nextPos.x === currentPos.x) {
            if (nextPos.y + 1 === currentPos.y)
                return directions["DOWN"];
            else if (nextPos.y - 1 === currentPos.y)
                return directions["UP"];
            else {
                this.getPath();
                this.getNextDirection();
            }
        }
        else
            throw new Error("Invalid path.");
        this.advancePath();
    };
    AStar.prototype.advancePath = function () {
        this.path.splice(0, 1);
    };
    return AStar;
}());
