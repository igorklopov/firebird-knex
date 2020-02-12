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
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9xdWVyeS9jb21waWxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7O3dCQUNxQixVQUFVOzs7O29DQUNMLHlCQUF5Qjs7OztBQUVuRCxTQUFTLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUU7QUFDL0Msb0NBQWMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7Q0FDM0M7QUFDRCxzQkFBUyxzQkFBc0Isb0NBQWdCLENBQUM7O0FBRWhELE1BQU0sQ0FBQyxNQUFNLENBQUMsc0JBQXNCLENBQUMsU0FBUyxFQUFFOzs7Ozs7Ozs7QUFTOUMsV0FBUyxFQUFBLHFCQUFHO2tCQUNnQixJQUFJLENBQUMsTUFBTTtRQUE3QixLQUFLLFdBQUwsS0FBSztRQUFFLE1BQU0sV0FBTixNQUFNOztBQUNyQixRQUFJLENBQUMsS0FBSyxJQUFJLEtBQUssS0FBSyxDQUFDLEVBQUU7QUFDekIsVUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsQ0FBQztBQUN2QixhQUFPLENBQUUsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFFLENBQUM7S0FDaEMsTUFBTTtBQUNMLFVBQUksQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFFLEtBQUssQ0FBRSxDQUFDO0FBQzlCLGFBQU8sQ0FBRSxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxLQUFLLENBQUUsQ0FBQztLQUN2QztHQUNGOztBQUVELE9BQUssRUFBQSxpQkFBRztBQUNOLFFBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqQyxRQUFJLElBQUksS0FBSyxTQUFTLEVBQUUsT0FBTztBQUMvQixXQUFPLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztHQUNqRDs7QUFFRCxRQUFNLEVBQUEsa0JBQUc7QUFDUCxRQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0IsUUFBSSxFQUFFLEtBQUssU0FBUyxFQUFFLE9BQU87QUFDN0IsV0FBTyxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7R0FDN0M7O0FBRUQsYUFBVyxFQUFBLHFCQUFDLFlBQVksRUFBRTtBQUN4QixRQUFNLFNBQVMsR0FBRyxFQUFFLENBQUM7QUFDckIsU0FBSyxJQUFNLEdBQUcsSUFBSSxZQUFZLEVBQUU7QUFDOUIsVUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2hDLFVBQUksT0FBTyxLQUFLLEtBQUssV0FBVyxFQUFFO0FBQ2hDLGlCQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDO09BQ3hCO0tBQ0Y7QUFDRCxXQUFPLGtDQUFjLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztHQUNsRTs7Q0FFRixDQUFDLENBQUM7O3FCQUVZLHNCQUFzQiIsImZpbGUiOiJjb21waWxlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEZpcmViaXJkIFF1ZXJ5IEJ1aWxkZXIgJiBDb21waWxlclxyXG5pbXBvcnQgaW5oZXJpdHMgZnJvbSAnaW5oZXJpdHMnO1xyXG5pbXBvcnQgUXVlcnlDb21waWxlciBmcm9tIFwia25leC9saWIvcXVlcnkvY29tcGlsZXJcIjtcclxuXHJcbmZ1bmN0aW9uIFF1ZXJ5Q29tcGlsZXJfRmlyZWJpcmQoY2xpZW50LCBidWlsZGVyKSB7XHJcbiAgUXVlcnlDb21waWxlci5jYWxsKHRoaXMsIGNsaWVudCwgYnVpbGRlcik7XHJcbn1cclxuaW5oZXJpdHMoUXVlcnlDb21waWxlcl9GaXJlYmlyZCwgUXVlcnlDb21waWxlcik7XHJcblxyXG5PYmplY3QuYXNzaWduKFF1ZXJ5Q29tcGlsZXJfRmlyZWJpcmQucHJvdG90eXBlLCB7XHJcbiAgLy8gVE9ETyBwcm9iYWJseSBidWdneS4gdGVzdCBpdFxyXG5cclxuICAvLyBsaW1pdCA1ICAgICAgICAgICAtPiByb3dzIDEgdG8gNSAgIC0gb3IganVzdCByb3dzIDVcclxuICAvLyBsaW1pdCA1IG9mZnNldCAgMCAtPiByb3dzIDEgdG8gNSAgIC0gb3IganVzdCByb3dzIDVcclxuICAvLyBsaW1pdCA1IG9mZnNldCAxMCAtPiByb3dzIDExIHRvIDE1XHJcbiAgLy8gICAgICAgICBvZmZzZXQgMTAgLT4gcm93cyAxMSB0byB2ZXJ5IGJpZyB2YWx1ZVxyXG4gIC8vICAgICAgICAgb2Zmc2V0ICAwIC0+IG5vdGhpbmdcclxuXHJcbiAgX2NhbGNSb3dzKCkge1xyXG4gICAgY29uc3QgeyBsaW1pdCwgb2Zmc2V0IH0gPSB0aGlzLnNpbmdsZTtcclxuICAgIGlmICghbGltaXQgJiYgbGltaXQgIT09IDApIHtcclxuICAgICAgaWYgKCFvZmZzZXQpIHJldHVybiBbXTtcclxuICAgICAgcmV0dXJuIFsgb2Zmc2V0ICsgMSwgMSA8PCAzMCBdO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKCFvZmZzZXQpIHJldHVybiBbIGxpbWl0IF07XHJcbiAgICAgIHJldHVybiBbIG9mZnNldCArIDEsIG9mZnNldCArIGxpbWl0IF07XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgbGltaXQoKSB7XHJcbiAgICBjb25zdCByb3dzID0gdGhpcy5fY2FsY1Jvd3MoKVswXTtcclxuICAgIGlmIChyb3dzID09PSB1bmRlZmluZWQpIHJldHVybjtcclxuICAgIHJldHVybiAncm93cyAnICsgdGhpcy5mb3JtYXR0ZXIucGFyYW1ldGVyKHJvd3MpO1xyXG4gIH0sXHJcblxyXG4gIG9mZnNldCgpIHtcclxuICAgIGNvbnN0IHRvID0gdGhpcy5fY2FsY1Jvd3MoKVsxXTtcclxuICAgIGlmICh0byA9PT0gdW5kZWZpbmVkKSByZXR1cm47XHJcbiAgICByZXR1cm4gJ3RvICcgKyB0aGlzLmZvcm1hdHRlci5wYXJhbWV0ZXIodG8pO1xyXG4gIH0sXHJcblxyXG4gIF9wcmVwSW5zZXJ0KGluc2VydFZhbHVlcykge1xyXG4gICAgY29uc3QgbmV3VmFsdWVzID0ge307XHJcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBpbnNlcnRWYWx1ZXMpIHtcclxuICAgICAgY29uc3QgdmFsdWUgPSBpbnNlcnRWYWx1ZXNba2V5XTtcclxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICBuZXdWYWx1ZXNba2V5XSA9IHZhbHVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gUXVlcnlDb21waWxlci5wcm90b3R5cGUuX3ByZXBJbnNlcnQuY2FsbCh0aGlzLCBuZXdWYWx1ZXMpO1xyXG4gIH1cclxuXHJcbn0pO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgUXVlcnlDb21waWxlcl9GaXJlYmlyZDtcclxuXHJcbiJdfQ==