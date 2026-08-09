import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Listing from './models/Listing.js';
import { connectDatabase, disconnectDatabase } from './db.js';

export const runSeed = async () => {
  const hashedPassword = await bcrypt.hash('password123', 10);

  const demoUsersData = [
    { name: 'Platform Admin', email: 'artsupplyexchange2026@gmail.com', password: hashedPassword, city: 'Mumbai', state: 'Maharashtra', bio: 'Official Platform Lead & Administrator.', role: 'admin' },
    { name: 'Nikhil (Admin)', email: 'nikhilk21518@gmail.com', password: hashedPassword, city: 'Mumbai', state: 'Maharashtra', bio: 'Platform Lead & Administrator.', role: 'admin' },
    { name: 'Asha Menon', email: 'asha@example.com', password: hashedPassword, city: 'Mumbai', state: 'Maharashtra', bio: 'Watercolor enthusiast building a small studio corner.' },
    { name: 'Rohan Sharma', email: 'rohan@example.com', password: hashedPassword, city: 'Delhi', state: 'Delhi', bio: 'Illustrator and printmaker looking to trade tools locally.' },
    { name: 'Meera Iyer', email: 'meera@example.com', password: hashedPassword, city: 'Bengaluru', state: 'Karnataka', bio: 'Freelance mural artist with a growing supply stash.' },
    { name: 'Karan Patel', email: 'karan@example.com', password: hashedPassword, city: 'Ahmedabad', state: 'Gujarat', bio: 'Sketchbook collector and hobby painter.' },
    { name: 'Nisha Rao', email: 'nisha@example.com', password: hashedPassword, city: 'Pune', state: 'Maharashtra', bio: 'Oil painter swapping branded sets that are barely used.' },
    { name: 'Vikram Sood', email: 'vikram@example.com', password: hashedPassword, city: 'Chennai', state: 'Tamil Nadu', bio: 'Teaching art classes and clearing extra materials.' }
  ];

  const seededUsers = [];
  for (const uData of demoUsersData) {
    let existing = await User.findOne({ email: uData.email });
    if (!existing) {
      existing = await User.create(uData);
    }
    seededUsers.push(existing);
  }

  const listingCount = await Listing.countDocuments();
  if (listingCount === 0) {
    const listings = [
      { title: 'Winsor & Newton Cotman Watercolor Set, 12 half-pans', description: 'Barely used set from a home studio, perfect for beginners and travel sketching.', category: 'paint', condition: 'like-new', price: 1800, listingType: 'sell', swapPreferences: 'Open to swapping for a brush set', images: ['https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=900&q=80'], city: 'Mumbai', state: 'Maharashtra' },
      { title: 'Princeton Velvet Touch Round Brush Set', description: 'A versatile brush set ideal for acrylic washes and detail work.', category: 'brush', condition: 'new', price: 950, listingType: 'both', swapPreferences: 'Would like a palette knife or sketchbook', images: ['https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80'], city: 'Delhi', state: 'Delhi' },
      { title: 'Stretched Cotton Canvas Pack, 8x10', description: 'Freshly primed canvases in a pack of 10 for practice or small paintings.', category: 'canvas', condition: 'new', price: 1100, listingType: 'sell', swapPreferences: '', images: ['https://images.unsplash.com/photo-1578301978018-3005759f48f7?auto=format&fit=crop&w=900&q=80'], city: 'Bengaluru', state: 'Karnataka' },
      { title: 'A4 Sketchbook with Heavy Paper', description: 'Smooth paper for ink, pencil, and light watercolor work.', category: 'sketchbook', condition: 'used', price: 450, listingType: 'swap', swapPreferences: 'Interested in a marker set', images: ['https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=80'], city: 'Pune', state: 'Maharashtra' },
      { title: 'Adjustable Drawing Table Lamp', description: 'Great for late-night sketching and hobby sessions.', category: 'tool', condition: 'used', price: 700, listingType: 'both', swapPreferences: 'Happy to trade for a mahl stick or ruler set', images: ['https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80'], city: 'Chennai', state: 'Tamil Nadu' },
      { title: 'Mont Marte Acrylic Paint Set, 24 colors', description: 'Well-loved but still vibrant colors for student projects.', category: 'paint', condition: 'used', price: 1200, listingType: 'sell', swapPreferences: '', images: ['https://images.unsplash.com/photo-1519643373928-c2e45f9f8d2b?auto=format&fit=crop&w=900&q=80'], city: 'Ahmedabad', state: 'Gujarat' },
      { title: 'Sable Hair Detail Brush Bundle', description: 'Excellent for fine outlines and detailed commissions.', category: 'brush', condition: 'like-new', price: 800, listingType: 'sell', swapPreferences: 'Would love a watercolor travel tin', images: ['https://images.unsplash.com/photo-1533073526757-2c8ca1df9f1c?auto=format&fit=crop&w=900&q=80'], city: 'Mumbai', state: 'Maharashtra' },
      { title: 'Large Canvas Board Trio', description: 'Three ready-to-paint boards for mixed media experiments.', category: 'canvas', condition: 'new', price: 900, listingType: 'both', swapPreferences: 'Open to a set of oil pastels', images: ['https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80'], city: 'Delhi', state: 'Delhi' },
      { title: 'Stonehenge Watercolor Journal', description: 'Handmade feel with strong paper weight for travel sketching.', category: 'sketchbook', condition: 'new', price: 650, listingType: 'sell', swapPreferences: '', images: ['https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80'], city: 'Bengaluru', state: 'Karnataka' },
      { title: 'Palette Knife Set with Wooden Handles', description: 'Great for impasto and textured finishes.', category: 'tool', condition: 'like-new', price: 550, listingType: 'swap', swapPreferences: 'Interested in a compact easel', images: ['https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80'], city: 'Pune', state: 'Maharashtra' },
      { title: 'Liquitex Basics Acrylic Pack', description: 'A compact pack of 12 colors for quick practice pieces.', category: 'paint', condition: 'new', price: 1400, listingType: 'sell', swapPreferences: '', images: ['https://images.unsplash.com/photo-1515405295579-ba7b45403062?auto=format&fit=crop&w=900&q=80'], city: 'Chennai', state: 'Tamil Nadu' },
      { title: 'Flat Brush Set for Large Washes', description: 'Good for backgrounds and broad strokes in poster or acrylic work.', category: 'brush', condition: 'used', price: 600, listingType: 'both', swapPreferences: 'Would trade for a good eraser set', images: ['https://images.unsplash.com/photo-1494253109108-2e30c049369b?auto=format&fit=crop&w=900&q=80'], city: 'Ahmedabad', state: 'Gujarat' },
      { title: 'Canvas Panel Bundle, 12 pieces', description: 'Lightweight and easy to transport for outdoor sketch sessions.', category: 'canvas', condition: 'used', price: 750, listingType: 'sell', swapPreferences: '', images: ['https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80'], city: 'Mumbai', state: 'Maharashtra' },
      { title: 'Moleskine Art Journal', description: 'Still in good condition with a few pages used up.', category: 'sketchbook', condition: 'used', price: 500, listingType: 'swap', swapPreferences: 'Open to watercolor pans', images: ['https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=900&q=80'], city: 'Delhi', state: 'Delhi' },
      { title: 'Compact Table Easel', description: 'Portable and sturdy for compact studio setups.', category: 'tool', condition: 'like-new', price: 850, listingType: 'sell', swapPreferences: '', images: ['https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=900&q=80'], city: 'Bengaluru', state: 'Karnataka' },
      { title: 'Faber-Castell Pitt Marker Set', description: 'Great for mixed-media and sketching notes.', category: 'tool', condition: 'new', price: 1300, listingType: 'both', swapPreferences: 'Would like a portable sketchbook', images: ['https://images.unsplash.com/photo-1491944799262-a5f4fa7a2c0b?auto=format&fit=crop&w=900&q=80'], city: 'Pune', state: 'Maharashtra' },
      { title: 'Poster Color Set, 18 shades', description: 'Bright colors suited for school projects and experiments.', category: 'paint', condition: 'used', price: 900, listingType: 'sell', swapPreferences: '', images: ['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80'], city: 'Chennai', state: 'Tamil Nadu' }
    ];

    await Listing.insertMany(listings.map((listing, index) => ({
      ...listing,
      seller: seededUsers[index % seededUsers.length]._id,
      status: 'available',
      views: 10 + index
    })));

    console.log('Seeded initial listings.');
  }

  console.log('Demo users verified and data preserved.');
};

if (process.argv[1] && (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('seed.js'))) {
  connectDatabase()
    .then(runSeed)
    .then(disconnectDatabase)
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
