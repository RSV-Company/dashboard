/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, Package, Plus, Search, Trash2, Edit, Eye, Image as ImageIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { toast, Toaster } from "sonner";
import ReactMarkdown from "react-markdown";
import { uploadImageToS3 } from "@/utils/s3-upload";

interface Product {
  id: string;
  title: string;
  slug: string;
  main_image_url: string | null;
  category_name: string;
  category_id: string;
  brand_name: string;
  brand_id: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  description: string | null;
  specifications: { [key: string]: string } | null;
  is_featured: boolean;
  is_best_selling: boolean;
  status: string;
  additional_images: { id: string; image_url: string }[];
}

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

interface FormData {
  title: string;
  slug: string;
  category_id: string;
  brand_id: string;
  price: string;
  discount_price: string;
  stock_quantity: string;
  description: string;
  specifications: string;
  is_featured: boolean;
  is_best_selling: boolean;
  main_image: File | null;
  main_image_preview: string;
  additional_images: File[];
  additional_previews: string[];
}

interface ProductFormProps {
  initialData: FormData;
  categories: Category[];
  brands: Brand[];
  onSubmit: (data: FormData, id?: string) => Promise<void>;
  onCancel?: () => void;
  isEdit?: boolean;
}

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onView: (product: Product) => void;
  onDelete: (id: string) => void;
  onManageImages: (product: Product) => void;
  hasPermission: (permission: string) => boolean;
}

interface ImageManagementModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: (productId: string, mainImageUrl: string | null, additionalImages: { id: string; image_url: string }[]) => Promise<void>;
}

const supabase = createClient();

