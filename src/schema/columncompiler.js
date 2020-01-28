import { assign } from 'lodash';
import inherits from 'inherits';
import ColumnCompiler from 'knex/lib/schema/columncompiler';

function ColumnCompiler_Firebird() {
  ColumnCompiler.apply(this, arguments);
  this.modifiers = [ 'collate', 'nullable' ];
}
inherits(ColumnCompiler_Firebird, ColumnCompiler);

assign(ColumnCompiler_Firebird.prototype, {

  increments: 'int not null primary key',

  collate(collation) {
    // TODO request `charset` modifier of knex column
    return collation && `character set ${collation}`
  }

});

export default ColumnCompiler_Firebird;
