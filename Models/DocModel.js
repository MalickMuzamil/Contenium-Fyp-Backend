import { mongoose } from "mongoose";

const ChatDocSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "tbl_user" },
    prompt: { type: String, required: true },
    generatedDocuments: { type: String, required: true, trim: true, },
    createdAt: { type: Date, default: Date.now,  immutable: true, },
    updatedAt: { type: Date, default: Date.now }
});

ChatDocSchema.pre('save', function (next){
    this.updatedAt = Date.now();
    next();
})

const ChatDocModel = mongoose.model("tbl_doc", ChatDocSchema);
export default ChatDocModel;