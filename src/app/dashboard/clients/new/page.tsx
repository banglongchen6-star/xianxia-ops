import ClientForm from "@/components/client/ClientForm";

export default function NewClientPage() {
  return (
    <div className="p-6 max-w-xl">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">新建客户</h2>
      <ClientForm />
    </div>
  );
}
