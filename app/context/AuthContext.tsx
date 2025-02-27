"use client"

import React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { User, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { User as DbUser } from "@/types"

type AuthContextType = {
  user: User | null
  userData: DbUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  signup: (email: string, password: string, name: string, role: DbUser["role"], hospitalId: string) => Promise<void>
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
  const [userData, setUserData] = useState<DbUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user)
      if (user) {
        const userDocRef = doc(db, "users", user.uid)
        const userDoc = await getDoc(userDocRef)
        if (userDoc.exists()) {
          setUserData({ id: userDoc.id, ...userDoc.data() } as DbUser)
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

  const signup = async (email: string, password: string, name: string, role: DbUser["role"], hospitalId: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    const now = new Date().toISOString()
    const userData: Omit<DbUser, "id"> = {
      email,
      name,
      role,
      hospitalId,
      createdAt: now,
      updatedAt: now,
    }
    await setDoc(doc(db, "users", user.uid), userData)
  }

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, logout, signup }}>{children}</AuthContext.Provider>
  )
}

