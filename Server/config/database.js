import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        if(!process.env.MONGODB_URI) {
            console.error('❌ MONGODB_URI is not set in .env file');
            console.error('Please create server/.env file with MONGODB_URI');
            process.exit(1);
        }

        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.error('\n💡 Troubleshooting:');
        console.error('1. Check if MongoDB is running (local) or connection string is correct (Atlas)');
        console.error('2. Verify MONGODB_URI in server/.env file');
        console.error('3. For Atlas: Check username, password, and IP whitelist');
        console.error('4. For local: Make sure MongoDB service is running');
        process.exit(1);
    }
};