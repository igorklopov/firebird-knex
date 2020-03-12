// Firebird Query Builder & Compiler
'use strict';

exports.__esModule = true;

var _obj;

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _knexLibQueryCompiler = require("knex/lib/query/compiler");

var _knexLibQueryCompiler2 = _interopRequireDefault(_knexLibQueryCompiler);

function QueryCompiler_Firebird(client, builder) {
  _knexLibQueryCompiler2['default'].call(this, client, builder);
}
_inherits2['default'](QueryCompiler_Firebird, _knexLibQueryCompiler2['default']);

Object.assign(QueryCompiler_Firebird.prototype, _obj = {
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
  },
  // Compiles a `columnInfo` query
  columnInfo: function columnInfo() {
    var column = this.single.columnInfo;

    // The user may have specified a custom wrapIdentifier function in the config. We
    // need to run the identifiers through that function, but not format them as
    // identifiers otherwise.
    var table = this.client.customWrapIdentifier(this.single.table, identity);

    return {
      sql: '\n      select \n        rlf.rdb$field_name as name,\n        fld.rdb$character_length as max_length,\n        typ.rdb$type_name as type,\n        rlf.rdb$null_flag as not_null\n      from rdb$relation_fields rlf\n      inner join rdb$fields fld on fld.rdb$field_name = rlf.rdb$field_source\n      inner join rdb$types typ on typ.rdb$type = fld.rdb$field_type\n      where rdb$relation_name = \'' + table + '\'\n      ',
      output: function output(resp) {
        var rows = resp[0];
        var fields = resp[1];

        var maxLengthRegex = /.*\((\d+)\)/;
        var out = reduce(rows, function (columns, val) {
          var name = val.NAME.trim();
          columns[name] = {
            type: val.TYPE.trim().toLowerCase(),
            nullable: !val.NOT_NULL
          };

          // ATSTODO: "defaultValue" não implementado
          // defaultValue: null,
          if (val.MAX_LENGTH) {
            columns[name] = val.MAX_LENGTH;
          }

          return columns;
        }, {});
        console.log('Resultado columnInfo', { out: out, column: column });
        return column && out[column] || out;
      }
    };
  },
  whereIn: function whereIn(statement) {
    var _this = this;

    // O FB não suporta `in` de tupla para tupla; neste caso, monta um or
    if (Array.isArray(statement.column)) {
      var conditions = statement.value.map(function (valueCols) {
        return valueCols.map(function (value, idx) {
          return _this['formatter'].columnize(statement.column[idx]) + ' = ' + _this['formatter'].values(value);
        }).join(' and ');
      });
      return '( ' + conditions.join('\n or ') + ' )';
    }
    return _get(Object.getPrototypeOf(_obj), 'whereIn', this).call(this, statement);
  }

});

