import { SettingsPage } from "@/components/settings-page"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminLayout } from "@/components/admin-layout"

export default function Settings() {
  return (
    <ProtectedRoute requiredPermission="view_settings">
      <AdminLayout>
        <SettingsPage />
      </AdminLayout>
    </ProtectedRoute>
  )
}
