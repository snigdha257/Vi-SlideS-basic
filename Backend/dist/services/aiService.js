"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askAI = askAI;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const SYSTEM_PROMPT = "You are a helpful teaching assistant who provides clear and concise answers 2 line answers to student questions .";
function askAI(question) {
    return __awaiter(this, void 0, void 0, function* () {
        const groqKey = process.env.GROQ_API_KEY;
        const stripMarkdown = (text) => {
            return text.replace(/\*\*/g, "").replace(/#/g, "").trim();
        };
        // GROQ
        if (groqKey) {
            try {
                const groq = new groq_sdk_1.default({
                    apiKey: groqKey
                });
                const completion = yield groq.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        {
                            role: "system",
                            content: SYSTEM_PROMPT
                        },
                        {
                            role: "user",
                            content: `A student asked: "${question}"`
                        }
                    ],
                    max_tokens: 300
                });
                const answer = completion.choices[0].message.content;
                if (answer)
                    return stripMarkdown(answer);
            }
            catch (error) {
                console.error("Groq error:", error.message);
            }
        }
        return "Error: No AI API keys found in .env.";
    });
}
