'use client'

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { auth } from '@/lib/db';
import { firebaseUser } from '@/lib/db';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  UserCredential 
} from 'firebase/auth';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: firebaseUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<firebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth, 
      (user) => {
        setUser(user);
        setLoading(false);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<UserCredential> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Signed in successfully",
        description: `Welcome back, ${result.user.email}!`,
      });
      return result;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to sign in";
      setError(errorMessage);
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string): Promise<UserCredential> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      toast({
        title: "Account created successfully",
        description: "You have been signed up and logged in.",
      });
      return result;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to create account";
      setError(errorMessage);
      toast({
        title: "Sign Up Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await signOut(auth);
      toast({
        title: "Signed out",
        description: "You have been successfully logged out.",
      });
    } catch (error: any) {
      const errorMessage = error.message || "Failed to sign out";
      setError(errorMessage);
      toast({
        title: "Sign Out Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider, useAuth };