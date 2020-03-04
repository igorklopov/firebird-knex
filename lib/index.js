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

  columnCompiler: function columnCompiler() {
    return new (_bind.apply(_schemaColumncompiler2['default'], [null].concat([this], _slice.call(arguments))))();
  },

  tableCompiler: function tableCompiler() {
    return new (_bind.apply(_schemaTablecompiler2['default'], [null].concat([this], _slice.call(arguments))))();
  },
  Transaction: _transaction2['default'],

  wrapIdentifierImpl: function wrapIdentifierImpl(value) {

    if (value === '*') return value;

    if (!/^[A-Za-z0-9_]+$/.test(value)) {
      //Dialect 1 of firebird doesn't support special characters
      //Backquotes only available on dialect 3
      throw new Error('Invalid identifier: "' + value + '"; Dialect 1 doesn\'t support special characters.');
    }
    return value;
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

      console.log('SQL', sql);
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
    return this._fixBlobCallbacks(rows, fields);
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

            if (field.alias === cell && (field.type === 448 || field.type === 452)) {
              // SQLVarString               
              row[cell] = value.toString();
              break;
            }
          }
        }
      }
    }
  },
  /**   
  * The Firebird library returns BLOLs with callback functions; Those need to be loaded asynchronously
  * @param {*} rows 
  * @param {*} fields 
  */
  _fixBlobCallbacks: function _fixBlobCallbacks(rows, fields) {
    if (!rows) return rows;

    var blobEntries = [];

    // Seek and verify if there is any BLOB

    var _loop = function () {
      if (_isArray3) {
        if (_i3 >= _iterator3.length) return 'break';
        _ref3 = _iterator3[_i3++];
      } else {
        _i3 = _iterator3.next();
        if (_i3.done) return 'break';
        _ref3 = _i3.value;
      }

      var row = _ref3;

      var _loop2 = function (cell) {
        var value = row[cell];
        // ATSTODO: Está presumindo que o blob é texto; recomenda-se diferenciar texto de binário. Talvez o "fields" ajude?
        // Is it a callback BLOB?
        if (value instanceof Function) {
          blobEntries.push(new Promise(function (resolve, reject) {
            value(function (err, name, stream) {
              if (err) {
                reject(err);
                return;
              }

              // ATSTODO: Ver como fazer quando o string não tiver o "setEncoding()"
              if (!stream['setEncoding']) {
                stream['setEncoding'] = function () {
                  return undefined;
                };
              }

              // ATSTODO: Não está convertendo os cadacteres acentuados corretamente, mesmo informando a codificação
              resolve(readableToString(stream, 'latin1').then(function (blobString) {
                row[cell] = blobString;
              }));
            });
          }));
        }
      };

      for (var cell in row) {
        _loop2(cell);
      }
    };

    for (var _iterator3 = rows, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
      var _ref3;

      var _ret = _loop();

      if (_ret === 'break') break;
    }
    // Returns a Promise that wait BLOBs be loaded and retuns it
    return Promise.all(blobEntries).then(function () {
      return rows;
    });
  },

  poolDefaults: function poolDefaults() {
    return _lodash.defaults({ min: 1, max: 1 }, _knexLibClient2['default'].prototype.poolDefaults.call(this));
  },

  ping: function ping(resource, callback) {
    resource.query('select 1 from RDB$DATABASE', callback);
  }
});

// ddl(compiler, pragma, connection) {
//   return new SQLite3_DDL(this, compiler, pragma, connection);
// },

// formatter() {
//   return new Firebird_Formatter(this, ...arguments);
// },
Client_Firebird.dialect = 'firebird';

