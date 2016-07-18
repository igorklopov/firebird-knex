import { Client } from 'knex';
import inherits from 'inherits';

const ColumnCompiler = Client.prototype.ColumnCompiler;

function ColumnCompiler_Firebird() {
  ColumnCompiler.apply(this, arguments);
  this.modifiers = [ 'nullable' ];
}
inherits(ColumnCompiler_Firebird, ColumnCompiler);

export default ColumnCompiler_Firebird;
