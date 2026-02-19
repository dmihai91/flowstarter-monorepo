const fs=require('fs');const c=[];process.stdin.on('data',d=>c.push(d));process.stdin.on('end',()=>{fs.writeFileSync(process.argv[2],Buffer.from(c.join(''),'base64'));console.log('done')});
