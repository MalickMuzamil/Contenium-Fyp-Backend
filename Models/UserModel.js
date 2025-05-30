import { mongoose } from 'mongoose'

const UserSchema = mongoose.Schema(
    {
        first_name: { type: String, default: "" },
        last_name: { type: String, default: "" },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true },
        phonenumber: { type: String, default: "" },
        is_deleted: { type: Boolean, default: false },
        status: { type: String, enum: ["active", "inactive"], default: "active" },
        role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", default: null },
        profileImage: { type: String, default: "" },
    },
    { timestamps: true }

    // meta: {
    //     address: { type: String, default: "" },
    //     zipcode: { type: String, default: "" },
    //     city: { type: String, default: "" },
    //     country: { type: String, default: "" },
    //     phonenumber: { type: String, default: "" }
    // }
)

const UserData = mongoose.model('tbl_user', UserSchema)
export default UserData