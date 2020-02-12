// Firebird Query Builder & Compiler
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _knexLibQueryCompiler = require("knex/lib/query/compiler");

var _knexLibQueryCompiler2 = _interopRequireDefault(_knexLibQueryCompiler);

function QueryCompiler_Firebird(client, builder) {
  _knexLibQueryCompiler2['default'].call(this, client, builder);
}
_inherits2['default'](QueryCompiler_Firebird, _knexLibQueryCompiler2['default']);

Object.assign(QueryCompiler_Firebird.prototype, {

  // TODO probably buggy. test it

  // limit 5           -> rows 1 to 5   - or just rows 5
  // limit 5 offset  0 -> rows 1 to 5   - or just rows 5
  // limit 5 offset 10 -> rows 11 to 15
  //         offset 10 -> rows 11 to very big value
  //         offset  0 -> nothing

  _calcRows: function _calcRows() {
    var _single = this.single;
    var limit = _single.limit;
    var offset = _single.offset;

    if (!limit && limit !== 0) {
      if (!offset) return [];
      return [offset + 1, 1 << 30];
    } else {
      if (!offset) return [limit];
      return [offset + 1, offset + limit];
    }
  },

  limit: function limit() {
    var rows = this._calcRows()[0];
    if (rows === undefined) return;
    return 'rows ' + this.formatter.parameter(rows);
  },

  offset: function offset() {
    var to = this._calcRows()[1];
    if (to === undefined) return;
    return 'to ' + this.formatter.parameter(to);
  },

  _prepInsert: function _prepInsert(insertValues) {
    var newValues = {};
    for (var key in insertValues) {
      var value = insertValues[key];
      if (typeof value !== 'undefined') {
        newValues[key] = value;
      }
    }
    return _knexLibQueryCompiler2['default'].prototype._prepInsert.call(this, newValues);
  }

});

exports['default'] = QueryCompiler_Firebird;

// const {
//   assign,
//   each,
//   isEmpty,
//   isString,
//   noop,
//   reduce,
//   identity,
// } = require('lodash');

// function QueryCompiler_SQLite3(client, builder) {
//   QueryCompiler.call(this, client, builder);

//   const { returning } = this.single;

//   if (returning) {
//     this.client.logger.warn(
//       '.returning() is not supported by sqlite3 and will not have any effect.'
//     );
//   }
// }

// inherits(QueryCompiler_SQLite3, QueryCompiler);

// assign(QueryCompiler_SQLite3.prototype, {
//   // The locks are not applicable in SQLite3
//   forShare: emptyStr,

//   forUpdate: emptyStr,

//   // SQLite requires us to build the multi-row insert as a listing of select with
//   // unions joining them together. So we'll build out this list of columns and
//   // then join them all together with select unions to complete the queries.
//   insert() {
//     const insertValues = this.single.insert || [];
//     let sql = this.with() + `insert into ${this.tableName} `;

//     if (Array.isArray(insertValues)) {
//       if (insertValues.length === 0) {
//         return '';
//       } else if (
//         insertValues.length === 1 &&
//         insertValues[0] &&
//         isEmpty(insertValues[0])
//       ) {
//         return sql + this._emptyInsertValue;
//       }
//     } else if (typeof insertValues === 'object' && isEmpty(insertValues)) {
//       return sql + this._emptyInsertValue;
//     }

//     const insertData = this._prepInsert(insertValues);

//     if (isString(insertData)) {
//       return sql + insertData;
//     }

//     if (insertData.columns.length === 0) {
//       return '';
//     }

//     sql += `(${this.formatter.columnize(insertData.columns)})`;

//     // backwards compatible error
//     if (this.client.valueForUndefined !== null) {
//       each(insertData.values, (bindings) => {
//         each(bindings, (binding) => {
//           if (binding === undefined)
//             throw new TypeError(
//               '`sqlite` does not support inserting default values. Specify ' +
//                 'values explicitly or use the `useNullAsDefault` config flag. ' +
//                 '(see docs http://knexjs.org/#Builder-insert).'
//             );
//         });
//       });
//     }

