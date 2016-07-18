import ColumnCompiler from '../../../schema/columncompiler';
import inherits from 'inherits';

function ColumnCompiler_Firebird() {
  ColumnCompiler.apply(this, arguments);
  this.modifiers = [ 'nullable' ];
}
inherits(ColumnCompiler_Firebird, ColumnCompiler);

export default ColumnCompiler_Firebird;
