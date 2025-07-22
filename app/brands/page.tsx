import { ProtectedRoute } from "@/components/protected-route";
import { AdminLayout } from "@/components/admin-layout";
import { BrandsManagement } from "@/components/brands-management";

export default function InventoryPage() {
	return (
		<ProtectedRoute requiredPermission="view_brands">
			<AdminLayout>
				<BrandsManagement />
			</AdminLayout>
		</ProtectedRoute>
	);
}
