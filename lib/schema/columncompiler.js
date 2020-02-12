'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _knexLibSchemaColumncompiler = require('knex/lib/schema/columncompiler');

var _knexLibSchemaColumncompiler2 = _interopRequireDefault(_knexLibSchemaColumncompiler);

// Column Compiler
// -------

function ColumnCompiler_Firebird() {
  _knexLibSchemaColumncompiler2['default'].apply(this, arguments);
  this.modifiers = ['collate', 'nullable'];
}
_inherits2['default'](ColumnCompiler_Firebird, _knexLibSchemaColumncompiler2['default']);

Object.assign(ColumnCompiler_Firebird.prototype, {

  increments: 'integer not null primary key',

  collate: function collate(collation) {
    // TODO request `charset` modifier of knex column   
    return collation && 'character set ' + (collation || 'ASCII');
  }

});

exports['default'] = ColumnCompiler_Firebird;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2hlbWEvY29sdW1uY29tcGlsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O3dCQUFxQixVQUFVOzs7OzJDQUNKLGdDQUFnQzs7Ozs7OztBQUszRCxTQUFVLHVCQUF1QixHQUFJO0FBQ25DLDJDQUFlLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDdEMsTUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFFLFNBQVMsRUFBRSxVQUFVLENBQUUsQ0FBQztDQUM1QztBQUNELHNCQUFTLHVCQUF1QiwyQ0FBaUIsQ0FBQzs7QUFFbEQsTUFBTSxDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxTQUFTLEVBQUU7O0FBRS9DLFlBQVUsRUFBRSw4QkFBOEI7O0FBRTFDLFNBQU8sRUFBQSxpQkFBQyxTQUFTLEVBQUU7O0FBRWpCLFdBQU8sU0FBUyx3QkFBcUIsU0FBUyxJQUFHLE9BQU8sQ0FBQSxBQUFFLENBQUE7R0FDM0Q7O0NBRUYsQ0FBQyxDQUFDOztxQkFFWSx1QkFBdUIiLCJmaWxlIjoiY29sdW1uY29tcGlsZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgaW5oZXJpdHMgZnJvbSAnaW5oZXJpdHMnO1xyXG5pbXBvcnQgQ29sdW1uQ29tcGlsZXIgZnJvbSAna25leC9saWIvc2NoZW1hL2NvbHVtbmNvbXBpbGVyJztcclxuXHJcbi8vIENvbHVtbiBDb21waWxlclxyXG4vLyAtLS0tLS0tXHJcblxyXG5mdW5jdGlvbiAgQ29sdW1uQ29tcGlsZXJfRmlyZWJpcmQgKCkge1xyXG4gIENvbHVtbkNvbXBpbGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgdGhpcy5tb2RpZmllcnMgPSBbICdjb2xsYXRlJywgJ251bGxhYmxlJyBdO1xyXG59XHJcbmluaGVyaXRzKENvbHVtbkNvbXBpbGVyX0ZpcmViaXJkLCBDb2x1bW5Db21waWxlcik7XHJcblxyXG5PYmplY3QuYXNzaWduKENvbHVtbkNvbXBpbGVyX0ZpcmViaXJkLnByb3RvdHlwZSwge1xyXG5cclxuICBpbmNyZW1lbnRzOiAnaW50ZWdlciBub3QgbnVsbCBwcmltYXJ5IGtleScsXHJcblxyXG4gIGNvbGxhdGUoY29sbGF0aW9uKSB7XHJcbiAgICAvLyBUT0RPIHJlcXVlc3QgYGNoYXJzZXRgIG1vZGlmaWVyIG9mIGtuZXggY29sdW1uICAgIFxyXG4gICAgcmV0dXJuIGNvbGxhdGlvbiAmJiBgY2hhcmFjdGVyIHNldCAke2NvbGxhdGlvbnx8ICdBU0NJSSd9YFxyXG4gIH1cclxuXHJcbn0pO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgQ29sdW1uQ29tcGlsZXJfRmlyZWJpcmQ7XHJcbiJdfQ==