import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">线下运营管理</h1>
          <p className="text-sm text-gray-400 mt-1">音乐密码</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
