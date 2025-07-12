import { OrdersManagement } from "@/components/orders-management"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminLayout } from "@/components/admin-layout"

export default function OrdersPage() {
  return (
    <ProtectedRoute requiredPermission="view_orders">
      <AdminLayout>
        <OrdersManagement />
      </AdminLayout>
    </ProtectedRoute>
  )
}
  