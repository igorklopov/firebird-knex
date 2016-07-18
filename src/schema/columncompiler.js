import { Client } from 'knex';
import { assign } from 'lodash';
import inherits from 'inherits';

const ColumnCompiler = Client.prototype.ColumnCompiler;

function ColumnCompiler_Firebird() {
  ColumnCompiler.apply(this, arguments);
  this.modifiers = [ 'nullable' ];
}
inherits(ColumnCompiler_Firebird, ColumnCompiler);

assign(ColumnCompiler_Firebird.prototype, {

  increments: 'int not null primary key'

});

export default ColumnCompiler_Firebird;
