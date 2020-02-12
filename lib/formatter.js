'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _knexLibFormatter = require('knex/lib/formatter');

var _knexLibFormatter2 = _interopRequireDefault(_knexLibFormatter);

var _knexLibRaw = require('knex/lib/raw');

var _knexLibRaw2 = _interopRequireDefault(_knexLibRaw);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

function Firebird_Formatter() {
  _knexLibFormatter2['default'].apply(this, arguments);
}

_inherits2['default'](Firebird_Formatter, _knexLibFormatter2['default']);

Object.assign(Firebird_Formatter.prototype, {
  values: function values(_values) {
    var _this = this;

    if (Array.isArray(_values)) {
      if (Array.isArray(_values[0])) {
        return '( values ' + _values.map(function (value) {
          return '(' + _this.parameterize(value) + ')';
        }).join(', ') + ')';
      }
      return '(' + this.parameterize(_values) + ')';
    }

    if (_values instanceof _knexLibRaw2['default']) {
      return '(' + this.parameter(_values) + ')';
    }

    return this.parameter(_values);
  }
});

exports['default'] = Firebird_Formatter;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9mb3JtYXR0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O2dDQUFzQixvQkFBb0I7Ozs7MEJBQzFCLGNBQWM7Ozs7d0JBQ1QsVUFBVTs7OztBQUUvQixTQUFTLGtCQUFrQixHQUFJO0FBQzdCLGdDQUFVLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7Q0FDbEM7O0FBRUQsc0JBQVMsa0JBQWtCLGdDQUFZLENBQUM7O0FBRXhDLE1BQU0sQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsU0FBUyxFQUFFO0FBQzFDLFFBQU0sRUFBQSxnQkFBQyxPQUFNLEVBQUU7OztBQUNiLFFBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFNLENBQUMsRUFBRTtBQUN6QixVQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDNUIsNkJBQW1CLE9BQU0sQ0FDdEIsR0FBRyxDQUFDLFVBQUMsS0FBSzt1QkFBUyxNQUFLLFlBQVksQ0FBQyxLQUFLLENBQUM7U0FBRyxDQUFDLENBQy9DLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBSTtPQUNsQjtBQUNELG1CQUFXLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTSxDQUFDLE9BQUk7S0FDekM7O0FBRUQsUUFBSSxPQUFNLG1DQUFlLEVBQUU7QUFDekIsbUJBQVcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFNLENBQUMsT0FBSTtLQUN0Qzs7QUFFRCxXQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTSxDQUFDLENBQUM7R0FDL0I7Q0FDRixDQUFDLENBQUM7O3FCQUVZLGtCQUFrQiIsImZpbGUiOiJmb3JtYXR0ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRm9ybWF0dGVyIGZyb20gJ2tuZXgvbGliL2Zvcm1hdHRlcic7XHJcbmltcG9ydCBSYXcgZnJvbSAna25leC9saWIvcmF3JztcclxuaW1wb3J0IGluaGVyaXRzIGZyb20gJ2luaGVyaXRzJztcclxuXHJcbmZ1bmN0aW9uIEZpcmViaXJkX0Zvcm1hdHRlciAoKSB7XHJcbiAgRm9ybWF0dGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmluaGVyaXRzKEZpcmViaXJkX0Zvcm1hdHRlciwgRm9ybWF0dGVyKTtcclxuXHJcbk9iamVjdC5hc3NpZ24oRmlyZWJpcmRfRm9ybWF0dGVyLnByb3RvdHlwZSwge1xyXG4gIHZhbHVlcyh2YWx1ZXMpIHtcclxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlcykpIHtcclxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWVzWzBdKSkge1xyXG4gICAgICAgIHJldHVybiBgKCB2YWx1ZXMgJHt2YWx1ZXNcclxuICAgICAgICAgIC5tYXAoKHZhbHVlKSA9PiBgKCR7dGhpcy5wYXJhbWV0ZXJpemUodmFsdWUpfSlgKVxyXG4gICAgICAgICAgLmpvaW4oJywgJyl9KWA7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGAoJHt0aGlzLnBhcmFtZXRlcml6ZSh2YWx1ZXMpfSlgO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh2YWx1ZXMgaW5zdGFuY2VvZiBSYXcpIHtcclxuICAgICAgcmV0dXJuIGAoJHt0aGlzLnBhcmFtZXRlcih2YWx1ZXMpfSlgO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzLnBhcmFtZXRlcih2YWx1ZXMpO1xyXG4gIH1cclxufSk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBGaXJlYmlyZF9Gb3JtYXR0ZXI7XHJcblxyXG4iXX0=