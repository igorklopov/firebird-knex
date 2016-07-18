import { Client } from 'knex';
import { assign } from 'lodash';
import inherits from 'inherits';

const QueryCompiler = Client.prototype.QueryCompiler;

function QueryCompiler_Firebird(client, builder) {
  QueryCompiler.call(this, client, builder);
}
inherits(QueryCompiler_Firebird, QueryCompiler);

assign(QueryCompiler_Firebird.prototype, {

  _prepInsert(insertValues) {
    const newValues = {};
    for (const key in insertValues) {
      const value = insertValues[key];
      if (typeof value !== "undefined") {
        newValues[key] = value;
      }
    }
    return QueryCompiler.prototype._prepInsert.call(this, newValues);
  }

});

export default QueryCompiler_Firebird;
