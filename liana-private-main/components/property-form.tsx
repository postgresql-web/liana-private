"use client"

import type React from "react"
import { PropertyNotes } from "@/components/property-notes"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { PlusIcon, XIcon, ImageIcon, TrashIcon, SparklesIcon } from "lucide-react"
import type { Client } from "@/lib/data-store"

interface PropertyFormProps {
  initialData?: {
    id?: string
    address?: string
    type?: string
    status?: string
    price?: number
    area?: number
    rooms?: number
    floor?: number
    totalFloors?: number
    owner?: string
    ownerPhone?: string
    description?: string
    hasFurniture?: boolean
    inventory?: string
    district?: string
    photos?: string[]
    mainPhotoIndex?: number
    notes?: string
    tags?: string[]
  }
}

export function PropertyForm({ initialData }: PropertyFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    id: initialData?.id || "",
    address: initialData?.address || "",
    type: initialData?.type || "apartment",
    status: initialData?.status || "available",
    price: initialData?.price ? initialData.price.toString() : "",
    area: initialData?.area ? initialData.area.toString() : "",
    rooms: initialData?.rooms ? initialData.rooms.toString() : "",
    floor: initialData?.floor ? initialData.floor.toString() : "",
    totalFloors: initialData?.totalFloors ? initialData.totalFloors.toString() : "",
    owner: initialData?.owner || "",
    ownerPhone: initialData?.ownerPhone || "",
    description: initialData?.description || "",
    hasFurniture: initialData?.hasFurniture || false,
    inventory: initialData?.inventory || "",
    district: initialData?.district || "",
  })

  const [inventoryItems, setInventoryItems] = useState<string[]>([])
  const [newInventoryItem, setNewInventoryItem] = useState("")
  const [photos, setPhotos] = useState<string[]>(initialData?.photos || [])
  const [mainPhotoIndex, setMainPhotoIndex] = useState(initialData?.mainPhotoIndex || 0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [notes, setNotes] = useState(initialData?.notes || "")
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])

  useEffect(() => {
    if (formData.inventory) {
      const items = formData.inventory
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
      setInventoryItems(items)
    }
  }, [])

  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await fetch("/api/clients")
        if (response.ok) {
          const data = await response.json()
          setClients(data)
        }
      } catch (error) {
        console.error("[v0] Failed to load clients:", error)
      } finally {
        setLoadingClients(false)
      }
    }
    loadClients()
  }, [])

  const generateUniqueId = () => {
    const timestamp = Date.now().toString().slice(-5)
    const random = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0")
    const uniqueId = `${timestamp}${random}`
    updateField("id", uniqueId)
    toast.success(`Згенеровано ID: ${uniqueId}`)
  }

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addInventoryItem = () => {
    if (newInventoryItem.trim()) {
      setInventoryItems((prev) => [...prev, newInventoryItem.trim()])
      setNewInventoryItem("")
    }
  }

  const removeInventoryItem = (index: number) => {
    setInventoryItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotos((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })

    e.target.value = ""
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    if (mainPhotoIndex === index) {
      setMainPhotoIndex(0)
    } else if (mainPhotoIndex > index) {
      setMainPhotoIndex(mainPhotoIndex - 1)
    }
  }

  const handleOwnerSelect = (clientId: string) => {
    const selectedClient = clients.find((c) => c.id === clientId)
    if (selectedClient) {
      setFormData((prev) => ({
        ...prev,
        owner: selectedClient.name,
        ownerPhone: selectedClient.phone,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.id?.trim()) {
        toast.error("Заповніть ID об'єкта")
        setIsSubmitting(false)
        return
      }

      if (!formData.address?.trim()) {
        toast.error("Заповніть адресу")
        setIsSubmitting(false)
        return
      }

      if (!formData.price?.trim() || Number(formData.price) <= 0) {
        toast.error("Заповніть коректну ціну")
        setIsSubmitting(false)
        return
      }

      if (!formData.area?.trim() || Number(formData.area) <= 0) {
        toast.error("Заповніть коректну площу")
        setIsSubmitting(false)
        return
      }

      if (formData.status !== "available") {
        if (!formData.owner?.trim()) {
          toast.error("Заповніть ПІБ власника")
          setIsSubmitting(false)
          return
        }

        if (!formData.ownerPhone?.trim()) {
          toast.error("Заповніть телефон власника")
          setIsSubmitting(false)
          return
        }
      }

      const url = initialData?.id ? `/api/objects/${initialData.id}` : "/api/objects"

      const inventoryString = inventoryItems.join(", ")

      const response = await fetch(url, {
        method: initialData?.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: formData.id.trim(),
          address: formData.address.trim(),
          type: formData.type,
          status: formData.status,
          price: Number(formData.price),
          area: Number(formData.area),
          rooms: formData.rooms ? Number(formData.rooms) : undefined,
          floor: formData.floor ? Number(formData.floor) : undefined,
          totalFloors: formData.totalFloors ? Number(formData.totalFloors) : undefined,
          owner: formData.status !== "available" ? formData.owner.trim() : undefined,
          ownerPhone: formData.status !== "available" ? formData.ownerPhone.trim() : undefined,
          description: formData.description.trim() || undefined,
          hasFurniture: formData.hasFurniture,
          inventory: inventoryString || undefined,
          district: formData.district.trim() || undefined,
          photos: photos.length > 0 ? photos : undefined,
          mainPhotoIndex: mainPhotoIndex,
          notes: notes.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(initialData?.id ? "Об'єкт успішно оновлено" : "Об'єкт успішно створено")
        router.push("/objects")
        router.refresh()
      } else {
        toast.error(data.error || "Помилка при збереженні об'єкта")
      }
    } catch (error) {
      console.error("[v0] Submit error:", error)
      toast.error("Помилка підключення до сервера")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Основна інформація</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="id">
              ID об'єкта <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="id"
                placeholder="10001"
                value={formData.id}
                onChange={(e) => updateField("id", e.target.value)}
                required
                disabled={!!initialData?.id}
                className="flex-1"
              />
              {!initialData?.id && (
                <Button type="button" variant="outline" onClick={generateUniqueId} className="shrink-0 bg-transparent">
                  <SparklesIcon className="size-4 mr-2" />
                  Згенерувати
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">7-значний номер об'єкта</p>
          </div>

          <div>
            <Label htmlFor="address">
              Адреса <span className="text-destructive">*</span>
            </Label>
            <Input
              id="address"
              placeholder="вул. Соборна, буд. 45, кв. 12, Миколаїв"
              value={formData.address}
              onChange={(e) => updateField("address", e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="district">Район</Label>
            <Input
              id="district"
              placeholder="Центральний"
              value={formData.district}
              onChange={(e) => updateField("district", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">
                Тип <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.type} onValueChange={(value) => updateField("type", value)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Квартира</SelectItem>
                  <SelectItem value="house">Будинок</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">
                Статус <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.status} onValueChange={(value) => updateField("status", value)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Доступна</SelectItem>
                  <SelectItem value="reserved">Зарезервована</SelectItem>
                  <SelectItem value="sold">Продана</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">"Доступна" - клієнтів на квартиру поки немає</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">
                Ціна (₴) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                placeholder="1650000"
                value={formData.price}
                onChange={(e) => updateField("price", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="area">
                Площа (м²) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="area"
                type="number"
                step="0.01"
                placeholder="65"
                value={formData.area}
                onChange={(e) => updateField("area", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="rooms">Кількість кімнат</Label>
              <Input
                id="rooms"
                type="number"
                placeholder="2"
                value={formData.rooms}
                onChange={(e) => updateField("rooms", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="floor">Поверх</Label>
              <Input
                id="floor"
                type="number"
                placeholder="5"
                value={formData.floor}
                onChange={(e) => updateField("floor", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="totalFloors">Всього поверхів</Label>
              <Input
                id="totalFloors"
                type="number"
                placeholder="9"
                value={formData.totalFloors}
                onChange={(e) => updateField("totalFloors", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Опис</Label>
            <Textarea
              id="description"
              placeholder="Затишна двокімнатна квартира в центрі міста..."
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Фотографії</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Завантажити фотографії</Label>
            <p className="text-xs text-muted-foreground mb-3">
              Додайте фотографії об'єкта. Можна завантажити декілька зображень.
            </p>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                    <img
                      src={photo || "/placeholder.svg"}
                      alt={`Фото ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={mainPhotoIndex === index ? "default" : "secondary"}
                        onClick={() => setMainPhotoIndex(index)}
                        className="h-7 text-xs"
                      >
                        {mainPhotoIndex === index ? "Головна" : "Зробити головною"}
                      </Button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <TrashIcon className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label htmlFor="photo-upload">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
                <ImageIcon className="size-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Натисніть для завантаження фотографій</p>
              </div>
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Мебель і комплектація</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="hasFurniture"
              checked={formData.hasFurniture}
              onCheckedChange={(checked) => updateField("hasFurniture", checked)}
            />
            <Label htmlFor="hasFurniture" className="cursor-pointer">
              {formData.hasFurniture ? "Є мебель" : "Немає мебелі"}
            </Label>
          </div>

          <div>
            <Label>Що є в квартирі</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Додайте предмети мебелі, техніку і інші елементи комплектації
            </p>

            {inventoryItems.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 p-3 bg-muted/50 rounded-lg">
                {inventoryItems.map((item, index) => (
                  <Badge key={index} variant="secondary" className="text-sm py-1.5 px-3">
                    {item}
                    <button
                      type="button"
                      onClick={() => removeInventoryItem(index)}
                      className="ml-2 hover:text-destructive"
                    >
                      <XIcon className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                placeholder="Наприклад: Холодильник, Стиральна машина, Кондиціонер..."
                value={newInventoryItem}
                onChange={(e) => setNewInventoryItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addInventoryItem()
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addInventoryItem}>
                <PlusIcon className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {formData.status !== "available" && (
        <Card>
          <CardHeader>
            <CardTitle>Власник</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!loadingClients && clients.length > 0 && (
              <div>
                <Label htmlFor="clientSelect">Виберіть із існуючих клієнтів</Label>
                <Select onValueChange={handleOwnerSelect}>
                  <SelectTrigger id="clientSelect">
                    <SelectValue placeholder="Виберіть клієнта..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} ({client.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">або заповніть дані вручну нижче</p>
              </div>
            )}

            <div>
              <Label htmlFor="owner">
                ПІБ власника <span className="text-destructive">*</span>
              </Label>
              <Input
                id="owner"
                placeholder="Іванов І.І."
                value={formData.owner}
                onChange={(e) => updateField("owner", e.target.value)}
                required={formData.status !== "available"}
              />
            </div>

            <div>
              <Label htmlFor="ownerPhone">
                Телефон власника <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ownerPhone"
                type="tel"
                placeholder="+380 (99) 123-45-67"
                value={formData.ownerPhone}
                onChange={(e) => updateField("ownerPhone", e.target.value)}
                required={formData.status !== "available"}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <PropertyNotes notes={notes} tags={tags} onNotesChange={setNotes} onTagsChange={setTags} />

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.push("/objects")} disabled={isSubmitting}>
          Відмінити
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Збереження..." : initialData?.id ? "Зберегти зміни" : "Створити об'єкт"}
        </Button>
      </div>
    </form>
  )
}
