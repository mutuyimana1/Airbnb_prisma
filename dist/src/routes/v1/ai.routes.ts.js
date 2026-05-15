"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_js_1 = require("../../controllers/v1/ai.controller.js");
const auth_middleware_js_1 = require("../../middlewares/auth.middleware.js");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /ai/search:
 *   post:
 *     summary: Search listings using natural language
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query:
 *                 type: string
 *                 example: "cozy apartment in New York for 2 people under $150"
 *     responses:
 *       200:
 *         description: Listings matching the natural language query
 */
router.post("/search", ai_controller_js_1.naturalLanguageSearch);
/**
 * @swagger
 * /ai/generate-description:
 *   post:
 *     summary: Generate a listing description using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, location, type, guests, amenities, price]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Beachfront Villa"
 *               location:
 *                 type: string
 *                 example: "Miami, FL"
 *               type:
 *                 type: string
 *                 example: "VILLA"
 *               guests:
 *                 type: integer
 *                 example: 6
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Pool", "WiFi", "BBQ"]
 *               price:
 *                 type: number
 *                 example: 250
 *     responses:
 *       200:
 *         description: Generated listing description
 */
router.post("/generate-description", auth_middleware_js_1.authenticate, ai_controller_js_1.generateListingDescription);
/**
 * @swagger
 * /ai/chat:
 *   post:
 *     summary: Chat with the Airbnb AI assistant
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message, sessionId]
 *             properties:
 *               message:
 *                 type: string
 *                 example: "What listings do you have in Miami?"
 *               sessionId:
 *                 type: string
 *                 example: "user-123-session-abc"
 *     responses:
 *       200:
 *         description: AI response
 */
router.post("/chat", ai_controller_js_1.chat);
exports.default = router;
