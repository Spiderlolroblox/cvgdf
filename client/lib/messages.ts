import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
  DocumentReference,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Message {
  id: string;
  conversationId: string;
  userId: string;
  text: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  messageCount: number;
}

export class MessagesService {
  static async createConversation(
    userId: string,
    title: string,
  ): Promise<DocumentReference> {
    const conversationRef = await addDoc(collection(db, "conversations"), {
      userId,
      title,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      messageCount: 0,
    });
    return conversationRef;
  }

  static async getConversations(userId: string): Promise<Conversation[]> {
    const q = query(
      collection(db, "conversations"),
      where("userId", "==", userId),
      orderBy("updatedAt", "desc"),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt as Timestamp,
      updatedAt: doc.data().updatedAt as Timestamp,
    })) as Conversation[];
  }

  static async deleteConversation(conversationId: string): Promise<void> {
    await deleteDoc(doc(db, "conversations", conversationId));
  }

  static async updateConversation(
    conversationId: string,
    data: Partial<Conversation>,
  ): Promise<void> {
    await updateDoc(doc(db, "conversations", conversationId), {
      ...data,
      updatedAt: Timestamp.now(),
    });
  }

  static async addMessage(
    conversationId: string,
    userId: string,
    text: string,
  ): Promise<string> {
    const messageRef = await addDoc(collection(db, "messages"), {
      conversationId,
      userId,
      text,
      createdAt: Timestamp.now(),
    });

    // Update conversation's message count
    const conversations = collection(db, "conversations");
    const conversationDoc = doc(conversations, conversationId);
    const conversationSnapshot = await getDocs(
      query(conversations, where("id", "==", conversationId)),
    );

    if (conversationSnapshot.docs.length > 0) {
      await updateDoc(conversationDoc, {
        messageCount:
          (conversationSnapshot.docs[0].data().messageCount || 0) + 1,
        updatedAt: Timestamp.now(),
      });
    }

    return messageRef.id;
  }

  static async getMessages(conversationId: string): Promise<Message[]> {
    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      orderBy("createdAt", "asc"),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt as Timestamp,
      updatedAt: doc.data().updatedAt as Timestamp,
    })) as Message[];
  }

  static async deleteMessage(messageId: string): Promise<void> {
    await deleteDoc(doc(db, "messages", messageId));
  }

  static async updateUserMessageCount(
    userId: string,
    messagesUsed: number,
  ): Promise<void> {
    await updateDoc(doc(db, "users", userId), {
      messagesUsed,
    });
  }
}
