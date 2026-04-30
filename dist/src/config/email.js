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
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
// A transporter is the connection to your email service
// It holds the SMTP credentials and reuses the connection for all emails
const transporter = nodemailer_1.default.createTransport({
    host: process.env["EMAIL_HOST"],
    port: Number(process.env["EMAIL_PORT"]),
    // secure: true uses SSL (port 465)
    // secure: false uses TLS (port 587) — more common
    secure: false, // avoid email to be secure
    auth: {
        user: process.env["EMAIL_USER"],
        pass: process.env["EMAIL_PASS"],
    },
    tls: {
        rejectUnauthorized: false //fix the self-signed certificate error
    }
});
// sendEmail is a reusable function that wraps nodemailer's sendMail
// to: recipient email address
// subject: email subject line
// html: the email body as HTML
function sendEmail(to, subject, html) {
    return __awaiter(this, void 0, void 0, function* () {
        yield transporter.sendMail({
            from: process.env["EMAIL_FROM"],
            to,
            subject,
            html,
        });
    });
}
exports.default = transporter;