exports['default'] = Client_Firebird;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q0FBQyxJQUFJLENBQUMsVUFBQSxVQUFVLEVBQUk7QUFDNUQsbUJBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxVQUFVLENBQUM7ZUFDeEIsQ0FBQyxDQUFDLENBQUM7YUFDTCxDQUFDLENBQUM7V0FDSixDQUFDLENBQUMsQ0FBQztTQUNMOzs7QUF2QkgsV0FBSyxJQUFNLElBQUksSUFBSSxHQUFHLEVBQUU7ZUFBYixJQUFJO09Bd0JkOzs7QUF6QkgsMEJBQWtCLElBQUkseUhBQUU7Ozs7OztLQTBCdkI7O0FBRUQsV0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQzthQUFNLElBQUk7S0FBQSxDQUFDLENBQUM7R0FDbEQ7O0FBRUQsY0FBWSxFQUFBLHdCQUFHO0FBQ2IsV0FBTyxpQkFDTCxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUNsQiwyQkFBTyxTQUFTLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FDekMsQ0FBQztHQUNIOztBQUVELE1BQUksRUFBQSxjQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUU7QUFDdkIsWUFBUSxDQUFDLEtBQUssQ0FBQyw0QkFBNEIsRUFBRSxRQUFRLENBQUMsQ0FBQztHQUN4RDtDQVNGLENBQUMsQ0FBQzs7Ozs7Ozs7O0FBRUgsZUFBZSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUM7O3FCQUd0QixlQUFlIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gRmlyZWJpcmRcclxuLy8gLS0tLS0tLVxyXG5pbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xyXG5cclxuaW1wb3J0IGluaGVyaXRzIGZyb20gJ2luaGVyaXRzJztcclxuaW1wb3J0IHsgaXNVbmRlZmluZWQsIG1hcCwgZGVmYXVsdHMgfSBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgeyBwcm9taXNpZnkgfSBmcm9tICd1dGlsJztcclxuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xyXG5pbXBvcnQgQ2xpZW50IGZyb20gJ2tuZXgvbGliL2NsaWVudCc7XHJcblxyXG5cclxuaW1wb3J0IENvbHVtbkNvbXBpbGVyIGZyb20gJy4vc2NoZW1hL2NvbHVtbmNvbXBpbGVyJztcclxuaW1wb3J0IFF1ZXJ5Q29tcGlsZXIgZnJvbSAnLi9xdWVyeS9jb21waWxlcic7XHJcbmltcG9ydCBUYWJsZUNvbXBpbGVyIGZyb20gJy4vc2NoZW1hL3RhYmxlY29tcGlsZXInO1xyXG5pbXBvcnQgVHJhbnNhY3Rpb24gZnJvbSAnLi90cmFuc2FjdGlvbic7XHJcbmltcG9ydCBTY2hlbWFDb21waWxlciBmcm9tICcuL3NjaGVtYS9jb21waWxlcic7XHJcbmltcG9ydCBGaXJlYmlyZF9Gb3JtYXR0ZXIgZnJvbSAnLi9mb3JtYXR0ZXInO1xyXG5cclxuXHJcblxyXG5cclxuZnVuY3Rpb24gQ2xpZW50X0ZpcmViaXJkKGNvbmZpZykge1xyXG4gIENsaWVudC5jYWxsKHRoaXMsIGNvbmZpZyk7XHJcbn1cclxuaW5oZXJpdHMoQ2xpZW50X0ZpcmViaXJkLCBDbGllbnQpO1xyXG5cclxuT2JqZWN0LmFzc2lnbihDbGllbnRfRmlyZWJpcmQucHJvdG90eXBlLCB7XHJcblxyXG4gIGRpYWxlY3Q6ICdmaXJlYmlyZCcsXHJcblxyXG4gIGRyaXZlck5hbWU6ICdub2RlLWZpcmViaXJkJyxcclxuXHJcbiAgX2RyaXZlcigpIHtcclxuICAgIHJldHVybiByZXF1aXJlKCdub2RlLWZpcmViaXJkJyk7XHJcbiAgfSxcclxuXHJcbiAgc2NoZW1hQ29tcGlsZXIoKSB7XHJcbiAgICByZXR1cm4gbmV3IFNjaGVtYUNvbXBpbGVyKHRoaXMsIC4uLmFyZ3VtZW50cyk7XHJcbiAgfSxcclxuICBRdWVyeUNvbXBpbGVyLFxyXG5cclxuICBjb2x1bW5Db21waWxlcigpIHtcclxuICAgIHJldHVybiBuZXcgQ29sdW1uQ29tcGlsZXIodGhpcywgLi4uYXJndW1lbnRzKTtcclxuICB9LFxyXG5cclxuICB0YWJsZUNvbXBpbGVyKCkge1xyXG4gICAgcmV0dXJuIG5ldyBUYWJsZUNvbXBpbGVyKHRoaXMsIC4uLmFyZ3VtZW50cyk7XHJcbiAgfSxcclxuICBUcmFuc2FjdGlvbixcclxuXHJcbiAgd3JhcElkZW50aWZpZXJJbXBsKHZhbHVlKSB7XHJcbiAgICBcclxuICAgIGlmICh2YWx1ZSA9PT0gJyonKSByZXR1cm4gdmFsdWU7ICAgXHJcblxyXG5cclxuICAgIGlmICghL15bQS1aYS16MC05X10rJC8udGVzdCh2YWx1ZSkpIHtcclxuICAgICAgLy9EaWFsZWN0IDEgb2YgZmlyZWJpcmQgZG9lc24ndCBzdXBwb3J0IHNwZWNpYWwgY2hhcmFjdGVyc1xyXG4gICAgICAvL0JhY2txdW90ZXMgb25seSBhdmFpbGFibGUgb24gZGlhbGVjdCAzXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBpZGVudGlmaWVyOiBcIiR7dmFsdWV9XCI7IERpYWxlY3QgMSBkb2Vzbid0IHN1cHBvcnQgc3BlY2lhbCBjaGFyYWN0ZXJzLmApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG4gIH0sXHJcblxyXG5cclxuICAvLyBHZXQgYSByYXcgY29ubmVjdGlvbiBmcm9tIHRoZSBkYXRhYmFzZSwgcmV0dXJuaW5nIGEgcHJvbWlzZSB3aXRoIHRoZSBjb25uZWN0aW9uIG9iamVjdC5cclxuICBhY3F1aXJlUmF3Q29ubmVjdGlvbigpIHtcclxuICAgIGFzc2VydCghdGhpcy5fY29ubmVjdGlvbkZvclRyYW5zYWN0aW9ucyk7XHJcbiAgICByZXR1cm4gbmV3IEJsdWViaXJkKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5kcml2ZXIuYXR0YWNoKHRoaXMuY29ubmVjdGlvblNldHRpbmdzLCAoZXJyb3IsIGNvbm5lY3Rpb24pID0+IHtcclxuICAgICAgICBpZiAoZXJyb3IpIHJldHVybiByZWplY3QoZXJyb3IpO1xyXG4gICAgICAgIHJlc29sdmUoY29ubmVjdGlvbik7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgLy8gVXNlZCB0byBleHBsaWNpdGx5IGNsb3NlIGEgY29ubmVjdGlvbiwgY2FsbGVkIGludGVybmFsbHkgYnkgdGhlIHBvb2wgd2hlblxyXG4gIC8vIGEgY29ubmVjdGlvbiB0aW1lcyBvdXQgb3IgdGhlIHBvb2wgaXMgc2h1dGRvd24uXHJcbiAgYXN5bmMgZGVzdHJveVJhd0Nvbm5lY3Rpb24oY29ubmVjdGlvbikge1xyXG4gICAgY29uc3QgY2xvc2UgPSBwcm9taXNpZnkoKGNiKSA9PiBjb25uZWN0aW9uLmRldGFjaChjYikpO1xyXG4gICAgcmV0dXJuIGNsb3NlKCk7XHJcbiAgfSxcclxuXHJcbiAgLy8gUnVucyB0aGUgcXVlcnkgb24gdGhlIHNwZWNpZmllZCBjb25uZWN0aW9uLCBwcm92aWRpbmcgdGhlIGJpbmRpbmdzIGFuZCBhbnlcclxuICAvLyBvdGhlciBuZWNlc3NhcnkgcHJlcCB3b3JrLlxyXG4gIF9xdWVyeShjb25uZWN0aW9uLCBvYmopIHtcclxuICAgIGlmICghb2JqIHx8IHR5cGVvZiBvYmogPT09ICdzdHJpbmcnKSBvYmogPSB7IHNxbDogb2JqIH07XHJcbiAgICByZXR1cm4gbmV3IEJsdWViaXJkKGZ1bmN0aW9uIChyZXNvbHZlciwgcmVqZWN0ZXIpIHtcclxuICAgICAgaWYgKCFjb25uZWN0aW9uKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlamVjdGVyKFxyXG4gICAgICAgICAgbmV3IEVycm9yKGBFcnJvciBjYWxsaW5nICR7Y2FsbE1ldGhvZH0gb24gY29ubmVjdGlvbi5gKVxyXG4gICAgICAgICk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBsZXQgeyBzcWwgfSA9IG9iajtcclxuICAgICAgY29uc29sZS5sb2coJ1NRTCcsIHNxbCk7XHJcbiAgICAgIGlmICghc3FsKSByZXR1cm4gcmVzb2x2ZXIoKTtcclxuICAgICAgY29uc3QgYyA9IGNvbm5lY3Rpb24uX3RyYXNhY3Rpb24gfHwgY29ubmVjdGlvbjtcclxuICAgICAgYy5xdWVyeShzcWwsIG9iai5iaW5kaW5ncywgKGVycm9yLCByb3dzLCBmaWVsZHMpID0+IHtcclxuICAgICAgICBpZiAoZXJyb3IpIHJldHVybiByZWplY3RlcihlcnJvcik7XHJcbiAgICAgICAgb2JqLnJlc3BvbnNlID0gW3Jvd3MsIGZpZWxkc107XHJcbiAgICAgICAgcmVzb2x2ZXIob2JqKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICBfc3RyZWFtKGNvbm5lY3Rpb24sIHNxbCwgc3RyZWFtKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ19zdHJlYW0gbm90IGltcGxlbWVudGVkJyk7XHJcbiAgICAvLyBjb25zdCBjbGllbnQgPSB0aGlzO1xyXG4gICAgLy8gcmV0dXJuIG5ldyBCbHVlYmlyZChmdW5jdGlvbiAocmVzb2x2ZXIsIHJlamVjdGVyKSB7XHJcbiAgICAvLyAgIHN0cmVhbS5vbignZXJyb3InLCByZWplY3Rlcik7XHJcbiAgICAvLyAgIHN0cmVhbS5vbignZW5kJywgcmVzb2x2ZXIpO1xyXG4gICAgLy8gICByZXR1cm4gY2xpZW50XHJcbiAgICAvLyAgICAgLl9xdWVyeShjb25uZWN0aW9uLCBzcWwpXHJcbiAgICAvLyAgICAgLnRoZW4oKG9iaikgPT4gb2JqLnJlc3BvbnNlKVxyXG4gICAgLy8gICAgIC50aGVuKChyb3dzKSA9PiByb3dzLmZvckVhY2goKHJvdykgPT4gc3RyZWFtLndyaXRlKHJvdykpKVxyXG4gICAgLy8gICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAvLyAgICAgICBzdHJlYW0uZW1pdCgnZXJyb3InLCBlcnIpO1xyXG4gICAgLy8gICAgIH0pXHJcbiAgICAvLyAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gICAgICAgc3RyZWFtLmVuZCgpO1xyXG4gICAgLy8gICAgIH0pO1xyXG4gICAgLy8gfSk7XHJcbiAgfSxcclxuXHJcbiAgLy8gRW5zdXJlcyB0aGUgcmVzcG9uc2UgaXMgcmV0dXJuZWQgaW4gdGhlIHNhbWUgZm9ybWF0IGFzIG90aGVyIGNsaWVudHMuXHJcbiAgcHJvY2Vzc1Jlc3BvbnNlKG9iaiwgcnVubmVyKSB7XHJcbiAgICBpZiAoIW9iaikgcmV0dXJuO1xyXG4gICAgbGV0IHsgcmVzcG9uc2UgfSA9IG9iajtcclxuXHJcbiAgICBjb25zdCBbcm93cywgZmllbGRzXSA9IHJlc3BvbnNlO1xyXG4gICAgdGhpcy5fZml4QnVmZmVyU3RyaW5ncyhyb3dzLCBmaWVsZHMpO1xyXG4gICAgcmV0dXJuIHRoaXMuX2ZpeEJsb2JDYWxsYmFja3Mocm93cywgZmllbGRzKTtcclxuICB9LFxyXG5cclxuICBfZml4QnVmZmVyU3RyaW5ncyhyb3dzLCBmaWVsZHMpIHtcclxuICAgIGlmICghcm93cykgcmV0dXJuIHJvd3M7XHJcbiAgICBmb3IgKGNvbnN0IHJvdyBvZiByb3dzKSB7XHJcbiAgICAgIGZvciAoY29uc3QgY2VsbCBpbiByb3cpIHtcclxuICAgICAgICBjb25zdCB2YWx1ZSA9IHJvd1tjZWxsXTtcclxuICAgICAgICBpZiAoQnVmZmVyLmlzQnVmZmVyKHZhbHVlKSkge1xyXG4gICAgICAgICAgZm9yIChjb25zdCBmaWVsZCBvZiBmaWVsZHMpIHtcclxuICAgICAgICAgICAgaWYgKGZpZWxkLmFsaWFzID09PSBjZWxsICYmXHJcbiAgICAgICAgICAgICAgKGZpZWxkLnR5cGUgPT09IDQ0OCB8fCBmaWVsZC50eXBlID09PSA0NTIpKSB7IC8vIFNRTFZhclN0cmluZyAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICByb3dbY2VsbF0gPSB2YWx1ZS50b1N0cmluZygpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuICAvKiogICBcclxuICAqIFRoZSBGaXJlYmlyZCBsaWJyYXJ5IHJldHVybnMgQkxPTHMgd2l0aCBjYWxsYmFjayBmdW5jdGlvbnM7IFRob3NlIG5lZWQgdG8gYmUgbG9hZGVkIGFzeW5jaHJvbm91c2x5XHJcbiAgKiBAcGFyYW0geyp9IHJvd3MgXHJcbiAgKiBAcGFyYW0geyp9IGZpZWxkcyBcclxuICAqL1xyXG4gIF9maXhCbG9iQ2FsbGJhY2tzKHJvd3MsIGZpZWxkcykgeyAgICBcclxuICAgIGlmICghcm93cykgcmV0dXJuIHJvd3M7XHJcblxyXG4gICAgY29uc3QgYmxvYkVudHJpZXMgPSBbXTtcclxuXHJcbiAgICAvLyBTZWVrIGFuZCB2ZXJpZnkgaWYgdGhlcmUgaXMgYW55IEJMT0JcclxuICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcclxuICAgICAgZm9yIChjb25zdCBjZWxsIGluIHJvdykge1xyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gcm93W2NlbGxdOyAgICAgICBcclxuICAgICAgICAvLyBBVFNUT0RPOiBFc3TDoSBwcmVzdW1pbmRvIHF1ZSBvIGJsb2Igw6kgdGV4dG87IHJlY29tZW5kYS1zZSBkaWZlcmVuY2lhciB0ZXh0byBkZSBiaW7DoXJpby4gVGFsdmV6IG8gXCJmaWVsZHNcIiBhanVkZT9cclxuICAgICAgICAvLyBJcyBpdCBhIGNhbGxiYWNrIEJMT0I/XHJcbiAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcclxuICAgICAgICAgIGJsb2JFbnRyaWVzLnB1c2gobmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICB2YWx1ZSgoZXJyLCBuYW1lLCBzdHJlYW0pID0+IHtcclxuICAgICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIC8vIEFUU1RPRE86IFZlciBjb21vIGZhemVyIHF1YW5kbyBvIHN0cmluZyBuw6NvIHRpdmVyIG8gXCJzZXRFbmNvZGluZygpXCJcclxuICAgICAgICAgICAgICBpZiAoIXN0cmVhbVsnc2V0RW5jb2RpbmcnXSkge1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtWydzZXRFbmNvZGluZyddID0gKCkgPT4gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgLy8gQVRTVE9ETzogTsOjbyBlc3TDoSBjb252ZXJ0ZW5kbyBvcyBjYWRhY3RlcmVzIGFjZW50dWFkb3MgY29ycmV0YW1lbnRlLCBtZXNtbyBpbmZvcm1hbmRvIGEgY29kaWZpY2HDp8Ojb1xyXG4gICAgICAgICAgICAgIHJlc29sdmUocmVhZGFibGVUb1N0cmluZyhzdHJlYW0sICdsYXRpbjEnKS50aGVuKGJsb2JTdHJpbmcgPT4ge1xyXG4gICAgICAgICAgICAgICAgcm93W2NlbGxdID0gYmxvYlN0cmluZztcclxuICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gUmV0dXJucyBhIFByb21pc2UgdGhhdCB3YWl0IEJMT0JzIGJlIGxvYWRlZCBhbmQgcmV0dW5zIGl0XHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoYmxvYkVudHJpZXMpLnRoZW4oKCkgPT4gcm93cyk7XHJcbiAgfSxcclxuXHJcbiAgcG9vbERlZmF1bHRzKCkge1xyXG4gICAgcmV0dXJuIGRlZmF1bHRzKFxyXG4gICAgICB7IG1pbjogMSwgbWF4OiAxIH0sXHJcbiAgICAgIENsaWVudC5wcm90b3R5cGUucG9vbERlZmF1bHRzLmNhbGwodGhpcylcclxuICAgICk7XHJcbiAgfSxcclxuXHJcbiAgcGluZyhyZXNvdXJjZSwgY2FsbGJhY2spIHtcclxuICAgIHJlc291cmNlLnF1ZXJ5KCdzZWxlY3QgMSBmcm9tIFJEQiREQVRBQkFTRScsIGNhbGxiYWNrKTtcclxuICB9LFxyXG4gIC8vIGRkbChjb21waWxlciwgcHJhZ21hLCBjb25uZWN0aW9uKSB7XHJcbiAgLy8gICByZXR1cm4gbmV3IFNRTGl0ZTNfRERMKHRoaXMsIGNvbXBpbGVyLCBwcmFnbWEsIGNvbm5lY3Rpb24pO1xyXG4gIC8vIH0sXHJcblxyXG5cclxuICAvLyBmb3JtYXR0ZXIoKSB7XHJcbiAgLy8gICByZXR1cm4gbmV3IEZpcmViaXJkX0Zvcm1hdHRlcih0aGlzLCAuLi5hcmd1bWVudHMpO1xyXG4gIC8vIH0sXHJcbn0pO1xyXG5cclxuQ2xpZW50X0ZpcmViaXJkLmRpYWxlY3QgPSAnZmlyZWJpcmQnO1xyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IENsaWVudF9GaXJlYmlyZDtcclxuIl19