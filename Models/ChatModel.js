import { mongoose } from "mongoose";

const ChatSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "tbl_user" },
    prompt: { type: String, required: true },
    generatedContent: { type: String, required: true },
    rephrasedContent: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

ChatSchema.pre('save', function (next){
    this.updatedAt = Date.now();
    next();
})

const ChatModel = mongoose.model("tbl_chat", ChatSchema);
export default ChatModel;