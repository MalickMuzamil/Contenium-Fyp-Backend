import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "tbl_user" },
        prompt: { type: String, required: true, },
        imageUrl: { type: String, required: true, },
    },
    {
        timestamps: true,
    }
);

const Image = mongoose.model('tbl_image', imageSchema);

export default Image;
