require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const connectDB = require('../config/db');
const User = require('../models/User');
const Medicine = require('../modules/medicines/medicine.model');
const Supplier = require('../modules/suppliers/supplier.model');

async function seed() {
  await connectDB();

  const ownerEmail = 'owner@pharmacy.com';
  let owner = await User.findOne({ email: ownerEmail });
  if (!owner) {
    owner = await User.create({
      firstName: 'Pharmacy',
      lastName: 'Owner',
      email: ownerEmail,
      password: 'Owner1234',
      role: 'owner',
      phone: '+250 788 000 001',
    });
    console.log('Created owner:', ownerEmail, '/ Owner1234');
  } else {
    console.log('Owner already exists:', ownerEmail);
  }

  const pharmacistEmail = 'pharmacist@pharmacy.com';
  const pharmacistExists = await User.findOne({ email: pharmacistEmail });
  if (!pharmacistExists) {
    await User.create({
      firstName: 'Jane',
      lastName: 'Pharmacist',
      email: pharmacistEmail,
      password: 'Pharma1234',
      role: 'pharmacist',
      phone: '+250 788 000 002',
    });
    console.log('Created pharmacist:', pharmacistEmail, '/ Pharma1234');
  }

  const supplierCount = await Supplier.countDocuments();
  if (supplierCount === 0) {
    await Supplier.insertMany([
      { name: 'Rwanda MedSupply Ltd', contactPerson: 'Jean Baptiste', phone: '+250 788 111 111', email: 'orders@medsupply.rw' },
      { name: 'Kigali Pharma Distributors', contactPerson: 'Alice Uwimana', phone: '+250 788 222 222', email: 'sales@kigalipharma.rw' },
    ]);
    console.log('Seeded suppliers');
  }

  const medicineCount = await Medicine.countDocuments();
  if (medicineCount === 0) {
    await Medicine.insertMany([
      { name: 'Paracetamol 500mg', genericName: 'Acetaminophen', unit: 'tablet', stock: 500, sellingPrice: 50, purchasePrice: 30 },
      { name: 'Amoxicillin 250mg', genericName: 'Amoxicillin', unit: 'capsule', stock: 200, sellingPrice: 120, purchasePrice: 80 },
      { name: 'Ibuprofen 400mg', genericName: 'Ibuprofen', unit: 'tablet', stock: 8, sellingPrice: 80, purchasePrice: 50 },
      { name: 'Vitamin C 1000mg', genericName: 'Ascorbic Acid', unit: 'tablet', stock: 0, sellingPrice: 150, purchasePrice: 100 },
    ]);
    console.log('Seeded medicines');
  }

  console.log('Seed complete');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
