import { Client, Promise } from 'knex';
import { assign } from 'lodash';
import inherits from 'inherits';

const Transaction = Client.prototype.Transaction;

function Transaction_Firebird() {
  Transaction.apply(this, arguments);
}
inherits(Transaction_Firebird, Transaction);

assign(Transaction_Firebird.prototype, {

  begin(conn) {
    return new Promise((resolve, reject) => {
      conn.transaction(this.client.driver.ISOLATION_READ_COMMITED, (error, transaction) => {
        if (error) return reject(error);
        conn._transaction = transaction;
        resolve();
      });
    });
  },

  savepoint() {
    throw new Error("savepoints not implemented");
  },

  commit(conn, value) {
    return new Promise((resolve, reject) => {
      conn._transaction.commit((error) => {
        if (error) return reject(error);
        delete conn._transaction;
        this._resolver(value);
        this._completed = true;
        resolve();
      });
    });
  },

  release() {
    throw new Error("releasing savepoints not implemented");
  },

  rollback(conn, value) {
    return new Promise((resolve, reject) => {
      conn._transaction.rollback((error) => {
        if (error) return reject(error);
        delete conn._transaction;
        this._rejecter(value);
        this._completed = true;
        resolve();
      });
    });
  },

  rollbackTo() {
    throw new Error("rolling back to savepoints not implemented");
  }

});

export default Transaction_Firebird;
