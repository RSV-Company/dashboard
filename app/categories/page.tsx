import { CategoriesManagement } from "@/components/categories-management"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminLayout } from "@/components/admin-layout"

export default function CategoriesPage() {
  return (
    <ProtectedRoute requiredPermission="view_categories">
      <AdminLayout>
        <CategoriesManagement />
      </AdminLayout>
    </ProtectedRoute>
  )
}