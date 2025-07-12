import { AnalyticsPage } from "@/components/analytics-page"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminLayout } from "@/components/admin-layout"

export default function Analytics() {
  return (
    <ProtectedRoute requiredPermission="view_analytics">
      <AdminLayout>
        <AnalyticsPage />
      </AdminLayout>
    </ProtectedRoute>
  )
}
