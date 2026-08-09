import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Listing from '../src/models/Listing.js';

let mongod;

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

test.after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('listing documents can be created and saved', async () => {
  const listing = await Listing.create({
    seller: new mongoose.Types.ObjectId(),
    title: 'Test listing',
    description: 'Description',
    category: 'paint',
    condition: 'used',
    price: 15,
    listingType: 'sell',
    city: 'Delhi',
    state: 'Delhi'
  });

  assert.ok(listing._id);
  assert.ok(listing.createdAt);
  assert.ok(listing.updatedAt);
});
