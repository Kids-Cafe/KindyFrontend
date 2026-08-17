import type {AuthUser} from "@/app/auth/types.ts";
import {SignupPayload} from "@/app/auth/mockSignup.ts";

export async function registerUser(payload: SignupPayload): Promise<AuthUser> {
    const joinedAt = new Date().toISOString();

    const p = new URLSearchParams();
    p.set("id", payload.loginId);
    p.set("name", payload.name);
    p.set("email", payload.email);
    p.set("password", payload.password);
    p.set("phone", payload.phone);
    p.set("postcode", payload.zonecode || '');
    p.set("address", payload.address || '');
    p.set("addressDetail", payload.addressDetail || '');

    const f = await fetch('/api/user/create', {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        credentials: 'include',
        body: p
    });

    const r = await f.json();

    console.log(JSON.stringify(r));

    if (r.status !== 'success') {
        return {
            id: "",
            name: payload.name,
            loginId: payload.loginId,
            email: payload.email,
            provider: "email",
            joinedAt
        };
    }

    const lp = new URLSearchParams();
    lp.set("id", payload.loginId);
    lp.set("password", payload.password);
    await fetch('/api/user/login', {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        credentials: 'include',
        body: lp
    });

    return {
        id: payload.loginId,
        name: payload.name,
        loginId: payload.loginId,
        email: payload.email,
        provider: "email",
        joinedAt
    };
}