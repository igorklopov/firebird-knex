// Firebird: Column Builder & Compiler
// -------
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _knexLibSchemaCompiler = require('knex/lib/schema/compiler');

var _knexLibSchemaCompiler2 = _interopRequireDefault(_knexLibSchemaCompiler);

var _lodash = require('lodash');

// Schema Compiler
// -------

function SchemaCompiler_Firebird() {
  _knexLibSchemaCompiler2['default'].apply(this, arguments);
}

_inherits2['default'](SchemaCompiler_Firebird, _knexLibSchemaCompiler2['default']);

Object.assign(SchemaCompiler_Firebird.prototype, {
  // Compile the query to determine if a table exists.
  hasTable: function hasTable(tableName) {
    var sql = 'select r.rdb$relation_name as "Table" ' + 'from rdb$relations r where ' + (' r.rdb$relation_name = ' + this.formatter.parameter(tableName));
    this.pushQuery({ sql: sql, output: function output(resp) {
        return resp.length > 0;
      } });
  },

  // Compile the query to determine if a column exists.
  hasColumn: function hasColumn(tableName, column) {
    this.pushQuery({
      sql: 'select i.rdb$field_name as "Field" from ' + 'rdb$relations r join rdb$RELATION_FIELDS i ' + 'on (i.rdb$relation_name = r.rdb$relation_name) ' + ('where r.rdb$relation_name = ' + this.formatter.wrap(tableName)),
      output: function output(resp) {
        var _this = this;

        return _lodash.some(resp, function (col) {
          return _this.client.wrapIdentifier(col.name.toLowerCase()) === _this.client.wrapIdentifier(column.toLowerCase());
        });
      }
    });
  }
});
// Compile a rename table command.
// SchemaCompiler_Firebird.prototype.renameTable = function(from, to) {
//   this.pushQuery(
//     `alter table ${this.formatter.wrap(from)} rename to ${this.formatter.wrap(
//       to
//     )}`
//   );
// };

