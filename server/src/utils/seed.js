import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma, connectDB } from '../config/db.js';

// Image files live in the React client at client/public/products/*.jpg
// and are served at /products/<file> by Vite. Products store those paths.
const img = (f) => `/products/${f}`;

const products = [
  {
    name: 'Peach Leheriya Organza Saree',
    slug: 'peach-leheriya-organza',
    category: 'saree',
    fabric: 'Organza',
    occasion: 'Festive',
    color: 'Peach',
    price: 4890,
    mrp: 6100,
    images: [
      '/products/peach-leheriya-organza-1.jpg',
      '/products/peach-leheriya-organza-2.jpg',
      '/products/peach-leheriya-organza-3.jpg',
      '/products/peach-leheriya-organza-4.jpg',
      '/products/peach-leheriya-organza-5.jpg',
      '/products/peach-leheriya-organza-6.jpg',
    ],
    description:
      'Hand-dyed leheriya waves running peach into gold on sheer organza, scattered with tiny embroidered blooms. Comes with a matching unstitched blouse piece.',
    care: 'Dry clean only. Store rolled rather than folded to keep the organza crisp.',
    blouseNote: 'Comes with an unstitched blouse piece (0.8m).',
    stock: 6,
    rating: 4.9,
    numReviews: 8,
    featured: true,
    isNewArrival: true,
  },

  {
    name: 'Mauve Kalamkari Peacock Saree',
    slug: 'mauve-kalamkari-peacock',
    category: 'saree',
    fabric: 'Chanderi',
    occasion: 'Festive',
    color: 'Mauve',
    price: 6490,
    mrp: 8000,
    images: [
      '/products/mauve-kalamkari-peacock-1.jpg',
      '/products/mauve-kalamkari-peacock-2.jpg',
      '/products/mauve-kalamkari-peacock-3.jpg',
      '/products/mauve-kalamkari-peacock-4.jpg',
      '/products/mauve-kalamkari-peacock-5.jpg',
      '/products/mauve-kalamkari-peacock-6.jpg',
      '/products/mauve-kalamkari-peacock-7.jpg',
      '/products/mauve-kalamkari-peacock-8.jpg',
    ],
    description:
      'Hand-painted kalamkari peacocks and flowering vines across a soft mauve Chanderi, finished with a mustard temple border. Each panel is painted by hand, so no two are identical.',
    care: 'Dry clean only. Keep away from prolonged direct sunlight.',
    blouseNote: 'Comes with an unstitched blouse piece (0.8m).',
    stock: 4,
    rating: 4.9,
    numReviews: 12,
    featured: true,
    isNewArrival: true,
  },

  {
    name: 'Mustard Saree with Turquoise Printed Blouse',
    slug: 'mustard-turquoise-set',
    category: 'saree',
    fabric: 'Mul Cotton',
    occasion: 'Everyday',
    color: 'Mustard',
    price: 3290,
    mrp: 4200,
    images: [
      '/products/mustard-turquoise-set-1.jpg',
      '/products/mustard-turquoise-set-2.jpg',
      '/products/mustard-turquoise-set-3.jpg',
    ],
    description:
      'A clean mustard mul cotton saree paired with a turquoise floral-print blouse — the kind of easy contrast that works for a daytime function or a workday.',
    care: 'Hand wash in cold water separately for the first few washes. Dry in shade.',
    blouseNote: 'Saree with a matching stitched blouse.',
    stock: 9,
    rating: 4.7,
    numReviews: 6,
    isNewArrival: true,
  },

  {
    name: 'Magenta Saree with Emerald Embroidered Blouse',
    slug: 'magenta-emerald-set',
    category: 'saree',
    fabric: 'Chiffon',
    occasion: 'Party',
    color: 'Magenta',
    price: 4190,
    mrp: 5300,
    images: [
      '/products/magenta-emerald-set-1.jpg',
      '/products/magenta-emerald-set-2.jpg',
      '/products/magenta-emerald-set-3.jpg',
    ],
    description:
      'A fluid magenta chiffon saree with an emerald blouse worked in floral thread embroidery and a scalloped lace trim — a full look, ready to wear.',
    care: 'Dry clean recommended.',
    blouseNote: 'Saree with a matching stitched blouse.',
    stock: 7,
    rating: 4.8,
    numReviews: 9,
    featured: true,
  },

  {
    name: 'Green & Gold Leheriya Saree',
    slug: 'green-gold-leheriya',
    category: 'saree',
    fabric: 'Organza',
    occasion: 'Festive',
    color: 'Green',
    price: 4590,
    mrp: 5800,
    images: [
      '/products/green-gold-leheriya-1.jpg',
      '/products/green-gold-leheriya-2.jpg',
      '/products/green-gold-leheriya-3.jpg',
      '/products/green-gold-leheriya-4.jpg',
      '/products/green-gold-leheriya-5.jpg',
    ],
    description:
      'Bright green and gold leheriya on organza with a sequinned gota border — light to drape, loud enough to not need much jewellery.',
    care: 'Dry clean only. Store rolled to protect the gota work.',
    blouseNote: 'Comes with an unstitched blouse piece (0.8m).',
    stock: 8,
    rating: 4.8,
    numReviews: 10,
    isNewArrival: true,
  },

  {
    name: 'Lavender Bird Print Chiffon Saree',
    slug: 'lavender-bird-chiffon',
    category: 'saree',
    fabric: 'Chiffon',
    occasion: 'Daywear',
    color: 'Lavender',
    price: 3490,
    mrp: 4400,
    images: [
      '/products/lavender-bird-chiffon-1.jpg',
      '/products/lavender-bird-chiffon-2.jpg',
    ],
    description:
      'Small birds and wildflowers printed across a pale lavender chiffon — a quiet, light saree that drapes softly and works right through summer.',
    care: 'Dry clean recommended. Hand wash cold if needed, dry flat.',
    blouseNote: 'Sold as saree only.',
    stock: 11,
    rating: 4.7,
    numReviews: 11,
  },

  {
    name: 'Maroon Patola Ikat Saree',
    slug: 'maroon-patola-ikat',
    category: 'saree',
    fabric: 'Silk',
    occasion: 'Wedding',
    color: 'Maroon',
    price: 7990,
    mrp: 9800,
    images: [
      '/products/maroon-patola-ikat-1.jpg',
      '/products/maroon-patola-ikat-2.jpg',
    ],
    description:
      'A maroon patola-style ikat in silk with orange and cream motifs and a woven gold border — the resist-dyeing is done before weaving, which is why the pattern reads on both faces.',
    care: 'Dry clean only. Store folded in muslin.',
    blouseNote: 'Comes with an unstitched blouse piece (0.8m).',
    stock: 4,
    rating: 4.9,
    numReviews: 14,
    featured: true,
  },

  {
    name: 'Peach Madhubani Hand-Painted Saree',
    slug: 'peach-madhubani',
    category: 'saree',
    fabric: 'Chanderi',
    occasion: 'Festive',
    color: 'Peach',
    price: 6890,
    mrp: 8500,
    images: [
      '/products/peach-madhubani-1.jpg',
      '/products/peach-madhubani-2.jpg',
      '/products/peach-madhubani-3.jpg',
    ],
    description:
      'Madhubani figures and folk motifs hand-painted onto peach Chanderi with a woven gold border. Painted panel by panel, so small variations are part of the piece.',
    care: 'Dry clean only. Avoid folding along the painted figures.',
    blouseNote: 'Comes with an unstitched blouse piece (0.8m).',
    stock: 3,
    rating: 5.0,
    numReviews: 7,
    featured: true,
    isNewArrival: true,
  },

  {
    name: 'Mustard Elephant Print Chanderi Saree',
    slug: 'mustard-elephant-chanderi',
    category: 'saree',
    fabric: 'Chanderi',
    occasion: 'Everyday',
    color: 'Mustard',
    price: 3890,
    mrp: 4900,
    images: [
      '/products/mustard-elephant-chanderi-1.jpg',
    ],
    description:
      'Block-printed elephants marching across mustard Chanderi with fine zari stripes and a black border — playful without tipping into costume.',
    care: 'Dry clean recommended for the first wash, then gentle hand wash in cold water.',
    blouseNote: 'Comes with an unstitched blouse piece (0.8m).',
    stock: 10,
    rating: 4.7,
    numReviews: 5,
    isNewArrival: true,
  },

  {
    name: 'Rose & Emerald Embroidered Suit Set',
    slug: 'rose-emerald-suit',
    category: 'suit',
    fabric: 'Cotton Silk',
    occasion: 'Festive',
    color: 'Rose',
    price: 4290,
    mrp: 5400,
    images: [
      '/products/rose-emerald-suit-1.jpg',
      '/products/rose-emerald-suit-2.jpg',
    ],
    description:
      'A rose-pink kurta panel with fine floral embroidery, paired with an emerald-and-blue geometric dupatta — an unstitched three-piece set you can have tailored to fit.',
    care: 'Dry clean recommended.',
    blouseNote: 'Unstitched three-piece set: kurta, bottom, dupatta.',
    stock: 7,
    rating: 4.8,
    numReviews: 8,
    featured: true,
    isNewArrival: true,
  },

  {
    name: 'Red Ajrakh Block Print Suit Set',
    slug: 'red-ajrakh-suit',
    category: 'suit',
    fabric: 'Ajrakh Cotton',
    occasion: 'Everyday',
    color: 'Red',
    price: 3490,
    mrp: 4400,
    images: [
      '/products/red-ajrakh-suit-1.jpg',
      '/products/red-ajrakh-suit-2.jpg',
    ],
    description:
      'Traditional Ajrakh block printing in madder red and indigo across breathable cotton — an unstitched set that softens beautifully with every wash.',
    care: 'Hand wash in cold water separately for the first few washes. The natural dyes settle over time.',
    blouseNote: 'Unstitched three-piece set: kurta, bottom, dupatta.',
    stock: 12,
    rating: 4.7,
    numReviews: 9,
    isNewArrival: true,
  },
];

