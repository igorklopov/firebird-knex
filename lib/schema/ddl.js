// Firebird_DDL
//
//
// columns and changing datatypes.
// -------

'use strict';

var _lodash = require('lodash');

Firebird_DDL = function (client, tableCompiler, pragma, connection) {
  undefined.client = client;
  undefined.tableCompiler = tableCompiler;
  undefined.pragma = pragma;
  undefined.tableNameRaw = undefined.tableCompiler.tableNameRaw;
  undefined.alteredName = _lodash.uniqueId('_knex_temp_alter');
  undefined.connection = connection;
  undefined.formatter = client && client.config && client.config.wrapIdentifier ? client.config.wrapIdentifier : function (value) {
    return value;
  };
};

Object.assign(Firebird_DDL.prototype, {
  tableName: function tableName() {
    return this.formatter(this.tableNameRaw, function (value) {
      return value;
    });
  },

  getColumn: function getColumn(column) {
    var currentCol;
    return regeneratorRuntime.async(function getColumn$(context$1$0) {
      var _this = this;

      while (1) switch (context$1$0.prev = context$1$0.next) {
        case 0:
          currentCol = _lodash.find(this.pragma, function (col) {
            return _this.client.wrapIdentifier(col.name).toLowerCase() === _this.client.wrapIdentifier(column).toLowerCase();
          });

          if (currentCol) {
            context$1$0.next = 3;
            break;
          }

          throw new Error('The column ' + column + ' is not in the ' + this.tableName() + ' table');

        case 3:
          return context$1$0.abrupt('return', currentCol);

        case 4:
        case 'end':
          return context$1$0.stop();
      }
    }, null, this);
  },

  getTableSql: function getTableSql() {
    var _this2 = this;

    this.trx.disableProcessing();
    return this.trx.raw('SELECT name, sql FROM sqlite_master WHERE type="table" AND name="' + this.tableName() + '"').then(function (result) {
      _this2.trx.enableProcessing();
      return result;
    });
  },

  renameTable: function renameTable() {
    return regeneratorRuntime.async(function renameTable$(context$1$0) {
      while (1) switch (context$1$0.prev = context$1$0.next) {
        case 0:
          return context$1$0.abrupt('return', this.trx.raw('ALTER TABLE "' + this.tableName() + '" RENAME TO "' + this.alteredName + '"'));

        case 1:
        case 'end':
          return context$1$0.stop();
      }
    }, null, this);
  },

  dropOriginal: function dropOriginal() {
    return this.trx.raw('DROP TABLE "' + this.tableName() + '"');
  },

  dropTempTable: function dropTempTable() {
    return this.trx.raw('DROP TABLE "' + this.alteredName + '"');
  },

  copyData: function copyData() {
    var _this3 = this;

    return this.trx.raw('SELECT * FROM "' + this.tableName() + '"').then(function (result) {
      return _this3.insertChunked(20, _this3.alteredName, _lodash.identity, result);
    });
  },

  reinsertData: function reinsertData(iterator) {
    var _this4 = this;

    return this.trx.raw('SELECT * FROM "' + this.alteredName + '"').then(function (result) {
      return _this4.insertChunked(20, _this4.tableName(), iterator, result);
    });
  },

  insertChunked: function insertChunked(chunkSize, target, iterator, result) {
    var chunked, _iterator, _isArray, _i, _ref, batch;

    return regeneratorRuntime.async(function insertChunked$(context$1$0) {
      while (1) switch (context$1$0.prev = context$1$0.next) {
        case 0:
          iterator = iterator || _lodash.identity;
          chunked = _lodash.chunk(result, chunkSize);
          _iterator = chunked, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();

        case 3:
          if (!_isArray) {
            context$1$0.next = 9;
            break;
          }

          if (!(_i >= _iterator.length)) {
            context$1$0.next = 6;
            break;
          }

          return context$1$0.abrupt('break', 18);

        case 6:
          _ref = _iterator[_i++];
          context$1$0.next = 13;
          break;

        case 9:
          _i = _iterator.next();

          if (!_i.done) {
            context$1$0.next = 12;
            break;
          }

          return context$1$0.abrupt('break', 18);

        case 12:
          _ref = _i.value;

        case 13:
          batch = _ref;
          context$1$0.next = 16;
          return regeneratorRuntime.awrap(this.trx.queryBuilder().table(target).insert(_lodash.map(batch, iterator)));

        case 16:
          context$1$0.next = 3;
          break;

        case 18:
        case 'end':
          return context$1$0.stop();
      }
    }, null, this);
  },

  createTempTable: function createTempTable(createTable) {
    return this.trx.raw(createTable.sql.replace(this.tableName(), this.alteredName));
  },

  _doReplace: function _doReplace(sql, from, to) {
    var oneLineSql = sql.replace(/\s+/g, ' ');
    var matched = oneLineSql.match(/^CREATE TABLE\s+(\S+)\s*\((.*)\)/);

    var tableName = matched[1];
    var defs = matched[2];

    if (!defs) {
      throw new Error('No column definitions in this statement!');
    }

    var parens = 0,
        args = [],
        ptr = 0;
    var i = 0;
    var x = defs.length;
    for (i = 0; i < x; i++) {
      switch (defs[i]) {
        case '(':
          parens++;
          break;
        case ')':
          parens--;
          break;
        case ',':
          if (parens === 0) {
            args.push(defs.slice(ptr, i));
            ptr = i + 1;
          }
          break;
        case ' ':
          if (ptr === i) {
            ptr = i + 1;
          }
          break;
      }
    }
    args.push(defs.slice(ptr, i));

    var fromIdentifier = from.replace(/[`"'[\]]/g, '');

    args = args.map(function (item) {
      var split = item.trim().split(' ');

      var fromMatchCandidates = [new RegExp('`' + fromIdentifier + '`', 'i'), new RegExp('"' + fromIdentifier + '"', 'i'), new RegExp('\'' + fromIdentifier + '\'', 'i'), new RegExp('\\[' + fromIdentifier + '\\]', 'i')];
      if (fromIdentifier.match(/^\S+$/)) {
        fromMatchCandidates.push(new RegExp('\\b' + fromIdentifier + '\\b', 'i'));
      }

      var doesMatchFromIdentifier = function doesMatchFromIdentifier(target) {
        return _lodash.some(fromMatchCandidates, function (c) {
          return target.match(c);
        });
      };

      var replaceFromIdentifier = function replaceFromIdentifier(target) {
        return fromMatchCandidates.reduce(function (result, candidate) {
          return result.replace(candidate, to);
        }, target);
      };

      if (doesMatchFromIdentifier(split[0])) {
        // column definition
        if (to) {
          split[0] = to;
          return split.join(' ');
        }
        return ''; // for deletions
      }

      // skip constraint name
      var idx = /constraint/i.test(split[0]) ? 2 : 0;

      // primary key and unique constraints have one or more
      // columns from this table listed between (); replace
      // one if it matches
      if (/primary|unique/i.test(split[idx])) {
        var ret = item.replace(/\(.*\)/, replaceFromIdentifier);
        // If any member columns are dropped then uniqueness/pk constraint
        // can not be retained
        if (ret !== item && _lodash.isEmpty(to)) return '';
        return ret;
      }

      // foreign keys have one or more columns from this table
      // listed between (); replace one if it matches
      // foreign keys also have a 'references' clause
      // which may reference THIS table; if it does, replace
      // column references in that too!
      if (/foreign/.test(split[idx])) {
        split = item.split(/ references /i);
        // the quoted column names save us from having to do anything
        // other than a straight replace here
        var replacedKeySpec = replaceFromIdentifier(split[0]);

        if (split[0] !== replacedKeySpec) {
          // If we are removing one or more columns of a foreign
          // key, then we should not retain the key at all
          if (_lodash.isEmpty(to)) return '';else split[0] = replacedKeySpec;
        }

        if (split[1].slice(0, tableName.length) === tableName) {
          // self-referential foreign key
          var replacedKeyTargetSpec = split[1].replace(/\(.*\)/, replaceFromIdentifier);
          if (split[1] !== replacedKeyTargetSpec) {
            // If we are removing one or more columns of a foreign
            // key, then we should not retain the key at all
            if (_lodash.isEmpty(to)) return '';else split[1] = replacedKeyTargetSpec;
          }
        }
        return split.join(' references ');
      }

      return item;
    });

    args = args.filter(_lodash.negate(_lodash.isEmpty));

    if (args.length === 0) {
      throw new Error('Unable to drop last column from table');
    }

    return oneLineSql.replace(/\(.*\)/, function () {
      return '(' + args.join(', ') + ')';
    }).replace(/,\s*([,)])/, '$1');
  },

  // Boy, this is quite a method.
  renameColumn: function renameColumn(from, to) {
    return regeneratorRuntime.async(function renameColumn$(context$1$0) {
      var _this5 = this;

      while (1) switch (context$1$0.prev = context$1$0.next) {
        case 0:
          return context$1$0.abrupt('return', this.client.transaction(function callee$1$0(trx) {
            var column, sql, a, b, createTable, newSql, _invert, mappedFrom, mappedTo;

            return regeneratorRuntime.async(function callee$1$0$(context$2$0) {
              while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                  this.trx = trx;
                  context$2$0.next = 3;
                  return regeneratorRuntime.awrap(this.getColumn(from));

                case 3:
                  column = context$2$0.sent;
                  context$2$0.next = 6;
                  return regeneratorRuntime.awrap(this.getTableSql(column));

                case 6:
                  sql = context$2$0.sent;
                  a = this.client.wrapIdentifier(from);
                  b = this.client.wrapIdentifier(to);
                  createTable = sql[0];
                  newSql = this._doReplace(createTable.sql, a, b);

                  if (!(sql === newSql)) {
                    context$2$0.next = 13;
                    break;
                  }

                  throw new Error('Unable to find the column to change');

                case 13:
                  _invert = _lodash.invert(this.client.postProcessResponse(_lodash.invert({
                    from: from,
                    to: to
                  })));
                  mappedFrom = _invert.from;
                  mappedTo = _invert.to;
                  return context$2$0.abrupt('return', this.reinsertMapped(createTable, newSql, function (row) {
                    row[mappedTo] = row[mappedFrom];
                    return _lodash.omit(row, mappedFrom);
                  }));

                case 17:
                case 'end':
                  return context$2$0.stop();
              }
            }, null, _this5);
          }, { connection: this.connection }));

        case 1:
        case 'end':
          return context$1$0.stop();
      }
    }, null, this);
  },

  dropColumn: function dropColumn(columns) {
    return regeneratorRuntime.async(function dropColumn$(context$1$0) {
      var _this6 = this;

      while (1) switch (context$1$0.prev = context$1$0.next) {
        case 0:
          return context$1$0.abrupt('return', this.client.transaction(function (trx) {
            _this6.trx = trx;
            return Promise.all(columns.map(function (column) {
              return _this6.getColumn(column);
            })).then(function () {
              return _this6.getTableSql();
            }).then(function (sql) {
              var createTable = sql[0];
              var newSql = createTable.sql;
              columns.forEach(function (column) {
                var a = _this6.client.wrapIdentifier(column);
                newSql = _this6._doReplace(newSql, a, '');
              });
              if (sql === newSql) {
                throw new Error('Unable to find the column to change');
              }
              var mappedColumns = Object.keys(_this6.client.postProcessResponse(_lodash.fromPairs(columns.map(function (column) {
                return [column, column];
              }))));
              return _this6.reinsertMapped(createTable, newSql, function (row) {
                return _lodash.omit.apply(undefined, [row].concat(mappedColumns));
              });
            });
          }, { connection: this.connection }));

        case 1:
        case 'end':
          return context$1$0.stop();
      }
    }, null, this);
  },

  reinsertMapped: function reinsertMapped(createTable, newSql, mapRow) {
    var _this7 = this;

    return Promise.resolve().then(function () {
      return _this7.createTempTable(createTable);
    }).then(function () {
      return _this7.copyData();
    }).then(function () {
      return _this7.dropOriginal();
    }).then(function () {
      return _this7.trx.raw(newSql);
    }).then(function () {
      return _this7.reinsertData(mapRow);
    }).then(function () {
      return _this7.dropTempTable();
    });
  }
});

module.exports = SQLite3_DDL;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUMsQ0FDM0IsSUFBSSxDQUFDO2FBQU0sT0FBSyxZQUFZLEVBQUU7S0FBQSxDQUFDLENBQy9CLElBQUksQ0FBQzthQUFNLE9BQUssR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7S0FBQSxDQUFDLENBQ2hDLElBQUksQ0FBQzthQUFNLE9BQUssWUFBWSxDQUFDLE1BQU0sQ0FBQztLQUFBLENBQUMsQ0FDckMsSUFBSSxDQUFDO2FBQU0sT0FBSyxhQUFhLEVBQUU7S0FBQSxDQUFDLENBQUM7R0FDckM7Q0FDRixDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUMiLCJmaWxlIjoiZGRsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gRmlyZWJpcmRfRERMXHJcbi8vXHJcbi8vIFxyXG4vLyBjb2x1bW5zIGFuZCBjaGFuZ2luZyBkYXRhdHlwZXMuXHJcbi8vIC0tLS0tLS1cclxuXHJcbmltcG9ydCB7ICBcclxuICB1bmlxdWVJZCxcclxuICBmaW5kLFxyXG4gIGlkZW50aXR5LFxyXG4gIG1hcCxcclxuICBvbWl0LFxyXG4gIGludmVydCxcclxuICBmcm9tUGFpcnMsXHJcbiAgc29tZSxcclxuICBuZWdhdGUsXHJcbiAgaXNFbXB0eSxcclxuICBjaHVuayxcclxufSBmcm9tICdsb2Rhc2gnO1xyXG5cclxuXHJcbkZpcmViaXJkX0RETCA9IChjbGllbnQsIHRhYmxlQ29tcGlsZXIsIHByYWdtYSwgY29ubmVjdGlvbikgPT4ge1xyXG4gIHRoaXMuY2xpZW50ID0gY2xpZW50O1xyXG4gIHRoaXMudGFibGVDb21waWxlciA9IHRhYmxlQ29tcGlsZXI7XHJcbiAgdGhpcy5wcmFnbWEgPSBwcmFnbWE7XHJcbiAgdGhpcy50YWJsZU5hbWVSYXcgPSB0aGlzLnRhYmxlQ29tcGlsZXIudGFibGVOYW1lUmF3O1xyXG4gIHRoaXMuYWx0ZXJlZE5hbWUgPSB1bmlxdWVJZCgnX2tuZXhfdGVtcF9hbHRlcicpO1xyXG4gIHRoaXMuY29ubmVjdGlvbiA9IGNvbm5lY3Rpb247XHJcbiAgdGhpcy5mb3JtYXR0ZXIgPVxyXG4gICAgY2xpZW50ICYmIGNsaWVudC5jb25maWcgJiYgY2xpZW50LmNvbmZpZy53cmFwSWRlbnRpZmllclxyXG4gICAgICA/IGNsaWVudC5jb25maWcud3JhcElkZW50aWZpZXJcclxuICAgICAgOiAodmFsdWUpID0+IHZhbHVlO1xyXG59XHJcblxyXG5PYmplY3QuYXNzaWduKEZpcmViaXJkX0RETC5wcm90b3R5cGUsIHtcclxuICB0YWJsZU5hbWUoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5mb3JtYXR0ZXIodGhpcy50YWJsZU5hbWVSYXcsICh2YWx1ZSkgPT4gdmFsdWUpO1xyXG4gIH0sXHJcblxyXG4gIGdldENvbHVtbjogYXN5bmMgZnVuY3Rpb24oY29sdW1uKSB7XHJcbiAgICBjb25zdCBjdXJyZW50Q29sID0gZmluZCh0aGlzLnByYWdtYSwgKGNvbCkgPT4ge1xyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIHRoaXMuY2xpZW50LndyYXBJZGVudGlmaWVyKGNvbC5uYW1lKS50b0xvd2VyQ2FzZSgpID09PVxyXG4gICAgICAgIHRoaXMuY2xpZW50LndyYXBJZGVudGlmaWVyKGNvbHVtbikudG9Mb3dlckNhc2UoKVxyXG4gICAgICApO1xyXG4gICAgfSk7XHJcbiAgICBpZiAoIWN1cnJlbnRDb2wpXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICBgVGhlIGNvbHVtbiAke2NvbHVtbn0gaXMgbm90IGluIHRoZSAke3RoaXMudGFibGVOYW1lKCl9IHRhYmxlYFxyXG4gICAgICApO1xyXG4gICAgcmV0dXJuIGN1cnJlbnRDb2w7XHJcbiAgfSxcclxuXHJcbiAgZ2V0VGFibGVTcWwoKSB7XHJcbiAgICB0aGlzLnRyeC5kaXNhYmxlUHJvY2Vzc2luZygpO1xyXG4gICAgcmV0dXJuIHRoaXMudHJ4XHJcbiAgICAgIC5yYXcoXHJcbiAgICAgICAgYFNFTEVDVCBuYW1lLCBzcWwgRlJPTSBzcWxpdGVfbWFzdGVyIFdIRVJFIHR5cGU9XCJ0YWJsZVwiIEFORCBuYW1lPVwiJHt0aGlzLnRhYmxlTmFtZSgpfVwiYFxyXG4gICAgICApXHJcbiAgICAgIC50aGVuKChyZXN1bHQpID0+IHtcclxuICAgICAgICB0aGlzLnRyeC5lbmFibGVQcm9jZXNzaW5nKCk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgcmVuYW1lVGFibGU6IGFzeW5jIGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudHJ4LnJhdyhcclxuICAgICAgYEFMVEVSIFRBQkxFIFwiJHt0aGlzLnRhYmxlTmFtZSgpfVwiIFJFTkFNRSBUTyBcIiR7dGhpcy5hbHRlcmVkTmFtZX1cImBcclxuICAgICk7XHJcbiAgfSxcclxuXHJcbiAgZHJvcE9yaWdpbmFsKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudHJ4LnJhdyhgRFJPUCBUQUJMRSBcIiR7dGhpcy50YWJsZU5hbWUoKX1cImApO1xyXG4gIH0sXHJcblxyXG4gIGRyb3BUZW1wVGFibGUoKSB7XHJcbiAgICByZXR1cm4gdGhpcy50cngucmF3KGBEUk9QIFRBQkxFIFwiJHt0aGlzLmFsdGVyZWROYW1lfVwiYCk7XHJcbiAgfSxcclxuXHJcbiAgY29weURhdGEoKSB7XHJcbiAgICByZXR1cm4gdGhpcy50cnhcclxuICAgICAgLnJhdyhgU0VMRUNUICogRlJPTSBcIiR7dGhpcy50YWJsZU5hbWUoKX1cImApXHJcbiAgICAgIC50aGVuKChyZXN1bHQpID0+XHJcbiAgICAgICAgdGhpcy5pbnNlcnRDaHVua2VkKDIwLCB0aGlzLmFsdGVyZWROYW1lLCBpZGVudGl0eSwgcmVzdWx0KVxyXG4gICAgICApO1xyXG4gIH0sXHJcblxyXG4gIHJlaW5zZXJ0RGF0YShpdGVyYXRvcikge1xyXG4gICAgcmV0dXJuIHRoaXMudHJ4XHJcbiAgICAgIC5yYXcoYFNFTEVDVCAqIEZST00gXCIke3RoaXMuYWx0ZXJlZE5hbWV9XCJgKVxyXG4gICAgICAudGhlbigocmVzdWx0KSA9PlxyXG4gICAgICAgIHRoaXMuaW5zZXJ0Q2h1bmtlZCgyMCwgdGhpcy50YWJsZU5hbWUoKSwgaXRlcmF0b3IsIHJlc3VsdClcclxuICAgICAgKTtcclxuICB9LFxyXG5cclxuICBhc3luYyBpbnNlcnRDaHVua2VkKGNodW5rU2l6ZSwgdGFyZ2V0LCBpdGVyYXRvciwgcmVzdWx0KSB7XHJcbiAgICBpdGVyYXRvciA9IGl0ZXJhdG9yIHx8IGlkZW50aXR5O1xyXG4gICAgY29uc3QgY2h1bmtlZCA9IGNodW5rKHJlc3VsdCwgY2h1bmtTaXplKTtcclxuICAgIGZvciAoY29uc3QgYmF0Y2ggb2YgY2h1bmtlZCkge1xyXG4gICAgICBhd2FpdCB0aGlzLnRyeFxyXG4gICAgICAgIC5xdWVyeUJ1aWxkZXIoKVxyXG4gICAgICAgIC50YWJsZSh0YXJnZXQpXHJcbiAgICAgICAgLmluc2VydChtYXAoYmF0Y2gsIGl0ZXJhdG9yKSk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgY3JlYXRlVGVtcFRhYmxlKGNyZWF0ZVRhYmxlKSB7XHJcbiAgICByZXR1cm4gdGhpcy50cngucmF3KFxyXG4gICAgICBjcmVhdGVUYWJsZS5zcWwucmVwbGFjZSh0aGlzLnRhYmxlTmFtZSgpLCB0aGlzLmFsdGVyZWROYW1lKVxyXG4gICAgKTtcclxuICB9LFxyXG5cclxuICBfZG9SZXBsYWNlKHNxbCwgZnJvbSwgdG8pIHtcclxuICAgIGNvbnN0IG9uZUxpbmVTcWwgPSBzcWwucmVwbGFjZSgvXFxzKy9nLCAnICcpO1xyXG4gICAgY29uc3QgbWF0Y2hlZCA9IG9uZUxpbmVTcWwubWF0Y2goL15DUkVBVEUgVEFCTEVcXHMrKFxcUyspXFxzKlxcKCguKilcXCkvKTtcclxuXHJcbiAgICBjb25zdCB0YWJsZU5hbWUgPSBtYXRjaGVkWzFdO1xyXG4gICAgY29uc3QgZGVmcyA9IG1hdGNoZWRbMl07XHJcblxyXG4gICAgaWYgKCFkZWZzKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gY29sdW1uIGRlZmluaXRpb25zIGluIHRoaXMgc3RhdGVtZW50IScpO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBwYXJlbnMgPSAwLFxyXG4gICAgICBhcmdzID0gW10sXHJcbiAgICAgIHB0ciA9IDA7XHJcbiAgICBsZXQgaSA9IDA7XHJcbiAgICBjb25zdCB4ID0gZGVmcy5sZW5ndGg7XHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgeDsgaSsrKSB7XHJcbiAgICAgIHN3aXRjaCAoZGVmc1tpXSkge1xyXG4gICAgICAgIGNhc2UgJygnOlxyXG4gICAgICAgICAgcGFyZW5zKys7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICcpJzpcclxuICAgICAgICAgIHBhcmVucy0tO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnLCc6XHJcbiAgICAgICAgICBpZiAocGFyZW5zID09PSAwKSB7XHJcbiAgICAgICAgICAgIGFyZ3MucHVzaChkZWZzLnNsaWNlKHB0ciwgaSkpO1xyXG4gICAgICAgICAgICBwdHIgPSBpICsgMTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJyAnOlxyXG4gICAgICAgICAgaWYgKHB0ciA9PT0gaSkge1xyXG4gICAgICAgICAgICBwdHIgPSBpICsgMTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBhcmdzLnB1c2goZGVmcy5zbGljZShwdHIsIGkpKTtcclxuXHJcbiAgICBjb25zdCBmcm9tSWRlbnRpZmllciA9IGZyb20ucmVwbGFjZSgvW2BcIidbXFxdXS9nLCAnJyk7XHJcblxyXG4gICAgYXJncyA9IGFyZ3MubWFwKChpdGVtKSA9PiB7XHJcbiAgICAgIGxldCBzcGxpdCA9IGl0ZW0udHJpbSgpLnNwbGl0KCcgJyk7XHJcblxyXG4gICAgICBcclxuICAgICAgY29uc3QgZnJvbU1hdGNoQ2FuZGlkYXRlcyA9IFtcclxuICAgICAgICBuZXcgUmVnRXhwKGBcXGAke2Zyb21JZGVudGlmaWVyfVxcYGAsICdpJyksXHJcbiAgICAgICAgbmV3IFJlZ0V4cChgXCIke2Zyb21JZGVudGlmaWVyfVwiYCwgJ2knKSxcclxuICAgICAgICBuZXcgUmVnRXhwKGAnJHtmcm9tSWRlbnRpZmllcn0nYCwgJ2knKSxcclxuICAgICAgICBuZXcgUmVnRXhwKGBcXFxcWyR7ZnJvbUlkZW50aWZpZXJ9XFxcXF1gLCAnaScpLFxyXG4gICAgICBdO1xyXG4gICAgICBpZiAoZnJvbUlkZW50aWZpZXIubWF0Y2goL15cXFMrJC8pKSB7XHJcbiAgICAgICAgZnJvbU1hdGNoQ2FuZGlkYXRlcy5wdXNoKG5ldyBSZWdFeHAoYFxcXFxiJHtmcm9tSWRlbnRpZmllcn1cXFxcYmAsICdpJykpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBkb2VzTWF0Y2hGcm9tSWRlbnRpZmllciA9ICh0YXJnZXQpID0+XHJcbiAgICAgICAgc29tZShmcm9tTWF0Y2hDYW5kaWRhdGVzLCAoYykgPT4gdGFyZ2V0Lm1hdGNoKGMpKTtcclxuXHJcbiAgICAgIGNvbnN0IHJlcGxhY2VGcm9tSWRlbnRpZmllciA9ICh0YXJnZXQpID0+XHJcbiAgICAgICAgZnJvbU1hdGNoQ2FuZGlkYXRlcy5yZWR1Y2UoXHJcbiAgICAgICAgICAocmVzdWx0LCBjYW5kaWRhdGUpID0+IHJlc3VsdC5yZXBsYWNlKGNhbmRpZGF0ZSwgdG8pLFxyXG4gICAgICAgICAgdGFyZ2V0XHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgIGlmIChkb2VzTWF0Y2hGcm9tSWRlbnRpZmllcihzcGxpdFswXSkpIHtcclxuICAgICAgICAvLyBjb2x1bW4gZGVmaW5pdGlvblxyXG4gICAgICAgIGlmICh0bykge1xyXG4gICAgICAgICAgc3BsaXRbMF0gPSB0bztcclxuICAgICAgICAgIHJldHVybiBzcGxpdC5qb2luKCcgJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAnJzsgLy8gZm9yIGRlbGV0aW9uc1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBza2lwIGNvbnN0cmFpbnQgbmFtZVxyXG4gICAgICBjb25zdCBpZHggPSAvY29uc3RyYWludC9pLnRlc3Qoc3BsaXRbMF0pID8gMiA6IDA7XHJcblxyXG4gICAgICAvLyBwcmltYXJ5IGtleSBhbmQgdW5pcXVlIGNvbnN0cmFpbnRzIGhhdmUgb25lIG9yIG1vcmVcclxuICAgICAgLy8gY29sdW1ucyBmcm9tIHRoaXMgdGFibGUgbGlzdGVkIGJldHdlZW4gKCk7IHJlcGxhY2VcclxuICAgICAgLy8gb25lIGlmIGl0IG1hdGNoZXNcclxuICAgICAgaWYgKC9wcmltYXJ5fHVuaXF1ZS9pLnRlc3Qoc3BsaXRbaWR4XSkpIHtcclxuICAgICAgICBjb25zdCByZXQgPSBpdGVtLnJlcGxhY2UoL1xcKC4qXFwpLywgcmVwbGFjZUZyb21JZGVudGlmaWVyKTtcclxuICAgICAgICAvLyBJZiBhbnkgbWVtYmVyIGNvbHVtbnMgYXJlIGRyb3BwZWQgdGhlbiB1bmlxdWVuZXNzL3BrIGNvbnN0cmFpbnRcclxuICAgICAgICAvLyBjYW4gbm90IGJlIHJldGFpbmVkXHJcbiAgICAgICAgaWYgKHJldCAhPT0gaXRlbSAmJiBpc0VtcHR5KHRvKSkgcmV0dXJuICcnO1xyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGZvcmVpZ24ga2V5cyBoYXZlIG9uZSBvciBtb3JlIGNvbHVtbnMgZnJvbSB0aGlzIHRhYmxlXHJcbiAgICAgIC8vIGxpc3RlZCBiZXR3ZWVuICgpOyByZXBsYWNlIG9uZSBpZiBpdCBtYXRjaGVzXHJcbiAgICAgIC8vIGZvcmVpZ24ga2V5cyBhbHNvIGhhdmUgYSAncmVmZXJlbmNlcycgY2xhdXNlXHJcbiAgICAgIC8vIHdoaWNoIG1heSByZWZlcmVuY2UgVEhJUyB0YWJsZTsgaWYgaXQgZG9lcywgcmVwbGFjZVxyXG4gICAgICAvLyBjb2x1bW4gcmVmZXJlbmNlcyBpbiB0aGF0IHRvbyFcclxuICAgICAgaWYgKC9mb3JlaWduLy50ZXN0KHNwbGl0W2lkeF0pKSB7XHJcbiAgICAgICAgc3BsaXQgPSBpdGVtLnNwbGl0KC8gcmVmZXJlbmNlcyAvaSk7XHJcbiAgICAgICAgLy8gdGhlIHF1b3RlZCBjb2x1bW4gbmFtZXMgc2F2ZSB1cyBmcm9tIGhhdmluZyB0byBkbyBhbnl0aGluZ1xyXG4gICAgICAgIC8vIG90aGVyIHRoYW4gYSBzdHJhaWdodCByZXBsYWNlIGhlcmVcclxuICAgICAgICBjb25zdCByZXBsYWNlZEtleVNwZWMgPSByZXBsYWNlRnJvbUlkZW50aWZpZXIoc3BsaXRbMF0pO1xyXG5cclxuICAgICAgICBpZiAoc3BsaXRbMF0gIT09IHJlcGxhY2VkS2V5U3BlYykge1xyXG4gICAgICAgICAgLy8gSWYgd2UgYXJlIHJlbW92aW5nIG9uZSBvciBtb3JlIGNvbHVtbnMgb2YgYSBmb3JlaWduXHJcbiAgICAgICAgICAvLyBrZXksIHRoZW4gd2Ugc2hvdWxkIG5vdCByZXRhaW4gdGhlIGtleSBhdCBhbGxcclxuICAgICAgICAgIGlmIChpc0VtcHR5KHRvKSkgcmV0dXJuICcnO1xyXG4gICAgICAgICAgZWxzZSBzcGxpdFswXSA9IHJlcGxhY2VkS2V5U3BlYztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzcGxpdFsxXS5zbGljZSgwLCB0YWJsZU5hbWUubGVuZ3RoKSA9PT0gdGFibGVOYW1lKSB7XHJcbiAgICAgICAgICAvLyBzZWxmLXJlZmVyZW50aWFsIGZvcmVpZ24ga2V5XHJcbiAgICAgICAgICBjb25zdCByZXBsYWNlZEtleVRhcmdldFNwZWMgPSBzcGxpdFsxXS5yZXBsYWNlKFxyXG4gICAgICAgICAgICAvXFwoLipcXCkvLFxyXG4gICAgICAgICAgICByZXBsYWNlRnJvbUlkZW50aWZpZXJcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgICBpZiAoc3BsaXRbMV0gIT09IHJlcGxhY2VkS2V5VGFyZ2V0U3BlYykge1xyXG4gICAgICAgICAgICAvLyBJZiB3ZSBhcmUgcmVtb3Zpbmcgb25lIG9yIG1vcmUgY29sdW1ucyBvZiBhIGZvcmVpZ25cclxuICAgICAgICAgICAgLy8ga2V5LCB0aGVuIHdlIHNob3VsZCBub3QgcmV0YWluIHRoZSBrZXkgYXQgYWxsXHJcbiAgICAgICAgICAgIGlmIChpc0VtcHR5KHRvKSkgcmV0dXJuICcnO1xyXG4gICAgICAgICAgICBlbHNlIHNwbGl0WzFdID0gcmVwbGFjZWRLZXlUYXJnZXRTcGVjO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc3BsaXQuam9pbignIHJlZmVyZW5jZXMgJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBpdGVtO1xyXG4gICAgfSk7XHJcblxyXG4gICAgYXJncyA9IGFyZ3MuZmlsdGVyKG5lZ2F0ZShpc0VtcHR5KSk7XHJcblxyXG4gICAgaWYgKGFyZ3MubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIGRyb3AgbGFzdCBjb2x1bW4gZnJvbSB0YWJsZScpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBvbmVMaW5lU3FsXHJcbiAgICAgIC5yZXBsYWNlKC9cXCguKlxcKS8sICgpID0+IGAoJHthcmdzLmpvaW4oJywgJyl9KWApXHJcbiAgICAgIC5yZXBsYWNlKC8sXFxzKihbLCldKS8sICckMScpO1xyXG4gIH0sXHJcblxyXG4gIC8vIEJveSwgdGhpcyBpcyBxdWl0ZSBhIG1ldGhvZC5cclxuICByZW5hbWVDb2x1bW46IGFzeW5jIGZ1bmN0aW9uKGZyb20sIHRvKSB7XHJcbiAgICByZXR1cm4gdGhpcy5jbGllbnQudHJhbnNhY3Rpb24oXHJcbiAgICAgIGFzeW5jICh0cngpID0+IHtcclxuICAgICAgICB0aGlzLnRyeCA9IHRyeDtcclxuICAgICAgICBjb25zdCBjb2x1bW4gPSBhd2FpdCB0aGlzLmdldENvbHVtbihmcm9tKTtcclxuICAgICAgICBjb25zdCBzcWwgPSBhd2FpdCB0aGlzLmdldFRhYmxlU3FsKGNvbHVtbik7XHJcbiAgICAgICAgY29uc3QgYSA9IHRoaXMuY2xpZW50LndyYXBJZGVudGlmaWVyKGZyb20pO1xyXG4gICAgICAgIGNvbnN0IGIgPSB0aGlzLmNsaWVudC53cmFwSWRlbnRpZmllcih0byk7XHJcbiAgICAgICAgY29uc3QgY3JlYXRlVGFibGUgPSBzcWxbMF07XHJcbiAgICAgICAgY29uc3QgbmV3U3FsID0gdGhpcy5fZG9SZXBsYWNlKGNyZWF0ZVRhYmxlLnNxbCwgYSwgYik7XHJcbiAgICAgICAgaWYgKHNxbCA9PT0gbmV3U3FsKSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBmaW5kIHRoZSBjb2x1bW4gdG8gY2hhbmdlJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB7IGZyb206IG1hcHBlZEZyb20sIHRvOiBtYXBwZWRUbyB9ID0gaW52ZXJ0KFxyXG4gICAgICAgICAgdGhpcy5jbGllbnQucG9zdFByb2Nlc3NSZXNwb25zZShcclxuICAgICAgICAgICAgaW52ZXJ0KHtcclxuICAgICAgICAgICAgICBmcm9tLFxyXG4gICAgICAgICAgICAgIHRvLFxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLnJlaW5zZXJ0TWFwcGVkKGNyZWF0ZVRhYmxlLCBuZXdTcWwsIChyb3cpID0+IHtcclxuICAgICAgICAgIHJvd1ttYXBwZWRUb10gPSByb3dbbWFwcGVkRnJvbV07XHJcbiAgICAgICAgICByZXR1cm4gb21pdChyb3csIG1hcHBlZEZyb20pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9LFxyXG4gICAgICB7IGNvbm5lY3Rpb246IHRoaXMuY29ubmVjdGlvbiB9XHJcbiAgICApO1xyXG4gIH0sXHJcblxyXG4gIGRyb3BDb2x1bW46IGFzeW5jIGZ1bmN0aW9uKGNvbHVtbnMpIHtcclxuICAgIHJldHVybiB0aGlzLmNsaWVudC50cmFuc2FjdGlvbihcclxuICAgICAgKHRyeCkgPT4ge1xyXG4gICAgICAgIHRoaXMudHJ4ID0gdHJ4O1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChjb2x1bW5zLm1hcCgoY29sdW1uKSA9PiB0aGlzLmdldENvbHVtbihjb2x1bW4pKSlcclxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuZ2V0VGFibGVTcWwoKSlcclxuICAgICAgICAgIC50aGVuKChzcWwpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgY3JlYXRlVGFibGUgPSBzcWxbMF07XHJcbiAgICAgICAgICAgIGxldCBuZXdTcWwgPSBjcmVhdGVUYWJsZS5zcWw7XHJcbiAgICAgICAgICAgIGNvbHVtbnMuZm9yRWFjaCgoY29sdW1uKSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc3QgYSA9IHRoaXMuY2xpZW50LndyYXBJZGVudGlmaWVyKGNvbHVtbik7XHJcbiAgICAgICAgICAgICAgbmV3U3FsID0gdGhpcy5fZG9SZXBsYWNlKG5ld1NxbCwgYSwgJycpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgaWYgKHNxbCA9PT0gbmV3U3FsKSB7XHJcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gZmluZCB0aGUgY29sdW1uIHRvIGNoYW5nZScpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IG1hcHBlZENvbHVtbnMgPSBPYmplY3Qua2V5cyhcclxuICAgICAgICAgICAgICB0aGlzLmNsaWVudC5wb3N0UHJvY2Vzc1Jlc3BvbnNlKFxyXG4gICAgICAgICAgICAgICAgZnJvbVBhaXJzKGNvbHVtbnMubWFwKChjb2x1bW4pID0+IFtjb2x1bW4sIGNvbHVtbl0pKVxyXG4gICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVpbnNlcnRNYXBwZWQoY3JlYXRlVGFibGUsIG5ld1NxbCwgKHJvdykgPT5cclxuICAgICAgICAgICAgICBvbWl0KHJvdywgLi4ubWFwcGVkQ29sdW1ucylcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICB9LFxyXG4gICAgICB7IGNvbm5lY3Rpb246IHRoaXMuY29ubmVjdGlvbiB9XHJcbiAgICApO1xyXG4gIH0sXHJcblxyXG4gIHJlaW5zZXJ0TWFwcGVkKGNyZWF0ZVRhYmxlLCBuZXdTcWwsIG1hcFJvdykge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgIC50aGVuKCgpID0+IHRoaXMuY3JlYXRlVGVtcFRhYmxlKGNyZWF0ZVRhYmxlKSlcclxuICAgICAgLnRoZW4oKCkgPT4gdGhpcy5jb3B5RGF0YSgpKVxyXG4gICAgICAudGhlbigoKSA9PiB0aGlzLmRyb3BPcmlnaW5hbCgpKVxyXG4gICAgICAudGhlbigoKSA9PiB0aGlzLnRyeC5yYXcobmV3U3FsKSlcclxuICAgICAgLnRoZW4oKCkgPT4gdGhpcy5yZWluc2VydERhdGEobWFwUm93KSlcclxuICAgICAgLnRoZW4oKCkgPT4gdGhpcy5kcm9wVGVtcFRhYmxlKCkpO1xyXG4gIH0sXHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTUUxpdGUzX0RETDtcclxuIl19