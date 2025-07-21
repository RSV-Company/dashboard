/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { MoreHorizontal, Package, Plus, Search, Trash2, Edit, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"

interface Product {
  id: string
  title: string
  slug: string
  main_image_url: string | null
  category_name: string
  category_id: string
  brand_name: string
  brand_id: string
  price: number
  discount_price: number | null
  stock_quantity: number
  description: string | null
  is_featured: boolean
  is_best_selling: boolean
  status: string
}

interface Category {
  id: string
  name: string
}

interface Brand {
  id: string
  name: string
}

export function InventoryManagement() {
  const [inventory, setInventory] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewProduct, setViewProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 10
  const [newProduct, setNewProduct] = useState({
    title: "",
    slug: "",
    category_id: "",
    brand_id: "",
    price: "",
    discount_price: "",
    stock_quantity: "",
    description: "",
    is_featured: false,
    is_best_selling: false,
  })
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const { hasPermission } = useAuth()
  const supabase = createClient()

  // Fetch categories, brands, and products
  const fetchInitialData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name")
      if (categoriesError) throw categoriesError
      setCategories(categoriesData)

      // Fetch brands
      const { data: brandsData, error: brandsError } = await supabase
        .from("brands")
        .select("id, name")
      if (brandsError) throw brandsError
      setBrands(brandsData)

      // Fetch products
      await fetchProducts(1)
    } catch (error: any) {
      toast.error("Error", {
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch products with pagination
  const fetchProducts = useCallback(
    async (pageNum: number) => {
      try {
        const { data: products, error: productsError, count } = await supabase
          .from("products")
          .select(
            `
            id,
            title,
            slug,
            main_image_url,
            price,
            discount_price,
            stock_quantity,
            description,
            is_featured,
            is_best_selling,
            category_id,
            brand_id,
            categories (name),
            brands (name)
          `,
            { count: "exact" }
          )
          .range((pageNum - 1) * pageSize, pageNum * pageSize - 1)
          .order("id", { ascending: true })

        if (productsError) throw productsError

        const formattedProducts = products.map((product: any) => ({
          id: product.id,
          title: product.title,
          slug: product.slug,
          main_image_url: product.main_image_url || "/placeholder.svg",
          category_name: product.categories?.name || "Uncategorized",
          category_id: product.category_id || "",
          brand_name: product.brands?.name || "Unbranded",
          brand_id: product.brand_id || "",
          price: product.price,
          discount_price: product.discount_price || null,
          stock_quantity: product.stock_quantity,
          description: product.description || "",
          is_featured: product.is_featured || false,
          is_best_selling: product.is_best_selling || false,
          status:
            product.stock_quantity <= 0
              ? "Out of Stock"
              : product.stock_quantity < 10
              ? "Low Stock"
              : "In Stock",
        }))

        setInventory(formattedProducts)
        setTotalPages(Math.ceil((count || 0) / pageSize))
      } catch (error: any) {
        toast.error("Error", {
          description: error.message,
        })
      }
    },
    []
  )

  // Initial data fetch and subscription
  useEffect(() => {
    fetchInitialData()

    // Subscribe to brands table changes
    const subscription = supabase
      .channel("brands_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brands" },
        async () => {
          const { data, error } = await supabase.from("brands").select("id, name")
          if (error) {
            toast.error("Error", {
              description: error.message,
            })
            return
          }
          setBrands(data)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [fetchInitialData])

  // Fetch products when page changes
  useEffect(() => {
    fetchProducts(page)
  }, [page, fetchProducts])

  const filteredInventory = useMemo(
    () =>
      inventory.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.id.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [inventory, searchTerm]
  )

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case "In Stock":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            In Stock
          </Badge>
        )
      case "Low Stock":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Low Stock
          </Badge>
        )
      case "Out of Stock":
        return <Badge variant="destructive">Out of Stock</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }, [])

  const handleDeleteItem = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from("products").delete().eq("id", id)
        if (error) throw error
        setInventory((prev) => prev.filter((item) => item.id !== id))
        toast.success("Success", {
          description: "Product deleted successfully",
        })
      } catch (error: any) {
        toast.error("Error", {
          description: error.message,
        })
      }
    },
    []
  )

  const handleAddProduct = useCallback(async () => {
    try {
      const { title, slug, category_id, brand_id, price, discount_price, stock_quantity, description, is_featured, is_best_selling } = newProduct
      if (!title || !slug || !category_id || !brand_id || !price || !stock_quantity) {
        toast.error("Error", {
          description: "Please fill in all required fields (Name, SKU, Category, Brand, Price, Stock)",
        })
        return
      }

      const { error } = await supabase.from("products").insert({
        title,
        slug,
        category_id,
        brand_id,
        price: parseFloat(price),
        discount_price: discount_price ? parseFloat(discount_price) : null,
        stock_quantity: parseInt(stock_quantity),
        description,
        is_featured,
        is_best_selling,
      })
      if (error) throw error

      setPage(1)
      await fetchProducts(1)

      setNewProduct({
        title: "",
        slug: "",
        category_id: "",
        brand_id: "",
        price: "",
        discount_price: "",
        stock_quantity: "",
        description: "",
        is_featured: false,
        is_best_selling: false,
      })
      setIsAddDialogOpen(false)
      toast.success("Success", {
        description: "Product added successfully",
      })
    } catch (error: any) {
      toast.error("Error", {
        description: error.message,
      })
    }
  }, [newProduct, fetchProducts])

  const handleEditProduct = useCallback(async () => {
    if (!editProduct) return
    try {
      const { id, title, slug, category_id, brand_id, price, discount_price, stock_quantity, description, is_featured, is_best_selling } = editProduct
      if (!title || !slug || !category_id || !brand_id || !price || !stock_quantity) {
        toast.error("Error", {
          description: "Please fill in all required fields (Name, SKU, Category, Brand, Price, Stock)",
        })
        return
      }

      const { error } = await supabase
        .from("products")
        .update({
          title,
          slug,
          category_id,
          brand_id,
          price: parseFloat(price.toString()),
          discount_price: discount_price ? parseFloat(discount_price.toString()) : null,
          stock_quantity: parseInt(stock_quantity.toString()),
          description,
          is_featured,
          is_best_selling,
        })
        .eq("id", id)
      if (error) throw error

      setPage(1)
      await fetchProducts(1)

      setEditProduct(null)
      setIsEditDialogOpen(false)
      toast.success("Success", {
        description: "Product updated successfully",
      })
    } catch (error: any) {
      toast.error("Error", {
        description: error.message,
      })
    }
  }, [editProduct, fetchProducts])

  const openEditDialog = useCallback((product: Product) => {
    setEditProduct(product)
    setIsEditDialogOpen(true)
  }, [])

  const openViewDialog = useCallback((product: Product) => {
    setViewProduct(product)
    setIsViewDialogOpen(true)
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }, [totalPages])

  // Memoize the table content to prevent rerenders
  const tableContent = useMemo(() => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Image</TableHead>
          <TableHead>ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Brand</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Discount</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Featured</TableHead>
          <TableHead>Best Selling</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredInventory.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <Image
                src={item.main_image_url || "/placeholder.svg"}
                alt={item.title}
                width={64}
                height={64}
                className="rounded-md object-cover"
              />
            </TableCell>
            <TableCell>{item.id}</TableCell>
            <TableCell className="font-medium">{item.title}</TableCell>
            <TableCell>{item.slug}</TableCell>
            <TableCell>{item.category_name}</TableCell>
            <TableCell>{item.brand_name}</TableCell>
            <TableCell>${item.price.toFixed(2)}</TableCell>
            <TableCell>{item.discount_price ? `$${item.discount_price.toFixed(2)}` : "-"}</TableCell>
            <TableCell>{item.stock_quantity}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <span className="truncate max-w-[150px]">{item.description || "-"}</span>
                {item.description && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openViewDialog(item)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </TableCell>
            <TableCell>
              {item.is_featured ? (
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  Yes
                </Badge>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell>
              {item.is_best_selling ? (
                <Badge variant="default" className="bg-purple-100 text-purple-800">
                  Yes
                </Badge>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell>{getStatusBadge(item.status)}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {hasPermission("manage_inventory") && (
                    <DropdownMenuItem onClick={() => openEditDialog(item)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {hasPermission("delete_products") && (
                    <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteItem(item.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ), [filteredInventory, hasPermission, getStatusBadge, openEditDialog, openViewDialog, handleDeleteItem])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
          <p className="text-muted-foreground">Manage your product inventory and stock levels</p>
        </div>
        {hasPermission("manage_inventory") && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Add a new product to your inventory. Fill in all the required details.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="title"
                    placeholder="Product name"
                    className="col-span-3"
                    value={newProduct.title}
                    onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="slug" className="text-right">
                    SKU
                  </Label>
                  <Input
                    id="slug"
                    placeholder="Product SKU"
                    className="col-span-3"
                    value={newProduct.slug}
                    onChange={(e) => setNewProduct({ ...newProduct, slug: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Category
                  </Label>
                  <Select
                    value={newProduct.category_id}
                    onValueChange={(value) => setNewProduct({ ...newProduct, category_id: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="brand" className="text-right">
                    Brand
                  </Label>
                  <Select
                    value={newProduct.brand_id}
                    onValueChange={(value) => setNewProduct({ ...newProduct, brand_id: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                    Price
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0.00"
                    className="col-span-3"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="discount_price" className="text-right">
                    Discount Price
                  </Label>
                  <Input
                    id="discount_price"
                    type="number"
                    placeholder="0.00 (optional)"
                    className="col-span-3"
                    value={newProduct.discount_price}
                    onChange={(e) => setNewProduct({ ...newProduct, discount_price: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stock" className="text-right">
                    Stock
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    placeholder="0"
                    className="col-span-3"
                    value={newProduct.stock_quantity}
                    onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed product description (supports Markdown, e.g., **bold**, *italic*, - lists)"
                    className="col-span-3"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Featured</Label>
                  <Checkbox
                    id="is_featured"
                    checked={newProduct.is_featured}
                    onCheckedChange={(checked) => setNewProduct({ ...newProduct, is_featured: !!checked })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Best Selling</Label>
                  <Checkbox
                    id="is_best_selling"
                    checked={newProduct.is_best_selling}
                    onCheckedChange={(checked) => setNewProduct({ ...newProduct, is_best_selling: !!checked })}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddProduct}>
                  Add Product
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {hasPermission("manage_inventory") && editProduct && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Update the product details. Fill in all the required fields.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-title" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-title"
                  placeholder="Product name"
                  className="col-span-3"
                  value={editProduct.title}
                  onChange={(e) => setEditProduct({ ...editProduct, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-slug" className="text-right">
                  SKU
                </Label>
                <Input
                  id="edit-slug"
                  placeholder="Product SKU"
                  className="col-span-3"
                  value={editProduct.slug}
                  onChange={(e) => setEditProduct({ ...editProduct, slug: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-category" className="text-right">
                  Category
                </Label>
                <Select
                  value={editProduct.category_id}
                  onValueChange={(value) => setEditProduct({ ...editProduct, category_id: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-brand" className="text-right">
                  Brand
                </Label>
                <Select
                  value={editProduct.brand_id}
                  onValueChange={(value) => setEditProduct({ ...editProduct, brand_id: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-price" className="text-right">
                  Price
                </Label>
                <Input
                  id="edit-price"
                  type="number"
                  placeholder="0.00"
                  className="col-span-3"
                  value={editProduct.price}
                  onChange={(e) => setEditProduct({ ...editProduct, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-discount_price" className="text-right">
                  Discount Price
                </Label>
                <Input
                  id="edit-discount_price"
                  type="number"
                  placeholder="0.00 (optional)"
                  className="col-span-3"
                  value={editProduct.discount_price || ""}
                  onChange={(e) => setEditProduct({ ...editProduct, discount_price: parseFloat(e.target.value) || null })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-stock" className="text-right">
                  Stock
                </Label>
                <Input
                  id="edit-stock"
                  type="number"
                  placeholder="0"
                  className="col-span-3"
                  value={editProduct.stock_quantity}
                  onChange={(e) => setEditProduct({ ...editProduct, stock_quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  placeholder="Detailed product description (supports Markdown, e.g., **bold**, *italic*, - lists)"
                  className="col-span-3"
                  value={editProduct.description || ""}
                  onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Featured</Label>
                <Checkbox
                  id="edit-is_featured"
                  checked={editProduct.is_featured}
                  onCheckedChange={(checked) => setEditProduct({ ...editProduct, is_featured: !!checked })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Best Selling</Label>
                <Checkbox
                  id="edit-is_best_selling"
                  checked={editProduct.is_best_selling}
                  onCheckedChange={(checked) => setEditProduct({ ...editProduct, is_best_selling: !!checked })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleEditProduct}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {viewProduct && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{viewProduct.title} - Description</DialogTitle>
              <DialogDescription>
                Detailed description of the product.
              </DialogDescription>
            </DialogHeader>
            <div className="prose max-w-none">
              <ReactMarkdown>{viewProduct.description || "No description available."}</ReactMarkdown>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.filter((item) => item.status === "In Stock").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.filter((item) => item.status === "Low Stock").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventory.filter((item) => item.status === "Out of Stock").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>Manage your product inventory</CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or ID..."
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