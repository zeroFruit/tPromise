'use strict';

const assert = require('assert');
const addToTaskQueue = require('./utils').addToTaskQueue;
const isThenable = require('./utils').isThenable;

const PromiseStateEnum = Object.freeze({
  PENDING: 'PENDING',
  FULFILLED: 'FULFILLED',
  REJECTED: 'REJECTED',
});

/**
 * @constructor
 * */
export function Promise() {
  this._fulfillmentTasks = [];
  this._rejectionTasks = [];
  this._promiseResult = undefined;
  this._promiseState = PromiseStateEnum.PENDING;
  this._alreadyResolved = false;
}

Promise.prototype.then = function(onFulfilled, onRejected) {
  const resultPromise = new Promise();

  const fulfillmentTask = function() {
    if (typeof onFulfilled === 'function') {
      this._runReactionSafely(resultPromise, onFulfilled);
    } else {
      resultPromise.resolve(this._promiseResult);
    }
  }.bind(this);
  const rejectionTask = function() {
    if (typeof onRejected === 'function') {
      this._runReactionSafely(resultPromise, onRejected);
    } else {
      resultPromise.reject(this._promiseResult);
    }
  }.bind(this);
  switch (this._promiseState) {
    case PromiseStateEnum.PENDING:
      this._fulfillmentTasks.push(fulfillmentTask);
      this._rejectionTasks.push(rejectionTask);
      break;
    case PromiseStateEnum.FULFILLED:
      addToTaskQueue(fulfillmentTask);
      break;
    case PromiseStateEnum.REJECTED:
      addToTaskQueue(rejectionTask);
      break;
    default:
      throw new Error();
  }
  return resultPromise;
};

Promise.prototype.resolve = function(value) {
  if (this._alreadyResolved) {
    return this;
  }
  this._alreadyResolved = true;

  if (isThenable(value)) {
    value.then(
      function (result) {
        this._doFulfill(result)
      }.bind(this),
      function (error) {
        this._doReject(error)
      }.bind(this)
    )
  } else {
    this._doFulfill(value);
  }
  return this;
};

Promise.prototype.reject = function(error) {
  if (this._alreadyResolved) {
    return this;
  }
  this._alreadyResolved = true;
  this._doReject(error);
  return this;
};

Promise.prototype.catch = function(onRejected) {
  return this.then(null, onRejected);
};

Promise.prototype._doFulfill = function(value) {
  assert.ok(!isThenable());
  this._promiseState = PromiseStateEnum.FULFILLED;
  this._promiseResult = value;
  this._clearAndEnqueueTasks(this._fulfillmentTasks);
};

Promise.prototype._doReject = function(error) {
  this._promiseState = PromiseStateEnum.REJECTED;
  this._promiseResult = error;
  this._clearAndEnqueueTasks(this._rejectionTasks);
};

Promise.prototype._runReactionSafely = function(resultPromise, reaction) {
  try {
    const returned = reaction(this._promiseResult);
    resultPromise.resolve(returned);
  } catch (e) {
    resultPromise.reject(e);
  }
};

Promise.prototype._clearAndEnqueueTasks = function(tasks) {
  this._fulfillmentTasks = undefined;
  this._rejectionTasks = undefined;
  tasks.map(addToTaskQueue);
};
