"use client"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { MoreHorizontal, Plus, Search, Trash2, Edit, Tag } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const mockCategories = [
  {
    id: 1,
    name: "Electronics",
    description: "Electronic devices and accessories",
    productCount: 45,
    createdAt: "2024-01-01",
  },
  {
    id: 2,
    name: "Clothing",
    description: "Fashion and apparel items",
    productCount: 120,
    createdAt: "2024-01-02",
  },
  {
    id: 3,
    name: "Home & Garden",
    description: "Home improvement and garden supplies",
    productCount: 78,
    createdAt: "2024-01-03",
  },
  {
    id: 4,
    name: "Books",
    description: "Books and educational materials",
    productCount: 32,
    createdAt: "2024-01-04",
  },
  {
    id: 5,
    name: "Sports & Outdoors",
    description: "Sports equipment and outdoor gear",
    productCount: 56,
    createdAt: "2024-01-05",
  },
]

export function CategoriesManagement() {
  const [categories, setCategories] = useState(mockCategories)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingCategory, setEditingCategory] = useState<any>(null)

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDeleteCategory = (id: number) => {
    setCategories(categories.filter((category) => category.id !== id))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditCategory = (category: any) => {
    setEditingCategory(category)
    setIsEditDialogOpen(true)
  }

  const handleAddCategory = () => {
    // In a real app, this would make an API call
    const newCategory = {
      id: categories.length + 1,
      name: "New Category",
      description: "New category description",
      productCount: 0,
      createdAt: new Date().toISOString().split("T")[0],
    }
    setCategories([...categories, newCategory])
    setIsAddDialogOpen(false)
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categories Management</h2>
          <p className="text-muted-foreground">Organize your products with categories</p>
        </div>
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
              <DialogDescription>Create a new category to organize your products.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category-name" className="text-right">
                  Name
                </Label>
                <Input id="category-name" placeholder="Category name" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category-description" className="text-right">
                  Description
                </Label>
                <Textarea id="category-description" placeholder="Category description" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddCategory}>
                Add Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              {categories.reduce((sum, category) => sum + category.productCount, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Largest Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.max(...categories.map((c) => c.productCount))}</div>
            <p className="text-xs text-muted-foreground">products</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(categories.reduce((sum, category) => sum + category.productCount, 0) / categories.length)}
            </div>
            <p className="text-xs text-muted-foreground">per category</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Manage your product categories</CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{category.description}</TableCell>
                  <TableCell>{category.productCount}</TableCell>
                  <TableCell>{category.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCategory(category.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update the category information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category-name" className="text-right">
                Name
              </Label>
              <Input id="edit-category-name" defaultValue={editingCategory?.name} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="edit-category-description"
                defaultValue={editingCategory?.description}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={() => setIsEditDialogOpen(false)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
