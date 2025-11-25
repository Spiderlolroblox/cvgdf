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

export interface UserBan {
  id: string;
  userId: string;
  email: string;
  reason: string;
  bannedAt: Timestamp;
  expiresAt?: Timestamp;
  isPermanent: boolean;
  type: "ban" | "warn";
}

export interface MaintenanceNotice {
  id: string;
  title: string;
  message: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  isActive: boolean;
  severity: "info" | "warning" | "critical";
  affectsAppFunctionality: boolean;
}

export class SystemNoticesService {
  // ============ BAN MANAGEMENT ============

  static async banUser(
    userId: string,
    email: string,
    reason: string,
    durationMinutes?: number,
  ): Promise<void> {
    const banRef = doc(collection(db, "bans"));
    const bannedAt = Timestamp.now();

    const banData: any = {
      userId,
      email,
      reason,
      bannedAt,
      isPermanent: !durationMinutes,
      type: "ban",
    };

    if (durationMinutes) {
      banData.expiresAt = Timestamp.fromDate(
        new Date(bannedAt.toDate().getTime() + durationMinutes * 60000),
      );
    }

    await setDoc(banRef, banData as UserBan);
  }

  static async warnUser(
    userId: string,
    email: string,
    reason: string,
    durationMinutes?: number,
  ): Promise<void> {
    const banRef = doc(collection(db, "bans"));
    const bannedAt = Timestamp.now();

    const warnData: any = {
      userId,
      email,
      reason,
      bannedAt,
      isPermanent: !durationMinutes,
      type: "warn",
    };

    if (durationMinutes) {
      warnData.expiresAt = Timestamp.fromDate(
        new Date(bannedAt.toDate().getTime() + durationMinutes * 60000),
      );
    }

    await setDoc(banRef, warnData as UserBan);
  }

  static async unbanUser(userId: string): Promise<void> {
    if (!userId) {
      console.warn("unbanUser called with undefined userId");
      return;
    }

    const q = query(collection(db, "bans"), where("userId", "==", userId));
    const snapshot = await getDocs(q);

    for (const doc_ of snapshot.docs) {
      await deleteDoc(doc_.ref);
    }
  }

  static async getUserBan(userId: string): Promise<UserBan | null> {
    if (!userId) {
      console.warn("getUserBan called with undefined userId");
      return null;
    }

    const q = query(collection(db, "bans"), where("userId", "==", userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const banDoc = snapshot.docs[0];
    const ban = { id: banDoc.id, ...banDoc.data() } as UserBan;

    // Check if ban has expired
    if (ban.expiresAt && ban.expiresAt.toDate() < new Date()) {
      await deleteDoc(banDoc.ref);
      return null;
    }

    return ban;
  }

  static async getAllBans(): Promise<UserBan[]> {
    const snapshot = await getDocs(collection(db, "bans"));
    const bans: UserBan[] = [];

    for (const doc_ of snapshot.docs) {
      const ban = { id: doc_.id, ...doc_.data() } as UserBan;

      // Remove expired bans
      if (ban.expiresAt && ban.expiresAt.toDate() < new Date()) {
        await deleteDoc(doc_.ref);
        continue;
      }

      bans.push(ban);
    }

    return bans;
  }

  // ============ MAINTENANCE MANAGEMENT ============

  static async createMaintenanceNotice(
    title: string,
    message: string,
    durationMinutes: number,
    severity: "info" | "warning" | "critical" = "warning",
    affectsAppFunctionality: boolean = false,
  ): Promise<void> {
    const startTime = Timestamp.now();
    const endTime = Timestamp.fromDate(
      new Date(startTime.toDate().getTime() + durationMinutes * 60000),
    );

    const noticeRef = doc(collection(db, "maintenance_notices"));
    await setDoc(noticeRef, {
      title,
      message,
      startTime,
      endTime,
      isActive: true,
      severity,
      affectsAppFunctionality,
    } as MaintenanceNotice);
  }

  static async updateMaintenanceNotice(
    noticeId: string,
    updates: Partial<MaintenanceNotice>,
  ): Promise<void> {
    const noticeRef = doc(db, "maintenance_notices", noticeId);
    await updateDoc(noticeRef, updates);
  }

  static async endMaintenance(noticeId: string): Promise<void> {
    await this.updateMaintenanceNotice(noticeId, {
      isActive: false,
      endTime: Timestamp.now(),
    });
  }

  static async getActiveMaintenanceNotice(): Promise<MaintenanceNotice | null> {
    const q = query(
      collection(db, "maintenance_notices"),
      where("isActive", "==", true),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const doc_ = snapshot.docs[0];
    const notice = { id: doc_.id, ...doc_.data() } as MaintenanceNotice;

    // Check if maintenance period has ended
    if (notice.endTime && notice.endTime.toDate() < new Date()) {
      await this.endMaintenance(notice.id);
      return null;
    }

    return notice;
  }

  static async getAllMaintenanceNotices(): Promise<MaintenanceNotice[]> {
    const snapshot = await getDocs(collection(db, "maintenance_notices"));
    const notices: MaintenanceNotice[] = snapshot.docs.map((doc_) => ({
      id: doc_.id,
      ...doc_.data(),
    })) as MaintenanceNotice[];

    return notices;
  }

  static async deleteMaintenanceNotice(noticeId: string): Promise<void> {
    await deleteDoc(doc(db, "maintenance_notices", noticeId));
  }
}