//     if (insertData.values.length === 1) {
//       const parameters = this.formatter.parameterize(
//         insertData.values[0],
//         this.client.valueForUndefined
//       );
//       return sql + ` values (${parameters})`;
//     }

//     const blocks = [];
//     let i = -1;
//     while (++i < insertData.values.length) {
//       let i2 = -1;
//       const block = (blocks[i] = []);
//       let current = insertData.values[i];
//       current = current === undefined ? this.client.valueForUndefined : current;
//       while (++i2 < insertData.columns.length) {
//         block.push(
//           this.formatter.alias(
//             this.formatter.parameter(current[i2]),
//             this.formatter.wrap(insertData.columns[i2])
//           )
//         );
//       }
//       blocks[i] = block.join(', ');
//     }
//     return sql + ' select ' + blocks.join(' union all select ');
//   },

//   // Compile a truncate table statement into SQL.
//   truncate() {
//     const { table } = this.single;
//     return {
//       sql: `delete from ${this.tableName}`,
//       output() {
//         return this.query({
//           sql: `delete from sqlite_sequence where name = '${table}'`,
//         }).catch(noop);
//       },
//     };
//   },

//   // Compiles a `columnInfo` query
//   columnInfo() {
//     const column = this.single.columnInfo;

//     // The user may have specified a custom wrapIdentifier function in the config. We
//     // need to run the identifiers through that function, but not format them as
//     // identifiers otherwise.
//     const table = this.client.customWrapIdentifier(this.single.table, identity);

//     return {
//       sql: `PRAGMA table_info(\`${table}\`)`,
//       output(resp) {
//         const maxLengthRegex = /.*\((\d+)\)/;
//         const out = reduce(
//           resp,
//           function(columns, val) {
//             let { type } = val;
//             let maxLength = type.match(maxLengthRegex);
//             if (maxLength) {
//               maxLength = maxLength[1];
//             }
//             type = maxLength ? type.split('(')[0] : type;
//             columns[val.name] = {
//               type: type.toLowerCase(),
//               maxLength,
//               nullable: !val.notnull,
//               defaultValue: val.dflt_value,
//             };
//             return columns;
//           },
//           {}
//         );
//         return (column && out[column]) || out;
//       },
//     };
//   },

//   limit() {
//     const noLimit = !this.single.limit && this.single.limit !== 0;
//     if (noLimit && !this.single.offset) return '';

//     // Workaround for offset only,
//     // see http://stackoverflow.com/questions/10491492/sqllite-with-skip-offset-only-not-limit
//     return `limit ${this.formatter.parameter(
//       noLimit ? -1 : this.single.limit
//     )}`;
//   },
// });

// function emptyStr() {
//   return '';
// }

