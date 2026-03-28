import { FormEvent, useState } from "react";

type Props = {
  mode: "login" | "register";
  onSubmit: (values: { username?: string; email: string; password: string }) => Promise<void>;
};

export const AuthForm = ({ mode, onSubmit }: Props) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await onSubmit({ username, email, password });
    } catch (err) {
      setError("Authentication failed. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-panel backdrop-blur-xl">
      <div>
        <h1 className="text-3xl font-semibold text-slate-100">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-slate-400">Modern chat with real-time updates and media support.</p>
      </div>
      {mode === "register" && (
        <input
          className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400"
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
      )}
      <input
        className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400"
        placeholder="Email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <input
        className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button className="w-full rounded-2xl bg-cyan-500 px-4 py-3 font-medium text-slate-950 transition hover:bg-cyan-400">
        {mode === "login" ? "Sign in" : "Register"}
      </button>
    </form>
  );
};
