/**
 * algorithms.js
 * 
 * This file is meant to be run as a thread/webworker.
 */
var _ = {};


/**
 * Internals
 */
 
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

function generateInitialGuess(holes) {
    var guess = [];
    var mean = holes / 2;
    var i = 0;
    for (i; i < holes; i++) {
        if (i < mean) {
            guess.push(0);
        } else {
            guess.push(1);
        }
    }
    return guess;
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

/**
 * I've broken this operation up into chunks, since they take up
 * a lot of time, freezing the OI. See http://stackoverflow.com/a/10344560/646543
 */
function filterPool(pool, guess, feedback, callback) {
    var output = [];
    
    _.each(pool, function(possible, index, list) {
        if (isMatch(guess, feedback, possible) && (possible !== guess)) {
            output.push(possible);
        }
    });
    return output;
    /*return _.filter(
        pool,
        function(possible) {
            return isMatch(guess, feedback, possible) && (possible !== guess);
        }
    );*/
}

function makeGuess(pool, feedback) {
    var min_length = Number.POSITIVE_INFINITY;
    var best_choice = null;
    
    /*var chunk = 20;
    var index = 0;
    
    function doChunk() {
        var count = chunk;
        while (count-- && index < pool.length) {
            var possible = pool[index];
            var length = filterPool(pool, possible, feedback).length;
            if (min_length > length) {
                min_length = length;
                best_choice = possible;
            }
            ++index;
        }
        if (index < pool.length) {
            setTimeout(doChunk, 0.3);
        }
        if (index === pool.length) {
            this.guess = best_choice;
            callback(best_choice);
        }
    }
    
    doChunk();*/
    
    _.each(pool, function(possible, index, list) {
        var length = filterPool(pool, possible, feedback).length;
        if (min_length > length) {
            min_length = length;
            best_choice = possible;
        }
    });
    
    
    return best_choice;
}


/**
 * Encapsulation of the algorithm into an object.
 */
function Game(choices, holes) {
    this.choices = choices;
    this.holes = holes;
    this.pool = generateInitialPool(this.choices, this.holes);
    this.guess = generateInitialGuess(this.holes);
    this.guess_number = 1;
}

Game.prototype.isGameWon = function(correct) {
    return correct === this.holes;
};

Game.prototype.addFeedback = function(correct, close) {
    var feedback = {"correct": correct, "close": close};
    this.pool = filterPool(this.pool, this.guess, feedback);
    this.guess_number += 1;
    this.guess = makeGuess(this.pool, feedback);
    return this.guess;
};



/**
 * Convenience functions
 */
function onMessage(name, callback) {
    self.addEventListener(name, function(message) {
        callback(name, message);
    });
}

function sendMessage(name, message) {
    self.postMessage(message);
}


var currentGame = currentGame || {};

/**
 * Public API
 */
 
onMessage('SetupGame', function(name, message) {
    currentGame = Game(message.choices, message.holes);
    
    sendMessage('GetFirstMove', {
        guess: currentGame.guess,
        guess_number: currentGame.guess_number
    });
});

onMessage('ProcessFeedback', function(name, message) {
    if (currentGame.pool.length === 0) {
        sendMessage('OnPoolExhausted', {});
    } else if (message.correct === currentGame.holes) {
        sendMessage('OnBadInput', {
            reason: 'already_won'
        });
    }

    var guess = currentGame.addFeedback(message.correct, message.close);
    
    sendMessage('GetNextMove', {
        guess: guess,
        guess_number: currentGame.guess_number,
        pool_length: currentGame.pool.length,
        holes: currentGame.holes
    });
    
    if (currentGame.pool.length === 1) {
        sendMessage('OnVictory', {});
    }
});


/**
 * Events which will be sent.
 *
 * GetFirstMove
 * GetNextMove
 * UpdateCounter
 *
 * OnError
 * OnBadInput        // a more specific error
 * OnPoolExhausted   // a more specific error
 * OnVictory
 */
 
