import inherits from 'inherits';
import TableCompiler from 'knex/lib/schema/tablecompiler';

// Table Compiler
// -------

function TableCompiler_Firebird () {
  TableCompiler.apply(this, arguments);
}
inherits(TableCompiler_Firebird, TableCompiler);

Object.assign(TableCompiler_Firebird.prototype, {
  // Create a new table.
  createQuery(columns, ifNot){
    if (ifNot) throw new Error('createQuery ifNot not implemented');
    const createStatement = 'create table ';
    let sql = createStatement + this.tableName() + ' (' + columns.sql.join(', ') + ')';
    this.pushQuery(sql);
  },


  // Compile a plain index key command.
  index(columns, indexName){
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery(`create index ${indexName} on ${this.tableName()} (${this.formatter.columnize(columns)})`);
  },

  //TableCompiler_Firebird.prototype.foreign =
  primary(){
    constraintName = constraintName ? this.formatter.wrap(constraintName) : this.formatter.wrap(`${this.tableNameRaw}_pkey`);
    this.pushQuery(`alter table ${this.tableName()} add constraint ${constraintName} primary key (${this.formatter.columnize(columns)})`);
  }

});

export default TableCompiler_Firebird;
