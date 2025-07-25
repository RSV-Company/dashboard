import { DashboardOverview } from "@/components/dashboard-overview"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminLayout } from "@/components/admin-layout"

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredPermission="view_dashboard">
      <AdminLayout>
        <DashboardOverview />
      </AdminLayout>
    </ProtectedRoute>
  )
}
