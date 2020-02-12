// Firebird Query Builder & Compiler
import inherits from 'inherits';
import QueryCompiler from "knex/lib/query/compiler";

function QueryCompiler_Firebird(client, builder) {
  QueryCompiler.call(this, client, builder);
}
inherits(QueryCompiler_Firebird, QueryCompiler);

Object.assign(QueryCompiler_Firebird.prototype, {
  // TODO probably buggy. test it

  // limit 5           -> rows 1 to 5   - or just rows 5
  // limit 5 offset  0 -> rows 1 to 5   - or just rows 5
  // limit 5 offset 10 -> rows 11 to 15
  //         offset 10 -> rows 11 to very big value
  //         offset  0 -> nothing

  _calcRows() {
    const { limit, offset } = this.single;
    if (!limit && limit !== 0) {
      if (!offset) return [];
      return [ offset + 1, 1 << 30 ];
    } else {
      if (!offset) return [ limit ];
      return [ offset + 1, offset + limit ];
    }
  },

  limit() {
    const rows = this._calcRows()[0];
    if (rows === undefined) return;
    return 'rows ' + this.formatter.parameter(rows);
  },

  offset() {
    const to = this._calcRows()[1];
    if (to === undefined) return;
    return 'to ' + this.formatter.parameter(to);
  },

  _prepInsert(insertValues) {
    const newValues = {};
    for (const key in insertValues) {
      const value = insertValues[key];
      if (typeof value !== 'undefined') {
        newValues[key] = value;
      }
    }
    return QueryCompiler.prototype._prepInsert.call(this, newValues);
  }

});

export default QueryCompiler_Firebird;

