import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore, collection, doc, getDoc, getDocs, query, where } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { Hospital, Room, User, Booking, Surgery, Shift } from "@/types"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

// Collection references
const hospitalsRef = collection(db, "hospitals")
const roomsRef = collection(db, "rooms")
const usersRef = collection(db, "users")
const bookingsRef = collection(db, "bookings")
const surgeriesRef = collection(db, "surgeries")
const shiftsRef = collection(db, "shifts")

// Fetch functions
export async function getHospital(id: string): Promise<Hospital | null> {
  const docRef = doc(hospitalsRef, id)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Hospital) : null
}

export async function getRoom(id: string): Promise<Room | null> {
  const docRef = doc(roomsRef, id)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Room) : null
}

export async function getRoomsByHospital(hospitalId: string): Promise<Room[]> {
  const q = query(roomsRef, where("hospitalId", "==", hospitalId))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Room)
}

export async function getUser(id: string): Promise<User | null> {
  const docRef = doc(usersRef, id)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as User) : null
}

export async function getBookingsByRoom(roomId: string, startDate: Date, endDate: Date): Promise<Booking[]> {
  const q = query(
    bookingsRef,
    where("roomId", "==", roomId),
    where("date", ">=", startDate.toISOString()),
    where("date", "<=", endDate.toISOString()),
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Booking)
}

export async function getSurgeriesByBooking(bookingId: string): Promise<Surgery[]> {
  const q = query(surgeriesRef, where("bookingId", "==", bookingId))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Surgery)
}

export async function getShiftsByNeurophysiologist(
  neurophysiologistId: string,
  startDate: Date,
  endDate: Date,
): Promise<Shift[]> {
  const q = query(
    shiftsRef,
    where("neurophysiologistId", "==", neurophysiologistId),
    where("date", ">=", startDate.toISOString()),
    where("date", "<=", endDate.toISOString()),
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Shift)
}

export { db, auth }

