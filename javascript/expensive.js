/**
 * expensive.js
 * 
 * This file is meant to be run as a thread/webworker.
 */

importScripts('underscore-min.js');
importScripts('algorithm.js');

var currentGame = currentGame || {};
var workerEvents = workerEvents || {};


/**
 * Convenience functions
 */
 
self.addEventListener('message', function(message) {
    message = message.data;
    var callback = workerEvents[message.name];
    if (!_.isFunction(callback)) {
        sendMessage('OnError', {reason: message.name});
        return;
    }
    callback(message.name, message);
}); 
    
function onMessage(name, callback) {
    workerEvents[name] = callback;
}

function sendMessage(name, message) {
    message.name = name;
    self.postMessage(message);
}


bindAlgorithmCalls(onMessage, sendMessage);
