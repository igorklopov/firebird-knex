import { Client } from 'knex';
import { assign } from 'lodash';
import inherits from 'inherits';

const TableCompiler = Client.prototype.TableCompiler;

function TableCompiler_Firebird() {
  TableCompiler.apply(this, arguments);
}
inherits(TableCompiler_Firebird, TableCompiler);

assign(TableCompiler_Firebird.prototype, {

  createQuery(columns, ifNot) {
    if (ifNot) throw new Error("createQuery ifNot not implemented");
    const createStatement = 'create table ';
    let sql = createStatement + this.tableName() + ' (' + columns.sql.join(', ') + ')';
    this.pushQuery(sql);
  },

  index(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery(`create index ${indexName} on ${this.tableName()} (${this.formatter.columnize(columns)})`);
  },

  primary(columns, constraintName) {
    constraintName = constraintName ? this.formatter.wrap(constraintName) : this.formatter.wrap(`${this.tableNameRaw}_pkey`);
    this.pushQuery(`alter table ${this.tableName()} add constraint ${constraintName} primary key (${this.formatter.columnize(columns)})`);
  }

});

export default TableCompiler_Firebird;
