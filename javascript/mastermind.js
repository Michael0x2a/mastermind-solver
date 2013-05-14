/**
 * Courtesy of http://stackoverflow.com/a/12628791/646543
 */
function cartesianProduct(lists) {
    return _.reduce(lists, function(a, b) {
        return _.flatten(_.map(a, function(x) {
            return _.map(b, function(y) {
                return x.concat([y]);
            });
        }), true);
    }, [ [] ]);
}

function generateInitialPool(choices, holes) {
    var numbers = [];
    _.each(_.range(holes), function(element, index, list) {
        numbers.push(_.range(choices));
    });
    return cartesianProduct(numbers);
}

function findCorrect(actual, guess) {
    var output = 0;
    _.each(_.zip(actual, guess), function (element, index, list) {
        if (element[0] === element[1]) {
            output += 1;
        }
    });
    return output;
}

function removeCorrect(actual, guess) {
    var new_actual = [];
    var new_guess = [];
    _.each(_.zip(actual, guess), function(element, index, list) {
        if (element[0] !== element[1]) {
            new_actual.push(element[0]);
            new_guess.push(element[1]);
        }
    });
    return [new_actual, new_guess];
}

function findClose(actual, guess) {
    var temp = removeCorrect(actual, guess);
    actual = temp[0];
    guess = temp[1];

    var close = 0;
    _.each(guess, function (possible, index, list) {
        if (_.contains(actual, possible)) {
            actual.splice(actual.indexOf(possible), 1);
            close += 1;
        }
    });

    return close;
}

function getFeedback(actual, guess) {
    return {
        "correct": findCorrect(actual, guess),
        "close": findClose(actual, guess)
    };
}

function isMatch(guess, feedback, possible) {
    var feedback2 = getFeedback(possible, guess);
    return (feedback.correct === feedback2.correct) && (feedback.close === feedback2.close);
}

function filterPool(pool, guess, feedback) {
    return _.filter(
        pool,
        function(possible) {
            return isMatch(guess, feedback, possible) && (possible !== guess);
        }
    );
}

function makeGuess(pool, feedback) {
    var min_length = Number.POSITIVE_INFINITY;
    var best_choice = null;

    _.each(pool, function(possible, index, list) {
        var length = filterPool(pool, possible, feedback).length;
        if (min_length > length) {
            min_length = length;
            best_choice = possible;
        }
    });
    return best_choice;
}


function Game(choices, holes) {
    this.choices = choices;
    this.holes = holes;
    this.pool = generateInitialPool(this.choices, this.holes);
    this.guess = [0, 0, 1, 1];
}

Game.prototype.isGameWon = function(correct) {
    return correct === this.holes;
};

Game.prototype.addFeedback = function(correct, close) {
    var feedback = {"correct": correct, "close": close};
    this.pool = filterPool(this.pool, this.guess, feedback);
    this.guess = makeGuess(this.pool, feedback);
};

Game.prototype.getNextGuess = function() {
    return this.guess;
};