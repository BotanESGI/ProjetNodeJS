import {createHash} from "crypto";

export function sha256(str: string): string {
    return createHash("sha256").update(str).digest("hex");
}

export function sha512(str: string): string {
    return createHash("sha512").update(str).digest("hex");
}