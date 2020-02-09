// Firebird
// -------
import Bluebird from 'bluebird';

import inherits from 'inherits';
import { isUndefined, map, defaults } from 'lodash';
import { promisify } from 'util';
import assert from 'assert';
import Client from 'knex/lib/client';


import ColumnCompiler from './schema/columncompiler';
import QueryCompiler from './query/compiler';
import TableCompiler from './schema/tablecompiler';
import Transaction from './transaction';
import SchemaCompiler from './schema/compiler';
import Firebird_Formatter from './formatter';




function Client_Firebird(config) {
  Client.call(this, config);
}
inherits(Client_Firebird, Client);

Object.assign(Client_Firebird.prototype, {

  dialect: 'firebird',

  driverName: 'node-firebird',

  _driver() {
    return require('node-firebird');
  },

  schemaCompiler() {
    return new SchemaCompiler(this, ...arguments);
  },

  queryCompiler() {
    return new QueryCompiler(this, ...arguments);
  },

  columnCompiler() {
    return new ColumnCompiler(this, ...arguments);
  },

  tableCompiler() {
    return new TableCompiler(this, ...arguments);
  },
  Transaction,

  // ddl(compiler, pragma, connection) {
  //   return new SQLite3_DDL(this, compiler, pragma, connection);
  // },

  wrapIdentifierImpl(value) {
    return value !== '*' ? `\`${value.replace(/`/g, '``')}\`` : '*';
  },


  // Get a raw connection from the database, returning a promise with the connection object.
  acquireRawConnection() {
    assert(!this._connectionForTransactions);
    return new Bluebird((resolve, reject) => {
      this.driver.attach(this.connectionSettings, (error, connection) => {
        if (error) return reject(error);
        resolve(connection);
      });
    });
  },

  // Used to explicitly close a connection, called internally by the pool when
  // a connection times out or the pool is shutdown.
  async destroyRawConnection(connection) {
    const close = promisify((cb) => connection.detach(cb));
    return close();
  },

  // Runs the query on the specified connection, providing the bindings and any
  // other necessary prep work.
  _query(connection, obj) {
    if (!obj || typeof obj === 'string') obj = { sql: obj };
    return new Bluebird(function (resolver, rejecter) {
      if (!connection) {
        return rejecter(
          new Error(`Error calling ${callMethod} on connection.`)
        );
      };

      let { sql } = obj;
      sql = sql.split("`").join('"');      
      if (!sql) return resolver();
      const c = connection._trasaction || connection;
      c.query(sql, obj.bindings, (error, rows, fields) => {
        if (error) return rejecter(error);
        obj.response = [rows, fields];
        resolver(obj);
      });      
    });
  },

  _stream(connection, sql, stream) {
    throw new Error('_stream not implemented');
    // const client = this;
    // return new Bluebird(function (resolver, rejecter) {
    //   stream.on('error', rejecter);
    //   stream.on('end', resolver);
    //   return client
    //     ._query(connection, sql)
    //     .then((obj) => obj.response)
    //     .then((rows) => rows.forEach((row) => stream.write(row)))
    //     .catch(function (err) {
    //       stream.emit('error', err);
    //     })
    //     .then(function () {
    //       stream.end();
    //     });
    // });
  },

  // Ensures the response is returned in the same format as other clients.
  processResponse(obj, runner) {
    if (!obj) return;
    let { response } = obj;
    
    const [rows, fields] = response;
    this._fixBufferStrings(rows, fields);
    return rows;
  },

  _fixBufferStrings(rows, fields) {
    if (!rows) return rows;
    for (const row of rows) {
      for (const cell in row) {
        const value = row[cell];
        if (Buffer.isBuffer(value)) {
          for (const field of fields) {
            if (field.alias === cell &&
              field.type === 448) { // SQLVarString
              row[cell] = value.toString();
              break;
            }
          }
        }
      }
    }
  },

  poolDefaults() {
    return defaults(
      { min: 1, max: 1 },
      Client.prototype.poolDefaults.call(this)
    );
  },

  ping(resource, callback) {
    resource.query('select 1 from RDB$DATABASE', callback);
  },


  // formatter() {
  //   return new Firebird_Formatter(this, ...arguments);
  // },
});

Client_Firebird.dialect = 'firebird';


export default Client_Firebird;
