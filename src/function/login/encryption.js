import CryptoJS from "crypto-js";

const SECRET_KEY = "testing";

export function encrypt(text) {
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

export function decrypt(cipher) {
    return CryptoJS.AES.decrypt(cipher, SECRET_KEY).toString(
        CryptoJS.enc.Utf8
    );
}

export function hashRoomCode(roomCode) {
    return CryptoJS.SHA256(roomCode).toString();
}
