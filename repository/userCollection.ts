import {
  collection,
  doc,
  Firestore,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore/lite";
import bcrypt from "bcrypt";
import { User } from "../entities/user";

export class UserCollection {
  static async getUsers(db: Firestore): Promise<User[]> {
    const usersCol = collection(db, "users");
    const userSnapshot = await getDocs(usersCol);
    const userList = userSnapshot.docs.map((doc) => doc.data());
    return userList as User[];
  }

  static async getOneUser(db: Firestore, userId: string): Promise<User | null> {
    try {
      const userDocRef = doc(db, "users", userId);

      const userDocSnapshot = await getDoc(userDocRef);

      if (userDocSnapshot.exists()) {
        return userDocSnapshot.data() as User;
      } else {
        console.warn(`No user found with ID: ${userId}`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching user with ID: ${userId}`, error);
      return null;
    }
  }

  static async updateUser(db: Firestore, userId: string, updateData: Partial<User>): Promise<void> {
    try {
      const userDocRef = doc(db, "users", userId);

      // `updateDoc` updates only the specified fields; it won't overwrite the entire document
      await updateDoc(userDocRef, updateData);
    } catch (error) {
      console.error(`Error updating user with ID: ${userId}`, error);
    }
  }

  static async createUser(db: Firestore, userId: string, userData: User): Promise<void> {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const userDocRef = doc(db, "users", userId);

      await setDoc(userDocRef, { ...userData, password: hashedPassword });
    } catch (error) {
      console.error(`Error creating user with ID: ${userId}`, error);
    }
  }

  static async loginUser(db: Firestore, email: string, password: string): Promise<User | null> {
    try {
      const usersCol = collection(db, "users");
      const q = query(usersCol, where("email", "==", email));
      const userSnapshot = await getDocs(q);

      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data() as User;

        const isPasswordValid = await bcrypt.compare(password, userData.password);
        if (isPasswordValid) {
          return userData;
        } else {
          console.warn("Invalid password.");
        }
      } else {
        console.warn("No user found with the given email.");
      }
      return null;
    } catch (error) {
      console.error("Error logging in user", error);
      return null;
    }
  }
}
