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
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import type { User } from "@/types"

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

  useEffect(() => {
    // Set persistence to LOCAL to persist the session
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log("Auth persistence set to LOCAL")
      })
      .catch((error) => {
        console.error("Error setting auth persistence:", error)
      })

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user)
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid)
          const userDoc = await getDoc(userDocRef)
          if (userDoc.exists()) {
            setUserData({ id: userDoc.id, ...userDoc.data() } as User)
          }
        } catch (error) {
          console.error("Error al cargar datos del usuario:", error)
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
    name: string,
    role: User["role"],
    gender: string,
    profilePictureUrl = "",
    hospitalId?: string,
    hospitals: string[] = [],
  ) => {
    try {
      // Crear el usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Preparar datos del usuario para Firestore
      const now = new Date().toISOString()

      // Si es neurofisiólogo y no se proporcionaron hospitales, usar el hospitalId como único hospital
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

      // Añadir datos del usuario a Firestore
      await setDoc(doc(db, "users", user.uid), userData)

      console.log("Usuario creado exitosamente:", user.uid)
    } catch (error) {
      console.error("Error en el registro:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, logout, signup }}>{children}</AuthContext.Provider>
  )
}

