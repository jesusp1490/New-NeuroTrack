"use client"

import React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
 User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { User } from "@/types"

type AuthContextType = {
  user: FirebaseUser | null
  userData: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  signup: (
    email: string,
    password: string,
    name: string,
    role: User["role"],
    gender: string,
    profilePictureUrl?: string,
    hospitalId?: string,
    hospitals?: string[],
  ) => Promise<User | void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  signup: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authInitialized, setAuthInitialized] = useState(false)

  // Set persistence to LOCAL immediately when the component mounts
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Set persistence to LOCAL to persist the session across page refreshes
        await setPersistence(auth, browserLocalPersistence)
        console.log("Auth persistence set to LOCAL")
        setAuthInitialized(true)
      } catch (error) {
        console.error("Error setting auth persistence:", error)
        // Even if setting persistence fails, we should still initialize auth
        setAuthInitialized(true)
      }
    }

    initializeAuth()
  }, [])

  // Listen for auth state changes after persistence is set
  useEffect(() => {
    if (!authInitialized) return

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed:", currentUser ? "User logged in" : "No user")
      setUser(currentUser)

      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid)
          const userDoc = await getDoc(userDocRef)
          if (userDoc.exists()) {
            const userDataFromFirestore = { id: userDoc.id, ...userDoc.data() } as User
            setUserData(userDataFromFirestore)
            console.log("User data loaded from Firestore")
          } else {
            console.log("User document does not exist in Firestore")
            setUserData(null)
          }
        } catch (error) {
          console.error("Error loading user data:", error)
          setUserData(null)
        }
      } else {
        setUserData(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [authInitialized])

  const login = async (email: string, password: string): Promise<void> => {
    try {
      // Persistence is already set, so we can just sign in
      await signInWithEmailAndPassword(auth, email, password)
      console.log("User logged in successfully")
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      console.log("User logged out successfully")
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    }
  }

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: User["role"],
    gender: string,
    profilePictureUrl = "",
    hospitalId?: string,
    hospitals: string[] = [],
  ) => {
    try {
      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Prepare user data for Firestore
      const now = new Date().toISOString()

      // If neurofisiologo and no hospitals provided, use hospitalId as the only hospital
      if (role === "neurofisiologo" && hospitals.length === 0 && hospitalId) {
        hospitals = [hospitalId]
      }

      const userData = {
        email,
        name,
        role,
        gender,
        hospitalId: hospitalId || "",
        hospitals: role === "neurofisiologo" ? hospitals : [],
        profilePictureUrl: profilePictureUrl || "",
        createdAt: now,
        updatedAt: now,
      }

      // Add user data to Firestore
      await setDoc(doc(db, "users", user.uid), userData)

      console.log("User created successfully:", user.uid)
    } catch (error) {
      console.error("Signup error:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, logout, signup }}>{children}</AuthContext.Provider>
  )
}

