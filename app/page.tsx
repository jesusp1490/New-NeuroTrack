import LoginForm from "@/components/LoginForm"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Welcome to NeuroTrack</h1>
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <LoginForm />
      </div>
    </main>
  )
}