// module.exports = QueryCompiler_SQLite3;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9xdWVyeS9jb21waWxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7O3dCQUNxQixVQUFVOzs7O29DQUNMLHlCQUF5Qjs7OztBQUVuRCxTQUFTLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUU7QUFDL0Msb0NBQWMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7Q0FDM0M7QUFDRCxzQkFBUyxzQkFBc0Isb0NBQWdCLENBQUM7O0FBRWhELE1BQU0sQ0FBQyxNQUFNLENBQUMsc0JBQXNCLENBQUMsU0FBUyxFQUFFOzs7Ozs7Ozs7O0FBVTlDLFdBQVMsRUFBQSxxQkFBRztrQkFDZ0IsSUFBSSxDQUFDLE1BQU07UUFBN0IsS0FBSyxXQUFMLEtBQUs7UUFBRSxNQUFNLFdBQU4sTUFBTTs7QUFDckIsUUFBSSxDQUFDLEtBQUssSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFO0FBQ3pCLFVBQUksQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUM7QUFDdkIsYUFBTyxDQUFFLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBRSxDQUFDO0tBQ2hDLE1BQU07QUFDTCxVQUFJLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBRSxLQUFLLENBQUUsQ0FBQztBQUM5QixhQUFPLENBQUUsTUFBTSxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsS0FBSyxDQUFFLENBQUM7S0FDdkM7R0FDRjs7QUFFRCxPQUFLLEVBQUEsaUJBQUc7QUFDTixRQUFNLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakMsUUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFLE9BQU87QUFDL0IsV0FBTyxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7R0FDakQ7O0FBRUQsUUFBTSxFQUFBLGtCQUFHO0FBQ1AsUUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CLFFBQUksRUFBRSxLQUFLLFNBQVMsRUFBRSxPQUFPO0FBQzdCLFdBQU8sS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0dBQzdDOztBQUVELGFBQVcsRUFBQSxxQkFBQyxZQUFZLEVBQUU7QUFDeEIsUUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDO0FBQ3JCLFNBQUssSUFBTSxHQUFHLElBQUksWUFBWSxFQUFFO0FBQzlCLFVBQU0sS0FBSyxHQUFHLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNoQyxVQUFJLE9BQU8sS0FBSyxLQUFLLFdBQVcsRUFBRTtBQUNoQyxpQkFBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQztPQUN4QjtLQUNGO0FBQ0QsV0FBTyxrQ0FBYyxTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7R0FDbEU7O0NBRUYsQ0FBQyxDQUFDOztxQkFFWSxzQkFBc0IiLCJmaWxlIjoiY29tcGlsZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBGaXJlYmlyZCBRdWVyeSBCdWlsZGVyICYgQ29tcGlsZXJcclxuaW1wb3J0IGluaGVyaXRzIGZyb20gJ2luaGVyaXRzJztcclxuaW1wb3J0IFF1ZXJ5Q29tcGlsZXIgZnJvbSBcImtuZXgvbGliL3F1ZXJ5L2NvbXBpbGVyXCI7XHJcblxyXG5mdW5jdGlvbiBRdWVyeUNvbXBpbGVyX0ZpcmViaXJkKGNsaWVudCwgYnVpbGRlcikge1xyXG4gIFF1ZXJ5Q29tcGlsZXIuY2FsbCh0aGlzLCBjbGllbnQsIGJ1aWxkZXIpO1xyXG59XHJcbmluaGVyaXRzKFF1ZXJ5Q29tcGlsZXJfRmlyZWJpcmQsIFF1ZXJ5Q29tcGlsZXIpO1xyXG5cclxuT2JqZWN0LmFzc2lnbihRdWVyeUNvbXBpbGVyX0ZpcmViaXJkLnByb3RvdHlwZSwge1xyXG5cclxuICAvLyBUT0RPIHByb2JhYmx5IGJ1Z2d5LiB0ZXN0IGl0XHJcblxyXG4gIC8vIGxpbWl0IDUgICAgICAgICAgIC0+IHJvd3MgMSB0byA1ICAgLSBvciBqdXN0IHJvd3MgNVxyXG4gIC8vIGxpbWl0IDUgb2Zmc2V0ICAwIC0+IHJvd3MgMSB0byA1ICAgLSBvciBqdXN0IHJvd3MgNVxyXG4gIC8vIGxpbWl0IDUgb2Zmc2V0IDEwIC0+IHJvd3MgMTEgdG8gMTVcclxuICAvLyAgICAgICAgIG9mZnNldCAxMCAtPiByb3dzIDExIHRvIHZlcnkgYmlnIHZhbHVlXHJcbiAgLy8gICAgICAgICBvZmZzZXQgIDAgLT4gbm90aGluZ1xyXG5cclxuICBfY2FsY1Jvd3MoKSB7XHJcbiAgICBjb25zdCB7IGxpbWl0LCBvZmZzZXQgfSA9IHRoaXMuc2luZ2xlO1xyXG4gICAgaWYgKCFsaW1pdCAmJiBsaW1pdCAhPT0gMCkge1xyXG4gICAgICBpZiAoIW9mZnNldCkgcmV0dXJuIFtdO1xyXG4gICAgICByZXR1cm4gWyBvZmZzZXQgKyAxLCAxIDw8IDMwIF07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAoIW9mZnNldCkgcmV0dXJuIFsgbGltaXQgXTtcclxuICAgICAgcmV0dXJuIFsgb2Zmc2V0ICsgMSwgb2Zmc2V0ICsgbGltaXQgXTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBsaW1pdCgpIHtcclxuICAgIGNvbnN0IHJvd3MgPSB0aGlzLl9jYWxjUm93cygpWzBdO1xyXG4gICAgaWYgKHJvd3MgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xyXG4gICAgcmV0dXJuICdyb3dzICcgKyB0aGlzLmZvcm1hdHRlci5wYXJhbWV0ZXIocm93cyk7XHJcbiAgfSxcclxuXHJcbiAgb2Zmc2V0KCkge1xyXG4gICAgY29uc3QgdG8gPSB0aGlzLl9jYWxjUm93cygpWzFdO1xyXG4gICAgaWYgKHRvID09PSB1bmRlZmluZWQpIHJldHVybjtcclxuICAgIHJldHVybiAndG8gJyArIHRoaXMuZm9ybWF0dGVyLnBhcmFtZXRlcih0byk7XHJcbiAgfSxcclxuXHJcbiAgX3ByZXBJbnNlcnQoaW5zZXJ0VmFsdWVzKSB7XHJcbiAgICBjb25zdCBuZXdWYWx1ZXMgPSB7fTtcclxuICAgIGZvciAoY29uc3Qga2V5IGluIGluc2VydFZhbHVlcykge1xyXG4gICAgICBjb25zdCB2YWx1ZSA9IGluc2VydFZhbHVlc1trZXldO1xyXG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIG5ld1ZhbHVlc1trZXldID0gdmFsdWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBRdWVyeUNvbXBpbGVyLnByb3RvdHlwZS5fcHJlcEluc2VydC5jYWxsKHRoaXMsIG5ld1ZhbHVlcyk7XHJcbiAgfVxyXG5cclxufSk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBRdWVyeUNvbXBpbGVyX0ZpcmViaXJkO1xyXG5cclxuXHJcbi8vIGNvbnN0IHtcclxuLy8gICBhc3NpZ24sXHJcbi8vICAgZWFjaCxcclxuLy8gICBpc0VtcHR5LFxyXG4vLyAgIGlzU3RyaW5nLFxyXG4vLyAgIG5vb3AsXHJcbi8vICAgcmVkdWNlLFxyXG4vLyAgIGlkZW50aXR5LFxyXG4vLyB9ID0gcmVxdWlyZSgnbG9kYXNoJyk7XHJcblxyXG4vLyBmdW5jdGlvbiBRdWVyeUNvbXBpbGVyX1NRTGl0ZTMoY2xpZW50LCBidWlsZGVyKSB7XHJcbi8vICAgUXVlcnlDb21waWxlci5jYWxsKHRoaXMsIGNsaWVudCwgYnVpbGRlcik7XHJcblxyXG4vLyAgIGNvbnN0IHsgcmV0dXJuaW5nIH0gPSB0aGlzLnNpbmdsZTtcclxuXHJcbi8vICAgaWYgKHJldHVybmluZykge1xyXG4vLyAgICAgdGhpcy5jbGllbnQubG9nZ2VyLndhcm4oXHJcbi8vICAgICAgICcucmV0dXJuaW5nKCkgaXMgbm90IHN1cHBvcnRlZCBieSBzcWxpdGUzIGFuZCB3aWxsIG5vdCBoYXZlIGFueSBlZmZlY3QuJ1xyXG4vLyAgICAgKTtcclxuLy8gICB9XHJcbi8vIH1cclxuXHJcbi8vIGluaGVyaXRzKFF1ZXJ5Q29tcGlsZXJfU1FMaXRlMywgUXVlcnlDb21waWxlcik7XHJcblxyXG4vLyBhc3NpZ24oUXVlcnlDb21waWxlcl9TUUxpdGUzLnByb3RvdHlwZSwge1xyXG4vLyAgIC8vIFRoZSBsb2NrcyBhcmUgbm90IGFwcGxpY2FibGUgaW4gU1FMaXRlM1xyXG4vLyAgIGZvclNoYXJlOiBlbXB0eVN0cixcclxuXHJcbi8vICAgZm9yVXBkYXRlOiBlbXB0eVN0cixcclxuXHJcbi8vICAgLy8gU1FMaXRlIHJlcXVpcmVzIHVzIHRvIGJ1aWxkIHRoZSBtdWx0aS1yb3cgaW5zZXJ0IGFzIGEgbGlzdGluZyBvZiBzZWxlY3Qgd2l0aFxyXG4vLyAgIC8vIHVuaW9ucyBqb2luaW5nIHRoZW0gdG9nZXRoZXIuIFNvIHdlJ2xsIGJ1aWxkIG91dCB0aGlzIGxpc3Qgb2YgY29sdW1ucyBhbmRcclxuLy8gICAvLyB0aGVuIGpvaW4gdGhlbSBhbGwgdG9nZXRoZXIgd2l0aCBzZWxlY3QgdW5pb25zIHRvIGNvbXBsZXRlIHRoZSBxdWVyaWVzLlxyXG4vLyAgIGluc2VydCgpIHtcclxuLy8gICAgIGNvbnN0IGluc2VydFZhbHVlcyA9IHRoaXMuc2luZ2xlLmluc2VydCB8fCBbXTtcclxuLy8gICAgIGxldCBzcWwgPSB0aGlzLndpdGgoKSArIGBpbnNlcnQgaW50byAke3RoaXMudGFibGVOYW1lfSBgO1xyXG5cclxuLy8gICAgIGlmIChBcnJheS5pc0FycmF5KGluc2VydFZhbHVlcykpIHtcclxuLy8gICAgICAgaWYgKGluc2VydFZhbHVlcy5sZW5ndGggPT09IDApIHtcclxuLy8gICAgICAgICByZXR1cm4gJyc7XHJcbi8vICAgICAgIH0gZWxzZSBpZiAoXHJcbi8vICAgICAgICAgaW5zZXJ0VmFsdWVzLmxlbmd0aCA9PT0gMSAmJlxyXG4vLyAgICAgICAgIGluc2VydFZhbHVlc1swXSAmJlxyXG4vLyAgICAgICAgIGlzRW1wdHkoaW5zZXJ0VmFsdWVzWzBdKVxyXG4vLyAgICAgICApIHtcclxuLy8gICAgICAgICByZXR1cm4gc3FsICsgdGhpcy5fZW1wdHlJbnNlcnRWYWx1ZTtcclxuLy8gICAgICAgfVxyXG4vLyAgICAgfSBlbHNlIGlmICh0eXBlb2YgaW5zZXJ0VmFsdWVzID09PSAnb2JqZWN0JyAmJiBpc0VtcHR5KGluc2VydFZhbHVlcykpIHtcclxuLy8gICAgICAgcmV0dXJuIHNxbCArIHRoaXMuX2VtcHR5SW5zZXJ0VmFsdWU7XHJcbi8vICAgICB9XHJcblxyXG4vLyAgICAgY29uc3QgaW5zZXJ0RGF0YSA9IHRoaXMuX3ByZXBJbnNlcnQoaW5zZXJ0VmFsdWVzKTtcclxuXHJcbi8vICAgICBpZiAoaXNTdHJpbmcoaW5zZXJ0RGF0YSkpIHtcclxuLy8gICAgICAgcmV0dXJuIHNxbCArIGluc2VydERhdGE7XHJcbi8vICAgICB9XHJcblxyXG4vLyAgICAgaWYgKGluc2VydERhdGEuY29sdW1ucy5sZW5ndGggPT09IDApIHtcclxuLy8gICAgICAgcmV0dXJuICcnO1xyXG4vLyAgICAgfVxyXG5cclxuLy8gICAgIHNxbCArPSBgKCR7dGhpcy5mb3JtYXR0ZXIuY29sdW1uaXplKGluc2VydERhdGEuY29sdW1ucyl9KWA7XHJcblxyXG4vLyAgICAgLy8gYmFja3dhcmRzIGNvbXBhdGlibGUgZXJyb3JcclxuLy8gICAgIGlmICh0aGlzLmNsaWVudC52YWx1ZUZvclVuZGVmaW5lZCAhPT0gbnVsbCkge1xyXG4vLyAgICAgICBlYWNoKGluc2VydERhdGEudmFsdWVzLCAoYmluZGluZ3MpID0+IHtcclxuLy8gICAgICAgICBlYWNoKGJpbmRpbmdzLCAoYmluZGluZykgPT4ge1xyXG4vLyAgICAgICAgICAgaWYgKGJpbmRpbmcgPT09IHVuZGVmaW5lZClcclxuLy8gICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcclxuLy8gICAgICAgICAgICAgICAnYHNxbGl0ZWAgZG9lcyBub3Qgc3VwcG9ydCBpbnNlcnRpbmcgZGVmYXVsdCB2YWx1ZXMuIFNwZWNpZnkgJyArXHJcbi8vICAgICAgICAgICAgICAgICAndmFsdWVzIGV4cGxpY2l0bHkgb3IgdXNlIHRoZSBgdXNlTnVsbEFzRGVmYXVsdGAgY29uZmlnIGZsYWcuICcgK1xyXG4vLyAgICAgICAgICAgICAgICAgJyhzZWUgZG9jcyBodHRwOi8va25leGpzLm9yZy8jQnVpbGRlci1pbnNlcnQpLidcclxuLy8gICAgICAgICAgICAgKTtcclxuLy8gICAgICAgICB9KTtcclxuLy8gICAgICAgfSk7XHJcbi8vICAgICB9XHJcblxyXG4vLyAgICAgaWYgKGluc2VydERhdGEudmFsdWVzLmxlbmd0aCA9PT0gMSkge1xyXG4vLyAgICAgICBjb25zdCBwYXJhbWV0ZXJzID0gdGhpcy5mb3JtYXR0ZXIucGFyYW1ldGVyaXplKFxyXG4vLyAgICAgICAgIGluc2VydERhdGEudmFsdWVzWzBdLFxyXG4vLyAgICAgICAgIHRoaXMuY2xpZW50LnZhbHVlRm9yVW5kZWZpbmVkXHJcbi8vICAgICAgICk7XHJcbi8vICAgICAgIHJldHVybiBzcWwgKyBgIHZhbHVlcyAoJHtwYXJhbWV0ZXJzfSlgO1xyXG4vLyAgICAgfVxyXG5cclxuLy8gICAgIGNvbnN0IGJsb2NrcyA9IFtdO1xyXG4vLyAgICAgbGV0IGkgPSAtMTtcclxuLy8gICAgIHdoaWxlICgrK2kgPCBpbnNlcnREYXRhLnZhbHVlcy5sZW5ndGgpIHtcclxuLy8gICAgICAgbGV0IGkyID0gLTE7XHJcbi8vICAgICAgIGNvbnN0IGJsb2NrID0gKGJsb2Nrc1tpXSA9IFtdKTtcclxuLy8gICAgICAgbGV0IGN1cnJlbnQgPSBpbnNlcnREYXRhLnZhbHVlc1tpXTtcclxuLy8gICAgICAgY3VycmVudCA9IGN1cnJlbnQgPT09IHVuZGVmaW5lZCA/IHRoaXMuY2xpZW50LnZhbHVlRm9yVW5kZWZpbmVkIDogY3VycmVudDtcclxuLy8gICAgICAgd2hpbGUgKCsraTIgPCBpbnNlcnREYXRhLmNvbHVtbnMubGVuZ3RoKSB7XHJcbi8vICAgICAgICAgYmxvY2sucHVzaChcclxuLy8gICAgICAgICAgIHRoaXMuZm9ybWF0dGVyLmFsaWFzKFxyXG4vLyAgICAgICAgICAgICB0aGlzLmZvcm1hdHRlci5wYXJhbWV0ZXIoY3VycmVudFtpMl0pLFxyXG4vLyAgICAgICAgICAgICB0aGlzLmZvcm1hdHRlci53cmFwKGluc2VydERhdGEuY29sdW1uc1tpMl0pXHJcbi8vICAgICAgICAgICApXHJcbi8vICAgICAgICAgKTtcclxuLy8gICAgICAgfVxyXG4vLyAgICAgICBibG9ja3NbaV0gPSBibG9jay5qb2luKCcsICcpO1xyXG4vLyAgICAgfVxyXG4vLyAgICAgcmV0dXJuIHNxbCArICcgc2VsZWN0ICcgKyBibG9ja3Muam9pbignIHVuaW9uIGFsbCBzZWxlY3QgJyk7XHJcbi8vICAgfSxcclxuXHJcbi8vICAgLy8gQ29tcGlsZSBhIHRydW5jYXRlIHRhYmxlIHN0YXRlbWVudCBpbnRvIFNRTC5cclxuLy8gICB0cnVuY2F0ZSgpIHtcclxuLy8gICAgIGNvbnN0IHsgdGFibGUgfSA9IHRoaXMuc2luZ2xlO1xyXG4vLyAgICAgcmV0dXJuIHtcclxuLy8gICAgICAgc3FsOiBgZGVsZXRlIGZyb20gJHt0aGlzLnRhYmxlTmFtZX1gLFxyXG4vLyAgICAgICBvdXRwdXQoKSB7XHJcbi8vICAgICAgICAgcmV0dXJuIHRoaXMucXVlcnkoe1xyXG4vLyAgICAgICAgICAgc3FsOiBgZGVsZXRlIGZyb20gc3FsaXRlX3NlcXVlbmNlIHdoZXJlIG5hbWUgPSAnJHt0YWJsZX0nYCxcclxuLy8gICAgICAgICB9KS5jYXRjaChub29wKTtcclxuLy8gICAgICAgfSxcclxuLy8gICAgIH07XHJcbi8vICAgfSxcclxuXHJcbi8vICAgLy8gQ29tcGlsZXMgYSBgY29sdW1uSW5mb2AgcXVlcnlcclxuLy8gICBjb2x1bW5JbmZvKCkge1xyXG4vLyAgICAgY29uc3QgY29sdW1uID0gdGhpcy5zaW5nbGUuY29sdW1uSW5mbztcclxuXHJcbi8vICAgICAvLyBUaGUgdXNlciBtYXkgaGF2ZSBzcGVjaWZpZWQgYSBjdXN0b20gd3JhcElkZW50aWZpZXIgZnVuY3Rpb24gaW4gdGhlIGNvbmZpZy4gV2VcclxuLy8gICAgIC8vIG5lZWQgdG8gcnVuIHRoZSBpZGVudGlmaWVycyB0aHJvdWdoIHRoYXQgZnVuY3Rpb24sIGJ1dCBub3QgZm9ybWF0IHRoZW0gYXNcclxuLy8gICAgIC8vIGlkZW50aWZpZXJzIG90aGVyd2lzZS5cclxuLy8gICAgIGNvbnN0IHRhYmxlID0gdGhpcy5jbGllbnQuY3VzdG9tV3JhcElkZW50aWZpZXIodGhpcy5zaW5nbGUudGFibGUsIGlkZW50aXR5KTtcclxuXHJcbi8vICAgICByZXR1cm4ge1xyXG4vLyAgICAgICBzcWw6IGBQUkFHTUEgdGFibGVfaW5mbyhcXGAke3RhYmxlfVxcYClgLFxyXG4vLyAgICAgICBvdXRwdXQocmVzcCkge1xyXG4vLyAgICAgICAgIGNvbnN0IG1heExlbmd0aFJlZ2V4ID0gLy4qXFwoKFxcZCspXFwpLztcclxuLy8gICAgICAgICBjb25zdCBvdXQgPSByZWR1Y2UoXHJcbi8vICAgICAgICAgICByZXNwLFxyXG4vLyAgICAgICAgICAgZnVuY3Rpb24oY29sdW1ucywgdmFsKSB7XHJcbi8vICAgICAgICAgICAgIGxldCB7IHR5cGUgfSA9IHZhbDtcclxuLy8gICAgICAgICAgICAgbGV0IG1heExlbmd0aCA9IHR5cGUubWF0Y2gobWF4TGVuZ3RoUmVnZXgpO1xyXG4vLyAgICAgICAgICAgICBpZiAobWF4TGVuZ3RoKSB7XHJcbi8vICAgICAgICAgICAgICAgbWF4TGVuZ3RoID0gbWF4TGVuZ3RoWzFdO1xyXG4vLyAgICAgICAgICAgICB9XHJcbi8vICAgICAgICAgICAgIHR5cGUgPSBtYXhMZW5ndGggPyB0eXBlLnNwbGl0KCcoJylbMF0gOiB0eXBlO1xyXG4vLyAgICAgICAgICAgICBjb2x1bW5zW3ZhbC5uYW1lXSA9IHtcclxuLy8gICAgICAgICAgICAgICB0eXBlOiB0eXBlLnRvTG93ZXJDYXNlKCksXHJcbi8vICAgICAgICAgICAgICAgbWF4TGVuZ3RoLFxyXG4vLyAgICAgICAgICAgICAgIG51bGxhYmxlOiAhdmFsLm5vdG51bGwsXHJcbi8vICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlOiB2YWwuZGZsdF92YWx1ZSxcclxuLy8gICAgICAgICAgICAgfTtcclxuLy8gICAgICAgICAgICAgcmV0dXJuIGNvbHVtbnM7XHJcbi8vICAgICAgICAgICB9LFxyXG4vLyAgICAgICAgICAge31cclxuLy8gICAgICAgICApO1xyXG4vLyAgICAgICAgIHJldHVybiAoY29sdW1uICYmIG91dFtjb2x1bW5dKSB8fCBvdXQ7XHJcbi8vICAgICAgIH0sXHJcbi8vICAgICB9O1xyXG4vLyAgIH0sXHJcblxyXG4vLyAgIGxpbWl0KCkge1xyXG4vLyAgICAgY29uc3Qgbm9MaW1pdCA9ICF0aGlzLnNpbmdsZS5saW1pdCAmJiB0aGlzLnNpbmdsZS5saW1pdCAhPT0gMDtcclxuLy8gICAgIGlmIChub0xpbWl0ICYmICF0aGlzLnNpbmdsZS5vZmZzZXQpIHJldHVybiAnJztcclxuXHJcbi8vICAgICAvLyBXb3JrYXJvdW5kIGZvciBvZmZzZXQgb25seSxcclxuLy8gICAgIC8vIHNlZSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwNDkxNDkyL3NxbGxpdGUtd2l0aC1za2lwLW9mZnNldC1vbmx5LW5vdC1saW1pdFxyXG4vLyAgICAgcmV0dXJuIGBsaW1pdCAke3RoaXMuZm9ybWF0dGVyLnBhcmFtZXRlcihcclxuLy8gICAgICAgbm9MaW1pdCA/IC0xIDogdGhpcy5zaW5nbGUubGltaXRcclxuLy8gICAgICl9YDtcclxuLy8gICB9LFxyXG4vLyB9KTtcclxuXHJcbi8vIGZ1bmN0aW9uIGVtcHR5U3RyKCkge1xyXG4vLyAgIHJldHVybiAnJztcclxuLy8gfVxyXG5cclxuLy8gbW9kdWxlLmV4cG9ydHMgPSBRdWVyeUNvbXBpbGVyX1NRTGl0ZTM7XHJcbiJdfQ==