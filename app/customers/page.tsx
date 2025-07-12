import { CustomersPage } from "@/components/customers-page"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminLayout } from "@/components/admin-layout"

export default function Customers() {
  return (
    <ProtectedRoute requiredPermission="view_customers">
      <AdminLayout>
        <CustomersPage />
      </AdminLayout>
    </ProtectedRoute>
  )
}
