import type {AuthUser, KindergartenInfo} from "@/app/auth/types.ts";
import {SignupPayload} from "@/app/auth/mockSignup.ts";
import {newId} from "@/app/lib/id.ts";

export async function registerUser(payload: SignupPayload): Promise<AuthUser> {
    const joinedAt = new Date().toISOString();

    const p = new URLSearchParams();
    p.set("id", payload.loginId);
    p.set("name", payload.name);
    p.set("email", payload.email);
    p.set("password", payload.password);
    p.set("phone", payload.phone);
    p.set("accountType", payload.accountType === "child" ? "CHILD" : "ADULT");
    if (payload.accountType === "child") {
        if (payload.birthDate) p.set("birthDate", payload.birthDate);
        if (payload.gender) p.set("gender", payload.gender === "male" ? "MALE" : "FEMALE");
        if (payload.guardianName) p.set("guardianName", payload.guardianName);
        if (payload.guardianPhone) p.set("guardianPhone", payload.guardianPhone);
    } else {
        p.set("postcode", payload.zonecode || '');
        p.set("address", payload.address || '');
        p.set("addressDetail", payload.addressDetail || '');
    }

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
            joinedAt,
            accountType: payload.accountType,
            birthDate: payload.birthDate,
            gender: payload.gender,
            guardianName: payload.guardianName,
            guardianPhone: payload.guardianPhone,
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
        joinedAt,
        accountType: payload.accountType,
        birthDate: payload.birthDate,
        gender: payload.gender,
        guardianName: payload.guardianName,
        guardianPhone: payload.guardianPhone,
    };
}

export interface KindergartenRegisterPayload {
    name: string;
    zonecode: string;
    address: string;
    addressDetail: string;
    businessRegNo: string;
}

export async function registerKindergarten(payload: KindergartenRegisterPayload): Promise<KindergartenInfo> {
    const p = new URLSearchParams();
    p.set("name", payload.name);
    p.set("brn", payload.businessRegNo);
    p.set("address", payload.address);
    p.set("addressDetail", payload.addressDetail);
    p.set("postcode", payload.zonecode);
    await fetch('/api/kindergarten/create', {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        credentials: 'include',
        body: p
    });

    const info: KindergartenInfo = {
        id: -1,
        name: payload.name,
        zonecode: payload.zonecode,
        address: payload.address,
        addressDetail: payload.addressDetail,
        businessRegNo: payload.businessRegNo,
    };

    const f = await fetch('/api/kindergarten/info?brn=' + payload.businessRegNo, {
        method: "GET",
        credentials: 'include'
    });
    const r = await f.json();
    if (r.status === 'success') {
        info.id = r.data.id;
    }
    return info;
}