function ProductForm({ initialData, categories, brands, onSubmit, onCancel, isEdit = false }: ProductFormProps) {
  const [formData, setFormData] = useState<FormData>(initialData);

  function handleSubmit() {
    console.log("handleSubmit called with formData:", formData);
    toast.info("Debug: Attempting to submit form");
    if (!formData.title || !formData.slug || !formData.category_id || !formData.brand_id || !formData.price || !formData.stock_quantity) {
      console.log("Validation failed:", {
        title: formData.title,
        slug: formData.slug,
        category_id: formData.category_id,
        brand_id: formData.brand_id,
        price: formData.price,
        stock_quantity: formData.stock_quantity,
      });
      toast.error("Error", { description: "Please fill in all required fields (Name, SKU, Category, Brand, Price, Stock)" });
      return;
    }
    if (!isEdit && !formData.main_image) {
      toast.error("Error", { description: "Main Image is required for new products" });
      return;
    }
    // Validate specifications JSON
    if (formData.specifications) {
      try {
        JSON.parse(formData.specifications);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        toast.error("Error", { description: "Specifications must be valid JSON (e.g., {\"key\": \"value\"})" });
        return;
      }
    }
    onSubmit(formData);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>, isMainImage: boolean) {
    const files = e.target.files;
    if (!files) return;
    if (isMainImage) {
      const file = files[0];
      if (file) {
        setFormData({
          ...formData,
          main_image: file,
          main_image_preview: URL.createObjectURL(file),
        });
      }
    } else {
      const newImages = Array.from(files);
      setFormData({
        ...formData,
        additional_images: [...formData.additional_images, ...newImages],
        additional_previews: [...formData.additional_previews, ...newImages.map(URL.createObjectURL)],
      });
    }
  }

  function removeAdditionalImage(index: number) {
    setFormData({
      ...formData,
      additional_images: formData.additional_images.filter((_, i) => i !== index),
      additional_previews: formData.additional_previews.filter((_, i) => i !== index),
    });
  }

  const formFields = [
    { id: "title", label: "Name", type: "text", placeholder: "Product name" },
    { id: "slug", label: "SKU", type: "text", placeholder: "Product SKU" },
    { id: "main_image", label: "Main Image", type: "file", accept: "image/jpeg,image/png" },
    { id: "additional_images", label: "Additional Images", type: "file", accept: "image/jpeg,image/png", multiple: true },
    { id: "category", label: "Category", type: "select", options: categories, valueKey: "id", displayKey: "name", placeholder: "Select category" },
    { id: "brand", label: "Brand", type: "select", options: brands, valueKey: "id", displayKey: "name", placeholder: "Select brand" },
    { id: "price", label: "Price", type: "number", placeholder: "0.00" },
    { id: "discount_price", label: "Discount Price", type: "number", placeholder: "0.00 (optional)" },
    { id: "stock_quantity", label: "Stock", type: "number", placeholder: "0" },
    { id: "description", label: "Description", type: "textarea", placeholder: "Detailed product description (supports Markdown, e.g., **bold**, *italic*, - lists)" },
    { id: "specifications", label: "Specifications", type: "textarea", placeholder: 'Enter specifications as JSON (e.g., {"color": "Red", "size": "Medium"})' },
    { id: "is_featured", label: "Featured", type: "checkbox" },
    { id: "is_best_selling", label: "Best Selling", type: "checkbox" },
  ];

  return (
    <div className="grid gap-4 py-4">
      {formFields.map((field) => (
        <div key={field.id} className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor={field.id} className="text-right">{field.label}</Label>
          {field.type === "select" ? (
            <Select
              value={(formData as any)[field.id.replace("category", "category_id").replace("brand", "brand_id")]}
              onValueChange={(value) => setFormData({ ...formData, [field.id.replace("category", "category_id").replace("brand", "brand_id")]: value })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: any) => (
                  <SelectItem key={option[field.valueKey!]} value={option[field.valueKey!]}>
                    {option[field.displayKey!]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : field.type === "checkbox" ? (
            <Checkbox
              id={field.id}
              checked={(formData as any)[field.id]}
              onCheckedChange={(checked) => setFormData({ ...formData, [field.id]: !!checked })}
              className="col-span-3"
            />
          ) : field.type === "textarea" ? (
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              className="col-span-3"
              value={(formData as any)[field.id]}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
            />
          ) : field.type === "file" ? (
            <Input
              id={field.id}
              type="file"
              accept={field.accept}
              multiple={field.multiple}
              className="col-span-3"
              onChange={(e) => handleImageChange(e, field.id === "main_image")}
            />
          ) : (
            <Input
              id={field.id}
              type={field.type}
              placeholder={field.placeholder}
              className="col-span-3"
              value={(formData as any)[field.id]}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
            />
          )}
        </div>
      ))}
      {formData.main_image_preview && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Main Image Preview</Label>
          <Image
            src={formData.main_image_preview}
            alt="Main Image Preview"
            width={100}
            height={100}
            className="col-span-3 rounded-md object-cover"
          />
        </div>
      )}
      {formData.additional_previews.length > 0 && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Additional Images</Label>
          <div className="col-span-3 grid grid-cols-3 gap-2">
            {formData.additional_previews.map((preview, index) => (
              <div key={index} className="relative">
                <Image
                  src={preview}
                  alt={`Additional Image ${index + 1}`}
                  width={100}
                  height={100}
                  className="rounded-md object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-0 right-0 h-6 w-6"
                  onClick={() => removeAdditionalImage(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      <DialogFooter>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        )}
        <Button onClick={handleSubmit}>{isEdit ? "Save Changes" : "Add Product"}</Button>
      </DialogFooter>
    </div>
  );
}

function ImageManagementModal({ product, onClose, onSave }: ImageManagementModalProps) {
  const [mainImage, setMainImage] = useState<string | null>(product?.main_image_url || null);
  const [images, setImages] = useState<{ id: string; image_url: string }[]>(product?.additional_images || []);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [newMainImage, setNewMainImage] = useState<File | null>(null);
  const [newMainImagePreview, setNewMainImagePreview] = useState<string | null>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>, isMainImage: boolean) {
    const files = e.target.files;
    if (!files) return;
    if (isMainImage) {
      const file = files[0];
      if (file) {
        setNewMainImage(file);
        setNewMainImagePreview(URL.createObjectURL(file));
      }
    } else {
      const newFiles = Array.from(files);
      setNewImages([...newImages, ...newFiles]);
      setNewPreviews([...newPreviews, ...newFiles.map(URL.createObjectURL)]);
    }
  }

  function removeImage(index: number, isExisting: boolean) {
    if (isExisting) {
      setImages(images.filter((_, i) => i !== index));
    } else {
      setNewImages(newImages.filter((_, i) => i !== index));
      setNewPreviews(newPreviews.filter((_, i) => i !== index));
    }
  }

  function removeMainImage() {
    setMainImage(null);
    setNewMainImage(null);
    setNewMainImagePreview(null);
  }

  async function handleSave() {
    if (!product) return;
    try {
      // Upload new main image if provided
      let mainImageUrl = mainImage;
      if (newMainImage) {
        mainImageUrl = await uploadImageToS3(newMainImage, mainImage?.split("/").pop());
      }

      // Upload new additional images
      const uploadedImages = await Promise.all(
        newImages.map(async (file) => ({
          id: crypto.randomUUID(),
          image_url: await uploadImageToS3(file),
        }))
      );

      await onSave(product.id, mainImageUrl, [...images, ...uploadedImages]);
      onClose();
    } catch (error: any) {
      console.error("ImageManagementModal handleSave error:", error);
      toast.error("Error", { description: error.message });
    }
  }

  return (
    <Dialog open={!!product} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Images for {product?.title}</DialogTitle>
          <DialogDescription>Add, remove, or view main and additional product images.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="main_image" className="text-right">Main Image</Label>
            <Input
              id="main_image"
              type="file"
              accept="image/jpeg,image/png"
              className="col-span-3"
              onChange={(e) => handleImageChange(e, true)}
            />
          </div>
          {(mainImage || newMainImagePreview) && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Main Image Preview</Label>
              <div className="col-span-3 relative">
                <Image
                  src={newMainImagePreview || mainImage || "/placeholder.svg"}
                  alt="Main Image"
                  width={100}
                  height={100}
                  className="rounded-md object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-0 right-0 h-6 w-6"
                  onClick={removeMainImage}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="additional_images" className="text-right">Additional Images</Label>
            <Input
              id="additional_images"
              type="file"
              accept="image/jpeg,image/png"
              multiple
              className="col-span-3"
              onChange={(e) => handleImageChange(e, false)}
            />
          </div>
          {(images.length > 0 || newPreviews.length > 0) && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Additional Images</Label>
              <div className="col-span-3 grid grid-cols-3 gap-2">
                {images.map((image, index) => (
                  <div key={image.id} className="relative">
                    <Image
                      src={image.image_url}
                      alt={`Image ${index + 1}`}
                      width={100}
                      height={100}
                      className="rounded-md object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-0 right-0 h-6 w-6"
                      onClick={() => removeImage(index, true)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {newPreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={preview}
                      alt={`New Image ${index + 1}`}
                      width={100}
                      height={100}
                      className="rounded-md object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-0 right-0 h-6 w-6"
                      onClick={() => removeImage(index, false)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Images</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductTable({ products, onEdit, onView, onDelete, onManageImages, hasPermission }: ProductTableProps) {
  function getStatusBadge(status: string) {
    switch (status) {
      case "In Stock":
        return <Badge variant="default" className="bg-green-100 text-green-800">In Stock</Badge>;
      case "Low Stock":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
      case "Out of Stock":
        return <Badge variant="destructive">Out of Stock</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  const tableHeadings = [
    "ID",
    "Name",
    "SKU",
    "Category",
    "Brand",
    "Price",
    "Discount",
    "Stock",
    "Images",
    "Description",
    "Specifications",
    "Featured",
    "Best Selling",
    "Status",
  ];

  const tableColumns = [
    { key: "id", render: (item: Product) => item.id },
    { key: "title", render: (item: Product) => <span className="font-medium">{item.title}</span> },
    { key: "slug", render: (item: Product) => item.slug },
    { key: "category_name", render: (item: Product) => item.category_name },
    { key: "brand_name", render: (item: Product) => item.brand_name },
    { key: "price", render: (item: Product) => `$${item.price.toFixed(2)}` },
    { key: "discount_price", render: (item: Product) => item.discount_price ? `$${item.discount_price.toFixed(2)}` : "-" },
    { key: "stock_quantity", render: (item: Product) => item.stock_quantity },
    { key: "additional_images", render: (item: Product) => item.additional_images.length },
    {
      key: "description",
      render: (item: Product) => (
        <div className="flex items-center gap-2">
          <span className="truncate max-w-[150px]">{item.description || "-"}</span>
          {item.description && (
            <Button variant="ghost" size="sm" onClick={() => onView(item)}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
    {
      key: "specifications",
      render: (item: Product) => (
        <div className="flex items-center gap-2">
          <span className="truncate max-w-[150px]">
            {item.specifications ? JSON.stringify(item.specifications).slice(0, 20) + "..." : "-"}
          </span>
          {item.specifications && (
            <Button variant="ghost" size="sm" onClick={() => onView(item)}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
    {
      key: "is_featured",
      render: (item: Product) => item.is_featured ? (
        <Badge variant="default" className="bg-blue-100 text-blue-800">Yes</Badge>
      ) : "-",
    },
    {
      key: "is_best_selling",
      render: (item: Product) => item.is_best_selling ? (
        <Badge variant="default" className="bg-purple-100 text-purple-800">Yes</Badge>
      ) : "-",
    },
    { key: "status", render: (item: Product) => getStatusBadge(item.status) },
  ];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Main Image</TableHead>
          {tableHeadings.map((heading) => (
            <TableHead key={heading}>{heading}</TableHead>
          ))}
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="">
              <Image
                src={item.main_image_url || "/placeholder.svg"}
                alt={item.title}
                width={64}
                height={64}
                className="rounded-md object-cover"
              />
            </TableCell>
            {tableColumns.map((col) => (
              <TableCell key={col.key} className="border">{col.render(item)}</TableCell>
            ))}
            <TableCell className="text-right ">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {hasPermission("manage_inventory") && (
                    <>
                      <DropdownMenuItem onClick={() => onEdit(item)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onManageImages(item)}>
                        <ImageIcon className="mr-2 h-4 w-4" /> Manage Images
                      </DropdownMenuItem>
                    </>
                  )}
                  {hasPermission("delete_products") && (
                    <DropdownMenuItem className="text-red-600" onClick={() => onDelete(item.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function InventoryManagement() {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [, setIsImageDialogOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [imageProduct, setImageProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const pageSize = 10;
  const { hasPermission } = useAuth();

  const initialFormData: FormData = {
    title: "",
    slug: "",
    category_id: "",
    brand_id: "",
    price: "",
    discount_price: "",
    stock_quantity: "",
    description: "",
    specifications: "",
    is_featured: false,
    is_best_selling: false,
    main_image: null,
    main_image_preview: "",
    additional_images: [],
    additional_previews: [],
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);

  async function fetchInitialData() {
    setIsLoading(true);
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name");
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData);

      const { data: brandsData, error: brandsError } = await supabase
        .from("brands")
        .select("id, name");
      if (brandsError) throw brandsError;
      setBrands(brandsData);

      await fetchProducts(1);
    } catch (error: any) {
      console.error("fetchInitialData error:", error);
      toast.error("Error", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchProducts(pageNum: number) {
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
          specifications,
          is_featured,
          is_best_selling,
          category_id,
          brand_id,
          categories (name),
          brands (name),
          product_images (id, image_url)
        `,
          { count: "exact" }
        )
        .range((pageNum - 1) * pageSize, pageNum * pageSize - 1)
        .order("id", { ascending: true });

      if (productsError) throw productsError;

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
        specifications: product.specifications || null,
        is_featured: product.is_featured || false,
        is_best_selling: product.is_best_selling || false,
        status:
          product.stock_quantity <= 0
            ? "Out of Stock"
            : product.stock_quantity < 10
            ? "Low Stock"
            : "In Stock",
        additional_images: product.product_images || [],
      }));

      setInventory(formattedProducts);
      setTotalPages(Math.ceil((count || 0) / pageSize));
    } catch (error: any) {
      console.error("fetchProducts error:", error);
      toast.error("Error", { description: error.message });
    }
  }

  async function handleDeleteItem(id: string) {
    try {
      // Images are deleted automatically via ON DELETE CASCADE in product_images
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      setInventory(inventory.filter((item) => item.id !== id));
      toast.success("Success", { description: "Product deleted successfully" });
    } catch (error: any) {
      console.error("handleDeleteItem error:", error);
      toast.error("Error", { description: error.message });
    }
  }

  async function handleFormSubmit(data: FormData, id?: string) {
    try {
      console.log("handleFormSubmit called with data:", data, "id:", id);
      toast.info("Debug: Submitting product data");
      const oldMainImageKey = id ? inventory.find((p) => p.id === id)?.main_image_url?.split("/").pop() : null;
      const main_image_url = data.main_image ? await uploadImageToS3(data.main_image, oldMainImageKey) : id ? inventory.find((p) => p.id === id)?.main_image_url : null;

      const productData = {
        title: data.title,
        slug: data.slug,
        category_id: data.category_id,
        brand_id: data.brand_id,
        price: parseFloat(data.price),
        discount_price: data.discount_price ? parseFloat(data.discount_price) : null,
        stock_quantity: parseInt(data.stock_quantity),
        description: data.description,
        specifications: data.specifications ? JSON.parse(data.specifications) : null,
        is_featured: data.is_featured,
        is_best_selling: data.is_best_selling,
        main_image_url,
      };

      let productId = id;
      if (id) {
        const { error } = await supabase.from("products").update(productData).eq("id", id);
        if (error) throw error;
      } else {
        const { data: newProduct, error } = await supabase.from("products").insert(productData).select("id").single();
        if (error) throw error;
        productId = newProduct.id;
      }

      // Save additional images
      if (data.additional_images.length > 0 && productId) {
        const uploadedImages = await Promise.all(
          data.additional_images.map(async (image) => ({
            product_id: productId,
            image_url: await uploadImageToS3(image),
          }))
        );
        const { error } = await supabase.from("product_images").insert(uploadedImages);
        if (error) throw error;
      }

      setPage(1);
      await fetchProducts(1);
      setFormData(initialFormData);
      setEditProductId(null);
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      toast.success("Success", { description: `Product ${id ? "updated" : "added"} successfully` });

      // Open image management modal for new products
      if (!id && productId) {
        const newProduct = {
          ...productData,
          id: productId,
          category_name: categories.find((c) => c.id === data.category_id)?.name || "Uncategorized",
          brand_name: brands.find((b) => b.id === data.brand_id)?.name || "Unbranded",
          status: parseInt(data.stock_quantity) <= 0 ? "Out of Stock" : parseInt(data.stock_quantity) < 10 ? "Low Stock" : "In Stock",
          additional_images: [],
        };
        setImageProduct(newProduct as Product);
        setIsImageDialogOpen(true);
      }
    } catch (error: any) {
      console.error("handleFormSubmit error:", error);
      toast.error("Error", { description: error.message });
    }
  }

  async function handleImageSave(productId: string, mainImageUrl: string | null, newImages: { id: string; image_url: string }[]) {
    try {
      // Update main image in products table
      const { error: updateError } = await supabase
        .from("products")
        .update({ main_image_url: mainImageUrl })
        .eq("id", productId);
      if (updateError) throw updateError;

      // Fetch existing images
      const { data: existingImages, error: fetchError } = await supabase
        .from("product_images")
        .select("id, image_url")
        .eq("product_id", productId);
      if (fetchError) throw fetchError;

      // Delete removed images from S3 and Supabase
      const imagesToDelete = existingImages.filter(
        (existing) => !newImages.some((newImage) => newImage.id === existing.id)
      );
      for (const image of imagesToDelete) {
        const key = image.image_url.split("/").pop();
        if (key) {
          await uploadImageToS3(new File([], "dummy"), key); // Trigger deletion
        }
      }
      const { error: deleteError } = await supabase
        .from("product_images")
        .delete()
        .eq("product_id", productId)
        .in("id", imagesToDelete.map((img) => img.id));
      if (deleteError) throw deleteError;

      // Insert new images
      if (newImages.length > 0) {
        const { error: insertError } = await supabase
          .from("product_images")
          .insert(newImages.map((img) => ({ id: img.id, product_id: productId, image_url: img.image_url })));
        if (insertError) throw insertError;
      }

      await fetchProducts(page);
      toast.success("Success", { description: "Images updated successfully" });
    } catch (error: any) {
      console.error("handleImageSave error:", error);
      toast.error("Error", { description: error.message });
    }
  }

  function openEditDialog(product: Product) {
    setFormData({
      title: product.title,
      slug: product.slug,
      category_id: product.category_id,
      brand_id: product.brand_id,
      price: product.price.toString(),
      discount_price: product.discount_price?.toString() || "",
      stock_quantity: product.stock_quantity.toString(),
      description: product.description || "",
      specifications: product.specifications ? JSON.stringify(product.specifications, null, 2) : "",
      is_featured: product.is_featured,
      is_best_selling: product.is_best_selling,
      main_image: null,
      main_image_preview: product.main_image_url || "",
      additional_images: [],
      additional_previews: product.additional_images.map((img) => img.image_url),
    });
    setEditProductId(product.id);
    setIsEditDialogOpen(true);
  }

  function openViewDialog(product: Product) {
    setViewProduct(product);
    setIsViewDialogOpen(true);
  }

  function openImageDialog(product: Product) {
    setImageProduct(product);
    setIsImageDialogOpen(true);
  }

  function handlePageChange(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }

  useEffect(() => {
    fetchInitialData();

    const brandsSubscription = supabase
      .channel("brands_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brands" },
        async () => {
          const { data, error } = await supabase.from("brands").select("id, name");
          if (error) {
            console.error("brandsSubscription error:", error);
            toast.error("Error", { description: error.message });
            return;
          }
          setBrands(data);
        }
      )
      .subscribe();

    const categoriesSubscription = supabase
      .channel("categories_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        async () => {
          const { data, error } = await supabase.from("categories").select("id, name");
          if (error) {
            console.error("categoriesSubscription error:", error);
            toast.error("Error", { description: error.message });
            return;
          }
          setCategories(data);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(brandsSubscription);
      supabase.removeChannel(categoriesSubscription);
    };
  }, []);

  useEffect(() => {
    fetchProducts(page);
  }, [page]);

  const filteredInventory = inventory.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Toaster />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
          <p className="text-muted-foreground">Manage your product inventory and stock levels</p>
        </div>
        {hasPermission("manage_inventory") && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>Add a new product to your inventory. Fill in all required fields.</DialogDescription>
              </DialogHeader>
              <ProductForm
                initialData={initialFormData}
                categories={categories}
                brands={brands}
                onSubmit={handleFormSubmit}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {hasPermission("manage_inventory") && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>Update the product details. Fill in all required fields.</DialogDescription>
            </DialogHeader>
            <ProductForm
              initialData={formData}
              categories={categories}
              brands={brands}
              onSubmit={(data) => handleFormSubmit(data, editProductId!)}
              onCancel={() => {
                setFormData(initialFormData);
                setEditProductId(null);
                setIsEditDialogOpen(false);
              }}
              isEdit
            />
          </DialogContent>
        </Dialog>
      )}

      {viewProduct && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{viewProduct.title} - Details</DialogTitle>
              <DialogDescription>Detailed description and specifications of the product.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="prose max-w-none">
                <h3>Description</h3>
                <ReactMarkdown>{viewProduct.description || "No description available."}</ReactMarkdown>
              </div>
              <div>
                <h3>Specifications</h3>
                {viewProduct.specifications ? (
                  <ul>
                    {Object.entries(viewProduct.specifications).map(([key, value]) => (
                      <li key={key}><strong>{key}:</strong> {value}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No specifications available.</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {hasPermission("manage_inventory") && (
        <ImageManagementModal
          product={imageProduct}
          onClose={() => {
            setImageProduct(null);
            setIsImageDialogOpen(false);
          }}
          onSave={handleImageSave}
        />
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
            <div className="text-2xl font-bold">{inventory.filter((item) => item.status === "Out of Stock").length}</div>
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
          <ProductTable
            products={filteredInventory}
            onEdit={openEditDialog}
            onView={openViewDialog}
            onDelete={handleDeleteItem}
            onManageImages={openImageDialog}
            hasPermission={hasPermission}
          />
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
  );
}