exports['default'] = QueryCompiler_Firebird;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9xdWVyeS9jb21waWxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozt3QkFDcUIsVUFBVTs7OztvQ0FDTCx5QkFBeUI7Ozs7QUFFbkQsU0FBUyxzQkFBc0IsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFO0FBQy9DLG9DQUFjLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0NBQzNDO0FBQ0Qsc0JBQVMsc0JBQXNCLG9DQUFnQixDQUFDOztBQUVoRCxNQUFNLENBQUMsTUFBTSxDQUFDLHNCQUFzQixDQUFDLFNBQVMsU0FBRTs7Ozs7Ozs7O0FBUzlDLFdBQVMsRUFBQSxxQkFBRztrQkFDZ0IsSUFBSSxDQUFDLE1BQU07UUFBN0IsS0FBSyxXQUFMLEtBQUs7UUFBRSxNQUFNLFdBQU4sTUFBTTs7QUFDckIsUUFBSSxDQUFDLEtBQUssSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFO0FBQ3pCLFVBQUksQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUM7QUFDdkIsYUFBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0tBQzlCLE1BQU07QUFDTCxVQUFJLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM1QixhQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsS0FBSyxDQUFDLENBQUM7S0FDckM7R0FDRjs7QUFFRCxPQUFLLEVBQUEsaUJBQUc7QUFDTixRQUFNLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakMsUUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFLE9BQU87QUFDL0IsV0FBTyxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7R0FDakQ7O0FBRUQsUUFBTSxFQUFBLGtCQUFHO0FBQ1AsUUFB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RCx5RUFBcUIsU0FBUyxFQUFFO0dBQ2pDOztDQUVGLENBQUMsQ0FBQzs7cUJBRVksc0JBQXNCIiwiZmlsZSI6ImNvbXBpbGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gRmlyZWJpcmQgUXVlcnkgQnVpbGRlciAmIENvbXBpbGVyXHJcbmltcG9ydCBpbmhlcml0cyBmcm9tICdpbmhlcml0cyc7XHJcbmltcG9ydCBRdWVyeUNvbXBpbGVyIGZyb20gXCJrbmV4L2xpYi9xdWVyeS9jb21waWxlclwiO1xyXG5cclxuZnVuY3Rpb24gUXVlcnlDb21waWxlcl9GaXJlYmlyZChjbGllbnQsIGJ1aWxkZXIpIHtcclxuICBRdWVyeUNvbXBpbGVyLmNhbGwodGhpcywgY2xpZW50LCBidWlsZGVyKTtcclxufVxyXG5pbmhlcml0cyhRdWVyeUNvbXBpbGVyX0ZpcmViaXJkLCBRdWVyeUNvbXBpbGVyKTtcclxuXHJcbk9iamVjdC5hc3NpZ24oUXVlcnlDb21waWxlcl9GaXJlYmlyZC5wcm90b3R5cGUsIHtcclxuICAvLyBUT0RPIHByb2JhYmx5IGJ1Z2d5LiB0ZXN0IGl0XHJcblxyXG4gIC8vIGxpbWl0IDUgICAgICAgICAgIC0+IHJvd3MgMSB0byA1ICAgLSBvciBqdXN0IHJvd3MgNVxyXG4gIC8vIGxpbWl0IDUgb2Zmc2V0ICAwIC0+IHJvd3MgMSB0byA1ICAgLSBvciBqdXN0IHJvd3MgNVxyXG4gIC8vIGxpbWl0IDUgb2Zmc2V0IDEwIC0+IHJvd3MgMTEgdG8gMTVcclxuICAvLyAgICAgICAgIG9mZnNldCAxMCAtPiByb3dzIDExIHRvIHZlcnkgYmlnIHZhbHVlXHJcbiAgLy8gICAgICAgICBvZmZzZXQgIDAgLT4gbm90aGluZ1xyXG5cclxuICBfY2FsY1Jvd3MoKSB7XHJcbiAgICBjb25zdCB7IGxpbWl0LCBvZmZzZXQgfSA9IHRoaXMuc2luZ2xlO1xyXG4gICAgaWYgKCFsaW1pdCAmJiBsaW1pdCAhPT0gMCkge1xyXG4gICAgICBpZiAoIW9mZnNldCkgcmV0dXJuIFtdO1xyXG4gICAgICByZXR1cm4gW29mZnNldCArIDEsIDEgPDwgMzBdO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKCFvZmZzZXQpIHJldHVybiBbbGltaXRdO1xyXG4gICAgICByZXR1cm4gW29mZnNldCArIDEsIG9mZnNldCArIGxpbWl0XTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBsaW1pdCgpIHtcclxuICAgIGNvbnN0IHJvd3MgPSB0aGlzLl9jYWxjUm93cygpWzBdO1xyXG4gICAgaWYgKHJvd3MgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xyXG4gICAgcmV0dXJuICdyb3dzICcgKyB0aGlzLmZvcm1hdHRlci5wYXJhbWV0ZXIocm93cyk7XHJcbiAgfSxcclxuXHJcbiAgb2Zmc2V0KCkge1xyXG4gICAgY29uc3QgdG8gPSB0aGlzLl9jYWxjUm93cygpWzFdO1xyXG4gICAgaWYgKHRvID09PSB1bmRlZmluZWQpIHJldHVybjtcclxuICAgIHJldHVybiAndG8gJyArIHRoaXMuZm9ybWF0dGVyLnBhcmFtZXRlcih0byk7XHJcbiAgfSxcclxuXHJcbiAgX3ByZXBJbnNlcnQoaW5zZXJ0VmFsdWVzKSB7XHJcbiAgICBjb25zdCBuZXdWYWx1ZXMgPSB7fTtcclxuICAgIGZvciAoY29uc3Qga2V5IGluIGluc2VydFZhbHVlcykge1xyXG4gICAgICBjb25zdCB2YWx1ZSA9IGluc2VydFZhbHVlc1trZXldO1xyXG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIG5ld1ZhbHVlc1trZXldID0gdmFsdWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBRdWVyeUNvbXBpbGVyLnByb3RvdHlwZS5fcHJlcEluc2VydC5jYWxsKHRoaXMsIG5ld1ZhbHVlcyk7XHJcbiAgfSxcclxuICAvLyBDb21waWxlcyBhIGBjb2x1bW5JbmZvYCBxdWVyeVxyXG4gIGNvbHVtbkluZm8oKSB7XHJcbiAgICBjb25zdCBjb2x1bW4gPSB0aGlzLnNpbmdsZS5jb2x1bW5JbmZvO1xyXG5cclxuICAgIC8vIFRoZSB1c2VyIG1heSBoYXZlIHNwZWNpZmllZCBhIGN1c3RvbSB3cmFwSWRlbnRpZmllciBmdW5jdGlvbiBpbiB0aGUgY29uZmlnLiBXZVxyXG4gICAgLy8gbmVlZCB0byBydW4gdGhlIGlkZW50aWZpZXJzIHRocm91Z2ggdGhhdCBmdW5jdGlvbiwgYnV0IG5vdCBmb3JtYXQgdGhlbSBhc1xyXG4gICAgLy8gaWRlbnRpZmllcnMgb3RoZXJ3aXNlLlxyXG4gICAgY29uc3QgdGFibGUgPSB0aGlzLmNsaWVudC5jdXN0b21XcmFwSWRlbnRpZmllcih0aGlzLnNpbmdsZS50YWJsZSwgaWRlbnRpdHkpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHNxbDogYFxyXG4gICAgICBzZWxlY3QgXHJcbiAgICAgICAgcmxmLnJkYiRmaWVsZF9uYW1lIGFzIG5hbWUsXHJcbiAgICAgICAgZmxkLnJkYiRjaGFyYWN0ZXJfbGVuZ3RoIGFzIG1heF9sZW5ndGgsXHJcbiAgICAgICAgdHlwLnJkYiR0eXBlX25hbWUgYXMgdHlwZSxcclxuICAgICAgICBybGYucmRiJG51bGxfZmxhZyBhcyBub3RfbnVsbFxyXG4gICAgICBmcm9tIHJkYiRyZWxhdGlvbl9maWVsZHMgcmxmXHJcbiAgICAgIGlubmVyIGpvaW4gcmRiJGZpZWxkcyBmbGQgb24gZmxkLnJkYiRmaWVsZF9uYW1lID0gcmxmLnJkYiRmaWVsZF9zb3VyY2VcclxuICAgICAgaW5uZXIgam9pbiByZGIkdHlwZXMgdHlwIG9uIHR5cC5yZGIkdHlwZSA9IGZsZC5yZGIkZmllbGRfdHlwZVxyXG4gICAgICB3aGVyZSByZGIkcmVsYXRpb25fbmFtZSA9ICcke3RhYmxlfSdcclxuICAgICAgYCxcclxuICAgICAgb3V0cHV0KHJlc3ApIHtcclxuICAgICAgICBjb25zdCBbcm93cywgZmllbGRzXSA9IHJlc3A7XHJcblxyXG4gICAgICAgIGNvbnN0IG1heExlbmd0aFJlZ2V4ID0gLy4qXFwoKFxcZCspXFwpLztcclxuICAgICAgICBjb25zdCBvdXQgPSByZWR1Y2UoXHJcbiAgICAgICAgICByb3dzLFxyXG4gICAgICAgICAgZnVuY3Rpb24gKGNvbHVtbnMsIHZhbCkge1xyXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gdmFsLk5BTUUudHJpbSgpO1xyXG4gICAgICAgICAgICBjb2x1bW5zW25hbWVdID0ge1xyXG4gICAgICAgICAgICAgIHR5cGU6IHZhbC5UWVBFLnRyaW0oKS50b0xvd2VyQ2FzZSgpLFxyXG4gICAgICAgICAgICAgIG51bGxhYmxlOiAhdmFsLk5PVF9OVUxMLFxyXG4gICAgICAgICAgICAgIC8vIEFUU1RPRE86IFwiZGVmYXVsdFZhbHVlXCIgbsOjbyBpbXBsZW1lbnRhZG9cclxuICAgICAgICAgICAgICAvLyBkZWZhdWx0VmFsdWU6IG51bGwsXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBpZiAodmFsLk1BWF9MRU5HVEgpIHtcclxuICAgICAgICAgICAgICBjb2x1bW5zW25hbWVdID0gdmFsLk1BWF9MRU5HVEg7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBjb2x1bW5zO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHt9XHJcbiAgICAgICAgKTtcclxuICAgICAgICBjb25zb2xlLmxvZygnUmVzdWx0YWRvIGNvbHVtbkluZm8nLCB7IG91dCwgY29sdW1uIH0pO1xyXG4gICAgICAgIHJldHVybiAoY29sdW1uICYmIG91dFtjb2x1bW5dKSB8fCBvdXQ7XHJcbiAgICAgIH0sXHJcbiAgICB9O1xyXG4gIH0sXHJcbiAgd2hlcmVJbihzdGF0ZW1lbnQpIHtcclxuICAgIC8vIE8gRkIgbsOjbyBzdXBvcnRhIGBpbmAgZGUgdHVwbGEgcGFyYSB0dXBsYTsgbmVzdGUgY2FzbywgbW9udGEgdW0gb3JcclxuICAgIGlmIChBcnJheS5pc0FycmF5KHN0YXRlbWVudC5jb2x1bW4pKSB7XHJcbiAgICAgIGNvbnN0IGNvbmRpdGlvbnMgPSBzdGF0ZW1lbnQudmFsdWUubWFwKHZhbHVlQ29scyA9PiB2YWx1ZUNvbHMubWFwKCh2YWx1ZSwgaWR4KSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIGAke3RoaXNbJ2Zvcm1hdHRlciddLmNvbHVtbml6ZShzdGF0ZW1lbnQuY29sdW1uW2lkeF0pfSA9ICR7dGhpc1snZm9ybWF0dGVyJ10udmFsdWVzKHZhbHVlKX1gXHJcbiAgICAgIH0pLmpvaW4oJyBhbmQgJykpO1xyXG4gICAgICByZXR1cm4gYCggJHtjb25kaXRpb25zLmpvaW4oJ1xcbiBvciAnKX0gKWA7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gc3VwZXIud2hlcmVJbihzdGF0ZW1lbnQpO1xyXG4gIH1cclxuXHJcbn0pO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgUXVlcnlDb21waWxlcl9GaXJlYmlyZDtcclxuXHJcbiJdfQ==