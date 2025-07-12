import { InventoryManagement } from "@/components/inventory-management"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminLayout } from "@/components/admin-layout"

export default function InventoryPage() {
  return (
    <ProtectedRoute requiredPermission="view_inventory">
      <AdminLayout>
        <InventoryManagement />
      </AdminLayout>
    </ProtectedRoute>
  )
}
