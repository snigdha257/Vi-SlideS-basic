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
exports.logoutUser = exports.googleCallback = exports.startGoogleAuth = exports.loginUser = exports.registerUser = void 0;
const userModels_1 = __importDefault(require("../models/userModels"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const google_auth_library_1 = require("google-auth-library");
const crypto_1 = __importDefault(require("crypto"));
const getOAuthClient = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirectUri) {
        throw new Error('Google OAuth environment variables are not configured');
    }
    return new google_auth_library_1.OAuth2Client(clientId, clientSecret, redirectUri);
};
const getCookieOptions = () => ({
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
});
const buildAppJwt = (user) => {
    return jsonwebtoken_1.default.sign({ email: user.email, name: user.name, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};
//user registration----------
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, name, role } = req.body;
    try {
        if (!email || !password || !name || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const existingUser = yield userModels_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const newUser = new userModels_1.default({
            email: email,
            password: hashedPassword,
            name: name,
            role: role
        });
        yield newUser.save();
        res.json({ message: "Registration successful" });
    }
    catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.registerUser = registerUser;
// User login---------------
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield userModels_1.default.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "invalid credentials" });
        }
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "invalid credentials" });
        }
        const token = buildAppJwt(user);
        res.cookie('token', token, Object.assign(Object.assign({}, getCookieOptions()), { maxAge: 60 * 60 * 1000 }));
        res.json({
            message: "Login successful",
            token: token,
            user: {
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.loginUser = loginUser;
const startGoogleAuth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const role = req.query.role === 'teacher' ? 'teacher' : 'student';
        const stateNonce = crypto_1.default.randomBytes(16).toString('hex');
        const state = Buffer.from(JSON.stringify({ nonce: stateNonce, role })).toString('base64url');
        const client = getOAuthClient();
        const authUrl = client.generateAuthUrl({
            access_type: 'offline',
            scope: ['openid', 'email', 'profile'],
            prompt: 'consent',
            state
        });
        res.cookie('oauth_state', stateNonce, Object.assign(Object.assign({}, getCookieOptions()), { maxAge: 10 * 60 * 1000 }));
        res.redirect(authUrl);
    }
    catch (error) {
        console.error('Google auth start error:', error);
        res.status(500).json({ message: 'Failed to start Google authentication' });
    }
});
exports.startGoogleAuth = startGoogleAuth;
const googleCallback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { code, state } = req.query;
    try {
        if (typeof code !== 'string' || typeof state !== 'string') {
            return res.status(400).json({ message: 'Missing Google callback parameters' });
        }
        const decodedState = JSON.parse(Buffer.from(state, 'base64url').toString('utf-8'));
        const storedNonce = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.oauth_state;
        if (!storedNonce || decodedState.nonce !== storedNonce) {
            return res.status(400).json({ message: 'Invalid OAuth state' });
        }
        const role = decodedState.role === 'teacher' ? 'teacher' : 'student';
        const client = getOAuthClient();
        const { tokens } = yield client.getToken(code);
        if (!tokens.id_token) {
            return res.status(400).json({ message: 'Missing id_token from Google' });
        }
        const ticket = yield client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        if (!(payload === null || payload === void 0 ? void 0 : payload.email)) {
            return res.status(400).json({ message: 'Invalid Google user payload' });
        }
        const email = payload.email;
        const name = payload.name || payload.email.split('@')[0];
        let user = yield userModels_1.default.findOne({ email });
        if (!user) {
            const randomPassword = yield bcrypt_1.default.hash(Math.random().toString(36).slice(-8), 10);
            user = new userModels_1.default({
                email,
                password: randomPassword,
                name,
                role
            });
            yield user.save();
        }
        const jwtToken = buildAppJwt(user);
        res.cookie('token', jwtToken, Object.assign(Object.assign({}, getCookieOptions()), { maxAge: 60 * 60 * 1000 }));
        res.clearCookie('oauth_state', getCookieOptions());
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const destination = user.role === 'teacher' ? '/teacher' : '/student';
        return res.redirect(`${frontendUrl}${destination}`);
    }
    catch (error) {
        console.error('Google callback error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/login`);
    }
});
exports.googleCallback = googleCallback;
const logoutUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.clearCookie('token', getCookieOptions());
    res.status(200).json({ message: 'Logged out successfully' });
});
exports.logoutUser = logoutUser;
