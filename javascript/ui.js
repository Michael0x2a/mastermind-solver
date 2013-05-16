/**
 * ui.js
 */
 
var colorTable = colorTable || []; 
 
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

function pushFeedback(guesses_id, guess_number, red, white, wrong) {
    if ((guess_number - 1) >= 1) {
        var feedback = ['<div class="feedback">'];
        feedback.push(repeat('<span class="red"></span>', red));
        feedback.push(repeat('<span class="white"></span>', white));
        feedback.push(repeat('<span class="none"></span>', wrong));
        feedback.push('</div>');
        
        var prev_id = '#guess_' + parseInt(guess_number - 1, 10);
        $(feedback.join('')).appendTo(prev_id).slideDown();
    }
}



/**
 * TRIGGERS AND BINDING LOGIC
 */

 
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
 
function getVal(id) {
    return parseInt($.trim($(id).val()), 10);
}

/**
 * Public API
 *
 * ProcessFeedback
 * SetupGame
 */
 
var worker = new Worker('algorithm.js');
worker.postMessage();

var sections = section || {
    submission_form: null,
    choices_input: null,
    holes_input: null,
    palette_section: null,
    


function bind_submit_function(form_id, choices_id, holes_id, palette_id, start_id, 
                              guesses_id, pointer_id, error_id) {
    $(form_id).click(function() {
        var choices = getVal(choices_id);
        var holes = getVal(holes_id);
        
        generateColors(choices);
        populateColors(palette_id);
        
        $(error_id).empty();
        $(guesses_id).empty();
        
        worker.postMessage('SetupGame', {
            choices: choices, 
            holes: holes});
    });
}

function bind_feedback_function(feedback_id, guesses_id, red_id, white_id, error_id) {
    $(feedback_id).click(function() {
        
        var red = getVal(red_id);
        var white = getVal(white_id);
        
        $(error_id).empty();
        $('<p>Thinking...</p>').appendTo(error_id).slideDown();
        
        worker.postMessage('ProcessFeedback', red, white);
    });
}


onMessage('GetFirstMove', function(name, message) {
    $(pointer_id).show();

    pushGuess(
        guesses_id, 
        message.guess_number, 
        message.guess,
        0, 0, 0);
    
    $(start_id).slideDown();
});

onMessage('GetNextMove', function(name, message) {
    pushGuess(
        guesses_id, 
        message.guess_number, 
        message.guess,
        message.correct, // TODO: refactor into separate function.
        message.close, 
        globalGame.holes - red - white);
    
    $(error_id).empty();
    $('#wait').hide();
});
 
onMessage('UpdateCounter', function(name, message) {

});

onMessage('OnError', function(name, message) {

});

onMessage('OnBadInput', function(name, message) {
    
});

onMessage('OnPoolExhausted', function(name, message) {
    $(error_id).text('No more possibilities left. Did you enter the number of red and white pegs correctly?');
});

onMessage('OnVictory', function(name, message) {
    $(error_id).text("Congrats! You've won!.");
});





function setupMastermind(form_id, choices_id, holes_id, palette_id, start_id,
                         feedback_id, guesses_id, pointer_id, red_id, white_id, error_id) {
    bind_submit_function(form_id, choices_id, holes_id, palette_id, start_id, 
                         guesses_id, pointer_id, error_id);
    bind_feedback_function(feedback_id, guesses_id, red_id, white_id, error_id);
}


