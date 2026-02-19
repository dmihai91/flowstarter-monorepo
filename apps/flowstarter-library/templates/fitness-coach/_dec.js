// Decoder: reads base64 from stdin, writes to file specified as argument
const fs = require('fs');
const chunks = [];
process.stdin.on('data', (c) => chunks.push(c));
process.stdin.on('end', () => {
  const decoded = Buffer.from(chunks.join(''), 'base64');
  fs.writeFileSync(process.argv[2], decoded);
  console.log('Written: ' + process.argv[2]);
});