import * as assert from 'assert';
import { Promise } from "../promise";

describe('Promise', () => {
  let p;

  beforeEach(() => {
    p = new Promise();
  });

  describe('then() works before and after settlement', () => {
    it('should be enable to resolve before then()', (done) => {
      p.resolve('abc');
      p.then((value) => {
        assert.equal(value, 'abc');
        done();
      });
    });

    it('should be enable resolve after then()', (done) => {
      p.then((value) => {
        assert.equal(value, 'abc');
        done();
      });
      p.resolve('abc');
    });

    it('should be enable to reject before then()', (done) => {
      p.reject('ERROR');
      p.then(null, (value) => {
        assert.equal(value, 'ERROR');
        done();
      });
    });

    it('should be enable to reject after then()', (done) => {
      p.then(null, (value) => {
        assert.equal(value, 'ERROR');
        done();
      });
      p.reject('ERROR');
    });
  });

  describe('promise can settle only once', () => {
    it('should resolve only once', (done) => {
      p.resolve('FIRST');
      p.then((value) => {
        assert.equal(value, 'FIRST');
        p.resolve('SECOND');
        p.then((value) => {
          assert.equal(value, 'FIRST');
          done();
        });
      });
    });

    it('should reject only once', (done) => {
      p.reject('FIRST_ERROR');
      p.then(null, (value) => {
        assert.equal(value, 'FIRST_ERROR');
        p.reject('SECOND_ERROR');
        p.then(null, (value) => {
          assert.equal(value, 'FIRST_ERROR');
          done();
        });
      })
    })
  });

  describe('promise enable simple chaining', () => {
    it('should return fulfilled value via onFulfilled reaction', (done) => {
      p.resolve();
      p
        .then((value1) => {
          assert.equal(value1, undefined);
          return 123;
        })
        .then((value2) => {
          assert.equal(value2, 123);
          done();
        });
    });

    it('should return fulfilled value via onRejected reaction', (done) => {
      p.reject();
      p
        .catch((reason) => {
          assert.equal(reason, undefined);
          return 123;
        })
        .then((value) => {
          assert.equal(value, 123);
          done();
        });
    });

    it('should pass catch() when fulfilled value is returned', (done) => {
      p.resolve('a');
      p
        .then((value1) => {
          assert.equal(value1, 'a');
          return 'b';
        })
        .catch((reason) => {
          assert.fail();
        })
        .then((value2) => {
          assert.equal(value2, 'b');
          done();
        })
    });
  });

  describe('flattening promises', () => {
    it('should resolve Promise when returned Promise is resolved', (done) => {
      const p1 = new Promise();
      const p2 = new Promise();

      p1.resolve(p2);
      p2.resolve(123);

      p1.then((value) => {
        assert.equal(value, 123);
        done();
      });
    });

    it('should reject Promise when returned Promise is rejected', done => {
      const p1 = new Promise();
      const p2 = new Promise();

      p1.resolve(p2);
      p2.reject(new Error('ERROR'));

      p1.then(value => {
        assert.fail();
      })
      .catch(error => {
        assert.equal(error.message, 'ERROR');
        done();
      });
    });
  });

  describe('catch exceptions thrown in reactions', () => {
    it('should reject via onFulfilled', (done) => {
      let ERROR;
      p.resolve();
      p
        .then((value) => {
          assert.equal(value, undefined);
          throw ERROR = new Error();
        })
        .catch((reason) => {
          assert.equal(reason, ERROR);
          done();
        })
    });

    it('should reject via onRejected', (done) => {
      let ERROR;
      p.reject();
      p
        .catch((reason1) => {
          assert.equal(reason1, undefined);
          throw ERROR = new Error();
        })
        .catch((reason2) => {
          assert.equal(reason2, ERROR);
          done();
        });
    });
  });
});
