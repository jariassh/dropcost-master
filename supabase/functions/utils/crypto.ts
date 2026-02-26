import { encode, decode } from "npm:base64-arraybuffer";

const getEncryptionKey = async () => {
    const secret = Deno.env.get("ENCRYPTION_KEY");
    if (!secret || secret.length < 32) {
        throw new Error("ENCRYPTION_KEY environment variable is missing or must be at least 32 characters long");
    }
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret.substring(0, 32));
    
    return await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
    );
};

export const encryptToken = async (text: string): Promise<string> => {
    try {
        const key = await getEncryptionKey();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        
        const encryptedBuff = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            key,
            data
        );
        
        const encryptedArray = new Uint8Array(encryptedBuff);
        const combined = new Uint8Array(iv.length + encryptedArray.length);
        combined.set(iv);
        combined.set(encryptedArray, iv.length);
        
        return encode(combined.buffer);
    } catch (e) {
        console.error("Encryption failed:", e);
        throw new Error("Encryption failed");
    }
};

export const decryptToken = async (encryptedBase64: string): Promise<string> => {
    try {
        const key = await getEncryptionKey();
        const combinedBuffer = decode(encryptedBase64);
        const combined = new Uint8Array(combinedBuffer);
        
        const iv = combined.slice(0, 12);
        const encryptedArray = combined.slice(12);
        
        const decryptedBuff = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            encryptedArray
        );
        
        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuff);
    } catch (e) {
        console.error("Decryption failed:", e);
        throw new Error("Decryption failed");
    }
};
