const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Get MongoDB URI from env
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      console.error('❌ MONGODB_URI is not set in environment variables!');
      console.error('   Please add your MongoDB Atlas connection string to .env');
      console.error('   Format: mongodb+srv://username:password@cluster.mongodb.net/synaptix?retryWrites=true&w=majority');
      // Don't exit - let server start anyway for debugging
      return false;
    }

    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // Force IPv4 to avoid DNS issues on some cloud providers
      family: 4,
      // Retry on failure
      retryWrites: true,
      w: 'majority'
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    return true;

  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);

    // Provide helpful error messages based on error type
    if (error.message.includes('ECONNREFUSED')) {
      console.error('   → MongoDB server is not running or not accessible');
      console.error('   → If using Atlas: Check Network Access → IP Whitelist');
      console.error('   → Add 0.0.0.0/0 to allow all IPs (for testing)');
    }
    if (error.message.includes('authentication failed')) {
      console.error('   → Username or password is incorrect');
      console.error('   → Make sure you use the DATABASE USER password, not Atlas account password');
    }
    if (error.message.includes('ENOTFOUND') || error.message.includes('DNS')) {
      console.error('   → Cannot resolve MongoDB cluster hostname');
      console.error('   → Check your connection string for typos');
    }
    if (error.message.includes("IP that isn't whitelisted") || error.message.includes('IP whitelist')) {
      console.error('   → Your server IP is not whitelisted in MongoDB Atlas');
      console.error('   → Go to Atlas → Network Access → Add IP Address → 0.0.0.0/0');
    }

    // Don't exit process - let server start so we can see the error in logs
    // process.exit(1);
    return false;
  }
};

module.exports = connectDB;
