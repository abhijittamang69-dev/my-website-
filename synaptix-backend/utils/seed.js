const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { Product, User } = require('../models');
require('dotenv').config();

const seedProducts = async () => {
  const products = [
    {
      name: 'HD CCTV Camera - 2MP',
      description: 'High-definition 2MP CCTV camera with night vision, weatherproof IP66 rating, and 30m IR range. Perfect for home and office surveillance.',
      price: 8500,
      icon: 'fa-video',
      badge: 'Popular',
      category: 'security',
      inStock: true,
      stockQuantity: 50,
      featured: true,
      specifications: [
        { key: 'Resolution', value: '2MP (1920x1080)' },
        { key: 'Lens', value: '3.6mm Fixed' },
        { key: 'IR Range', value: '30 meters' },
        { key: 'Weatherproof', value: 'IP66' }
      ]
    },
    {
      name: '4MP Dome Camera',
      description: 'Ultra-clear 4MP dome camera with 360-degree coverage, vandal-proof design, and smart motion detection. Ideal for indoor monitoring.',
      price: 12500,
      icon: 'fa-video',
      badge: 'New',
      category: 'security',
      inStock: true,
      stockQuantity: 30,
      featured: true,
      specifications: [
        { key: 'Resolution', value: '4MP (2560x1440)' },
        { key: 'Lens', value: '2.8-12mm Varifocal' },
        { key: 'Protection', value: 'IK10 Vandal-proof' },
        { key: 'Audio', value: 'Built-in Mic' }
      ]
    },
    {
      name: '16-Channel DVR System',
      description: 'Professional 16-channel digital video recorder with H.265+ compression, 4K output, and mobile app support. Supports up to 16 cameras.',
      price: 45000,
      icon: 'fa-server',
      badge: 'Hot',
      category: 'security',
      inStock: true,
      stockQuantity: 15,
      featured: true,
      specifications: [
        { key: 'Channels', value: '16' },
        { key: 'Resolution', value: '4K Output' },
        { key: 'Compression', value: 'H.265+' },
        { key: 'Storage', value: 'Up to 16TB' }
      ]
    },
    {
      name: 'Fingerprint Access Control',
      description: 'Biometric fingerprint access control system with RFID card support, PIN code, and TCP/IP network connectivity. Supports 3000 users.',
      price: 18500,
      icon: 'fa-fingerprint',
      badge: 'Popular',
      category: 'security',
      inStock: true,
      stockQuantity: 25,
      featured: false,
      specifications: [
        { key: 'Users', value: '3000' },
        { key: 'Fingerprints', value: '3000' },
        { key: 'Cards', value: '3000' },
        { key: 'Communication', value: 'TCP/IP, RS485' }
      ]
    },
    {
      name: 'Automatic E-Gate System',
      description: 'Smart automatic sliding gate system with remote control, smartphone app, and safety sensors. Suitable for residential and commercial properties.',
      price: 95000,
      icon: 'fa-gate',
      badge: 'Sale',
      category: 'security',
      inStock: true,
      stockQuantity: 8,
      featured: true,
      specifications: [
        { key: 'Max Gate Weight', value: '800kg' },
        { key: 'Opening Speed', value: '12m/min' },
        { key: 'Power', value: 'AC 220V' },
        { key: 'Remote', value: '4 remotes included' }
      ]
    },
    {
      name: 'Wireless Alarm System',
      description: 'Complete wireless home alarm system with door sensors, motion detectors, and loud 120dB siren. GSM module for SMS alerts included.',
      price: 22000,
      icon: 'fa-bell',
      badge: 'New',
      category: 'security',
      inStock: true,
      stockQuantity: 20,
      featured: false,
      specifications: [
        { key: 'Zones', value: '99 Wireless' },
        { key: 'Siren', value: '120dB' },
        { key: 'Battery', value: '8 hours backup' },
        { key: 'GSM', value: 'Dual SIM' }
      ]
    },
    {
      name: 'PTZ Camera - 5MP',
      description: 'Pan-Tilt-Zoom camera with 5MP resolution, 20x optical zoom, auto-tracking, and 150m IR night vision. Perfect for large area coverage.',
      price: 65000,
      icon: 'fa-video',
      badge: '',
      category: 'security',
      inStock: true,
      stockQuantity: 10,
      featured: false,
      specifications: [
        { key: 'Resolution', value: '5MP' },
        { key: 'Zoom', value: '20x Optical' },
        { key: 'IR Range', value: '150m' },
        { key: 'Tracking', value: 'Auto-tracking' }
      ]
    },
    {
      name: 'Network Video Recorder - 32CH',
      description: 'Enterprise-grade 32-channel NVR with 4K recording, AI analytics, face detection, and 8 hard drive bays. Cloud backup supported.',
      price: 85000,
      icon: 'fa-server',
      badge: 'Hot',
      category: 'security',
      inStock: true,
      stockQuantity: 5,
      featured: true,
      specifications: [
        { key: 'Channels', value: '32' },
        { key: 'Recording', value: '4K @ 30fps' },
        { key: 'AI Features', value: 'Face Detection' },
        { key: 'Storage', value: '8 HDD Bays' }
      ]
    },
    {
      name: 'HDMI Cable - 20m',
      description: 'High-quality HDMI cable with gold-plated connectors, 4K support, and braided shielding. Perfect for CCTV monitor connections.',
      price: 2500,
      icon: 'fa-plug',
      badge: '',
      category: 'accessories',
      inStock: true,
      stockQuantity: 100,
      featured: false,
      specifications: [
        { key: 'Length', value: '20 meters' },
        { key: 'Resolution', value: '4K @ 60Hz' },
        { key: 'Version', value: 'HDMI 2.0' },
        { key: 'Shielding', value: 'Triple Shielded' }
      ]
    },
    {
      name: 'Hard Drive - 4TB Surveillance',
      description: 'Western Digital Purple surveillance hard drive optimized for 24/7 CCTV recording. 180TB/year workload rating.',
      price: 18500,
      icon: 'fa-hdd',
      badge: 'Popular',
      category: 'accessories',
      inStock: true,
      stockQuantity: 40,
      featured: false,
      specifications: [
        { key: 'Capacity', value: '4TB' },
        { key: 'Interface', value: 'SATA 6Gb/s' },
        { key: 'Cache', value: '256MB' },
        { key: 'Workload', value: '180TB/year' }
      ]
    },
    {
      name: 'CCTV Installation Service',
      description: 'Professional CCTV installation service including site survey, camera mounting, cable routing, DVR setup, and mobile app configuration.',
      price: 15000,
      icon: 'fa-tools',
      badge: '',
      category: 'software',
      inStock: true,
      stockQuantity: 999,
      featured: false,
      specifications: [
        { key: 'Includes', value: 'Site Survey' },
        { key: 'Warranty', value: '1 Year Service' },
        { key: 'Support', value: '24/7 Remote' },
        { key: 'Training', value: 'Included' }
      ]
    },
    {
      name: 'Cloud Storage - 1 Year',
      description: 'Secure cloud storage subscription for CCTV footage backup. 30-day retention, encrypted transfer, and instant playback from anywhere.',
      price: 12000,
      icon: 'fa-cloud',
      badge: 'New',
      category: 'software',
      inStock: true,
      stockQuantity: 999,
      featured: false,
      specifications: [
        { key: 'Retention', value: '30 Days' },
        { key: 'Encryption', value: 'AES-256' },
        { key: 'Access', value: 'Global' },
        { key: 'Support', value: 'Email & Chat' }
      ]
    }
  ];

  try {
    // Clear existing products
    await Product.deleteMany({});
    console.log('✅ Cleared existing products');

    // Insert new products
    await Product.insertMany(products);
    console.log(`✅ Seeded ${products.length} products`);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
  }
};

const seedAdmin = async () => {
  try {
    // Check if admin exists
    const existingAdmin = await User.findOne({ email: 'admin@synaptix.com' });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    await User.create({
      name: 'Abhijit Tamang',
      email: 'admin@synaptix.com',
      phone: '9865057546',
      password: process.env.ADMIN_PASSWORD || 'Abhijit@2',
      role: 'admin',
      isActive: true,
      permissions: ['products', 'orders', 'bookings', 'users', 'analytics', 'settings']
    });

    console.log('✅ Admin user created');
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  }
};

const seed = async () => {
  try {
    await connectDB();
    await seedProducts();
    await seedAdmin();
    console.log('\n🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();
