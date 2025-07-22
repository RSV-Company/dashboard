/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, Plus, Search } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useDebounce } from "@/lib/helpers/debounce";

interface Brand {
	id: string;
	name: string;
}

export function BrandsManagement() {
	const [brands, setBrands] = useState<Brand[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const debouncedSearchTerm = useDebounce(searchTerm, 500);
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
	const [newBrand, setNewBrand] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const pageSize = 10;
	const { hasPermission } = useAuth();
	const supabase = createClient();

	// Fetch brands with pagination and optional search
	const fetchBrands = useCallback(async (pageNum: number, search: string) => {
		setIsLoading(true);
		try {
			let query = supabase
				.from("brands")
				.select("id, name", { count: "exact" })
				.order("name", { ascending: true })
				.range((pageNum - 1) * pageSize, pageNum * pageSize - 1);

			if (search.trim()) {
				query = query.ilike("name", `%${search.trim()}%`);
			}

			const { data, error, count } = await query;
			if (error) throw error;

			setBrands(data);
			setTotalPages(Math.ceil((count || 0) / pageSize));
		} catch (error: any) {
			toast.error("Error", {
				description: error.message,
			});
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Fetch brands when page or debounced search term changes
	useEffect(() => {
		fetchBrands(page, debouncedSearchTerm);
	}, [page, debouncedSearchTerm, fetchBrands]);

	const handleAddBrand = useCallback(async () => {
		if (!newBrand.trim()) {
			toast.error("Error", {
				description: "Brand name cannot be empty",
			});
			return;
		}

		try {
			const { error } = await supabase
				.from("brands")
				.insert({ name: newBrand.trim() })
				.select()
				.single();
			if (error) {
				if (error.code === "23505") {
					toast.error("Error", {
						description: "Brand name already exists",
					});
				} else {
					throw error;
				}
				return;
			}
			setPage(1);
			await fetchBrands(1, debouncedSearchTerm);
			setNewBrand("");
			setIsAddDialogOpen(false);
			toast.success("Success", {
				description: "Brand added successfully",
			});
		} catch (error: any) {
			toast.error("Error", {
				description: error.message,
			});
		}
	}, [newBrand, debouncedSearchTerm, fetchBrands]);

	const handleDeleteBrand = useCallback(async () => {
		if (!brandToDelete) return;
		try {
			const { error } = await supabase
				.from("brands")
				.delete()
				.eq("id", brandToDelete.id);
			if (error) {
				if (error.code === "23503") {
					toast.error("Error", {
						description:
							"Cannot delete brand because it is associated with products",
					});
				} else {
					throw error;
				}
				return;
			}
			setPage(1);
			await fetchBrands(1, debouncedSearchTerm);
			setIsDeleteDialogOpen(false);
			setBrandToDelete(null);
			toast.success("Success", {
				description: "Brand deleted successfully",
			});
		} catch (error: any) {
			toast.error("Error", {
				description: error.message,
			});
		}
	}, [brandToDelete, debouncedSearchTerm, fetchBrands]);

	const openDeleteDialog = useCallback((brand: Brand) => {
		setBrandToDelete(brand);
		setIsDeleteDialogOpen(true);
	}, []);

	const handlePageChange = useCallback(
		(newPage: number) => {
			if (newPage >= 1 && newPage <= totalPages) {
				setPage(newPage);
			}
		},
		[totalPages]
	);

	// Memoize the table content to prevent rerenders
	const tableContent = useMemo(
		() => (
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{brands.map((brand) => (
						<TableRow key={brand.id}>
							<TableCell className="font-medium">
								{brand.name}
							</TableCell>
							<TableCell className="text-right">
								{hasPermission("manage_brands") && (
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												className="h-8 w-8 p-0"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												className="text-red-600"
												onClick={() =>
													openDeleteDialog(brand)
												}
											>
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		),
		[brands, hasPermission, openDeleteDialog]
	);

	return (
		<div className="flex-1 space-y-4 p-8 pt-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-3xl font-bold tracking-tight">
						Brands Management
					</h2>
					<p className="text-muted-foreground">
						Manage your product brands
					</p>
				</div>
				{hasPermission("manage_brands") && (
					<Dialog
						open={isAddDialogOpen}
						onOpenChange={setIsAddDialogOpen}
					>
						<DialogTrigger asChild>
							<Button>
								<Plus className="mr-2 h-4 w-4" />
								Add Brand
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[425px]">
							<DialogHeader>
								<DialogTitle>Add New Brand</DialogTitle>
								<DialogDescription>
									Add a new brand to your inventory. Enter a
									unique brand name.
								</DialogDescription>
							</DialogHeader>
							<div className="grid gap-4 py-4">
								<div className="grid grid-cols-4 items-center gap-4">
									<Label
										htmlFor="brand-name"
										className="text-right"
									>
										Name
									</Label>
									<Input
										id="brand-name"
										placeholder="Brand name"
										className="col-span-3"
										value={newBrand}
										onChange={(e) =>
											setNewBrand(e.target.value)
										}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button
									type="submit"
									onClick={handleAddBrand}
								>
									Add Brand
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				)}
			</div>

			{hasPermission("manage_brands") && brandToDelete && (
				<Dialog
					open={isDeleteDialogOpen}
					onOpenChange={setIsDeleteDialogOpen}
				>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>Confirm Deletion</DialogTitle>
							<DialogDescription>
								Are you sure you want to delete the brand &quot;
								{brandToDelete.name}&quot;? This action cannot
								be undone unless the brand is not associated
								with any products.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsDeleteDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={handleDeleteBrand}
							>
								Delete
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Brands</CardTitle>
					<CardDescription>
						View and manage your brands
					</CardDescription>
					<div className="flex items-center space-x-2">
						<Search className="h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search by brand name..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="max-w-sm"
						/>
					</div>
				</CardHeader>
				{isLoading ? (
					<div>Loading...</div>
				) : (
					<CardContent>
						{tableContent}
						<div className="flex items-center justify-between mt-4">
							<Button
								variant="outline"
								disabled={page === 1}
								onClick={() => handlePageChange(page - 1)}
							>
								Previous
							</Button>
							<div className="flex items-center gap-2">
								{Array.from(
									{ length: totalPages },
									(_, i) => i + 1
								).map((pageNum) => (
									<Button
										key={pageNum}
										variant={
											pageNum === page
												? "default"
												: "outline"
										}
										onClick={() =>
											handlePageChange(pageNum)
										}
									>
										{pageNum}
									</Button>
								))}
							</div>
							<Button
								variant="outline"
								disabled={page === totalPages}
								onClick={() => handlePageChange(page + 1)}
							>
								Next
							</Button>
						</div>
					</CardContent>
				)}
			</Card>
		</div>
	);
}
