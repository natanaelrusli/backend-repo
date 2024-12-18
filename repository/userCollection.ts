import {
  collection,
  doc,
  Firestore,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  addDoc,
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

  static async checkEmailExists(db: Firestore, email: string): Promise<boolean> {
    const usersCol = collection(db, "users");
    const emailQuery = query(usersCol, where("email", "==", email));
    const emailSnapshot = await getDocs(emailQuery);

    return !emailSnapshot.empty;
  }

  static async getOneUserByEmail(db: Firestore, email: string): Promise<User | null> {
    try {
      const usersCol = collection(db, "users");
      const emailQuery = query(usersCol, where("email", "==", email));
      const emailSnapshot = await getDocs(emailQuery);
  
      if (!emailSnapshot.empty) {
        const userDoc = emailSnapshot.docs[0];
        const userData = userDoc.data() as User;

        return { ...userData, userId: userDoc.id }; 
      }
  
      return null;
    } catch (error) {
      throw new Error("error getting user by email");
    }
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
      await updateDoc(userDocRef, updateData);
    } catch (error) {
      throw new Error(`Error updating user ${error}`);
    }
  }

  static async createUser(db: Firestore, userData: Partial<User>): Promise<User | null> {
    try {
      if (!userData.password) throw new Error("Password is required.");
  
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const usersCol = collection(db, "users");
  
      const createdUserRef = await addDoc(usersCol, { ...userData, password: hashedPassword });
  
      const { password, ...userWithoutPassword } = userData as User;
      return { ...userWithoutPassword, userId: createdUserRef.id } as User;  
    } catch (error) {
      console.error("Error creating user:", error);
      return null;
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
