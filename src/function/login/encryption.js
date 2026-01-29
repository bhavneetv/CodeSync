import CryptoJS from "crypto-js";

const SECRET_KEY = "testing"; 

export function encrypt(text) {
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

export function hashRoomCode(roomCode) {
    return CryptoJS.SHA256(roomCode).toString();
}