'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _knexLibTransaction = require('knex/lib/transaction');

var _knexLibTransaction2 = _interopRequireDefault(_knexLibTransaction);

var debug = require('debug')('knex:tx');

function Transaction_Firebird() {
  _knexLibTransaction2['default'].apply(this, arguments);
}
_inherits2['default'](Transaction_Firebird, _knexLibTransaction2['default']);

Object.assign(Transaction_Firebird.prototype, {

  begin: function begin(conn) {
    var _this = this;

    return new Promise(function (resolve, reject) {
      conn.transaction(_this.client.driver.ISOLATION_READ_COMMITED, function (error, transaction) {
        if (error) return reject(error);
        conn._transaction = transaction;
        resolve();
      });
    });
  },

  savepoint: function savepoint() {
    throw new Error('savepoints not implemented');
  },

  commit: function commit(conn, value) {
    return this.query(conn, 'commit', 1, value);
  },

  release: function release() {
    throw new Error('releasing savepoints not implemented');
  },

  rollback: function rollback(conn, error) {
    return this.query(conn, 'rollback', 2, error);
  },

  rollbackTo: function rollbackTo() {
    throw new Error('rolling back to savepoints not implemented');
  },

  query: function query(conn, method, status, value) {
    var _this2 = this;

    var q = new Promise(function (resolve, reject) {
      var transaction = conn._transaction;
      delete conn._transaction;
      transaction[method](function (error) {
        if (error) return reject(error);
        resolve();
      });
    })['catch'](function (error) {
      status = 2;
      value = error;
      _this2._completed = true;
      debug('%s error running transaction query', _this2.txid);
    }).tap(function () {
      if (status === 1) _this2._resolver(value);
      if (status === 2) _this2._rejecter(value);
    });
    if (status === 1 || status === 2) {
      this._completed = true;
    }
    return q;
  }

});

exports['default'] = Transaction_Firebird;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q0FBQyxFQUFFO0FBQ2hDLFVBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0tBQ3hCO0FBQ0QsV0FBTyxDQUFDLENBQUM7R0FDVjs7Q0FFRixDQUFDLENBQUM7O3FCQUVZLG9CQUFvQiIsImZpbGUiOiJ0cmFuc2FjdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBpbmhlcml0cyBmcm9tICdpbmhlcml0cyc7XHJcbmNvbnN0IGRlYnVnID0gcmVxdWlyZSgnZGVidWcnKSgna25leDp0eCcpO1xyXG5pbXBvcnQgVHJhbnNhY3Rpb24gZnJvbSAna25leC9saWIvdHJhbnNhY3Rpb24nO1xyXG5cclxuXHJcbmZ1bmN0aW9uIFRyYW5zYWN0aW9uX0ZpcmViaXJkICgpIHtcclxuICBUcmFuc2FjdGlvbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG59XHJcbmluaGVyaXRzKFRyYW5zYWN0aW9uX0ZpcmViaXJkLCBUcmFuc2FjdGlvbik7XHJcblxyXG5PYmplY3QuYXNzaWduKFRyYW5zYWN0aW9uX0ZpcmViaXJkLnByb3RvdHlwZSwge1xyXG5cclxuICBiZWdpbihjb25uKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICBjb25uLnRyYW5zYWN0aW9uKHRoaXMuY2xpZW50LmRyaXZlci5JU09MQVRJT05fUkVBRF9DT01NSVRFRCwgKGVycm9yLCB0cmFuc2FjdGlvbikgPT4ge1xyXG4gICAgICAgIGlmIChlcnJvcikgcmV0dXJuIHJlamVjdChlcnJvcik7XHJcbiAgICAgICAgY29ubi5fdHJhbnNhY3Rpb24gPSB0cmFuc2FjdGlvbjtcclxuICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgXHJcblxyXG4gIHNhdmVwb2ludCgpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignc2F2ZXBvaW50cyBub3QgaW1wbGVtZW50ZWQnKTtcclxuICB9LFxyXG5cclxuICBjb21taXQoY29ubiwgdmFsdWUpIHtcclxuICAgIHJldHVybiB0aGlzLnF1ZXJ5KGNvbm4sICdjb21taXQnLCAxLCB2YWx1ZSk7XHJcbiAgfSxcclxuXHJcbiAgcmVsZWFzZSgpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcigncmVsZWFzaW5nIHNhdmVwb2ludHMgbm90IGltcGxlbWVudGVkJyk7XHJcbiAgfSxcclxuXHJcbiAgcm9sbGJhY2soY29ubiwgZXJyb3IpIHtcclxuICAgIHJldHVybiB0aGlzLnF1ZXJ5KGNvbm4sICdyb2xsYmFjaycsIDIsIGVycm9yKTtcclxuICB9LFxyXG5cclxuICByb2xsYmFja1RvKCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdyb2xsaW5nIGJhY2sgdG8gc2F2ZXBvaW50cyBub3QgaW1wbGVtZW50ZWQnKTtcclxuICB9LFxyXG5cclxuICBxdWVyeShjb25uLCBtZXRob2QsIHN0YXR1cywgdmFsdWUpIHtcclxuICAgIGNvbnN0IHEgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSBjb25uLl90cmFuc2FjdGlvbjtcclxuICAgICAgICBkZWxldGUgY29ubi5fdHJhbnNhY3Rpb247XHJcbiAgICAgICAgdHJhbnNhY3Rpb25bbWV0aG9kXSgoZXJyb3IpID0+IHtcclxuICAgICAgICAgIGlmIChlcnJvcikgcmV0dXJuIHJlamVjdChlcnJvcik7XHJcbiAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pXHJcbiAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcclxuICAgICAgICBzdGF0dXMgPSAyO1xyXG4gICAgICAgIHZhbHVlID0gZXJyb3I7XHJcbiAgICAgICAgdGhpcy5fY29tcGxldGVkID0gdHJ1ZTtcclxuICAgICAgICBkZWJ1ZygnJXMgZXJyb3IgcnVubmluZyB0cmFuc2FjdGlvbiBxdWVyeScsIHRoaXMudHhpZCk7XHJcbiAgICAgIH0pXHJcbiAgICAgIC50YXAoKCkgPT4ge1xyXG4gICAgICAgIGlmIChzdGF0dXMgPT09IDEpIHRoaXMuX3Jlc29sdmVyKHZhbHVlKTtcclxuICAgICAgICBpZiAoc3RhdHVzID09PSAyKSB0aGlzLl9yZWplY3Rlcih2YWx1ZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgaWYgKHN0YXR1cyA9PT0gMSB8fCBzdGF0dXMgPT09IDIpIHtcclxuICAgICAgdGhpcy5fY29tcGxldGVkID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIHJldHVybiBxO1xyXG4gIH1cclxuXHJcbn0pO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgVHJhbnNhY3Rpb25fRmlyZWJpcmQ7XHJcbiJdfQ==