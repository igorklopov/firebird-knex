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
  QueryCompiler: _queryCompiler2['default'],
  // queryCompiler() {
  //   return new QueryCompiler(this, ...arguments);
  // },

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Ozs7Ozs7O2dCQUFqQixLQUFLOztBQUNkLGdCQUFJLEtBQUssQ0FBQyxLQUFLLEtBQUssSUFBSSxJQUN0QixLQUFLLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRTs7QUFDcEIsaUJBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDN0Isb0JBQU07YUFDUDtXQUNGO1NBQ0Y7T0FDRjtLQUNGO0dBQ0Y7O0FBRUQsY0FBWSxFQUFBLHdCQUFHO0FBQ2IsV0FBTyxpQkFDTCxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUNsQiwyQkFBTyxTQUFTLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FDekMsQ0FBQztHQUNIOztBQUVELE1BQUksRUFBQSxjQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUU7QUFDdkIsWUFBUSxDQUFDLEtBQUssQ0FBQyw0QkFBNEIsRUFBRSxRQUFRLENBQUMsQ0FBQztHQUN4RDs7Q0FNRixDQUFDLENBQUM7Ozs7O0FBRUgsZUFBZSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUM7O3FCQUd0QixlQUFlIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gRmlyZWJpcmRcclxuLy8gLS0tLS0tLVxyXG5pbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xyXG5cclxuaW1wb3J0IGluaGVyaXRzIGZyb20gJ2luaGVyaXRzJztcclxuaW1wb3J0IHsgaXNVbmRlZmluZWQsIG1hcCwgZGVmYXVsdHMgfSBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgeyBwcm9taXNpZnkgfSBmcm9tICd1dGlsJztcclxuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xyXG5pbXBvcnQgQ2xpZW50IGZyb20gJ2tuZXgvbGliL2NsaWVudCc7XHJcblxyXG5cclxuaW1wb3J0IENvbHVtbkNvbXBpbGVyIGZyb20gJy4vc2NoZW1hL2NvbHVtbmNvbXBpbGVyJztcclxuaW1wb3J0IFF1ZXJ5Q29tcGlsZXIgZnJvbSAnLi9xdWVyeS9jb21waWxlcic7XHJcbmltcG9ydCBUYWJsZUNvbXBpbGVyIGZyb20gJy4vc2NoZW1hL3RhYmxlY29tcGlsZXInO1xyXG5pbXBvcnQgVHJhbnNhY3Rpb24gZnJvbSAnLi90cmFuc2FjdGlvbic7XHJcbmltcG9ydCBTY2hlbWFDb21waWxlciBmcm9tICcuL3NjaGVtYS9jb21waWxlcic7XHJcbmltcG9ydCBGaXJlYmlyZF9Gb3JtYXR0ZXIgZnJvbSAnLi9mb3JtYXR0ZXInO1xyXG5cclxuXHJcblxyXG5cclxuZnVuY3Rpb24gQ2xpZW50X0ZpcmViaXJkKGNvbmZpZykge1xyXG4gIENsaWVudC5jYWxsKHRoaXMsIGNvbmZpZyk7XHJcbn1cclxuaW5oZXJpdHMoQ2xpZW50X0ZpcmViaXJkLCBDbGllbnQpO1xyXG5cclxuT2JqZWN0LmFzc2lnbihDbGllbnRfRmlyZWJpcmQucHJvdG90eXBlLCB7XHJcblxyXG4gIGRpYWxlY3Q6ICdmaXJlYmlyZCcsXHJcblxyXG4gIGRyaXZlck5hbWU6ICdub2RlLWZpcmViaXJkJyxcclxuXHJcbiAgX2RyaXZlcigpIHtcclxuICAgIHJldHVybiByZXF1aXJlKCdub2RlLWZpcmViaXJkJyk7XHJcbiAgfSxcclxuXHJcbiAgc2NoZW1hQ29tcGlsZXIoKSB7XHJcbiAgICByZXR1cm4gbmV3IFNjaGVtYUNvbXBpbGVyKHRoaXMsIC4uLmFyZ3VtZW50cyk7XHJcbiAgfSxcclxuICBRdWVyeUNvbXBpbGVyLFxyXG4gIC8vIHF1ZXJ5Q29tcGlsZXIoKSB7XHJcbiAgLy8gICByZXR1cm4gbmV3IFF1ZXJ5Q29tcGlsZXIodGhpcywgLi4uYXJndW1lbnRzKTtcclxuICAvLyB9LFxyXG5cclxuICBjb2x1bW5Db21waWxlcigpIHtcclxuICAgIHJldHVybiBuZXcgQ29sdW1uQ29tcGlsZXIodGhpcywgLi4uYXJndW1lbnRzKTtcclxuICB9LFxyXG5cclxuICB0YWJsZUNvbXBpbGVyKCkge1xyXG4gICAgcmV0dXJuIG5ldyBUYWJsZUNvbXBpbGVyKHRoaXMsIC4uLmFyZ3VtZW50cyk7XHJcbiAgfSxcclxuICBUcmFuc2FjdGlvbixcclxuXHJcbiAgLy8gZGRsKGNvbXBpbGVyLCBwcmFnbWEsIGNvbm5lY3Rpb24pIHtcclxuICAvLyAgIHJldHVybiBuZXcgU1FMaXRlM19EREwodGhpcywgY29tcGlsZXIsIHByYWdtYSwgY29ubmVjdGlvbik7XHJcbiAgLy8gfSxcclxuXHJcbiAgd3JhcElkZW50aWZpZXJJbXBsKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdmFsdWUgIT09ICcqJyA/IGBcXGAke3ZhbHVlLnJlcGxhY2UoL2AvZywgJ2BgJyl9XFxgYCA6ICcqJztcclxuICB9LFxyXG5cclxuXHJcbiAgLy8gR2V0IGEgcmF3IGNvbm5lY3Rpb24gZnJvbSB0aGUgZGF0YWJhc2UsIHJldHVybmluZyBhIHByb21pc2Ugd2l0aCB0aGUgY29ubmVjdGlvbiBvYmplY3QuXHJcbiAgYWNxdWlyZVJhd0Nvbm5lY3Rpb24oKSB7XHJcbiAgICBhc3NlcnQoIXRoaXMuX2Nvbm5lY3Rpb25Gb3JUcmFuc2FjdGlvbnMpO1xyXG4gICAgcmV0dXJuIG5ldyBCbHVlYmlyZCgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRoaXMuZHJpdmVyLmF0dGFjaCh0aGlzLmNvbm5lY3Rpb25TZXR0aW5ncywgKGVycm9yLCBjb25uZWN0aW9uKSA9PiB7XHJcbiAgICAgICAgaWYgKGVycm9yKSByZXR1cm4gcmVqZWN0KGVycm9yKTtcclxuICAgICAgICByZXNvbHZlKGNvbm5lY3Rpb24pO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIC8vIFVzZWQgdG8gZXhwbGljaXRseSBjbG9zZSBhIGNvbm5lY3Rpb24sIGNhbGxlZCBpbnRlcm5hbGx5IGJ5IHRoZSBwb29sIHdoZW5cclxuICAvLyBhIGNvbm5lY3Rpb24gdGltZXMgb3V0IG9yIHRoZSBwb29sIGlzIHNodXRkb3duLlxyXG4gIGFzeW5jIGRlc3Ryb3lSYXdDb25uZWN0aW9uKGNvbm5lY3Rpb24pIHtcclxuICAgIGNvbnN0IGNsb3NlID0gcHJvbWlzaWZ5KChjYikgPT4gY29ubmVjdGlvbi5kZXRhY2goY2IpKTtcclxuICAgIHJldHVybiBjbG9zZSgpO1xyXG4gIH0sXHJcblxyXG4gIC8vIFJ1bnMgdGhlIHF1ZXJ5IG9uIHRoZSBzcGVjaWZpZWQgY29ubmVjdGlvbiwgcHJvdmlkaW5nIHRoZSBiaW5kaW5ncyBhbmQgYW55XHJcbiAgLy8gb3RoZXIgbmVjZXNzYXJ5IHByZXAgd29yay5cclxuICBfcXVlcnkoY29ubmVjdGlvbiwgb2JqKSB7XHJcbiAgICBpZiAoIW9iaiB8fCB0eXBlb2Ygb2JqID09PSAnc3RyaW5nJykgb2JqID0geyBzcWw6IG9iaiB9O1xyXG4gICAgcmV0dXJuIG5ldyBCbHVlYmlyZChmdW5jdGlvbiAocmVzb2x2ZXIsIHJlamVjdGVyKSB7XHJcbiAgICAgIGlmICghY29ubmVjdGlvbikge1xyXG4gICAgICAgIHJldHVybiByZWplY3RlcihcclxuICAgICAgICAgIG5ldyBFcnJvcihgRXJyb3IgY2FsbGluZyAke2NhbGxNZXRob2R9IG9uIGNvbm5lY3Rpb24uYClcclxuICAgICAgICApO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgbGV0IHsgc3FsIH0gPSBvYmo7XHJcbiAgICAgIHNxbCA9IHNxbC5zcGxpdChcImBcIikuam9pbignXCInKTsgICAgICBcclxuICAgICAgaWYgKCFzcWwpIHJldHVybiByZXNvbHZlcigpO1xyXG4gICAgICBjb25zdCBjID0gY29ubmVjdGlvbi5fdHJhc2FjdGlvbiB8fCBjb25uZWN0aW9uO1xyXG4gICAgICBjLnF1ZXJ5KHNxbCwgb2JqLmJpbmRpbmdzLCAoZXJyb3IsIHJvd3MsIGZpZWxkcykgPT4ge1xyXG4gICAgICAgIGlmIChlcnJvcikgcmV0dXJuIHJlamVjdGVyKGVycm9yKTtcclxuICAgICAgICBvYmoucmVzcG9uc2UgPSBbcm93cywgZmllbGRzXTtcclxuICAgICAgICByZXNvbHZlcihvYmopO1xyXG4gICAgICB9KTsgICAgICBcclxuICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIF9zdHJlYW0oY29ubmVjdGlvbiwgc3FsLCBzdHJlYW0pIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignX3N0cmVhbSBub3QgaW1wbGVtZW50ZWQnKTtcclxuICAgIC8vIGNvbnN0IGNsaWVudCA9IHRoaXM7XHJcbiAgICAvLyByZXR1cm4gbmV3IEJsdWViaXJkKGZ1bmN0aW9uIChyZXNvbHZlciwgcmVqZWN0ZXIpIHtcclxuICAgIC8vICAgc3RyZWFtLm9uKCdlcnJvcicsIHJlamVjdGVyKTtcclxuICAgIC8vICAgc3RyZWFtLm9uKCdlbmQnLCByZXNvbHZlcik7XHJcbiAgICAvLyAgIHJldHVybiBjbGllbnRcclxuICAgIC8vICAgICAuX3F1ZXJ5KGNvbm5lY3Rpb24sIHNxbClcclxuICAgIC8vICAgICAudGhlbigob2JqKSA9PiBvYmoucmVzcG9uc2UpXHJcbiAgICAvLyAgICAgLnRoZW4oKHJvd3MpID0+IHJvd3MuZm9yRWFjaCgocm93KSA9PiBzdHJlYW0ud3JpdGUocm93KSkpXHJcbiAgICAvLyAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcclxuICAgIC8vICAgICAgIHN0cmVhbS5lbWl0KCdlcnJvcicsIGVycik7XHJcbiAgICAvLyAgICAgfSlcclxuICAgIC8vICAgICAudGhlbihmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyAgICAgICBzdHJlYW0uZW5kKCk7XHJcbiAgICAvLyAgICAgfSk7XHJcbiAgICAvLyB9KTtcclxuICB9LFxyXG5cclxuICAvLyBFbnN1cmVzIHRoZSByZXNwb25zZSBpcyByZXR1cm5lZCBpbiB0aGUgc2FtZSBmb3JtYXQgYXMgb3RoZXIgY2xpZW50cy5cclxuICBwcm9jZXNzUmVzcG9uc2Uob2JqLCBydW5uZXIpIHtcclxuICAgIGlmICghb2JqKSByZXR1cm47XHJcbiAgICBsZXQgeyByZXNwb25zZSB9ID0gb2JqO1xyXG4gICAgXHJcbiAgICBjb25zdCBbcm93cywgZmllbGRzXSA9IHJlc3BvbnNlO1xyXG4gICAgdGhpcy5fZml4QnVmZmVyU3RyaW5ncyhyb3dzLCBmaWVsZHMpO1xyXG4gICAgcmV0dXJuIHJvd3M7XHJcbiAgfSxcclxuXHJcbiAgX2ZpeEJ1ZmZlclN0cmluZ3Mocm93cywgZmllbGRzKSB7XHJcbiAgICBpZiAoIXJvd3MpIHJldHVybiByb3dzO1xyXG4gICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xyXG4gICAgICBmb3IgKGNvbnN0IGNlbGwgaW4gcm93KSB7XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSByb3dbY2VsbF07XHJcbiAgICAgICAgaWYgKEJ1ZmZlci5pc0J1ZmZlcih2YWx1ZSkpIHtcclxuICAgICAgICAgIGZvciAoY29uc3QgZmllbGQgb2YgZmllbGRzKSB7XHJcbiAgICAgICAgICAgIGlmIChmaWVsZC5hbGlhcyA9PT0gY2VsbCAmJlxyXG4gICAgICAgICAgICAgIGZpZWxkLnR5cGUgPT09IDQ0OCkgeyAvLyBTUUxWYXJTdHJpbmdcclxuICAgICAgICAgICAgICByb3dbY2VsbF0gPSB2YWx1ZS50b1N0cmluZygpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgcG9vbERlZmF1bHRzKCkge1xyXG4gICAgcmV0dXJuIGRlZmF1bHRzKFxyXG4gICAgICB7IG1pbjogMSwgbWF4OiAxIH0sXHJcbiAgICAgIENsaWVudC5wcm90b3R5cGUucG9vbERlZmF1bHRzLmNhbGwodGhpcylcclxuICAgICk7XHJcbiAgfSxcclxuXHJcbiAgcGluZyhyZXNvdXJjZSwgY2FsbGJhY2spIHtcclxuICAgIHJlc291cmNlLnF1ZXJ5KCdzZWxlY3QgMSBmcm9tIFJEQiREQVRBQkFTRScsIGNhbGxiYWNrKTtcclxuICB9LFxyXG5cclxuXHJcbiAgLy8gZm9ybWF0dGVyKCkge1xyXG4gIC8vICAgcmV0dXJuIG5ldyBGaXJlYmlyZF9Gb3JtYXR0ZXIodGhpcywgLi4uYXJndW1lbnRzKTtcclxuICAvLyB9LFxyXG59KTtcclxuXHJcbkNsaWVudF9GaXJlYmlyZC5kaWFsZWN0ID0gJ2ZpcmViaXJkJztcclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCBDbGllbnRfRmlyZWJpcmQ7XHJcbiJdfQ==