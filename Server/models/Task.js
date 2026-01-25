import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },
    type: {
        type: String,
        enum: ['todo', 'habit', 'challenge'],
        required: true,
    },
    createdDate: {
        type: Date,
        defult: Date.now,
    },
    assignedDate: {
        type: Date,
        required: true,
        index: true,
    }, 
    repeatConfig: {
        enabled: {
            type: Boolean,
            default: false,
        }, 
        daysOfWeek: [{
            type: Number,
        }],
    },
    status: {
        completed: {
            type: Boolean,
            default: false,
        },
        failed: {
            type: Boolean, 
            default: false,
        },
        pending: {
            type: Boolean, 
            default: true,
        },
        delayCount: {
            type: Number, 
            default: 0,
        },
    },

    expReward: {
        type: Number,
        default: 10,
    },
    coinReward: {
        type: Number,
        default: 5,
    },
    penalties: {
        heartLoss: {
            type: Number, 
            default: 2,
        }, 
        coinLoss: {
            type: Number,
            default: 2,
        },
    },
}, {
    timestamps: true,
});

// Compound index for efficient queries
taskSchema.index({ userId: 1, assignedDate: 1 });
taskSchema.index({ userId: 1, type: 1 });
taskSchema.index({ userId: 1, 'status completed': 1 });

export default mongoose.model('Task', taskSchema);