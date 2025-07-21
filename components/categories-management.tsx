/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2, Plus, Search, Tag, MoreHorizontal, Edit } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useDebounce } from "@/lib/helpers/debounce"

interface Category {
  id: string
  name: string
  slug: string
  created_at: string
  product_count: number
}

export function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [newCategory, setNewCategory] = useState({ name: "", slug: "" })
  const [editCategory, setEditCategory] = useState({ name: "", slug: "" })
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 10
  const { hasPermission } = useAuth()
  const supabase = createClient()

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  // Fetch categories with pagination, search, and product count
  const fetchCategories = useCallback(
    async (pageNum: number, search: string) => {
      setIsLoading(true)
      try {
        let query = supabase
          .from("categories")
          .select(
            `
            id,
            name,
            slug,
            created_at,
            product_count:products(count)
          `,
            { count: "exact" }
          )
          .order("name", { ascending: true })
          .range((pageNum - 1) * pageSize, pageNum * pageSize - 1)

        if (search.trim()) {
          query = query.or(`name.ilike.%${search.trim()}%,slug.ilike.%${search.trim()}%`)
        }

        const { data, error, count } = await query
        if (error) throw error

        const formattedCategories = data.map((category: any) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          created_at: new Date(category.created_at).toISOString().split("T")[0],
          product_count: category.product_count[0]?.count || 0,
        }))

        setCategories(formattedCategories)
        setTotalPages(Math.ceil((count || 0) / pageSize))
      } catch (error: any) {
        toast.error("Error", {
          description: error.message,
        })
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // Fetch categories when page or debounced search term changes
  useEffect(() => {
    fetchCategories(page, debouncedSearchTerm)
  }, [page, debouncedSearchTerm, fetchCategories])

  const handleAddCategory = useCallback(async () => {
    if (!newCategory.name.trim() || !newCategory.slug.trim()) {
      toast.error("Error", {
        description: "Category name and slug cannot be empty",
      })
      return
    }

    try {
      const { error } = await supabase
        .from("categories")
        .insert({ name: newCategory.name.trim(), slug: newCategory.slug.trim() })
        .select()
        .single()
      if (error) {
        if (error.code === "23505") {
          toast.error("Error", {
            description: "Category name or slug already exists",
          })
        } else {
          throw error
        }
        return
      }
      setPage(1)
      await fetchCategories(1, debouncedSearchTerm)
      setNewCategory({ name: "", slug: "" })
      setIsAddDialogOpen(false)
      toast.success("Success", {
        description: "Category added successfully",
      })
    } catch (error: any) {
      toast.error("Error", {
        description: error.message,
      })
    }
  }, [newCategory, debouncedSearchTerm, fetchCategories])

  const handleEditCategory = useCallback(async () => {
    if (!categoryToEdit || !editCategory.name.trim() || !editCategory.slug.trim()) {
      toast.error("Error", {
        description: "Category name and slug cannot be empty",
      })
      return
    }

    try {
      const { error } = await supabase
        .from("categories")
        .update({ name: editCategory.name.trim(), slug: editCategory.slug.trim() })
        .eq("id", categoryToEdit.id)
        .select()
        .single()
      if (error) {
        if (error.code === "23505") {
          toast.error("Error", {
            description: "Category name or slug already exists",
          })
        } else {
          throw error
        }
        return
      }
      setPage(1)
      await fetchCategories(1, debouncedSearchTerm)
      setEditCategory({ name: "", slug: "" })
      setCategoryToEdit(null)
      setIsEditDialogOpen(false)
      toast.success("Success", {
        description: "Category updated successfully",
      })
    } catch (error: any) {
      toast.error("Error", {
        description: error.message,
      })
    }
  }, [categoryToEdit, editCategory, debouncedSearchTerm, fetchCategories])

  const handleDeleteCategory = useCallback(async () => {
    if (!categoryToDelete) return
    try {
      const { error } = await supabase.from("categories").delete().eq("id", categoryToDelete.id)
      if (error) {
        if (error.code === "23503") {
          toast.error("Error", {
            description: "Cannot delete category because it is associated with products",
          })
        } else {
          throw error
        }
        return
      }
      setPage(1)
      await fetchCategories(1, debouncedSearchTerm)
      setIsDeleteDialogOpen(false)
      setCategoryToDelete(null)
      toast.success("Success", {
        description: "Category deleted successfully",
      })
    } catch (error: any) {
      toast.error("Error", {
        description: error.message,
      })
    }
  }, [categoryToDelete, debouncedSearchTerm, fetchCategories])

  const openEditDialog = useCallback((category: Category) => {
    setCategoryToEdit(category)
    setEditCategory({ name: category.name, slug: category.slug })
    setIsEditDialogOpen(true)
  }, [])

  const openDeleteDialog = useCallback((category: Category) => {
    setCategoryToDelete(category)
    setIsDeleteDialogOpen(true)
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }, [totalPages])

  // Memoize table content to prevent rerenders
  const tableContent = useMemo(() => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Products</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category.id}>
            <TableCell className="font-medium">{category.name}</TableCell>
            <TableCell>{category.slug}</TableCell>
            <TableCell>{category.product_count}</TableCell>
            <TableCell>{category.created_at}</TableCell>
            <TableCell className="text-right">
              {hasPermission("manage_categories") && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(category)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => openDeleteDialog(category)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
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
  ), [categories, hasPermission, openEditDialog, openDeleteDialog])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categories Management</h2>
          <p className="text-muted-foreground">Manage your product categories</p>
        </div>
        {hasPermission("manage_categories") && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>
                  Add a new category to your inventory. Enter a unique name and slug.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="category-name"
                    placeholder="Category name"
                    className="col-span-3"
                    value={newCategory.name}
                    onChange={(e) => {
                      const name = e.target.value
                      setNewCategory({ name, slug: generateSlug(name) })
                    }}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category-slug" className="text-right">
                    Slug
                  </Label>
                  <Input
                    id="category-slug"
                    placeholder="category-slug"
                    className="col-span-3"
                    value={newCategory.slug}
                    onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddCategory}>
                  Add Category
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {hasPermission("manage_categories") && categoryToEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update the category name and slug.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-category-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-category-name"
                  placeholder="Category name"
                  className="col-span-3"
                  value={editCategory.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setEditCategory({ name, slug: generateSlug(name) })
                  }}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-category-slug" className="text-right">
                  Slug
                </Label>
                <Input
                  id="edit-category-slug"
                  placeholder="category-slug"
                  className="col-span-3"
                  value={editCategory.slug}
                  onChange={(e) => setEditCategory({ ...editCategory, slug: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleEditCategory}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {hasPermission("manage_categories") && categoryToDelete && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the category &quot;{categoryToDelete.name}&quot;? This action cannot be undone unless the category is not associated with any products.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteCategory}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.reduce((sum, category) => sum + category.product_count, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Largest Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(...categories.map((c) => c.product_count), 0)}
            </div>
            <p className="text-xs text-muted-foreground">products</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>View and manage your categories</CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  onClick={() => handlePageChange(pageNum)}
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
      </Card>
    </div>
  )
}