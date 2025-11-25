import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export interface UserIP {
  id: string;
  userId: string;
  email: string;
  ipAddress: string;
  lastLogin: Timestamp;
  createdAt: Timestamp;
  isVPN?: boolean;
  vpnProvider?: string;
}

export interface IPBan {
  id: string;
  ipAddress: string;
  reason: string;
  bannedAt: Timestamp;
  expiresAt?: Timestamp;
  isPermanent: boolean;
}

export class IPService {
  static async getUserIP(): Promise<string> {
    try {
      const response = await fetch("/api/get-ip");
      if (!response.ok) {
        throw new Error("Failed to get IP");
      }
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error("Error getting IP:", error);
      return "unknown";
    }
  }

  static async checkVPN(ipAddress: string): Promise<{
    isVPN: boolean;
    provider?: string;
  }> {
    try {
      const response = await fetch("/api/check-vpn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipAddress }),
      });

      if (!response.ok) {
        return { isVPN: false };
      }

      const data = await response.json();
      return {
        isVPN: data.isVPN || false,
        provider: data.provider,
      };
    } catch (error) {
      console.error("Error checking VPN:", error);
      return { isVPN: false };
    }
  }

  static async recordUserIP(
    userId: string,
    email: string,
    ipAddress: string,
  ): Promise<void> {
    try {
      const vpcCheck = await this.checkVPN(ipAddress);

      const ipRef = doc(collection(db, "user_ips"));
      const now = Timestamp.now();

      const ipData: any = {
        userId,
        email,
        ipAddress,
        lastLogin: now,
        createdAt: now,
        isVPN: vpcCheck.isVPN,
      };

      if (vpcCheck.provider) {
        ipData.vpnProvider = vpcCheck.provider;
      }

      await setDoc(ipRef, ipData as UserIP);

      await this.checkIPLimit(ipAddress);
    } catch (error) {
      console.error("Error recording user IP:", error);
    }
  }

  static async updateUserIPLogin(
    userId: string,
    ipAddress: string,
  ): Promise<void> {
    if (!userId || !ipAddress) {
      console.warn(
        "updateUserIPLogin called with undefined userId or ipAddress",
      );
      return;
    }

    try {
      const q = query(
        collection(db, "user_ips"),
        where("userId", "==", userId),
        where("ipAddress", "==", ipAddress),
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, {
          lastLogin: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error("Error updating user IP login:", error);
    }
  }

  static async checkIPLimit(
    ipAddress: string,
    maxAccountsPerIP: number = 1,
  ): Promise<{
    isLimitExceeded: boolean;
    accountCount: number;
    accounts: UserIP[];
  }> {
    if (!ipAddress) {
      console.warn("checkIPLimit called with undefined ipAddress");
      return {
        isLimitExceeded: false,
        accountCount: 0,
        accounts: [],
      };
    }

    try {
      const q = query(
        collection(db, "user_ips"),
        where("ipAddress", "==", ipAddress),
      );

      const snapshot = await getDocs(q);
      const accounts = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as UserIP,
      );

      return {
        isLimitExceeded: accounts.length > maxAccountsPerIP,
        accountCount: accounts.length,
        accounts,
      };
    } catch (error) {
      console.error("Error checking IP limit:", error);
      return {
        isLimitExceeded: false,
        accountCount: 0,
        accounts: [],
      };
    }
  }

  static async getAccountsFromIP(ipAddress: string): Promise<UserIP[]> {
    if (!ipAddress) {
      console.warn("getAccountsFromIP called with undefined ipAddress");
      return [];
    }

    try {
      const q = query(
        collection(db, "user_ips"),
        where("ipAddress", "==", ipAddress),
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as UserIP,
      );
    } catch (error) {
      console.error("Error getting accounts from IP:", error);
      return [];
    }
  }

  static async banIP(
    ipAddress: string,
    reason: string,
    durationMinutes?: number,
  ): Promise<void> {
    try {
      const banRef = doc(collection(db, "ip_bans"));
      const bannedAt = Timestamp.now();

      const banData: any = {
        ipAddress,
        reason,
        bannedAt,
        isPermanent: !durationMinutes,
      };

      if (durationMinutes) {
        banData.expiresAt = Timestamp.fromDate(
          new Date(bannedAt.toDate().getTime() + durationMinutes * 60000),
        );
      }

      await setDoc(banRef, banData as IPBan);
    } catch (error) {
      console.error("Error banning IP:", error);
    }
  }

  static async unbanIP(ipAddress: string): Promise<void> {
    try {
      const q = query(
        collection(db, "ip_bans"),
        where("ipAddress", "==", ipAddress),
      );
      const snapshot = await getDocs(q);

      for (const doc_ of snapshot.docs) {
        await deleteDoc(doc_.ref);
      }
    } catch (error) {
      console.error("Error unbanning IP:", error);
    }
  }

  static async checkIPBan(ipAddress: string): Promise<IPBan | null> {
    if (!ipAddress) {
      console.warn("checkIPBan called with undefined ipAddress");
      return null;
    }

    try {
      const q = query(
        collection(db, "ip_bans"),
        where("ipAddress", "==", ipAddress),
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) return null;

      const banDoc = snapshot.docs[0];
      const ban = { id: banDoc.id, ...banDoc.data() } as IPBan;

      if (ban.expiresAt && ban.expiresAt.toDate() < new Date()) {
        await deleteDoc(banDoc.ref);
        return null;
      }

      return ban;
    } catch (error) {
      console.error("Error checking IP ban:", error);
      return null;
    }
  }

  static async getAllIPBans(): Promise<IPBan[]> {
    try {
      const snapshot = await getDocs(collection(db, "ip_bans"));
      const bans: IPBan[] = [];

      for (const doc_ of snapshot.docs) {
        const ban = { id: doc_.id, ...doc_.data() } as IPBan;

        if (ban.expiresAt && ban.expiresAt.toDate() < new Date()) {
          await deleteDoc(doc_.ref);
          continue;
        }

        bans.push(ban);
      }

      return bans;
    } catch (error) {
      console.error("Error getting all IP bans:", error);
      return [];
    }
  }

  static async getUserIPs(userId: string): Promise<UserIP[]> {
    if (!userId) {
      console.warn("getUserIPs called with undefined userId");
      return [];
    }

    try {
      const q = query(
        collection(db, "user_ips"),
        where("userId", "==", userId),
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as UserIP,
      );
    } catch (error) {
      console.error("Error getting user IPs:", error);
      return [];
    }
  }
}
