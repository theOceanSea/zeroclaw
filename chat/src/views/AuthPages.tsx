import type { FC } from "hono/jsx";
import { Layout } from "./Layout";

export const LoginPage: FC<{ error?: string }> = ({ error }) => {
  return (
    <Layout title="Login">
      <div class="max-w-md mx-auto mt-16">
        <h1 class="text-2xl font-bold text-center mb-8">ZeroClaw Chat</h1>
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4">Login</h2>
          {error ? (
            <div class="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">
              {error}
            </div>
          ) : null}
          <form method="post" action="/login">
            <div class="mb-4">
              <label
                class="block text-sm font-medium text-gray-700 mb-1"
                for="username"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                minlength={3}
                maxlength={32}
                class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div class="mb-6">
              <label
                class="block text-sm font-medium text-gray-700 mb-1"
                for="password"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                minlength={8}
                class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              class="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 transition"
            >
              Login
            </button>
          </form>
          <p class="text-center text-sm text-gray-500 mt-4">
            No account?{" "}
            <a href="/register" class="text-blue-600 hover:underline">
              Register
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export const RegisterPage: FC<{ error?: string }> = ({ error }) => {
  return (
    <Layout title="Register">
      <div class="max-w-md mx-auto mt-16">
        <h1 class="text-2xl font-bold text-center mb-8">ZeroClaw Chat</h1>
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4">Register</h2>
          {error ? (
            <div class="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">
              {error}
            </div>
          ) : null}
          <form method="post" action="/register">
            <div class="mb-4">
              <label
                class="block text-sm font-medium text-gray-700 mb-1"
                for="username"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                minlength={3}
                maxlength={32}
                class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div class="mb-6">
              <label
                class="block text-sm font-medium text-gray-700 mb-1"
                for="password"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                minlength={8}
                class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              class="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 transition"
            >
              Create Account
            </button>
          </form>
          <p class="text-center text-sm text-gray-500 mt-4">
            Already have an account?{" "}
            <a href="/login" class="text-blue-600 hover:underline">
              Login
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
};
