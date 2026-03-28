import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { AuthForm } from "../components/AuthForm";
import { useAuth } from "../context/AuthContext";

export const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") === "register" ? "register" : "login";
  const { login, register } = useAuth();
  const navigate = useNavigate();

  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-[1.1fr,0.9fr]">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-10 text-white shadow-panel backdrop-blur-xl">
          <h1 className="text-5xl font-semibold leading-tight">Arattai</h1>
          <p className="mt-5 max-w-lg text-slate-300">
            A professional real-time chat workspace for direct conversations, groups, and seamless collaboration.
          </p>
        </section>
        <div>
          <AuthForm
            mode={mode}
            onSubmit={async (values) => {
              if (mode === "login") {
                await login(values.email, values.password);
              } else {
                await register(values.username || "", values.email, values.password);
              }
              navigate("/");
            }}
          />
          <p className="mt-4 text-center text-sm text-slate-400">
            {mode === "login" ? "Need an account?" : "Already registered?"}{" "}
            <Link
              to={mode === "login" ? "/auth?mode=register" : "/auth?mode=login"}
              className="font-medium text-cyan-300"
            >
              {mode === "login" ? "Register" : "Login"}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};
