import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    // Set for Google sign-ins only. Sparse so the seeded demo accounts,
    // which have no googleId, don't collide on the unique index.
    googleId: { type: String, unique: true, sparse: true },

    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },

    // Only the seeded demo accounts have one. Never returned by default.
    passwordHash: { type: String, select: false },

    role: { type: String, enum: ['customer', 'vendor'], default: 'customer' },

    // False until the user picks a role after first sign-in. The frontend
    // shows the role picker while this is false.
    roleSelected: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    email: this.email,
    name: this.name,
    role: this.role,
    roleSelected: this.roleSelected,
  };
};

export default mongoose.model('User', userSchema);