const coupons = [
  {
    code: 'WELCOME10',
    discountType: 'percent',
    value: 10,
    minOrderValue: 1500,
    maxDiscount: 1000,
    usageLimit: null,
    expiresAt: null,
  },
  {
    code: 'FESTIVE500',
    discountType: 'flat',
    value: 500,
    minOrderValue: 3500,
    maxDiscount: null,
    usageLimit: 200,
    expiresAt: null,
  },
];

async function run() {
  await connectDB();

  const destroy = process.argv.includes('--destroy');
  if (destroy) {
    await prisma.statusEvent.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.review.deleteMany();
    await prisma.product.deleteMany();
    await prisma.coupon.deleteMany();
    console.log('Products, coupons, reviews and orders cleared.');
    await prisma.$disconnect();
    process.exit(0);
  }

  // Reset products, coupons & orders (keep users so you don't lose accounts)
  await prisma.statusEvent.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.coupon.deleteMany();

  await prisma.product.createMany({ data: products });
  console.log(`Inserted ${products.length} products.`);

  await prisma.coupon.createMany({ data: coupons });
  console.log(`Inserted ${coupons.length} coupons.`);

  // Ensure an admin exists
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@sutaara.in').toLowerCase();
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    admin = await prisma.user.create({
      data: {
        name: process.env.ADMIN_NAME || 'Sutaara Admin',
        email: adminEmail,
        password: await bcrypt.hash(password, 10),
        role: 'admin',
        // Seeded by hand, so there is no address to prove ownership of —
        // without this the admin could never log in once email verification
        // is enforced.
        emailVerified: true,
      },
    });
    console.log(`Admin created: ${adminEmail} / ${password}`);
  } else {
    // Existing installs seeded before email verification existed would have
    // emailVerified=false and be locked out — fix that here.
    if (!admin.emailVerified) {
      admin = await prisma.user.update({
        where: { id: admin.id },
        data: { emailVerified: true },
      });
      console.log(`Admin already exists: ${adminEmail} (marked email-verified)`);
    } else {
      console.log(`Admin already exists: ${adminEmail}`);
    }
  }

  // ----- Seed "Sutaara Diaries" reviews -----
  // Real reviews require a verified purchase, but until customers arrive we
  // seed a handful of 5-star reviews so the Diaries section isn't empty. Each
  // is attached to a throwaway reviewer account and a real product.
  const dbProducts = await prisma.product.findMany({ select: { id: true, slug: true } });
  const bySlug = Object.fromEntries(dbProducts.map((p) => [p.slug, p.id]));

  const seedReviews = [
    { slug: 'mauve-kalamkari-peacock', name: 'Ananya R.', title: 'A dream to drape', body: 'The hand-painted peacocks are even more stunning in person. I wore it to my sister\u2019s wedding and could not stop getting compliments. You can feel the craft in every inch.' },
    { slug: 'maroon-patola-ikat', name: 'Devika S.', title: 'Heirloom quality', body: 'This is the kind of saree you pass down. The ikat work is flawless and the colour is so rich. Worth every rupee.' },
    { slug: 'green-gold-leheriya', name: 'Meera K.', title: 'Absolutely radiant', body: 'The green and gold together are magical under light. Lightweight, easy to carry all evening, and the zari border is gorgeous.' },
    { slug: 'peach-leheriya-organza', name: 'Sana P.', title: 'My new favourite', body: 'So soft and airy. Perfect for a daytime function. The peach shade is exactly like the photos \u2014 delicate and elegant.' },
    { slug: 'magenta-emerald-set', name: 'Ritika M.', title: 'Stitched to perfection', body: 'The suit set fit beautifully and the colour combination is regal. Sutaara\u2019s finishing is top-notch.' },
    { slug: 'peach-madhubani', name: 'Aditi V.', title: 'Wearable art', body: 'Every motif tells a story. I have never owned anything with this much detail. Felt special the moment I put it on.' },
    { slug: 'red-ajrakh-suit', name: 'Nisha T.', title: 'Timeless and comfortable', body: 'The ajrakh print is classic and the cotton breathes so well. My go-to for festive brunches now.' },
    { slug: 'rose-emerald-suit', name: 'Kavya B.', title: 'Elegant beyond words', body: 'Received it well-packed and on time. The rose and emerald pairing is stunning and the fabric feels premium.' },
  ];

  let seededCount = 0;
  for (const r of seedReviews) {
    const productId = bySlug[r.slug];
    if (!productId) continue;
    const email = `diary-${r.slug}@sutaara.demo`;
    let reviewer = await prisma.user.findUnique({ where: { email } });
    if (!reviewer) {
      reviewer = await prisma.user.create({
        data: { name: r.name, email, authProvider: 'demo', emailVerified: true },
      });
    }
    const exists = await prisma.review.findFirst({ where: { productId, userId: reviewer.id } });
    if (!exists) {
      await prisma.review.create({
        data: { productId, userId: reviewer.id, rating: 5, title: r.title, body: r.body, verified: true, approved: true },
      });
      seededCount += 1;
    }
  }
  console.log(`Seeded ${seededCount} diary reviews.`);

  await prisma.$disconnect();
  console.log('Seed complete.');
  process.exit(0);
}

run().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