exports['default'] = SchemaCompiler_Firebird;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2hlbWEvY29tcGlsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7d0JBRXFCLFVBQVU7Ozs7cUNBQ0osMEJBQTBCOzs7O3NCQUVoQyxRQUFROzs7OztBQUs3QixTQUFTLHVCQUF1QixHQUFJO0FBQ2xDLHFDQUFlLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7Q0FDdkM7O0FBRUQsc0JBQVMsdUJBQXVCLHFDQUFpQixDQUFDOztBQUVsRCxNQUFNLENBQUMsTUFBTSxDQUFDLHVCQUF1QixDQUFDLFNBQVMsRUFBRTs7QUFFL0MsVUFBUSxFQUFBLGtCQUFDLFNBQVMsRUFBQztBQUNqQixRQUFNLEdBQUcsR0FDUCx3RUFDNkIsZ0NBQ0gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUUsQ0FBQztBQUNsRSxRQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBRyxFQUFILEdBQUcsRUFBRSxNQUFNLEVBQUUsZ0JBQUMsSUFBSTtlQUFLLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQztPQUFBLEVBQUUsQ0FBQyxDQUFDO0dBQzVEOzs7QUFHRCxXQUFTLEVBQUEsbUJBQUMsU0FBUyxFQUFFLE1BQU0sRUFBQztBQUMxQixRQUFJLENBQUMsU0FBUyxDQUFDO0FBQ2IsU0FBRyxFQUFFLDBGQUMwQyxvREFDSSxxQ0FDbEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUU7QUFDakUsWUFBTSxFQUFBLGdCQUFDLElBQUksRUFBRTs7O0FBQ1gsZUFBTyxhQUFLLElBQUksRUFBRSxVQUFDLEdBQUcsRUFBSztBQUN6QixpQkFDRSxNQUFLLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUNsRCxNQUFLLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQ2hEO1NBQ0gsQ0FBQyxDQUFDO09BQ0o7S0FDRixDQUFDLENBQUM7R0FDSjtDQUNGLENBQUMsQ0FBQzs7Ozs7Ozs7OztxQkFVWSx1QkFBdUIiLCJmaWxlIjoiY29tcGlsZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBGaXJlYmlyZDogQ29sdW1uIEJ1aWxkZXIgJiBDb21waWxlclxyXG4vLyAtLS0tLS0tXHJcbmltcG9ydCBpbmhlcml0cyBmcm9tICdpbmhlcml0cyc7XHJcbmltcG9ydCBTY2hlbWFDb21waWxlciBmcm9tICdrbmV4L2xpYi9zY2hlbWEvY29tcGlsZXInO1xyXG5cclxuaW1wb3J0IHsgc29tZSB9IGZyb20gJ2xvZGFzaCc7XHJcblxyXG4vLyBTY2hlbWEgQ29tcGlsZXJcclxuLy8gLS0tLS0tLVxyXG5cclxuZnVuY3Rpb24gU2NoZW1hQ29tcGlsZXJfRmlyZWJpcmQgKCkge1xyXG4gIFNjaGVtYUNvbXBpbGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmluaGVyaXRzKFNjaGVtYUNvbXBpbGVyX0ZpcmViaXJkLCBTY2hlbWFDb21waWxlcik7XHJcblxyXG5PYmplY3QuYXNzaWduKFNjaGVtYUNvbXBpbGVyX0ZpcmViaXJkLnByb3RvdHlwZSwge1xyXG4gIC8vIENvbXBpbGUgdGhlIHF1ZXJ5IHRvIGRldGVybWluZSBpZiBhIHRhYmxlIGV4aXN0cy5cclxuICBoYXNUYWJsZSh0YWJsZU5hbWUpe1xyXG4gICAgY29uc3Qgc3FsID1cclxuICAgICAgYHNlbGVjdCByLnJkYiRyZWxhdGlvbl9uYW1lIGFzIFwiVGFibGVcIiBgICtcclxuICAgICAgYGZyb20gcmRiJHJlbGF0aW9ucyByIHdoZXJlIGAgK1xyXG4gICAgICBgIHIucmRiJHJlbGF0aW9uX25hbWUgPSAke3RoaXMuZm9ybWF0dGVyLnBhcmFtZXRlcih0YWJsZU5hbWUpfWA7XHJcbiAgICB0aGlzLnB1c2hRdWVyeSh7IHNxbCwgb3V0cHV0OiAocmVzcCkgPT4gcmVzcC5sZW5ndGggPiAwIH0pO1xyXG4gIH0sXHJcblxyXG4gIC8vIENvbXBpbGUgdGhlIHF1ZXJ5IHRvIGRldGVybWluZSBpZiBhIGNvbHVtbiBleGlzdHMuXHJcbiAgaGFzQ29sdW1uKHRhYmxlTmFtZSwgY29sdW1uKXtcclxuICAgIHRoaXMucHVzaFF1ZXJ5KHtcclxuICAgICAgc3FsOiBgc2VsZWN0IGkucmRiJGZpZWxkX25hbWUgYXMgXCJGaWVsZFwiIGZyb20gYCArXHJcbiAgICAgICAgYHJkYiRyZWxhdGlvbnMgciBqb2luIHJkYiRSRUxBVElPTl9GSUVMRFMgaSBgICtcclxuICAgICAgICBgb24gKGkucmRiJHJlbGF0aW9uX25hbWUgPSByLnJkYiRyZWxhdGlvbl9uYW1lKSBgICtcclxuICAgICAgICBgd2hlcmUgci5yZGIkcmVsYXRpb25fbmFtZSA9ICR7dGhpcy5mb3JtYXR0ZXIud3JhcCh0YWJsZU5hbWUpfWAsXHJcbiAgICAgIG91dHB1dChyZXNwKSB7XHJcbiAgICAgICAgcmV0dXJuIHNvbWUocmVzcCwgKGNvbCkgPT4ge1xyXG4gICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgdGhpcy5jbGllbnQud3JhcElkZW50aWZpZXIoY29sLm5hbWUudG9Mb3dlckNhc2UoKSkgPT09XHJcbiAgICAgICAgICAgIHRoaXMuY2xpZW50LndyYXBJZGVudGlmaWVyKGNvbHVtbi50b0xvd2VyQ2FzZSgpKVxyXG4gICAgICAgICAgKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG4gIH1cclxufSk7XHJcbi8vIENvbXBpbGUgYSByZW5hbWUgdGFibGUgY29tbWFuZC5cclxuLy8gU2NoZW1hQ29tcGlsZXJfRmlyZWJpcmQucHJvdG90eXBlLnJlbmFtZVRhYmxlID0gZnVuY3Rpb24oZnJvbSwgdG8pIHtcclxuLy8gICB0aGlzLnB1c2hRdWVyeShcclxuLy8gICAgIGBhbHRlciB0YWJsZSAke3RoaXMuZm9ybWF0dGVyLndyYXAoZnJvbSl9IHJlbmFtZSB0byAke3RoaXMuZm9ybWF0dGVyLndyYXAoXHJcbi8vICAgICAgIHRvXHJcbi8vICAgICApfWBcclxuLy8gICApO1xyXG4vLyB9O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgU2NoZW1hQ29tcGlsZXJfRmlyZWJpcmQ7XHJcbiJdfQ==