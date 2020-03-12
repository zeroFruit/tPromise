'use strict';

export function addToTaskQueue(task) {
  setTimeout(task, 0);
}

export function isThenable(value) {
  return typeof value === 'object' && value !== null
    && typeof value.then === 'function';
}