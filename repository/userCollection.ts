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
import { ResponseError } from "../errors/responseError";

export class UserCollection {
  static async getUsers(db: Firestore): Promise<User[]> {
    const usersCol = collection(db, "users");
    const userSnapshot = await getDocs(usersCol);
    const userList = userSnapshot.docs.map((doc) => doc.data());
    return userList as User[];
  }

  static async getOneUserByEmail(db: Firestore, email: string): Promise<User | null> {
    const usersCol = collection(db, "users");
    const emailQuery = query(usersCol, where("email", "==", email));
    const emailSnapshot = await getDocs(emailQuery);

    if (!emailSnapshot.empty) {
      const userDoc = emailSnapshot.docs[0];
      const userData = userDoc.data() as User;

      return { ...userData, userId: userDoc.id }; 
    }

    return null;
  }

  static async getOneUser(db: Firestore, userId: string): Promise<User | null> {
    const userDocRef = doc(db, "users", userId);
    const userDocSnapshot = await getDoc(userDocRef);

    if (userDocSnapshot.exists()) {
      return userDocSnapshot.data() as User;
    } else {
      console.warn(`No user found with ID: ${userId}`);
      return null;
    }
  }

  static async updateUser(db: Firestore, userId: string, updateData: Partial<User>): Promise<void> {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, updateData);
  }

  static async createUser(db: Firestore, userData: Partial<User>): Promise<User | null> {
    if (!userData.password) {
      throw new ResponseError(400, "Password is required.");
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const usersCol = collection(db, "users");

    const createdUserRef = await addDoc(usersCol, { ...userData, password: hashedPassword });

    const { password, ...userWithoutPassword } = userData as User;
    return { ...userWithoutPassword, userId: createdUserRef.id } as User;
  }
  

  static async loginUser(db: Firestore, email: string, password: string): Promise<User | null> {
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
        throw new ResponseError(400, "Invalid password.");
      }
    }
    return null;
  }
}
