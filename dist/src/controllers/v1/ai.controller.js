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
exports.naturalLanguageSearch = naturalLanguageSearch;
exports.generateListingDescription = generateListingDescription;
exports.chat = chat;
const prompts_1 = require("@langchain/core/prompts");
const output_parsers_1 = require("@langchain/core/output_parsers");
const ai_js_1 = __importDefault(require("../../config/ai.js"));
const prisma_js_1 = __importDefault(require("../../config/prisma.js"));
const chat_history_1 = require("@langchain/core/chat_history");
const runnables_1 = require("@langchain/core/runnables");
// ─── Natural Language Search ──────────────────────────────────────────────────
const searchPrompt = prompts_1.ChatPromptTemplate.fromTemplate(`
You are a search assistant for an Airbnb-like platform.
Extract search filters from the user's natural language query.

User query: {query}

Return a JSON object with these optional fields:
- location: string (city or area mentioned)
- type: one of APARTMENT, HOUSE, VILLA, CABIN (if mentioned)
- guests: number (max guests needed)
- maxPrice: number (maximum price per night in USD)

Return ONLY valid JSON. No explanation. No markdown. Example:
{{"location": "Miami", "type": "VILLA", "guests": 4, "maxPrice": 300}}

If a field is not mentioned, omit it from the JSON.
`);
const parser = new output_parsers_1.JsonOutputParser();
const searchChain = searchPrompt.pipe(ai_js_1.default).pipe(parser);
function naturalLanguageSearch(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: "query is required" });
        }
        // Extract filters from natural language using AI
        const filters = yield searchChain.invoke({ query });
        // Build Prisma where clause from extracted filters
        const where = {};
        if (filters.location) {
            where["location"] = { contains: filters.location, mode: "insensitive" };
        }
        if (filters.type) {
            where["type"] = filters.type;
        }
        if (filters.guests) {
            where["guests"] = { gte: filters.guests };
        }
        if (filters.maxPrice) {
            where["pricePerNight"] = { lte: filters.maxPrice };
        }
        const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== null);
        if (!hasFilters) {
            return res.status(400).json({ message: "No specific search criteria found in the query. Please provide more details for better search results." });
        }
        const listings = yield prisma_js_1.default.listing.findMany({
            where,
            include: {
                host: { select: { name: true, avatar: true } },
            },
            take: 10,
        });
        res.json({
            query,
            extractedFilters: filters,
            results: listings,
            count: listings.length,
        });
    });
}
// ─── Listing Description Generator ───────────────────────────────────────────
const descriptionPrompt = prompts_1.ChatPromptTemplate.fromTemplate(`
You are a professional copywriter for an Airbnb-like platform.
Write an engaging, warm, and descriptive listing description.

Listing details:
- Title: {title}
- Location: {location}
- Type: {type}
- Max guests: {guests}
- Amenities: {amenities}
- Price per night: ${"{pricePerNight}"} USD

Write a 3-paragraph description:
1. Opening hook — what makes this place special
2. The space — describe the property and its features
3. The location — what guests can do nearby

Keep it between 150-200 words. Be specific and inviting. Do not use generic phrases like "perfect getaway".
`);
const descriptionChain = descriptionPrompt.pipe(ai_js_1.default).pipe(new output_parsers_1.StringOutputParser());
function generateListingDescription(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { title, location, type, guests, emenities, pricePerNight } = req.body;
        if (!title || !location || !type || !guests || !emenities || !pricePerNight) {
            return res.status(400).json({ error: "title, location, type, guests, emenities, and pricePerNight are required" });
        }
        const description = yield descriptionChain.invoke({
            title,
            location,
            type,
            guests,
            amenities: Array.isArray(emenities) ? emenities.join(", ") : emenities,
            pricePerNight,
        });
        res.json({ description });
    });
}
// Store conversation histories in memory
// In production, store these in Redis or a database
const sessionHistories = new Map();
function getSessionHistory(sessionId) {
    if (!sessionHistories.has(sessionId)) {
        sessionHistories.set(sessionId, new chat_history_1.InMemoryChatMessageHistory());
    }
    return sessionHistories.get(sessionId);
}
// ─── Chatbot ──────────────────────────────────────────────────────────────────
const chatPrompt = prompts_1.ChatPromptTemplate.fromMessages([
    [
        "system",
        `You are a helpful Airbnb assistant. You help guests find listings, answer questions about properties, and assist with bookings.

Available listings context: {listingsContext}

Be friendly, concise, and helpful. If you don't know something, say so.
If asked about specific listings, refer to the context provided.`,
    ],
    ["placeholder", "{chat_history}"],
    ["human", "{input}"],
]);
const chatChain = chatPrompt.pipe(ai_js_1.default);
const chainWithHistory = new runnables_1.RunnableWithMessageHistory({
    runnable: chatChain,
    getMessageHistory: getSessionHistory,
    inputMessagesKey: "input",
    historyMessagesKey: "chat_history",
});
function chat(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { message, sessionId } = req.body;
        if (!message || !sessionId) {
            return res.status(400).json({ error: "message and sessionId are required" });
        }
        // Fetch recent listings to give the AI context about available properties
        const listings = yield prisma_js_1.default.listing.findMany({
            take: 5,
            select: {
                title: true,
                location: true,
                pricePerNight: true,
                type: true,
                guests: true,
                emenities: true,
            },
        });
        const listingsContext = listings
            .map((l) => `- ${l.title} in ${l.location}: $${l.pricePerNight}/night, ${l.type}, up to ${l.guests} guests, emenities: ${l.emenities.join(", ")}`)
            .join("\n");
        const reply = yield chainWithHistory.invoke({ input: message, listingsContext }, { configurable: { sessionId } });
        res.json({ reply, sessionId });
    });
}
