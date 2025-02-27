"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { type User, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

export type UserRole = "cirujano" | "neurofisiologo" | "administrativo" | "jefe_departamento"
export type Gender = "male" | "female"

type UserData = {
  role: UserRole
  gender: Gender
  profilePictureUrl: string
  hospital?: string
}

type AuthContextType = {
  user: User | null
  userData: UserData | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  signup: (
    email: string,
    password: string,
    role: UserRole,
    gender: Gender,
    profilePictureUrl: string,
    hospital?: string,
  ) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  signup: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user)
      if (user) {
        const userDocRef = doc(db, "users", user.uid)
        const userDoc = await getDoc(userDocRef)
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData)
        }
      } else {
        setUserData(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const logout = async () => {
    await signOut(auth)
  }

  const signup = async (
    email: string,
    password: string,
    role: UserRole,
    gender: Gender,
    profilePictureUrl: string,
    hospital?: string,
  ) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    const userData: UserData = { role, gender, profilePictureUrl, ...(hospital && { hospital }) }
    await setDoc(doc(db, "users", user.uid), userData)
  }

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, logout, signup }}>{children}</AuthContext.Provider>
  )
}

