"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	BarChart3,
	Package,
	ShoppingCart,
	Tags,
	Home,
	Settings,
	Users,
	LogOut,
	Truck,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const sidebarNavItems = [
	{
		title: "Dashboard",
		href: "/",
		icon: Home,
		permission: "view_dashboard",
	},
	{
		title: "Inventory",
		href: "/inventory",
		icon: Package,
		permission: "view_inventory",
	},
	{
		title: "Categories",
		href: "/categories",
		icon: Tags,
		permission: "view_categories",
	},
	{
		title: "Brands",
		href: "/brands",
		icon: Truck,
		permission: "view_categories",
	},
	{
		title: "Orders",
		href: "/orders",
		icon: ShoppingCart,
		permission: "view_orders",
	},
	{
		title: "Analytics",
		href: "/analytics",
		icon: BarChart3,
		permission: "view_analytics",
	},
	{
		title: "Customers",
		href: "/customers",
		icon: Users,
		permission: "view_customers",
	},
	{
		title: "Settings",
		href: "/settings",
		icon: Settings,
		permission: "view_settings",
	},
];

export function AdminSidebar() {
	const pathname = usePathname();
	const router = useRouter();
	const { user, logout, hasPermission } = useAuth();

	const handleLogout = () => {
		logout();
		router.push("/login");
	};

	const getRoleBadgeColor = (role: string) => {
		switch (role) {
			case "admin":
				return "bg-red-100 text-red-800";
			case "manager":
				return "bg-blue-100 text-blue-800";
			case "staff":
				return "bg-green-100 text-green-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	if (!user) return null;

	return (
		<div className="flex h-full w-64 flex-col bg-gray-900 text-white">
			<div className="flex h-16 items-center px-6">
				<h1 className="text-xl font-bold">Admin Portal</h1>
			</div>

			{/* User Info */}
			<div className="px-6 py-4 border-b border-gray-700">
				<div className="flex items-center space-x-3">
					<Avatar className="h-8 w-8">
						<AvatarFallback className="bg-gray-600 text-white">
							{user.name
								.split(" ")
								.map((n) => n[0])
								.join("")}
						</AvatarFallback>
					</Avatar>
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium truncate">
							{user.name}
						</p>
						<Badge
							className={cn(
								"text-xs",
								getRoleBadgeColor(user.role)
							)}
						>
							{user.role.charAt(0).toUpperCase() +
								user.role.slice(1)}
						</Badge>
					</div>
				</div>
			</div>

			<ScrollArea className="flex-1 px-3">
				<div className="space-y-1 py-4">
					{sidebarNavItems.map((item) => {
						const Icon = item.icon;
						const hasAccess = hasPermission(item.permission);

						if (!hasAccess) return null;

						return (
							<Link
								key={item.href}
								href={item.href}
							>
								<Button
									variant="ghost"
									className={cn(
										"w-full justify-start text-white hover:bg-gray-800 hover:text-white",
										pathname === item.href &&
											"bg-gray-800 text-white"
									)}
								>
									<Icon className="mr-2 h-4 w-4" />
									{item.title}
								</Button>
							</Link>
						);
					})}
				</div>
			</ScrollArea>

			<div className="p-3">
				<Button
					variant="ghost"
					className="w-full justify-start text-white hover:bg-gray-800 hover:text-white"
					onClick={handleLogout}
				>
					<LogOut className="mr-2 h-4 w-4" />
					LOGOUT
				</Button>
			</div>
		</div>
	);
}
