#!/usr/bin/env python
'''
Mastermind solver

Given feedback from a game of mastermind, makes guesses to try and
determine the answer.
'''

import itertools
import collections


Feedback = collections.namedtuple('Feedback', ['correct', 'close'])


def generate_initial_pool(choices, holes):
    '''Generates the initial set of possible answers.'''
    return list(itertools.product(*[range(choices) for _ in xrange(holes)]))


def find_correct(actual, guess):
    '''Finds the sum of all correct matches.'''
    return sum([1 for (a, b) in zip(actual, guess) if a == b])


def remove_correct(actual, guess):
    '''Removes all correct matches from two "rows"'''
    actual2 = [a for (a, b) in zip(actual, guess) if a != b]
    guess2 = [b for (a, b) in zip(actual, guess) if a != b]
    return actual2, guess2


def find_close(actual, guess):
    '''Finds the sum of all close matches.'''
    actual, guess = remove_correct(actual, guess)

    close = 0
    for possible in guess:
        if possible in actual:
            del actual[actual.index(possible)]
            close += 1
    return close


def get_feedback(actual, guess):
    '''Compares two "rows" to each other and returns feedback.'''
    return Feedback(find_correct(actual, guess), find_close(actual, guess))


def is_match(guess, feedback, possible):
    '''Returns true if hypothetical could be the answer given the feedback
    and the guess'''
    return feedback == get_feedback(possible, guess)


def filter_pool(pool, guess, feedback):
    '''Filters through the pool of possibilities and removes ones which
    couldn't possibly be the answer.'''
    for possible in pool:
        if is_match(guess, feedback, possible) and (possible != guess):
            yield possible


def make_guess(pool, feedback):
    '''Makes an educated guess between the pool of possibilities and
    the user feedback.'''
    min_length = float('infinity')
    best_choice = None
    for possible in pool:
        length = len(list(filter_pool(pool, possible, feedback)))
        if min_length > length:
            min_length = length
            best_choice = possible
    return best_choice


def play():
    '''Plays a complete game of minesweeper, and collects user input.'''
    choices = int(raw_input("Number of numbers? "), 10)
    holes = int(raw_input("Number of spaces?  "), 10)
    print ''

    pool = generate_initial_pool(choices, holes)
    guess = (0, 0, 1, 1)
    while True:
        print "Try this: {0}".format(guess)
        correct = int(raw_input("    # Red pegs?   "))
        close = int(raw_input("    # White pegs? "))

        feedback = Feedback(correct, close)
        if feedback.correct == holes:
            break
        pool = list(filter_pool(pool, guess, feedback))
        print "{0} possible choices left. Thinking...\n".format(len(pool))

        guess = make_guess(pool, feedback)
    print "\nYou win!"


if __name__ == '__main__':
    play()
