import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    date: {
        type: Date,
        required: true,
        index: true,
    },
    completedTasks: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalTasks: {
        type: Number,
        default: 0,
        min: 0,
    },
    success: {
        type: Boolean,
        dafault: false,
    },
}, {
    timestamps: true,
});

// Compound index for efficient data range queries
activityLogSchema.index({ userId: 1, date: 1 }, { unique: true });

// Method to calculate success percentage
activityLogSchema.virtual('successPercentage').get(function() {
    if(this.totalTasks === 0) return 0;
    return Math.round((this.completedTasks / this.totalTasks) * 100);
});

export default mongoose.model('ActivityLog', activityLogSchema);

