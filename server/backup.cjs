const { PrismaClient, Prisma } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

(async () => {
  fs.mkdirSync('backup', { recursive: true });
  const urls = new Set();

  for (const m of Prisma.dmmf.datamodel.models) {
    const name = m.name[0].toLowerCase() + m.name.slice(1);
    const rows = await prisma[name].findMany();
    const json = JSON.stringify(rows, null, 2);
    fs.writeFileSync(`backup/${m.name}.json`, json);
    (json.match(/https:\/\/res\.cloudinary\.com\/[^"\s)\\]+/g) || []).forEach((u) => urls.add(u));
    console.log(m.name.padEnd(22), rows.length, 'rows');
  }

  fs.writeFileSync('backup/urls.txt', [...urls].join('\n'));
  console.log('\nCloudinary URLs found:', urls.size);
  await prisma.$disconnect();
})();