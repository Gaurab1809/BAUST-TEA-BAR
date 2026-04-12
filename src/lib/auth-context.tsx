import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { User } from "./mock-data";
import { useAppState } from "./app-state";
import { auth, db } from "./firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  confirmPasswordReset,
  onAuthStateChanged
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

interface RegisterData {
  name: string;
  email: string;
  password: string;
  designation: string;
  department: string;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; message: string; resetCode?: string }>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  isAuthenticated: boolean;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const AUTH_USER_KEY = "baust_auth_user";

const loadSessionUser = (): User | null => {
  try {
    const raw = window.localStorage.getItem(AUTH_USER_KEY);
    if (raw) return JSON.parse(raw) as User;
  } catch {
    // ignore parse errors
  }
  return null;
};

const saveSessionUser = (nextUser: User | null) => {
  try {
    if (nextUser) {
      window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
    } else {
      window.localStorage.removeItem(AUTH_USER_KEY);
    }
  } catch {
    // ignore storage errors
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const { users, addUser, updateUser } = useAppState();
  const [user, setUser] = useState<User | null>(() => loadSessionUser());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setUser(userData);
          saveSessionUser(userData);
          
          if (!users.find(u => u.id === userData.id)) {
            addUser(userData);
          }
        }
      } else {
        setUser(null);
        saveSessionUser(null);
      }
    });

    return () => unsubscribe();
  }, [users, addUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDocRef = doc(db, "users", userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setUser(userData);
        saveSessionUser(userData);
        
        if (!users.find(u => u.id === userData.id)) {
          addUser(userData);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  }, [users, addUser]);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const uid = userCredential.user.uid;
      
      const userData: User = {
        id: uid,
        name: data.name,
        email: data.email,
        designation: data.designation,
        department: data.department,
        phone: data.phone,
        role: "user", // new users default to user
      };
      
      await setDoc(doc(db, "users", uid), userData);
      
      return { success: true, message: "Registration successful" };
    } catch (e: any) {
      console.error(e);
      return { success: false, message: e.message || "Network error occurred." };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      saveSessionUser(null);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
     try {
      await sendPasswordResetEmail(auth, email);
      return { 
        success: true, 
        message: "An email with instructions to reset your password has been sent."
      };
    } catch (e: any) {
      console.error(e);
      return { success: false, message: `Failed to send reset email: ${e.message || "Unknown error"}` };
    }
  }, []);

  const resetPassword = useCallback(async (email: string, token: string, newPassword: string) => {
    try {
      await confirmPasswordReset(auth, token, newPassword);
      return { success: true, message: "Your password has been successfully reset." };
    } catch (e) {
      console.error(e);
      return { success: false, message: "Failed to reset password. The link may have expired." };
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      await updateDoc(doc(db, "users", user.id), updates);
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...updates };
        saveSessionUser(next);
        updateUser(prev.id, updates);
        return next;
      });
    } catch (e) {
      console.error("Failed to update profile", e);
    }
  }, [user, updateUser]);

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin: user?.role === "admin",
      login,
      logout,
      register,
      sendPasswordReset,
      resetPassword,
      isAuthenticated: !!user,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
