import { mongoose } from "mongoose";

const RoleSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true, unique: true },
    role: { type: String, required: true },
}, {
    timestamps: true,
});

const RoleModel = mongoose.model("tbl_role", RoleSchema);
export default RoleModel;