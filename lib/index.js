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
    console.log('Value', value);
    if (value === '*') return value;
    if (value === '`') return '"';

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
              row[cell] = value.toString('latin1');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O3dCQUVxQixVQUFVOzs7O3dCQUVWLFVBQVU7Ozs7c0JBQ1ksUUFBUTs7b0JBQ3pCLE1BQU07O3NCQUNiLFFBQVE7Ozs7NkJBQ1IsaUJBQWlCOzs7O29DQUdULHlCQUF5Qjs7Ozs2QkFDMUIsa0JBQWtCOzs7O21DQUNsQix3QkFBd0I7Ozs7MkJBQzFCLGVBQWU7Ozs7OEJBQ1osbUJBQW1COzs7O3lCQUNmLGFBQWE7Ozs7QUFLNUMsU0FBUyxlQUFlLENBQUMsTUFBTSxFQUFFO0FBQy9CLDZCQUFPLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7Q0FDM0I7QUFDRCxzQkFBUyxlQUFlLDZCQUFTLENBQUM7O0FBRWxDLE1BQU0sQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsRUFBRTs7QUFFdkMsU0FBTyxFQUFFLFVBQVU7O0FBRW5CLFlBQVUsRUFBRSxlQUFlOztBQUUzQixTQUFPLEVBQUEsbUJBQUc7QUFDUixXQUFPLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztHQUNqQzs7QUFFRCxnQkFBYyxFQUFBLDBCQUFHO0FBQ2Ysd0VBQTBCLElBQUksZUFBSyxTQUFTLE9BQUU7R0FDL0M7QUFDRCxlQUFhLDRCQUFBOztBQUViLGdCQUFjLEVBQUEsMEJBQUc7QUFDZiw4RUFBMEIsSUFBSSxlQUFLLFNBQVMsT0FBRTtHQUMvQzs7QUFFRCxlQUFhLEVBQUEseUJBQUc7QUFDZCw2RUFBeUIsSUFBSSxlQUFLLFNBQVMsT0FBRTtHQUM5QztBQUNELGFBQVcsMEJBQUE7O0FBRVgsb0JBQWtCLEVBQUEsNEJBQUMsS0FBSyxFQUFFO0FBQ3hCLFdBQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFBO0FBQzNCLFFBQUksS0FBSyxLQUFLLEdBQUcsRUFBRSxPQUFPLEtBQUssQ0FBQztBQUNoQyxRQUFJLEtBQUssS0FBSyxHQUFHLEVBQUUsT0FBTyxHQUFHLENBQUM7O0FBRzlCLFFBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7OztBQUdsQyxZQUFNLElBQUksS0FBSywyQkFBeUIsS0FBSyx1REFBbUQsQ0FBQztLQUNsRztBQUNELFdBQU8sS0FBSyxDQUFDO0dBQ2Q7OztBQUlELHNCQUFvQixFQUFBLGdDQUFHOzs7QUFDckIsd0JBQU8sQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsQ0FBQztBQUN6QyxXQUFPLDBCQUFhLFVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBSztBQUN2QyxZQUFLLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBSyxrQkFBa0IsRUFBRSxVQUFDLEtBQUssRUFBRSxVQUFVLEVBQUs7QUFDakUsWUFBSSxLQUFLLEVBQUUsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDaEMsZUFBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO09BQ3JCLENBQUMsQ0FBQztLQUNKLENBQUMsQ0FBQztHQUNKOzs7O0FBSUQsQUFBTSxzQkFBb0IsRUFBQSw4QkFBQyxVQUFVO1FBQzdCLEtBQUs7Ozs7QUFBTCxlQUFLLEdBQUcsZ0JBQVUsVUFBQyxFQUFFO21CQUFLLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO1dBQUEsQ0FBQzs4Q0FDL0MsS0FBSyxFQUFFOzs7Ozs7O0dBQ2Y7Ozs7QUFJRCxRQUFNLEVBQUEsZ0JBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtBQUN0QixRQUFJLENBQUMsR0FBRyxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRSxHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7QUFDeEQsV0FBTywwQkFBYSxVQUFVLFFBQVEsRUFBRSxRQUFRLEVBQUU7QUFDaEQsVUFBSSxDQUFDLFVBQVUsRUFBRTtBQUNmLGVBQU8sUUFBUSxDQUNiLElBQUksS0FBSyxvQkFBa0IsVUFBVSxxQkFBa0IsQ0FDeEQsQ0FBQztPQUNILENBQUM7O2lCQUVZLEdBQUc7VUFBWCxHQUFHLFFBQUgsR0FBRzs7QUFDVCxhQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztBQUN4QixVQUFJLENBQUMsR0FBRyxFQUFFLE9BQU8sUUFBUSxFQUFFLENBQUM7QUFDNUIsVUFBTSxDQUFDLEdBQUcsVUFBVSxDQUFDLFdBQVcsSUFBSSxVQUFVLENBQUM7QUFDL0MsT0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLFFBQVEsRUFBRSxVQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFLO0FBQ2xELFlBQUksS0FBSyxFQUFFLE9BQU8sUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2xDLFdBQUcsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDOUIsZ0JBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztPQUNmLENBQUMsQ0FBQztLQUNKLENBQUMsQ0FBQztHQUNKOztBQUVELFNBQU8sRUFBQSxpQkFBQyxVQUFVLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRTtBQUMvQixVQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7R0FnQjVDOzs7QUFHRCxpQkFBZSxFQUFBLHlCQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUU7QUFDM0IsUUFBSSxDQUFDLEdBQUcsRUFBRSxPQUFPO1FBQ1gsUUFBUSxHQUFLLEdBQUcsQ0FBaEIsUUFBUTtRQUVQLElBQUksR0FBWSxRQUFRO1FBQWxCLE1BQU0sR0FBSSxRQUFROztBQUMvQixRQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3JDLFdBQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztHQUM3Qzs7QUFFRCxtQkFBaUIsRUFBQSwyQkFBQyxJQUFJLEVBQUUsTUFBTSxFQUFFO0FBQzlCLFFBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxJQUFJLENBQUM7QUFDdkIseUJBQWtCLElBQUksa0hBQUU7Ozs7Ozs7Ozs7OztVQUFiLEdBQUc7O0FBQ1osV0FBSyxJQUFNLElBQUksSUFBSSxHQUFHLEVBQUU7QUFDdEIsWUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3hCLFlBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUMxQixnQ0FBb0IsTUFBTSx5SEFBRTs7Ozs7Ozs7Ozs7O2dCQUFqQixLQUFLOztBQUNkLGdCQUFJLEtBQUssQ0FBQyxLQUFLLEtBQUssSUFBSSxLQUNyQixLQUFLLENBQUMsSUFBSSxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQSxBQUFDLEVBQUU7O0FBQzVDLGlCQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNyQyxvQkFBTTthQUNQO1dBQ0Y7U0FDRjtPQUNGO0tBQ0Y7R0FDRjs7Ozs7O0FBTUQsbUJBQWlCLEVBQUEsMkJBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRTtBQUM5QixRQUFJLENBQUMsSUFBSSxFQUFFLE9BQU8sSUFBSSxDQUFDOztBQUV2QixRQUFNLFdBQVcsR0FBRyxFQUFFLENBQUM7Ozs7Ozs7Ozs7Ozs7O1VBR1osR0FBRzs7NkJBQ0QsSUFBSTtBQUNiLFlBQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7OztBQUl4QixZQUFJLEtBQUssWUFBWSxRQUFRLEVBQUU7QUFDN0IscUJBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFLO0FBQ2hELGlCQUFLLENBQUMsVUFBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBSztBQUMzQixrQkFBSSxHQUFHLEVBQUU7QUFDUCxzQkFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ1osdUJBQU87ZUFDUjs7O0FBR0Qsa0JBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLEVBQUU7QUFDMUIsc0JBQU0sQ0FBQyxhQUFhLENBQUMsR0FBRzt5QkFBTSxTQUFTO2lCQUFBLENBQUM7ZUFDekM7OztBQUdELHFCQUFPLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFBLFVBQVUsRUFBSTtBQUM1RCxtQkFBRyxDQUFDLElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQztlQUN4QixDQUFDLENBQUMsQ0FBQzthQUNMLENBQUMsQ0FBQztXQUNKLENBQUMsQ0FBQyxDQUFDO1NBQ0w7OztBQXhCSCxXQUFLLElBQU0sSUFBSSxJQUFJLEdBQUcsRUFBRTtlQUFiLElBQUk7T0F5QmQ7OztBQTFCSCwwQkFBa0IsSUFBSSx5SEFBRTs7Ozs7O0tBMkJ2Qjs7QUFFRCxXQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDO2FBQU0sSUFBSTtLQUFBLENBQUMsQ0FBQztHQUNsRDs7QUFFRCxjQUFZLEVBQUEsd0JBQUc7QUFDYixXQUFPLGlCQUNMLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQ2xCLDJCQUFPLFNBQVMsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUN6QyxDQUFDO0dBQ0g7O0FBRUQsTUFBSSxFQUFBLGNBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRTtBQUN2QixZQUFRLENBQUMsS0FBSyxDQUFDLDRCQUE0QixFQUFFLFFBQVEsQ0FBQyxDQUFDO0dBQ3hEO0NBU0YsQ0FBQyxDQUFDOzs7Ozs7Ozs7QUFFSCxlQUFlLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQzs7cUJBR3RCLGVBQWUiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBGaXJlYmlyZFxyXG4vLyAtLS0tLS0tXHJcbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XHJcblxyXG5pbXBvcnQgaW5oZXJpdHMgZnJvbSAnaW5oZXJpdHMnO1xyXG5pbXBvcnQgeyBpc1VuZGVmaW5lZCwgbWFwLCBkZWZhdWx0cyB9IGZyb20gJ2xvZGFzaCc7XHJcbmltcG9ydCB7IHByb21pc2lmeSB9IGZyb20gJ3V0aWwnO1xyXG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XHJcbmltcG9ydCBDbGllbnQgZnJvbSAna25leC9saWIvY2xpZW50JztcclxuXHJcblxyXG5pbXBvcnQgQ29sdW1uQ29tcGlsZXIgZnJvbSAnLi9zY2hlbWEvY29sdW1uY29tcGlsZXInO1xyXG5pbXBvcnQgUXVlcnlDb21waWxlciBmcm9tICcuL3F1ZXJ5L2NvbXBpbGVyJztcclxuaW1wb3J0IFRhYmxlQ29tcGlsZXIgZnJvbSAnLi9zY2hlbWEvdGFibGVjb21waWxlcic7XHJcbmltcG9ydCBUcmFuc2FjdGlvbiBmcm9tICcuL3RyYW5zYWN0aW9uJztcclxuaW1wb3J0IFNjaGVtYUNvbXBpbGVyIGZyb20gJy4vc2NoZW1hL2NvbXBpbGVyJztcclxuaW1wb3J0IEZpcmViaXJkX0Zvcm1hdHRlciBmcm9tICcuL2Zvcm1hdHRlcic7XHJcblxyXG5cclxuXHJcblxyXG5mdW5jdGlvbiBDbGllbnRfRmlyZWJpcmQoY29uZmlnKSB7XHJcbiAgQ2xpZW50LmNhbGwodGhpcywgY29uZmlnKTtcclxufVxyXG5pbmhlcml0cyhDbGllbnRfRmlyZWJpcmQsIENsaWVudCk7XHJcblxyXG5PYmplY3QuYXNzaWduKENsaWVudF9GaXJlYmlyZC5wcm90b3R5cGUsIHtcclxuXHJcbiAgZGlhbGVjdDogJ2ZpcmViaXJkJyxcclxuXHJcbiAgZHJpdmVyTmFtZTogJ25vZGUtZmlyZWJpcmQnLFxyXG5cclxuICBfZHJpdmVyKCkge1xyXG4gICAgcmV0dXJuIHJlcXVpcmUoJ25vZGUtZmlyZWJpcmQnKTtcclxuICB9LFxyXG5cclxuICBzY2hlbWFDb21waWxlcigpIHtcclxuICAgIHJldHVybiBuZXcgU2NoZW1hQ29tcGlsZXIodGhpcywgLi4uYXJndW1lbnRzKTtcclxuICB9LFxyXG4gIFF1ZXJ5Q29tcGlsZXIsXHJcblxyXG4gIGNvbHVtbkNvbXBpbGVyKCkge1xyXG4gICAgcmV0dXJuIG5ldyBDb2x1bW5Db21waWxlcih0aGlzLCAuLi5hcmd1bWVudHMpO1xyXG4gIH0sXHJcblxyXG4gIHRhYmxlQ29tcGlsZXIoKSB7XHJcbiAgICByZXR1cm4gbmV3IFRhYmxlQ29tcGlsZXIodGhpcywgLi4uYXJndW1lbnRzKTtcclxuICB9LFxyXG4gIFRyYW5zYWN0aW9uLFxyXG5cclxuICB3cmFwSWRlbnRpZmllckltcGwodmFsdWUpIHtcclxuICAgIGNvbnNvbGUubG9nKCdWYWx1ZScsIHZhbHVlKVxyXG4gICAgaWYgKHZhbHVlID09PSAnKicpIHJldHVybiB2YWx1ZTtcclxuICAgIGlmICh2YWx1ZSA9PT0gJ2AnKSByZXR1cm4gJ1wiJztcclxuXHJcblxyXG4gICAgaWYgKCEvXltBLVphLXowLTlfXSskLy50ZXN0KHZhbHVlKSkge1xyXG4gICAgICAvL0RpYWxlY3QgMSBvZiBmaXJlYmlyZCBkb2Vzbid0IHN1cHBvcnQgc3BlY2lhbCBjaGFyYWN0ZXJzXHJcbiAgICAgIC8vQmFja3F1b3RlcyBvbmx5IGF2YWlsYWJsZSBvbiBkaWFsZWN0IDNcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGlkZW50aWZpZXI6IFwiJHt2YWx1ZX1cIjsgRGlhbGVjdCAxIGRvZXNuJ3Qgc3VwcG9ydCBzcGVjaWFsIGNoYXJhY3RlcnMuYCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFsdWU7XHJcbiAgfSxcclxuXHJcblxyXG4gIC8vIEdldCBhIHJhdyBjb25uZWN0aW9uIGZyb20gdGhlIGRhdGFiYXNlLCByZXR1cm5pbmcgYSBwcm9taXNlIHdpdGggdGhlIGNvbm5lY3Rpb24gb2JqZWN0LlxyXG4gIGFjcXVpcmVSYXdDb25uZWN0aW9uKCkge1xyXG4gICAgYXNzZXJ0KCF0aGlzLl9jb25uZWN0aW9uRm9yVHJhbnNhY3Rpb25zKTtcclxuICAgIHJldHVybiBuZXcgQmx1ZWJpcmQoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLmRyaXZlci5hdHRhY2godGhpcy5jb25uZWN0aW9uU2V0dGluZ3MsIChlcnJvciwgY29ubmVjdGlvbikgPT4ge1xyXG4gICAgICAgIGlmIChlcnJvcikgcmV0dXJuIHJlamVjdChlcnJvcik7XHJcbiAgICAgICAgcmVzb2x2ZShjb25uZWN0aW9uKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICAvLyBVc2VkIHRvIGV4cGxpY2l0bHkgY2xvc2UgYSBjb25uZWN0aW9uLCBjYWxsZWQgaW50ZXJuYWxseSBieSB0aGUgcG9vbCB3aGVuXHJcbiAgLy8gYSBjb25uZWN0aW9uIHRpbWVzIG91dCBvciB0aGUgcG9vbCBpcyBzaHV0ZG93bi5cclxuICBhc3luYyBkZXN0cm95UmF3Q29ubmVjdGlvbihjb25uZWN0aW9uKSB7XHJcbiAgICBjb25zdCBjbG9zZSA9IHByb21pc2lmeSgoY2IpID0+IGNvbm5lY3Rpb24uZGV0YWNoKGNiKSk7XHJcbiAgICByZXR1cm4gY2xvc2UoKTtcclxuICB9LFxyXG5cclxuICAvLyBSdW5zIHRoZSBxdWVyeSBvbiB0aGUgc3BlY2lmaWVkIGNvbm5lY3Rpb24sIHByb3ZpZGluZyB0aGUgYmluZGluZ3MgYW5kIGFueVxyXG4gIC8vIG90aGVyIG5lY2Vzc2FyeSBwcmVwIHdvcmsuXHJcbiAgX3F1ZXJ5KGNvbm5lY3Rpb24sIG9iaikge1xyXG4gICAgaWYgKCFvYmogfHwgdHlwZW9mIG9iaiA9PT0gJ3N0cmluZycpIG9iaiA9IHsgc3FsOiBvYmogfTtcclxuICAgIHJldHVybiBuZXcgQmx1ZWJpcmQoZnVuY3Rpb24gKHJlc29sdmVyLCByZWplY3Rlcikge1xyXG4gICAgICBpZiAoIWNvbm5lY3Rpb24pIHtcclxuICAgICAgICByZXR1cm4gcmVqZWN0ZXIoXHJcbiAgICAgICAgICBuZXcgRXJyb3IoYEVycm9yIGNhbGxpbmcgJHtjYWxsTWV0aG9kfSBvbiBjb25uZWN0aW9uLmApXHJcbiAgICAgICAgKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGxldCB7IHNxbCB9ID0gb2JqO1xyXG4gICAgICBjb25zb2xlLmxvZygnU1FMJywgc3FsKTtcclxuICAgICAgaWYgKCFzcWwpIHJldHVybiByZXNvbHZlcigpO1xyXG4gICAgICBjb25zdCBjID0gY29ubmVjdGlvbi5fdHJhc2FjdGlvbiB8fCBjb25uZWN0aW9uO1xyXG4gICAgICBjLnF1ZXJ5KHNxbCwgb2JqLmJpbmRpbmdzLCAoZXJyb3IsIHJvd3MsIGZpZWxkcykgPT4ge1xyXG4gICAgICAgIGlmIChlcnJvcikgcmV0dXJuIHJlamVjdGVyKGVycm9yKTtcclxuICAgICAgICBvYmoucmVzcG9uc2UgPSBbcm93cywgZmllbGRzXTtcclxuICAgICAgICByZXNvbHZlcihvYmopO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIF9zdHJlYW0oY29ubmVjdGlvbiwgc3FsLCBzdHJlYW0pIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignX3N0cmVhbSBub3QgaW1wbGVtZW50ZWQnKTtcclxuICAgIC8vIGNvbnN0IGNsaWVudCA9IHRoaXM7XHJcbiAgICAvLyByZXR1cm4gbmV3IEJsdWViaXJkKGZ1bmN0aW9uIChyZXNvbHZlciwgcmVqZWN0ZXIpIHtcclxuICAgIC8vICAgc3RyZWFtLm9uKCdlcnJvcicsIHJlamVjdGVyKTtcclxuICAgIC8vICAgc3RyZWFtLm9uKCdlbmQnLCByZXNvbHZlcik7XHJcbiAgICAvLyAgIHJldHVybiBjbGllbnRcclxuICAgIC8vICAgICAuX3F1ZXJ5KGNvbm5lY3Rpb24sIHNxbClcclxuICAgIC8vICAgICAudGhlbigob2JqKSA9PiBvYmoucmVzcG9uc2UpXHJcbiAgICAvLyAgICAgLnRoZW4oKHJvd3MpID0+IHJvd3MuZm9yRWFjaCgocm93KSA9PiBzdHJlYW0ud3JpdGUocm93KSkpXHJcbiAgICAvLyAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcclxuICAgIC8vICAgICAgIHN0cmVhbS5lbWl0KCdlcnJvcicsIGVycik7XHJcbiAgICAvLyAgICAgfSlcclxuICAgIC8vICAgICAudGhlbihmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyAgICAgICBzdHJlYW0uZW5kKCk7XHJcbiAgICAvLyAgICAgfSk7XHJcbiAgICAvLyB9KTtcclxuICB9LFxyXG5cclxuICAvLyBFbnN1cmVzIHRoZSByZXNwb25zZSBpcyByZXR1cm5lZCBpbiB0aGUgc2FtZSBmb3JtYXQgYXMgb3RoZXIgY2xpZW50cy5cclxuICBwcm9jZXNzUmVzcG9uc2Uob2JqLCBydW5uZXIpIHtcclxuICAgIGlmICghb2JqKSByZXR1cm47XHJcbiAgICBsZXQgeyByZXNwb25zZSB9ID0gb2JqO1xyXG5cclxuICAgIGNvbnN0IFtyb3dzLCBmaWVsZHNdID0gcmVzcG9uc2U7XHJcbiAgICB0aGlzLl9maXhCdWZmZXJTdHJpbmdzKHJvd3MsIGZpZWxkcyk7XHJcbiAgICByZXR1cm4gdGhpcy5fZml4QmxvYkNhbGxiYWNrcyhyb3dzLCBmaWVsZHMpO1xyXG4gIH0sXHJcblxyXG4gIF9maXhCdWZmZXJTdHJpbmdzKHJvd3MsIGZpZWxkcykge1xyXG4gICAgaWYgKCFyb3dzKSByZXR1cm4gcm93cztcclxuICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcclxuICAgICAgZm9yIChjb25zdCBjZWxsIGluIHJvdykge1xyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gcm93W2NlbGxdO1xyXG4gICAgICAgIGlmIChCdWZmZXIuaXNCdWZmZXIodmFsdWUpKSB7XHJcbiAgICAgICAgICBmb3IgKGNvbnN0IGZpZWxkIG9mIGZpZWxkcykge1xyXG4gICAgICAgICAgICBpZiAoZmllbGQuYWxpYXMgPT09IGNlbGwgJiZcclxuICAgICAgICAgICAgICAoZmllbGQudHlwZSA9PT0gNDQ4IHx8IGZpZWxkLnR5cGUgPT09IDQ1MikpIHsgLy8gU1FMVmFyU3RyaW5nXHJcbiAgICAgICAgICAgICAgcm93W2NlbGxdID0gdmFsdWUudG9TdHJpbmcoJ2xhdGluMScpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuICAvKiogICBcclxuICAqIFRoZSBGaXJlYmlyZCBsaWJyYXJ5IHJldHVybnMgQkxPTHMgd2l0aCBjYWxsYmFjayBmdW5jdGlvbnM7IFRob3NlIG5lZWQgdG8gYmUgbG9hZGVkIGFzeW5jaHJvbm91c2x5XHJcbiAgKiBAcGFyYW0geyp9IHJvd3MgXHJcbiAgKiBAcGFyYW0geyp9IGZpZWxkcyBcclxuICAqL1xyXG4gIF9maXhCbG9iQ2FsbGJhY2tzKHJvd3MsIGZpZWxkcykge1xyXG4gICAgaWYgKCFyb3dzKSByZXR1cm4gcm93cztcclxuXHJcbiAgICBjb25zdCBibG9iRW50cmllcyA9IFtdO1xyXG5cclxuICAgIC8vIFNlZWsgYW5kIHZlcmlmeSBpZiB0aGVyZSBpcyBhbnkgQkxPQlxyXG4gICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xyXG4gICAgICBmb3IgKGNvbnN0IGNlbGwgaW4gcm93KSB7XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSByb3dbY2VsbF07XHJcblxyXG4gICAgICAgIC8vIEFUU1RPRE86IEVzdMOhIHByZXN1bWluZG8gcXVlIG8gYmxvYiDDqSB0ZXh0bzsgcmVjb21lbmRhLXNlIGRpZmVyZW5jaWFyIHRleHRvIGRlIGJpbsOhcmlvLiBUYWx2ZXogbyBcImZpZWxkc1wiIGFqdWRlP1xyXG4gICAgICAgIC8vIElzIGl0IGEgY2FsbGJhY2sgQkxPQj9cclxuICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xyXG4gICAgICAgICAgYmxvYkVudHJpZXMucHVzaChuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHZhbHVlKChlcnIsIG5hbWUsIHN0cmVhbSkgPT4ge1xyXG4gICAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgLy8gQVRTVE9ETzogVmVyIGNvbW8gZmF6ZXIgcXVhbmRvIG8gc3RyaW5nIG7Do28gdGl2ZXIgbyBcInNldEVuY29kaW5nKClcIlxyXG4gICAgICAgICAgICAgIGlmICghc3RyZWFtWydzZXRFbmNvZGluZyddKSB7XHJcbiAgICAgICAgICAgICAgICBzdHJlYW1bJ3NldEVuY29kaW5nJ10gPSAoKSA9PiB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAvLyBBVFNUT0RPOiBOw6NvIGVzdMOhIGNvbnZlcnRlbmRvIG9zIGNhZGFjdGVyZXMgYWNlbnR1YWRvcyBjb3JyZXRhbWVudGUsIG1lc21vIGluZm9ybWFuZG8gYSBjb2RpZmljYcOnw6NvXHJcbiAgICAgICAgICAgICAgcmVzb2x2ZShyZWFkYWJsZVRvU3RyaW5nKHN0cmVhbSwgJ2xhdGluMScpLnRoZW4oYmxvYlN0cmluZyA9PiB7XHJcbiAgICAgICAgICAgICAgICByb3dbY2VsbF0gPSBibG9iU3RyaW5nO1xyXG4gICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBSZXR1cm5zIGEgUHJvbWlzZSB0aGF0IHdhaXQgQkxPQnMgYmUgbG9hZGVkIGFuZCByZXR1bnMgaXRcclxuICAgIHJldHVybiBQcm9taXNlLmFsbChibG9iRW50cmllcykudGhlbigoKSA9PiByb3dzKTtcclxuICB9LFxyXG5cclxuICBwb29sRGVmYXVsdHMoKSB7XHJcbiAgICByZXR1cm4gZGVmYXVsdHMoXHJcbiAgICAgIHsgbWluOiAxLCBtYXg6IDEgfSxcclxuICAgICAgQ2xpZW50LnByb3RvdHlwZS5wb29sRGVmYXVsdHMuY2FsbCh0aGlzKVxyXG4gICAgKTtcclxuICB9LFxyXG5cclxuICBwaW5nKHJlc291cmNlLCBjYWxsYmFjaykge1xyXG4gICAgcmVzb3VyY2UucXVlcnkoJ3NlbGVjdCAxIGZyb20gUkRCJERBVEFCQVNFJywgY2FsbGJhY2spO1xyXG4gIH0sXHJcbiAgLy8gZGRsKGNvbXBpbGVyLCBwcmFnbWEsIGNvbm5lY3Rpb24pIHtcclxuICAvLyAgIHJldHVybiBuZXcgU1FMaXRlM19EREwodGhpcywgY29tcGlsZXIsIHByYWdtYSwgY29ubmVjdGlvbik7XHJcbiAgLy8gfSxcclxuXHJcblxyXG4gIC8vIGZvcm1hdHRlcigpIHtcclxuICAvLyAgIHJldHVybiBuZXcgRmlyZWJpcmRfRm9ybWF0dGVyKHRoaXMsIC4uLmFyZ3VtZW50cyk7XHJcbiAgLy8gfSxcclxufSk7XHJcblxyXG5DbGllbnRfRmlyZWJpcmQuZGlhbGVjdCA9ICdmaXJlYmlyZCc7XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgQ2xpZW50X0ZpcmViaXJkO1xyXG4iXX0=