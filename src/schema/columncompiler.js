import inherits from 'inherits';
import ColumnCompiler from 'knex/lib/schema/columncompiler';

// Column Compiler
// -------

function  ColumnCompiler_Firebird () {
  ColumnCompiler.apply(this, arguments);
  this.modifiers = [ 'collate', 'nullable' ];
}
inherits(ColumnCompiler_Firebird, ColumnCompiler);

Object.assign(ColumnCompiler_Firebird.prototype, {

  increments: 'integer not null primary key',

  collate(collation) {
    // TODO request `charset` modifier of knex column    
    return collation && `character set ${collation|| 'ASCII'}`
  }

});

export default ColumnCompiler_Firebird;
