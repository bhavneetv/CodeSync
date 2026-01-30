// crypto.js
import CryptoJS from "crypto-js";

const SECRET = import.meta.env.VITE_AES_SECRET || "testing";

export function hashRoomCode(roomCode) {
    return CryptoJS.SHA256(roomCode).toString();
}

export function encrypt(text) {
    return CryptoJS.AES.encrypt(text, SECRET).toString();
}

export function decrypt(cipher) {
    const bytes = CryptoJS.AES.decrypt(cipher, SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
}
