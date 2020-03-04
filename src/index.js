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
  QueryCompiler,

  columnCompiler() {
    return new ColumnCompiler(this, ...arguments);
  },

  tableCompiler() {
    return new TableCompiler(this, ...arguments);
  },
  Transaction,

  wrapIdentifierImpl(value) {
    
    if (value === '*') return value;   


    if (!/^[A-Za-z0-9_]+$/.test(value)) {
      //Dialect 1 of firebird doesn't support special characters
      //Backquotes only available on dialect 3
      throw new Error(`Invalid identifier: "${value}"; Dialect 1 doesn't support special characters.`);
    }
    return value;
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
      console.log('SQL', sql);
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
    return this._fixBlobCallbacks(rows, fields);
  },

  _fixBufferStrings(rows, fields) {
    if (!rows) return rows;
    for (const row of rows) {
      for (const cell in row) {
        const value = row[cell];
        if (Buffer.isBuffer(value)) {
          for (const field of fields) {
            if (field.alias === cell &&
              (field.type === 448 || field.type === 452)) { // SQLVarString                
              row[cell] = value.toString('latin1');
              break;
            }
          }
        }
      }
    }
  },
  /**   
  * The Firebird library returns BLOLs with callback functions; Those need to be loaded asynchronously
  * @param {*} rows 
  * @param {*} fields 
  */
  _fixBlobCallbacks(rows, fields) {    
    if (!rows) return rows;

    const blobEntries = [];

    // Seek and verify if there is any BLOB
    for (const row of rows) {
      for (const cell in row) {
        const value = row[cell];       
        // ATSTODO: Está presumindo que o blob é texto; recomenda-se diferenciar texto de binário. Talvez o "fields" ajude?
        // Is it a callback BLOB?
        if (value instanceof Function) {
          blobEntries.push(new Promise((resolve, reject) => {
            value((err, name, stream) => {
              if (err) {
                reject(err);
                return;
              }

              // ATSTODO: Ver como fazer quando o string não tiver o "setEncoding()"
              if (!stream['setEncoding']) {
                stream['setEncoding'] = () => undefined;
              }

              // ATSTODO: Não está convertendo os cadacteres acentuados corretamente, mesmo informando a codificação
              resolve(readableToString(stream, 'latin1').then(blobString => {
                row[cell] = blobString;
              }));
            });
          }));
        }
      }
    }
    // Returns a Promise that wait BLOBs be loaded and retuns it
    return Promise.all(blobEntries).then(() => rows);
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
  // ddl(compiler, pragma, connection) {
  //   return new Firebird_DDL(this, compiler, pragma, connection);
  // },


  
  Firebird_Formatter
  
});

Client_Firebird.dialect = 'firebird';


export default Client_Firebird;
