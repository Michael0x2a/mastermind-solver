# README: mastermind-solver

## About

This is a short script meant to help you solve mastermind games. 
You first start the program, specify the number of colors there are, and the number of holes
available. You then tell the program the number of red and white pegs you recieved, and 
it'll give you a combination to guess.

Just for kicks, I'm writing a version of the algorithm in several different programming 
languages, mostly as an exercise to help me be more familiar with new programming languages.

## Versions available:

### Python

The Python script is the basic reference implementation for the core algorithm. It operates
as a simple console app. 

Usage:

    python solve_mastermind.py
    
### Javascript + HTML5

I focused primarily on writing a useable visual interface in this implementation. The core
algorithm is separated into a web worker, and communicates with the main interface via websockets,
to prevent the browser from ever freezing up. It could probably use a bit more work so it 
feels more idiomatic. 

A working demo can be found on [my website][1]. Alternatively, simply open `index.html`. 

[1]: http://projects.michael0x2a.com/mastermind_solver

### Java

Currently in-progress

