import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongodbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatinvis';
    
    await mongoose.connect(mongodbUri, {
      retryWrites: true,
      w: 'majority'
    });
    
    console.log(' MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    console.error(' MongoDB connection error:', error.message);
    process.exit(1);
  }
};

export default connectDB;
