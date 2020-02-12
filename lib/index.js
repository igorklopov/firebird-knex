// Firebird
// -------
'use strict';

exports.__esModule = true;
var _bind = Function.prototype.bind;
var _slice = Array.prototype.slice;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _lodash = require('lodash');

var _util = require('util');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _knexLibClient = require('knex/lib/client');

var _knexLibClient2 = _interopRequireDefault(_knexLibClient);

var _schemaColumncompiler = require('./schema/columncompiler');

var _schemaColumncompiler2 = _interopRequireDefault(_schemaColumncompiler);

var _queryCompiler = require('./query/compiler');

var _queryCompiler2 = _interopRequireDefault(_queryCompiler);

var _schemaTablecompiler = require('./schema/tablecompiler');

var _schemaTablecompiler2 = _interopRequireDefault(_schemaTablecompiler);

var _transaction = require('./transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _schemaCompiler = require('./schema/compiler');

var _schemaCompiler2 = _interopRequireDefault(_schemaCompiler);

var _formatter = require('./formatter');

var _formatter2 = _interopRequireDefault(_formatter);

function Client_Firebird(config) {
  _knexLibClient2['default'].call(this, config);
}
_inherits2['default'](Client_Firebird, _knexLibClient2['default']);

Object.assign(Client_Firebird.prototype, {

  dialect: 'firebird',

  driverName: 'node-firebird',

  _driver: function _driver() {
    return require('node-firebird');
  },

  schemaCompiler: function schemaCompiler() {
    return new (_bind.apply(_schemaCompiler2['default'], [null].concat([this], _slice.call(arguments))))();
  },

  queryCompiler: function queryCompiler() {
    return new (_bind.apply(_queryCompiler2['default'], [null].concat([this], _slice.call(arguments))))();
  },

  columnCompiler: function columnCompiler() {
    return new (_bind.apply(_schemaColumncompiler2['default'], [null].concat([this], _slice.call(arguments))))();
  },

  tableCompiler: function tableCompiler() {
    return new (_bind.apply(_schemaTablecompiler2['default'], [null].concat([this], _slice.call(arguments))))();
  },
  Transaction: _transaction2['default'],

  // ddl(compiler, pragma, connection) {
  //   return new SQLite3_DDL(this, compiler, pragma, connection);
  // },

  wrapIdentifierImpl: function wrapIdentifierImpl(value) {
    return value !== '*' ? '`' + value.replace(/`/g, '``') + '`' : '*';
  },

  // Get a raw connection from the database, returning a promise with the connection object.
  acquireRawConnection: function acquireRawConnection() {
    var _this = this;

    _assert2['default'](!this._connectionForTransactions);
    return new _bluebird2['default'](function (resolve, reject) {
      _this.driver.attach(_this.connectionSettings, function (error, connection) {
        if (error) return reject(error);
        resolve(connection);
      });
    });
  },

  // Used to explicitly close a connection, called internally by the pool when
  // a connection times out or the pool is shutdown.
  destroyRawConnection: function destroyRawConnection(connection) {
    var close;
    return regeneratorRuntime.async(function destroyRawConnection$(context$1$0) {
      while (1) switch (context$1$0.prev = context$1$0.next) {
        case 0:
          close = _util.promisify(function (cb) {
            return connection.detach(cb);
          });
          return context$1$0.abrupt('return', close());

        case 2:
        case 'end':
          return context$1$0.stop();
      }
    }, null, this);
  },

  // Runs the query on the specified connection, providing the bindings and any
  // other necessary prep work.
  _query: function _query(connection, obj) {
    if (!obj || typeof obj === 'string') obj = { sql: obj };
    return new _bluebird2['default'](function (resolver, rejecter) {
      if (!connection) {
        return rejecter(new Error('Error calling ' + callMethod + ' on connection.'));
      };

      var _obj = obj;
      var sql = _obj.sql;

      sql = sql.split("`").join('"');
      if (!sql) return resolver();
      var c = connection._trasaction || connection;
      c.query(sql, obj.bindings, function (error, rows, fields) {
        if (error) return rejecter(error);
        obj.response = [rows, fields];
        resolver(obj);
      });
    });
  },

  _stream: function _stream(connection, sql, stream) {
    throw new Error('_stream not implemented');
    // const client = this;
    // return new Bluebird(function (resolver, rejecter) {
    //   stream.on('error', rejecter);
    //   stream.on('end', resolver);
    //   return client
    //     ._query(connection, sql)
    //     .then((obj) => obj.response)
    //     .then((rows) => rows.forEach((row) => stream.write(row)))
    //     .catch(function (err) {
    //       stream.emit('error', err);
    //     })
    //     .then(function () {
    //       stream.end();
    //     });
    // });
  },

  // Ensures the response is returned in the same format as other clients.
  processResponse: function processResponse(obj, runner) {
    if (!obj) return;
    var response = obj.response;
    var rows = response[0];
    var fields = response[1];

    this._fixBufferStrings(rows, fields);
    return rows;
  },

  _fixBufferStrings: function _fixBufferStrings(rows, fields) {
    if (!rows) return rows;
    for (var _iterator = rows, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var row = _ref;

      for (var cell in row) {
        var value = row[cell];
        if (Buffer.isBuffer(value)) {
          for (var _iterator2 = fields, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
            var _ref2;

            if (_isArray2) {
              if (_i2 >= _iterator2.length) break;
              _ref2 = _iterator2[_i2++];
            } else {
              _i2 = _iterator2.next();
              if (_i2.done) break;
              _ref2 = _i2.value;
            }

            var field = _ref2;

            if (field.alias === cell && field.type === 448) {
              // SQLVarString
              row[cell] = value.toString();
              break;
            }
          }
        }
      }
    }
  },

  poolDefaults: function poolDefaults() {
    return _lodash.defaults({ min: 1, max: 1 }, _knexLibClient2['default'].prototype.poolDefaults.call(this));
  },

  ping: function ping(resource, callback) {
    resource.query('select 1 from RDB$DATABASE', callback);
  }

});

// formatter() {
//   return new Firebird_Formatter(this, ...arguments);
// },
Client_Firebird.dialect = 'firebird';

exports['default'] = Client_Firebird;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUssQ0FBQyxFQUFFO0FBQzFCLGdDQUFvQixNQUFNLHlIQUFFOzs7Ozs7Ozs7Ozs7Z0JBQWpCLEtBQUs7O0FBQ2QsZ0JBQUksS0FBSyxDQUFDLEtBQUssS0FBSyxJQUFJLElBQ3RCLEtBQUssQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFOztBQUNwQixpQkFBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUM3QixvQkFBTTthQUNQO1dBQ0Y7U0FDRjtPQUNGO0tBQ0Y7R0FDRjs7QUFFRCxjQUFZLEVBQUEsd0JBQUc7QUFDYixXQUFPLGlCQUNMLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQ2xCLDJCQUFPLFNBQVMsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUN6QyxDQUFDO0dBQ0g7O0FBRUQsTUFBSSxFQUFBLGNBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRTtBQUN2QixZQUFRLENBQUMsS0FBSyxDQUFDLDRCQUE0QixFQUFFLFFBQVEsQ0FBQyxDQUFDO0dBQ3hEOztDQU1GLENBQUMsQ0FBQzs7Ozs7QUFFSCxlQUFlLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQzs7cUJBR3RCLGVBQWUiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBGaXJlYmlyZFxyXG4vLyAtLS0tLS0tXHJcbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XHJcblxyXG5pbXBvcnQgaW5oZXJpdHMgZnJvbSAnaW5oZXJpdHMnO1xyXG5pbXBvcnQgeyBpc1VuZGVmaW5lZCwgbWFwLCBkZWZhdWx0cyB9IGZyb20gJ2xvZGFzaCc7XHJcbmltcG9ydCB7IHByb21pc2lmeSB9IGZyb20gJ3V0aWwnO1xyXG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XHJcbmltcG9ydCBDbGllbnQgZnJvbSAna25leC9saWIvY2xpZW50JztcclxuXHJcblxyXG5pbXBvcnQgQ29sdW1uQ29tcGlsZXIgZnJvbSAnLi9zY2hlbWEvY29sdW1uY29tcGlsZXInO1xyXG5pbXBvcnQgUXVlcnlDb21waWxlciBmcm9tICcuL3F1ZXJ5L2NvbXBpbGVyJztcclxuaW1wb3J0IFRhYmxlQ29tcGlsZXIgZnJvbSAnLi9zY2hlbWEvdGFibGVjb21waWxlcic7XHJcbmltcG9ydCBUcmFuc2FjdGlvbiBmcm9tICcuL3RyYW5zYWN0aW9uJztcclxuaW1wb3J0IFNjaGVtYUNvbXBpbGVyIGZyb20gJy4vc2NoZW1hL2NvbXBpbGVyJztcclxuaW1wb3J0IEZpcmViaXJkX0Zvcm1hdHRlciBmcm9tICcuL2Zvcm1hdHRlcic7XHJcblxyXG5cclxuXHJcblxyXG5mdW5jdGlvbiBDbGllbnRfRmlyZWJpcmQoY29uZmlnKSB7XHJcbiAgQ2xpZW50LmNhbGwodGhpcywgY29uZmlnKTtcclxufVxyXG5pbmhlcml0cyhDbGllbnRfRmlyZWJpcmQsIENsaWVudCk7XHJcblxyXG5PYmplY3QuYXNzaWduKENsaWVudF9GaXJlYmlyZC5wcm90b3R5cGUsIHtcclxuXHJcbiAgZGlhbGVjdDogJ2ZpcmViaXJkJyxcclxuXHJcbiAgZHJpdmVyTmFtZTogJ25vZGUtZmlyZWJpcmQnLFxyXG5cclxuICBfZHJpdmVyKCkge1xyXG4gICAgcmV0dXJuIHJlcXVpcmUoJ25vZGUtZmlyZWJpcmQnKTtcclxuICB9LFxyXG5cclxuICBzY2hlbWFDb21waWxlcigpIHtcclxuICAgIHJldHVybiBuZXcgU2NoZW1hQ29tcGlsZXIodGhpcywgLi4uYXJndW1lbnRzKTtcclxuICB9LFxyXG5cclxuICBxdWVyeUNvbXBpbGVyKCkge1xyXG4gICAgcmV0dXJuIG5ldyBRdWVyeUNvbXBpbGVyKHRoaXMsIC4uLmFyZ3VtZW50cyk7XHJcbiAgfSxcclxuXHJcbiAgY29sdW1uQ29tcGlsZXIoKSB7XHJcbiAgICByZXR1cm4gbmV3IENvbHVtbkNvbXBpbGVyKHRoaXMsIC4uLmFyZ3VtZW50cyk7XHJcbiAgfSxcclxuXHJcbiAgdGFibGVDb21waWxlcigpIHtcclxuICAgIHJldHVybiBuZXcgVGFibGVDb21waWxlcih0aGlzLCAuLi5hcmd1bWVudHMpO1xyXG4gIH0sXHJcbiAgVHJhbnNhY3Rpb24sXHJcblxyXG4gIC8vIGRkbChjb21waWxlciwgcHJhZ21hLCBjb25uZWN0aW9uKSB7XHJcbiAgLy8gICByZXR1cm4gbmV3IFNRTGl0ZTNfRERMKHRoaXMsIGNvbXBpbGVyLCBwcmFnbWEsIGNvbm5lY3Rpb24pO1xyXG4gIC8vIH0sXHJcblxyXG4gIHdyYXBJZGVudGlmaWVySW1wbCh2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHZhbHVlICE9PSAnKicgPyBgXFxgJHt2YWx1ZS5yZXBsYWNlKC9gL2csICdgYCcpfVxcYGAgOiAnKic7XHJcbiAgfSxcclxuXHJcblxyXG4gIC8vIEdldCBhIHJhdyBjb25uZWN0aW9uIGZyb20gdGhlIGRhdGFiYXNlLCByZXR1cm5pbmcgYSBwcm9taXNlIHdpdGggdGhlIGNvbm5lY3Rpb24gb2JqZWN0LlxyXG4gIGFjcXVpcmVSYXdDb25uZWN0aW9uKCkge1xyXG4gICAgYXNzZXJ0KCF0aGlzLl9jb25uZWN0aW9uRm9yVHJhbnNhY3Rpb25zKTtcclxuICAgIHJldHVybiBuZXcgQmx1ZWJpcmQoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLmRyaXZlci5hdHRhY2godGhpcy5jb25uZWN0aW9uU2V0dGluZ3MsIChlcnJvciwgY29ubmVjdGlvbikgPT4ge1xyXG4gICAgICAgIGlmIChlcnJvcikgcmV0dXJuIHJlamVjdChlcnJvcik7XHJcbiAgICAgICAgcmVzb2x2ZShjb25uZWN0aW9uKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICAvLyBVc2VkIHRvIGV4cGxpY2l0bHkgY2xvc2UgYSBjb25uZWN0aW9uLCBjYWxsZWQgaW50ZXJuYWxseSBieSB0aGUgcG9vbCB3aGVuXHJcbiAgLy8gYSBjb25uZWN0aW9uIHRpbWVzIG91dCBvciB0aGUgcG9vbCBpcyBzaHV0ZG93bi5cclxuICBhc3luYyBkZXN0cm95UmF3Q29ubmVjdGlvbihjb25uZWN0aW9uKSB7XHJcbiAgICBjb25zdCBjbG9zZSA9IHByb21pc2lmeSgoY2IpID0+IGNvbm5lY3Rpb24uZGV0YWNoKGNiKSk7XHJcbiAgICByZXR1cm4gY2xvc2UoKTtcclxuICB9LFxyXG5cclxuICAvLyBSdW5zIHRoZSBxdWVyeSBvbiB0aGUgc3BlY2lmaWVkIGNvbm5lY3Rpb24sIHByb3ZpZGluZyB0aGUgYmluZGluZ3MgYW5kIGFueVxyXG4gIC8vIG90aGVyIG5lY2Vzc2FyeSBwcmVwIHdvcmsuXHJcbiAgX3F1ZXJ5KGNvbm5lY3Rpb24sIG9iaikge1xyXG4gICAgaWYgKCFvYmogfHwgdHlwZW9mIG9iaiA9PT0gJ3N0cmluZycpIG9iaiA9IHsgc3FsOiBvYmogfTtcclxuICAgIHJldHVybiBuZXcgQmx1ZWJpcmQoZnVuY3Rpb24gKHJlc29sdmVyLCByZWplY3Rlcikge1xyXG4gICAgICBpZiAoIWNvbm5lY3Rpb24pIHtcclxuICAgICAgICByZXR1cm4gcmVqZWN0ZXIoXHJcbiAgICAgICAgICBuZXcgRXJyb3IoYEVycm9yIGNhbGxpbmcgJHtjYWxsTWV0aG9kfSBvbiBjb25uZWN0aW9uLmApXHJcbiAgICAgICAgKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGxldCB7IHNxbCB9ID0gb2JqO1xyXG4gICAgICBzcWwgPSBzcWwuc3BsaXQoXCJgXCIpLmpvaW4oJ1wiJyk7ICAgICAgXHJcbiAgICAgIGlmICghc3FsKSByZXR1cm4gcmVzb2x2ZXIoKTtcclxuICAgICAgY29uc3QgYyA9IGNvbm5lY3Rpb24uX3RyYXNhY3Rpb24gfHwgY29ubmVjdGlvbjtcclxuICAgICAgYy5xdWVyeShzcWwsIG9iai5iaW5kaW5ncywgKGVycm9yLCByb3dzLCBmaWVsZHMpID0+IHtcclxuICAgICAgICBpZiAoZXJyb3IpIHJldHVybiByZWplY3RlcihlcnJvcik7XHJcbiAgICAgICAgb2JqLnJlc3BvbnNlID0gW3Jvd3MsIGZpZWxkc107XHJcbiAgICAgICAgcmVzb2x2ZXIob2JqKTtcclxuICAgICAgfSk7ICAgICAgXHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICBfc3RyZWFtKGNvbm5lY3Rpb24sIHNxbCwgc3RyZWFtKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ19zdHJlYW0gbm90IGltcGxlbWVudGVkJyk7XHJcbiAgICAvLyBjb25zdCBjbGllbnQgPSB0aGlzO1xyXG4gICAgLy8gcmV0dXJuIG5ldyBCbHVlYmlyZChmdW5jdGlvbiAocmVzb2x2ZXIsIHJlamVjdGVyKSB7XHJcbiAgICAvLyAgIHN0cmVhbS5vbignZXJyb3InLCByZWplY3Rlcik7XHJcbiAgICAvLyAgIHN0cmVhbS5vbignZW5kJywgcmVzb2x2ZXIpO1xyXG4gICAgLy8gICByZXR1cm4gY2xpZW50XHJcbiAgICAvLyAgICAgLl9xdWVyeShjb25uZWN0aW9uLCBzcWwpXHJcbiAgICAvLyAgICAgLnRoZW4oKG9iaikgPT4gb2JqLnJlc3BvbnNlKVxyXG4gICAgLy8gICAgIC50aGVuKChyb3dzKSA9PiByb3dzLmZvckVhY2goKHJvdykgPT4gc3RyZWFtLndyaXRlKHJvdykpKVxyXG4gICAgLy8gICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAvLyAgICAgICBzdHJlYW0uZW1pdCgnZXJyb3InLCBlcnIpO1xyXG4gICAgLy8gICAgIH0pXHJcbiAgICAvLyAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gICAgICAgc3RyZWFtLmVuZCgpO1xyXG4gICAgLy8gICAgIH0pO1xyXG4gICAgLy8gfSk7XHJcbiAgfSxcclxuXHJcbiAgLy8gRW5zdXJlcyB0aGUgcmVzcG9uc2UgaXMgcmV0dXJuZWQgaW4gdGhlIHNhbWUgZm9ybWF0IGFzIG90aGVyIGNsaWVudHMuXHJcbiAgcHJvY2Vzc1Jlc3BvbnNlKG9iaiwgcnVubmVyKSB7XHJcbiAgICBpZiAoIW9iaikgcmV0dXJuO1xyXG4gICAgbGV0IHsgcmVzcG9uc2UgfSA9IG9iajtcclxuICAgIFxyXG4gICAgY29uc3QgW3Jvd3MsIGZpZWxkc10gPSByZXNwb25zZTtcclxuICAgIHRoaXMuX2ZpeEJ1ZmZlclN0cmluZ3Mocm93cywgZmllbGRzKTtcclxuICAgIHJldHVybiByb3dzO1xyXG4gIH0sXHJcblxyXG4gIF9maXhCdWZmZXJTdHJpbmdzKHJvd3MsIGZpZWxkcykge1xyXG4gICAgaWYgKCFyb3dzKSByZXR1cm4gcm93cztcclxuICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcclxuICAgICAgZm9yIChjb25zdCBjZWxsIGluIHJvdykge1xyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gcm93W2NlbGxdO1xyXG4gICAgICAgIGlmIChCdWZmZXIuaXNCdWZmZXIodmFsdWUpKSB7XHJcbiAgICAgICAgICBmb3IgKGNvbnN0IGZpZWxkIG9mIGZpZWxkcykge1xyXG4gICAgICAgICAgICBpZiAoZmllbGQuYWxpYXMgPT09IGNlbGwgJiZcclxuICAgICAgICAgICAgICBmaWVsZC50eXBlID09PSA0NDgpIHsgLy8gU1FMVmFyU3RyaW5nXHJcbiAgICAgICAgICAgICAgcm93W2NlbGxdID0gdmFsdWUudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIHBvb2xEZWZhdWx0cygpIHtcclxuICAgIHJldHVybiBkZWZhdWx0cyhcclxuICAgICAgeyBtaW46IDEsIG1heDogMSB9LFxyXG4gICAgICBDbGllbnQucHJvdG90eXBlLnBvb2xEZWZhdWx0cy5jYWxsKHRoaXMpXHJcbiAgICApO1xyXG4gIH0sXHJcblxyXG4gIHBpbmcocmVzb3VyY2UsIGNhbGxiYWNrKSB7XHJcbiAgICByZXNvdXJjZS5xdWVyeSgnc2VsZWN0IDEgZnJvbSBSREIkREFUQUJBU0UnLCBjYWxsYmFjayk7XHJcbiAgfSxcclxuXHJcblxyXG4gIC8vIGZvcm1hdHRlcigpIHtcclxuICAvLyAgIHJldHVybiBuZXcgRmlyZWJpcmRfRm9ybWF0dGVyKHRoaXMsIC4uLmFyZ3VtZW50cyk7XHJcbiAgLy8gfSxcclxufSk7XHJcblxyXG5DbGllbnRfRmlyZWJpcmQuZGlhbGVjdCA9ICdmaXJlYmlyZCc7XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgQ2xpZW50X0ZpcmViaXJkO1xyXG4iXX0=