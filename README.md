```js
var knex = require('knex')({
  client: require('firebird-knex'),
  connection: {
    host: "127.0.0.1",
    port: 3050,
    user: "SYSDBA",
    password: "masterkey",
    database: __dirname + '/data.fdb'
  }
});

// Create a table
knex.schema.createTable('users', function(table) {
  table.increments('id');
  table.string('user_name');
})

// ...and another
.createTable('accounts', function(table) {
  table.increments('id');
  table.string('account_name');
  table.integer('user_id').unsigned().references('users.id');
})

// Then query the table...
.then(function() {
  return knex.insert({id: 1, user_name: 'Tim'}).into('users');
})

// ...and using the insert id, insert into the other table.
.then(function() {
  return knex.table('accounts').insert({id: 101, account_name: 'knex', user_id: 1});
})

// Query both of the rows.
.then(function() {
  return knex('users')
    .join('accounts', 'users.id', 'accounts.user_id')
    .select('users.user_name as user_name', 'accounts.account_name as account');
})

// .map over the results
.map(function(row) {
  console.log(row);
})

.then(function() {
  knex.destroy();
})

// Finally, add a .catch handler for the promise chain
.catch(function(e) {
  console.error(e);
});
```
