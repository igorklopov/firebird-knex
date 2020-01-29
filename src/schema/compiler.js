// Firebird: Column Builder & Compiler
// -------
import inherits from 'inherits';
import SchemaCompiler from 'knex/lib/schema/compiler';

import { some } from 'lodash';

// Schema Compiler
// -------

function SchemaCompiler_Firebird () {
  SchemaCompiler.apply(this, arguments);
}

inherits(SchemaCompiler_Firebird, SchemaCompiler);

Object.assign(SchemaCompiler_Firebird.prototype, {
  // Compile the query to determine if a table exists.
  hasTable(tableName){
    const sql =
      `select r.rdb$relation_name as "Table" ` +
      `from rdb$relations r where ` +
      ` r.rdb$relation_name = ${this.formatter.parameter(tableName)}`;
    this.pushQuery({ sql, output: (resp) => resp.length > 0 });
  },

  // Compile the query to determine if a column exists.
  hasColumn(tableName, column){
    this.pushQuery({
      sql: `select i.rdb$field_name as "Field" from ` +
        `rdb$relations r join rdb$RELATION_FIELDS i ` +
        `on (i.rdb$relation_name = r.rdb$relation_name) ` +
        `where r.rdb$relation_name = ${this.formatter.wrap(tableName)}`,
      output(resp) {
        return some(resp, (col) => {
          return (
            this.client.wrapIdentifier(col.name.toLowerCase()) ===
            this.client.wrapIdentifier(column.toLowerCase())
          );
        });
      },
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

export default SchemaCompiler_Firebird;
