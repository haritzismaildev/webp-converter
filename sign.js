const crypto = require('crypto');
const fs     = require('fs');
const SECRET = 'supersecretkey123';

const raw = fs.readFileSync('payload.json');
const hash = crypto.createHmac('sha512', SECRET)
  .update(raw)
  .digest('hex');

console.log(hash);