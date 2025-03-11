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
  getAuth,
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

  // Debug function to check Firebase auth state
  const checkAuthState = () => {
    const currentAuth = getAuth()
    console.log("Current auth state:", {
      currentUser: currentAuth.currentUser ? `User: ${currentAuth.currentUser.email}` : "No user",
      isAuthReady: currentAuth.currentUser !== null || currentAuth.currentUser === null,
    })
  }

  // Set persistence to LOCAL immediately when the component mounts
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("Initializing auth with persistence...")
        // Set persistence to LOCAL to persist the session across page refreshes
        await setPersistence(auth, browserLocalPersistence)
        console.log("Auth persistence set to LOCAL")
        checkAuthState()
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

    console.log("Setting up auth state listener")
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed:", currentUser ? `User logged in: ${currentUser.email}` : "No user")
      setUser(currentUser)

      if (currentUser) {
        try {
          console.log(`Fetching user data for ${currentUser.uid}`)
          const userDocRef = doc(db, "users", currentUser.uid)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            const userDataFromFirestore = { id: userDoc.id, ...userDoc.data() } as User
            console.log("User data loaded from Firestore:", userDataFromFirestore.role)
            setUserData(userDataFromFirestore)
          } else {
            console.error("User document does not exist in Firestore for uid:", currentUser.uid)
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

    return () => {
      console.log("Cleaning up auth state listener")
      unsubscribe()
    }
  }, [authInitialized])

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true)
    try {
      console.log(`Attempting to log in user: ${email}`)
      // Persistence is already set, so we can just sign in
      const result = await signInWithEmailAndPassword(auth, email, password)
      console.log("User logged in successfully:", result.user.uid)

      // Manually fetch user data to speed up the process
      const userDocRef = doc(db, "users", result.user.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        const userDataFromFirestore = { id: userDoc.id, ...userDoc.data() } as User
        console.log("User data loaded from Firestore after login:", userDataFromFirestore.role)
        setUserData(userDataFromFirestore)
      } else {
        console.error("User document does not exist in Firestore after login")
        setUserData(null)
      }

      // Don't set loading to false here - let the onAuthStateChanged handler do it
    } catch (error) {
      console.error("Login error:", error)
      setLoading(false)
      throw error
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await signOut(auth)
      console.log("User logged out successfully")
      setUser(null)
      setUserData(null)
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    } finally {
      setLoading(false)
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
    setLoading(true)
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
      // Don't set loading to false here - let the onAuthStateChanged handler do it
    } catch (error) {
      console.error("Signup error:", error)
      setLoading(false)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, logout, signup }}>{children}</AuthContext.Provider>
  )
}

