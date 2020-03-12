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
      return [offset + 1, 1 << 30];
    } else {
      if (!offset) return [limit];
      return [offset + 1, offset + limit];
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
  },
  // Compiles a `columnInfo` query
  columnInfo() {
    const column = this.single.columnInfo;

    // The user may have specified a custom wrapIdentifier function in the config. We
    // need to run the identifiers through that function, but not format them as
    // identifiers otherwise.
    const table = this.client.customWrapIdentifier(this.single.table, identity);

    return {
      sql: `
      select 
        rlf.rdb$field_name as name,
        fld.rdb$character_length as max_length,
        typ.rdb$type_name as type,
        rlf.rdb$null_flag as not_null
      from rdb$relation_fields rlf
      inner join rdb$fields fld on fld.rdb$field_name = rlf.rdb$field_source
      inner join rdb$types typ on typ.rdb$type = fld.rdb$field_type
      where rdb$relation_name = '${table}'
      `,
      output(resp) {
        const [rows, fields] = resp;

        const maxLengthRegex = /.*\((\d+)\)/;
        const out = reduce(
          rows,
          function (columns, val) {
            const name = val.NAME.trim();
            columns[name] = {
              type: val.TYPE.trim().toLowerCase(),
              nullable: !val.NOT_NULL,
              // ATSTODO: "defaultValue" não implementado
              // defaultValue: null,
            };

            if (val.MAX_LENGTH) {
              columns[name] = val.MAX_LENGTH;
            }

            return columns;
          },
          {}
        );
        console.log('Resultado columnInfo', { out, column });
        return (column && out[column]) || out;
      },
    };
  },
  whereIn(statement) {
    // O FB não suporta `in` de tupla para tupla; neste caso, monta um or
    if (Array.isArray(statement.column)) {
      const conditions = statement.value.map(valueCols => valueCols.map((value, idx) => {
        return `${this['formatter'].columnize(statement.column[idx])} = ${this['formatter'].values(value)}`
      }).join(' and '));
      return `( ${conditions.join('\n or ')} )`;
    }
    return super.whereIn(statement);
  }

});

export default QueryCompiler_Firebird;

