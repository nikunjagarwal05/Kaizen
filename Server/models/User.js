import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    }, 
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    }, 
    passwordHash: {
        type: String,
        required: true,
    }, 
    avatar: {
        type: String,
        default: '',
    },
    refreshToken: [{
        type: String,
    }],
    createdAt: {
        type: Date, 
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Method to compare password

userSchema.methods.comparePassword = async function(candidatePassword) {
    if(!this.passwordHash) return false;
    return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to add refresh token
userSchema.methods.addRefreshToken = async function(token) {
    if(!this.refreshToken.includes(token)) {
        this.refreshToken.push(token);
        // Keep only last 5 refresh tokens per device
        if(this.refreshToken.length > 5) {
            this.refreshToken = this.refreshToken.slice(-5);
        }
    }
};

// Method to remove refresh token
userSchema.methods.removeRefreshToken = async function(token) {
    this.refreshToken = this.refreshToken.filter(t => t !== token);
};

export default mongoose.model('User', userSchema);