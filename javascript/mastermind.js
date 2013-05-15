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
    for (var i = 0; i < holes; i++) {
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

function makeGuess(pool, feedback, callback) {
    var min_length = Number.POSITIVE_INFINITY;
    var best_choice = null;
    
    var chunk = 20;
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
    
    doChunk();
    
    /*_.each(pool, function(possible, index, list) {
        var length = filterPool(pool, possible, feedback).length;
        if (min_length > length) {
            min_length = length;
            best_choice = possible;
        }
    });
    
    
    return best_choice;
    */
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

Game.prototype.addFeedback = function(correct, close, callback) {
    var feedback = {"correct": correct, "close": close};
    this.pool = filterPool(this.pool, this.guess, feedback);
    this.guess_number += 1;
    makeGuess(this.pool, feedback, callback);
};






/**
 * UI
 */
 
var colorTable = colorTable || [];
 
/**
 * DISPLAY
 */
function pushPaletteColor(id, color, number) {
    var style = 'style="background-color:' + color + '" ';
    var number_str = (number + 1).toString(10);
    var color_id = 'id="color_' + number.toString() + '" ';
    var html = '<div class="color" ' + color_id + style + '><span>' + number_str + '</span></div>';
    $(id).append(html);
}

/**
 * Courtesy of http://stackoverflow.com/a/202627/646543
 */
function repeat(string, num) {
    var i = 0;
    var output = [];
    for (i; i < num; ++i) {
        output.push(string);
    }
    return output.join('');
}

function pushGuess(guesses_id, guess_number, guess, red, white, wrong) {
    if ((guess_number - 1) >= 1) {
        var feedback = ['<div class="feedback">'];
        feedback.push(repeat('<span class="red"></span>', red));
        feedback.push(repeat('<span class="white"></span>', white));
        feedback.push(repeat('<span class="none"></span>', wrong));
        feedback.push('</div>');
        
        var prev_id = '#guess_' + parseInt(guess_number - 1, 10);
        $(feedback.join('')).appendTo(prev_id).slideDown();
    }
    
    var current_id = 'guess_' + parseInt(guess_number, 10);
    var html = '<div id="' + current_id + '" class="row"></div>'
    $(guesses_id).prepend(html);
    
    var colors = ['<div class="guess">'];
    _.each(guess, function(color, index, list) {
        var style = 'style="background-color:' + colorTable[color] + '" ';
        var color_class = 'color_' + color;
        var span = '<span>' + (color + 1) + '</span>';
        colors.push('<div class="color ' + color_class + '" ' + style + '>' + span + '</div>');
    });
    colors.push('</div>');
    
    $(colors.join('')).prependTo('#' + current_id).hide().slideDown();
    
    $('#guess_' + guess_number).slideDown();
}
 
 
/**
 * Courtesy of http://stackoverflow.com/a/5624139/646543
 */
function toHex(c) {
    var hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}
 
/**
 * Courtesy of http://snipplr.com/view/14590
 */
function hsvToHex(h, s, v) {
    var r, g, b;
    var i;
    var f, p, q, t;

    // Make sure our arguments stay in-range
    h = Math.max(0, Math.min(1, h));
    s = Math.max(0, Math.min(1, s));
    v = Math.max(0, Math.min(1, v));

    h *= 360;

    if (s === 0) {
        // Achromatic (grey)
        r = g = b = v;
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    h /= 60; // sector 0 to 5
    i = Math.floor(h);
    f = h - i; // factorial part of h
    p = v * (1 - s);
    q = v * (1 - s * f);
    t = v * (1 - s * (1 - f));
     
    switch (i) {
    case 0:
        r = v;
        g = t;
        b = p;
        break;
    case 1:
        r = q;
        g = v;
        b = p;
        break;
    case 2:
        r = p;
        g = v;
        b = t;
        break;
    case 3:
        r = p;
        g = q;
        b = v;
        break;
    case 4:
        r = t;
        g = p;
        b = v;
        break;         
    default: // case 5:
        r = v;
        g = p;
        b = q;
    }
    
    r = toHex(Math.round(r * 255));
    g = toHex(Math.round(g * 255));
    b = toHex(Math.round(b * 255));
     
    return '#' + r + g + b;

}
 
/**
 * Algorithm courtesy of http://gamedev.stackexchange.com/a/46469/24514
 * Essentially, the colors are spaced equally in the hsv space using 
 * the equidistribution theorem. The above link explains better.
 */
function generateColors(amount) {
    var PHI = 0.618033988749895;
    var i = 0;
    for (i; i < amount; ++i) {
        if (_.isString(colorTable[i])) {
            continue;
        } else {
            colorTable.push(
                hsvToHex((i * PHI) % 1.0, 
                0.5, 
                Math.sqrt(1.0 - ((i * PHI) % 0.5))));
        }
    }
    
}

function populateColors(id) {
    $(id).empty();
    _.each(colorTable, function(color, index, list) {
        pushPaletteColor(id, color, index);
    });
}


var globalGame = {};

/**
 * TRIGGERS AND BINDING LOGIC
 */
 
function getVal(id) {
    return parseInt($.trim($(id).val()), 10);
}
 
function bind_submit_function(form_id, choices_id, holes_id, palette_id, start_id, 
                              guesses_id, pointer_id, error_id) {
    $(form_id).click(function() {
        var choices = getVal(choices_id);
        var holes = getVal(holes_id);
        
        generateColors(choices);
        populateColors(palette_id);
        
        $(pointer_id).show();
        $(error_id).empty();
        $(guesses_id).empty();
        
        globalGame = new Game(choices, holes);
        
        pushGuess(
            guesses_id, 
            globalGame.guess_number, 
            globalGame.guess,
            0, 0, 0);
        
        $(start_id).slideDown();
    });
}

function bind_feedback_function(feedback_id, guesses_id, red_id, white_id, error_id) {
    $(feedback_id).click(function() {
        
        var red = getVal(red_id);
        var white = getVal(white_id);
        
        if (globalGame.pool.length === 0) {
            $(error_id).text('No more possibilities left. Did you enter the number of red and white pegs correctly?');
            return;
        }
        
        if (globalGame.isGameWon(red)) {
            $(error_id).text("Congrats! You've won!.");
            return;
        }
        
        $('<p>Thinking...</p>').appendTo(error_id).slideDown();
        
        
        var guess = globalGame.addFeedback(red, white, function(guess) {   
            pushGuess(
                guesses_id, 
                globalGame.guess_number, 
                guess,
                red, 
                white, 
                globalGame.holes - red - white);
            
            $(error_id).empty();
            $('#wait').hide();
        });
    });
}

function setupMastermind(form_id, choices_id, holes_id, palette_id, start_id,
                         feedback_id, guesses_id, pointer_id, red_id, white_id, error_id) {
    bind_submit_function(form_id, choices_id, holes_id, palette_id, start_id, 
                         guesses_id, pointer_id, error_id);
    bind_feedback_function(feedback_id, guesses_id, red_id, white_id, error_id);
}

