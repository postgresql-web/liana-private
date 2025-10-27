"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { BuildingIcon, EyeIcon, PencilIcon, TrashIcon, HomeIcon, BedIcon, SquareIcon } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import type { Property } from "@/lib/data-store"

interface PropertyListProps {
  filters: {
    search: string
    status: string
    rooms: string
    district: string
    minPrice?: string
    maxPrice?: string
    minArea?: string
    maxArea?: string
  }
  viewMode: "standard" | "large"
}

export function PropertyList({ filters, viewMode }: PropertyListProps) {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadProperties()
  }, [])

  const loadProperties = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/objects")
      const data = await response.json()
      setProperties(data)
    } catch (error) {
      console.error("[v0] Load properties error:", error)
      toast.error("Помилка завантаження об'єктів")
    } finally {
      setLoading(false)
    }
  }

  const filteredProperties = properties.filter((property) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch =
        property.address.toLowerCase().includes(searchLower) ||
        property.id.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }

    if (filters.status !== "all" && property.status !== filters.status) {
      return false
    }

    if (filters.rooms !== "all") {
      const roomsFilter = filters.rooms === "4" ? 4 : Number(filters.rooms)
      if (filters.rooms === "4") {
        if (!property.rooms || property.rooms < 4) return false
      } else if (property.rooms !== roomsFilter) {
        return false
      }
    }

    if (filters.minPrice && Number(property.price) < Number(filters.minPrice)) {
      return false
    }

    if (filters.maxPrice && Number(property.price) > Number(filters.maxPrice)) {
      return false
    }

    if (filters.minArea && Number(property.area) < Number(filters.minArea)) {
      return false
    }

    if (filters.maxArea && Number(property.area) > Number(filters.maxArea)) {
      return false
    }

    return true
  })

  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProperties = filteredProperties.slice(startIndex, startIndex + itemsPerPage)

  const handleDelete = async (propertyId: string) => {
    if (!confirm("Ви впевнені, що хочете видалити цей об'єкт?")) return

    try {
      const response = await fetch(`/api/objects/${propertyId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Об'єкт успішно видалено")
        loadProperties()
      } else {
        toast.error("Помилка при видаленні об'єкта")
      }
    } catch (error) {
      console.error("[v0] Delete error:", error)
      toast.error("Помилка при видаленні об'єкта")
    }
  }

  if (loading) {
    return <Card className="p-8 text-center">Завантаження...</Card>
  }

  if (filteredProperties.length === 0) {
    return (
      <Card>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BuildingIcon />
            </EmptyMedia>
            <EmptyTitle>Об'єкти не знайдено</EmptyTitle>
            <EmptyDescription>Спробуйте змінити параметри фільтрації або додайте новий об'єкт</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href="/objects/new">
              <Button>Додати об'єкт</Button>
            </Link>
          </EmptyContent>
        </Empty>
      </Card>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge variant="default" className="bg-green-600">Доступна</Badge>
      case "reserved":
        return <Badge variant="secondary" className="bg-yellow-600 text-white">Зарезервована</Badge>
      case "sold":
        return <Badge variant="outline" className="bg-slate-500 text-white">Продана</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency: "UAH",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getMainPhoto = (property: Property) => {
    if (!property.photos || property.photos.length === 0) {
      return "/modern-city-apartment.png"
    }
    const mainIndex = (property as any).mainPhotoIndex || 0
    return property.photos[mainIndex] || property.photos[0]
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {paginatedProperties.map((property) => (
          <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="relative w-full md:w-64 h-48 overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={getMainPhoto(property) || "/placeholder.svg"}
                    alt={property.address}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/modern-city-apartment.png"
                    }}
                  />
                  <div className="absolute top-2 right-2">{getStatusBadge(property.status)}</div>
                </div>

                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-semibold">{property.address}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">ID: {property.id}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-emerald-600">{formatPrice(property.price)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <SquareIcon className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Площа</p>
                        <p className="font-semibold">{property.area} м²</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BedIcon className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Кімнати</p>
                        <p className="font-semibold">{property.rooms || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <HomeIcon className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Поверх</p>
                        <p className="font-semibold">
                          {property.floor && property.totalFloors
                            ? `${property.floor} / ${property.totalFloors}`
                            : property.floor || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <HomeIcon className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Тип</p>
                        <p className="font-semibold">
                          {property.type === "apartment" ? "Квартира" : "Будинок"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {property.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{property.description}</p>
                  )}

                  {property.owner && (
                    <div className="mb-4 pb-4 border-b">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <span className="text-sm text-muted-foreground">Власник:</span>
                          <p className="font-medium">{property.owner}</p>
                        </div>
                        {property.ownerPhone && (
                          <div>
                            <span className="text-sm text-muted-foreground">Телефон:</span>
                            <p className="font-medium">{property.ownerPhone}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link href={`/objects/${property.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <EyeIcon className="size-4 mr-2" />
                        Переглянути
                      </Button>
                    </Link>
                    <Link href={`/objects/${property.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <PencilIcon className="size-4 mr-2" />
                        Редагувати
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(property.id)}>
                      <TrashIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <div className="text-sm text-muted-foreground text-center">
        Показано {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredProperties.length)} з{" "}
        {filteredProperties.length} об'єктів
      </div>
    </div>
  )
}
