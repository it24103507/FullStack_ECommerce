import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    RefreshControl,
    Image,
    Alert,
    TextInput,
    Modal,
    FlatList,
    TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { COLORS, CATEGORIES } from "@/constants";
import { productService } from "@/services/productService";

interface Product {
    _id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    sizes?: string[];
    category: string;
    stock: number;
    isFeatured: boolean;
    isActive: boolean;
    createdAt: string;
}

interface Stats {
    total: number;
    active: number;
    inactive: number;
    featured: number;
    lowStock: number;
    outOfStock: number;
}

export default function AdminProducts() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all"); // all, active, inactive

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

    const fetchProducts = async (page: number = 1, applyFilters: boolean = true) => {
        try {
            const filters: any = {
                sort: sortBy,
                order: sortOrder,
            };

            if (searchQuery) filters.search = searchQuery;
            if (selectedCategory !== "All") filters.category = selectedCategory;
            if (statusFilter !== "all") {
                filters.isActive = statusFilter === "active";
            }

            const response = await productService.getProducts(filters, {
                page,
                limit: pageSize,
            });

            if (response.success && response.data) {
                setProducts(response.data);
                setFilteredProducts(response.data);
                if (response.pagination) {
                    setTotalPages(response.pagination.pages);
                }
            } else {
                Toast.show({
                    type: "error",
                    text1: "Error",
                    text2: response.message || "Failed to fetch products",
                });
            }
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to fetch products",
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await productService.getProductStats();
            if (response.success && response.data) {
                setStats(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        }
    };

    useEffect(() => {
        fetchProducts(1, true);
        fetchStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        setCurrentPage(1);
        fetchProducts(1, true);
        fetchStats();
    };

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        setCurrentPage(1);
    };

    const handleDeleteProduct = async (id: string, name: string) => {
        Alert.alert("Delete Product", `Are you sure you want to delete "${name}"?`, [
            { text: "Cancel", style: "cancel" as const },
            {
                text: "Delete",
                style: "destructive" as const,
                onPress: async () => {
                    try {
                        const response = await productService.deleteProduct(id);
                        if (response.success) {
                            Toast.show({
                                type: "success",
                                text1: "Success",
                                text2: "Product deleted successfully",
                            });
                            fetchProducts(currentPage, true);
                            fetchStats();
                        } else {
                            Toast.show({
                                type: "error",
                                text1: "Error",
                                text2: response.message || "Failed to delete product",
                            });
                        }
                    } catch (error: any) {
                        Toast.show({
                            type: "error",
                            text1: "Error",
                            text2: "Failed to delete product",
                        });
                    }
                },
            },
        ]);
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const response = await productService.toggleProductStatus(id);
            if (response.success) {
                Toast.show({
                    type: "success",
                    text1: "Success",
                    text2: response.message || "Status updated successfully",
                });
                fetchProducts(currentPage, true);
                fetchStats();
            } else {
                Toast.show({
                    type: "error",
                    text1: "Error",
                    text2: response.message || "Failed to update status",
                });
            }
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to update status",
            });
        }
    };

    const handleToggleFeatured = async (id: string) => {
        try {
            const response = await productService.toggleFeaturedStatus(id);
            if (response.success) {
                Toast.show({
                    type: "success",
                    text1: "Success",
                    text2: response.message || "Featured status updated",
                });
                fetchProducts(currentPage, true);
            } else {
                Toast.show({
                    type: "error",
                    text1: "Error",
                    text2: response.message || "Failed to update featured status",
                });
            }
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to update featured status",
            });
        }
    };

    const getStockStatus = (stock: number) => {
        if (stock === 0) return { text: "Out of Stock", color: "#FF4444" };
        if (stock < 10) return { text: `Low (${stock})`, color: "#FFA500" };
        return { text: `In Stock (${stock})`, color: "#4CAF50" };
    };

    if (loading && !refreshing) {
        return (
            <View className="flex-1 justify-center items-center bg-surface">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-surface">
            {/* Header */}
            <View className="bg-white border-b border-gray-100 p-4">
                <View className="mb-4">
                    <Text className="text-xl font-bold text-primary">Product Management</Text>
                    {stats && (
                        <Text className="text-sm text-secondary mt-1">
                            Total: {stats.total} | Active: {stats.active} | Featured: {stats.featured}
                        </Text>
                    )}
                </View>

                {/* Search and Action Buttons */}
                <View className="flex-row gap-2 mb-3">
                    <View className="flex-1 bg-surface rounded-lg flex-row items-center px-3">
                        <Ionicons name="search" size={18} color={COLORS.secondary} />
                        <TextInput
                            className="flex-1 ml-2 py-2 text-primary"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChangeText={handleSearch}
                            placeholderTextColor={COLORS.secondary}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={() => setFilterModalVisible(true)}
                        className="bg-gray-100 px-3 py-2 rounded-lg justify-center"
                    >
                        <Ionicons name="funnel" size={20} color={COLORS.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push("/admin/products/add")}
                        className="bg-primary px-4 py-2 rounded-lg flex-row items-center"
                    >
                        <Ionicons name="add" size={20} color="white" />
                        <Text className="text-white font-medium ml-1 text-xs">Add</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Bar */}
                {stats && (
                    <View className="flex-row gap-2 mb-3">
                        <View className="flex-1 bg-red-50 rounded p-2">
                            <Text className="text-xs text-red-900 font-semibold">{stats.outOfStock}</Text>
                            <Text className="text-xs text-red-700">Out of Stock</Text>
                        </View>
                        <View className="flex-1 bg-yellow-50 rounded p-2">
                            <Text className="text-xs text-yellow-900 font-semibold">{stats.lowStock}</Text>
                            <Text className="text-xs text-yellow-700">Low Stock</Text>
                        </View>
                        <View className="flex-1 bg-green-50 rounded p-2">
                            <Text className="text-xs text-green-900 font-semibold">{stats.inactive}</Text>
                            <Text className="text-xs text-green-700">Inactive</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Filter Modal */}
            <Modal
                visible={filterModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)}>
                    <View className="flex-1 justify-end bg-black/50">
                        <View className="bg-white rounded-t-2xl p-4 max-h-[60%]">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-lg font-bold text-primary">Filters</Text>
                                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                                    <Ionicons name="close" size={24} color={COLORS.primary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Category Filter */}
                                <View className="mb-4">
                                    <Text className="font-semibold text-primary mb-2">Category</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
                                        {["All", ...CATEGORIES.map((c) => c.name)].map((cat) => (
                                            <TouchableOpacity
                                                key={cat}
                                                onPress={() => {
                                                    setSelectedCategory(cat);
                                                    setCurrentPage(1);
                                                }}
                                                className={`px-4 py-2 rounded-full ${
                                                    selectedCategory === cat ? "bg-primary" : "bg-gray-100"
                                                }`}
                                            >
                                                <Text
                                                    className={`text-sm font-medium ${
                                                        selectedCategory === cat ? "text-white" : "text-primary"
                                                    }`}
                                                >
                                                    {cat}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                {/* Status Filter */}
                                <View className="mb-4">
                                    <Text className="font-semibold text-primary mb-2">Status</Text>
                                    <View className="gap-2">
                                        {["all", "active", "inactive"].map((status) => (
                                            <TouchableOpacity
                                                key={status}
                                                onPress={() => {
                                                    setStatusFilter(status);
                                                    setCurrentPage(1);
                                                }}
                                                className={`p-3 rounded-lg border ${
                                                    statusFilter === status
                                                        ? "bg-primary border-primary"
                                                        : "border-gray-200"
                                                }`}
                                            >
                                                <Text
                                                    className={`capitalize font-medium ${
                                                        statusFilter === status ? "text-white" : "text-primary"
                                                    }`}
                                                >
                                                    {status === "all"
                                                        ? "All Products"
                                                        : status === "active"
                                                          ? "Active Only"
                                                          : "Inactive Only"}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Sort Options */}
                                <View className="mb-4">
                                    <Text className="font-semibold text-primary mb-2">Sort By</Text>
                                    <View className="gap-2">
                                        {[
                                            { value: "createdAt", label: "Newest" },
                                            { value: "name", label: "Name" },
                                            { value: "price", label: "Price" },
                                            { value: "stock", label: "Stock" },
                                        ].map((sort) => (
                                            <TouchableOpacity
                                                key={sort.value}
                                                onPress={() => {
                                                    setSortBy(sort.value);
                                                    setCurrentPage(1);
                                                }}
                                                className={`p-3 rounded-lg border ${
                                                    sortBy === sort.value
                                                        ? "bg-primary border-primary"
                                                        : "border-gray-200"
                                                }`}
                                            >
                                                <Text
                                                    className={`font-medium ${
                                                        sortBy === sort.value ? "text-white" : "text-primary"
                                                    }`}
                                                >
                                                    {sort.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Sort Order */}
                                <View className="mb-4">
                                    <Text className="font-semibold text-primary mb-2">Order</Text>
                                    <View className="flex-row gap-2">
                                        {[
                                            { value: "asc", label: "Ascending" },
                                            { value: "desc", label: "Descending" },
                                        ].map((order) => (
                                            <TouchableOpacity
                                                key={order.value}
                                                onPress={() => {
                                                    setSortOrder(order.value as "asc" | "desc");
                                                    setCurrentPage(1);
                                                }}
                                                className={`flex-1 p-3 rounded-lg border ${
                                                    sortOrder === order.value
                                                        ? "bg-primary border-primary"
                                                        : "border-gray-200"
                                                }`}
                                            >
                                                <Text
                                                    className={`text-center font-medium ${
                                                        sortOrder === order.value ? "text-white" : "text-primary"
                                                    }`}
                                                >
                                                    {order.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Apply Filters Button */}
                                <TouchableOpacity
                                    onPress={() => {
                                        fetchProducts(1, true);
                                        setFilterModalVisible(false);
                                    }}
                                    className="bg-primary p-3 rounded-lg mt-4"
                                >
                                    <Text className="text-white text-center font-semibold">Apply Filters</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Products List */}
            <ScrollView
                className="flex-1 p-2"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {filteredProducts.length === 0 ? (
                    <View className="flex-1 justify-center items-center mt-20">
                        <Ionicons name="layers-outline" size={48} color={COLORS.secondary} />
                        <Text className="text-secondary mt-4 text-center">No products found</Text>
                        <Text className="text-secondary text-xs mt-2 text-center px-8">
                            Try adjusting your filters or create a new product
                        </Text>
                    </View>
                ) : (
                    <View className="gap-2">
                        {filteredProducts.map((product) => {
                            const stockStatus = getStockStatus(product.stock);
                            return (
                                <View
                                    key={product._id}
                                    className={`bg-white p-3 rounded-lg border border-gray-100 flex-row items-start gap-3 ${
                                        !product.isActive ? "opacity-60" : ""
                                    }`}
                                >
                                    {/* Product Image */}
                                    <Image
                                        source={{
                                            uri:
                                                product.images && product.images.length > 0
                                                    ? product.images[0]
                                                    : "https://via.placeholder.com/80",
                                        }}
                                        className="w-20 h-20 rounded-lg bg-gray-100"
                                        resizeMode="cover"
                                    />

                                    {/* Product Info */}
                                    <View className="flex-1">
                                        <View className="flex-row items-start justify-between mb-1">
                                            <Text className="font-bold text-primary text-sm flex-1" numberOfLines={2}>
                                                {product.name}
                                            </Text>
                                            {product.isFeatured && (
                                                <View className="bg-yellow-100 px-2 py-1 rounded ml-2">
                                                    <Text className="text-yellow-800 text-xs font-semibold">
                                                        Featured
                                                    </Text>
                                                </View>
                                            )}
                                        </View>

                                        <Text className="text-secondary text-xs mb-1" numberOfLines={1}>
                                            {product.category}
                                        </Text>

                                        <View className="flex-row items-center justify-between mb-2">
                                            <Text className="text-primary font-bold text-sm">
                                                ${product.price.toFixed(2)}
                                            </Text>
                                            <Text style={{ color: stockStatus.color }} className="text-xs font-semibold">
                                                {stockStatus.text}
                                            </Text>
                                        </View>

                                        {/* Status Badge */}
                                        <View className="flex-row items-center gap-1">
                                            <View
                                                className={`px-2 py-1 rounded ${
                                                    product.isActive
                                                        ? "bg-green-100"
                                                        : "bg-red-100"
                                                }`}
                                            >
                                                <Text
                                                    className={`text-xs font-semibold ${
                                                        product.isActive
                                                            ? "text-green-800"
                                                            : "text-red-800"
                                                    }`}
                                                >
                                                    {product.isActive ? "Active" : "Inactive"}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Action Buttons */}
                                    <View className="flex-row gap-1">
                                        <TouchableOpacity
                                            onPress={() =>
                                                router.push(`/admin/products/edit/${product._id}`)
                                            }
                                            className="p-2 bg-blue-50 rounded-full"
                                        >
                                            <Ionicons name="create-outline" size={16} color="#0066cc" />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => handleToggleStatus(product._id, product.isActive)}
                                            className={`p-2 rounded-full ${
                                                product.isActive
                                                    ? "bg-red-50"
                                                    : "bg-green-50"
                                            }`}
                                        >
                                            <Ionicons
                                                name={product.isActive ? "eye-off-outline" : "eye-outline"}
                                                size={16}
                                                color={product.isActive ? "#FF4444" : "#4CAF50"}
                                            />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => handleDeleteProduct(product._id, product.name)}
                                            className="p-2 bg-red-50 rounded-full"
                                        >
                                            <Ionicons name="trash-outline" size={16} color="#FF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <View className="flex-row justify-center items-center gap-2 mt-6 mb-4">
                        <TouchableOpacity
                            disabled={currentPage === 1}
                            onPress={() => {
                                setCurrentPage(currentPage - 1);
                                fetchProducts(currentPage - 1, false);
                            }}
                            className={`px-3 py-2 rounded ${
                                currentPage === 1
                                    ? "bg-gray-100"
                                    : "bg-primary"
                            }`}
                        >
                            <Text className={currentPage === 1 ? "text-gray-400" : "text-white"}>
                                Previous
                            </Text>
                        </TouchableOpacity>

                        <Text className="px-3 py-2 text-primary font-semibold">
                            {currentPage} / {totalPages}
                        </Text>

                        <TouchableOpacity
                            disabled={currentPage === totalPages}
                            onPress={() => {
                                setCurrentPage(currentPage + 1);
                                fetchProducts(currentPage + 1, false);
                            }}
                            className={`px-3 py-2 rounded ${
                                currentPage === totalPages
                                    ? "bg-gray-100"
                                    : "bg-primary"
                            }`}
                        >
                            <Text className={currentPage === totalPages ? "text-gray-400" : "text-white"}>
                                Next
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
