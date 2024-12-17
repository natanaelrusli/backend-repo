import { collection, Firestore, getDocs } from "firebase/firestore/lite";
import { User } from "../entities/user";

export class UserCollection {
  static async getUsers(db: Firestore): Promise<User[]> {
    const usersCol = collection(db, 'users');
    const userSnapshot = await getDocs(usersCol);
    const userList = userSnapshot.docs.map(doc => doc.data());
    return userList as User[];
  }
}
