import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Switch,
    Image,
    ActivityIndicator,
    Platform,
    Modal,
    FlatList,
    TouchableWithoutFeedback,
    Alert,
} from "react-native";
import Toast from "react-native-toast-message";
import { COLORS, CATEGORIES } from "@/constants";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { productService } from "@/services/productService";

interface Product {
    _id: string;
    name: string;
    description: string;
    price: number;
    comparePrice?: number;
    images: string[];
    sizes?: string[];
    category: string;
    stock: number;
    isFeatured: boolean;
    isActive: boolean;
}

interface FormErrors {
    name?: string;
    description?: string;
    price?: string;
    comparePrice?: string;
    category?: string;
    stock?: string;
    sizes?: string;
}

const SIZES_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];

export default function EditProduct() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [sizesModalVisible, setSizesModalVisible] = useState(false);

    // Form State
    const [product, setProduct] = useState<Product | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [comparePrice, setComparePrice] = useState("");
    const [stock, setStock] = useState("");
    const [category, setCategory] = useState("");
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [isFeatured, setIsFeatured] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [errors, setErrors] = useState<FormErrors>({});

    // Image State
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [newImages, setNewImages] = useState<string[]>([]);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                if (!id || typeof id !== "string") {
                    throw new Error("Invalid product ID");
                }

                const response = await productService.getProduct(id);

                if (response.success && response.data) {
                    const prod = response.data;
                    setProduct(prod);
                    setName(prod.name);
                    setDescription(prod.description || "");
                    setPrice(prod.price.toString());
                    setComparePrice(prod.comparePrice ? prod.comparePrice.toString() : "");
                    setStock(prod.stock.toString());
                    setCategory(prod.category);
                    setIsFeatured(prod.isFeatured);
                    setIsActive(prod.isActive);

                    if (prod.sizes && Array.isArray(prod.sizes)) {
                        setSelectedSizes(prod.sizes);
                    }

                    if (prod.images && Array.isArray(prod.images)) {
                        setExistingImages(prod.images);
                    }
                } else {
                    Toast.show({
                        type: "error",
                        text1: "Error",
                        text2: response.message || "Failed to fetch product",
                    });
                    router.back();
                }
            } catch (error: any) {
                console.error("Failed to fetch product:", error);
                Toast.show({
                    type: "error",
                    text1: "Error",
                    text2: error.message || "Something went wrong",
                });
                router.back();
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchProduct();
    }, [id]);

    const pickImages = async () => {
        try {
            const maxSelectable = 5 - (existingImages.length + newImages.length);
            if (maxSelectable <= 0) {
                Toast.show({
                    type: "error",
                    text1: "Limit Reached",
                    text2: "Maximum 5 images allowed",
                });
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                selectionLimit: maxSelectable,
                quality: 0.8,
            });

            if (!result.canceled) {
                const uris = result.assets.map((asset) => asset.uri);
                setNewImages([...newImages, ...uris]);
            }
        } catch (error) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to pick images",
            });
        }
    };

    const removeExistingImage = (index: number) => {
        const updated = [...existingImages];
        updated.splice(index, 1);
        setExistingImages(updated);
    };

    const removeNewImage = (index: number) => {
        const updated = [...newImages];
        updated.splice(index, 1);
        setNewImages(updated);
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!name.trim() || name.trim().length < 2) {
            newErrors.name = "Product name must be at least 2 characters";
        }

        if (!description.trim() || description.trim().length < 10) {
            newErrors.description = "Description must be at least 10 characters";
        }

        if (!price || isNaN(Number(price)) || Number(price) <= 0) {
            newErrors.price = "Price must be a positive number";
        }

        if (comparePrice && (isNaN(Number(comparePrice)) || Number(comparePrice) <= 0)) {
            newErrors.comparePrice = "Compare price must be a positive number";
        }

        if (comparePrice && Number(comparePrice) <= Number(price)) {
            newErrors.comparePrice = "Compare price must be greater than price";
        }

        if (!stock || isNaN(Number(stock)) || Number(stock) < 0) {
            newErrors.stock = "Stock must be a non-negative number";
        }

        if (!category) {
            newErrors.category = "Category is required";
        }

        if (selectedSizes.length === 0) {
            newErrors.sizes = "At least one size is required";
        }

        if (existingImages.length + newImages.length === 0) {
            newErrors.sizes = "At least one image is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            Toast.show({
                type: "error",
                text1: "Validation Error",
                text2: "Please fix all errors before submitting",
            });
            return;
        }

        if (!id || typeof id !== "string") {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Invalid product ID",
            });
            return;
        }

        setSubmitting(true);

        try {
            const response = await productService.updateProduct(
                id,
                {
                    name: name.trim(),
                    description: description.trim(),
                    price: Number(price),
                    comparePrice: comparePrice ? Number(comparePrice) : undefined,
                    category,
                    stock: Number(stock),
                    sizes: selectedSizes,
                    isFeatured,
                },
                newImages.length > 0 ? newImages : undefined,
                existingImages.length > 0 ? existingImages : undefined
            );

            if (response.success) {
                Toast.show({
                    type: "success",
                    text1: "Success",
                    text2: "Product updated successfully",
                });
                router.push("/admin/products");
            } else {
                Toast.show({
                    type: "error",
                    text1: "Error",
                    text2: response.message || "Failed to update product",
                });
            }
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: error.message || "An error occurred",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const toggleSize = (size: string) => {
        if (selectedSizes.includes(size)) {
            setSelectedSizes(selectedSizes.filter((s) => s !== size));
        } else {
            setSelectedSizes([...selectedSizes, size]);
        }
        setErrors({ ...errors, sizes: undefined });
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-surface">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!product) {
        return (
            <View className="flex-1 justify-center items-center bg-surface">
                <Text className="text-primary text-lg">Product not found</Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-surface p-4" showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="mb-4">
                <TouchableOpacity onPress={() => router.back()} className="mb-2">
                    <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-primary">Edit Product</Text>
                <Text className="text-secondary text-sm mt-1">Update product details</Text>
            </View>

            <View className="bg-white p-4 rounded-xl shadow-sm mb-20">
                {/* STATUS */}
                <View className="mb-6 flex-row justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <View>
                        <Text className="text-secondary text-xs font-bold uppercase">Product Status</Text>
                        <Text className="text-secondary text-xs">
                            {isActive ? "Active" : "Inactive"}
                        </Text>
                    </View>
                    <Switch
                        value={isActive}
                        onValueChange={setIsActive}
                        disabled={submitting}
                        trackColor={{ false: "#ccc", true: COLORS.primary }}
                        thumbColor={isActive ? COLORS.accent : "#f4f3f4"}
                    />
                </View>

                {/* NAME */}
                <View className="mb-4">
                    <Text className="text-secondary text-xs font-bold mb-2 uppercase">Product Name *</Text>
                    <TextInput
                        className={`bg-surface p-3 rounded-lg text-primary ${
                            errors.name ? "border-2 border-red-500" : ""
                        }`}
                        placeholder="e.g. Wireless Headphones"
                        value={name}
                        onChangeText={(text) => {
                            setName(text);
                            if (text.trim().length >= 2) {
                                setErrors({ ...errors, name: undefined });
                            }
                        }}
                        editable={!submitting}
                    />
                    {errors.name && <Text className="text-red-500 text-xs mt-1">{errors.name}</Text>}
                </View>

                {/* DESCRIPTION */}
                <View className="mb-4">
                    <Text className="text-secondary text-xs font-bold mb-2 uppercase">Description *</Text>
                    <TextInput
                        className={`bg-surface p-3 rounded-lg text-primary min-h-[100px] ${
                            errors.description ? "border-2 border-red-500" : ""
                        }`}
                        placeholder="Detailed product description"
                        multiline
                        numberOfLines={5}
                        value={description}
                        onChangeText={(text) => {
                            setDescription(text);
                            if (text.trim().length >= 10) {
                                setErrors({ ...errors, description: undefined });
                            }
                        }}
                        editable={!submitting}
                        textAlignVertical="top"
                    />
                    {errors.description && (
                        <Text className="text-red-500 text-xs mt-1">{errors.description}</Text>
                    )}
                </View>

                {/* PRICE */}
                <View className="mb-4">
                    <Text className="text-secondary text-xs font-bold mb-2 uppercase">Price ($) *</Text>
                    <TextInput
                        className={`bg-surface p-3 rounded-lg text-primary ${
                            errors.price ? "border-2 border-red-500" : ""
                        }`}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        value={price}
                        onChangeText={(text) => {
                            setPrice(text);
                            if (!isNaN(Number(text)) && Number(text) > 0) {
                                setErrors({ ...errors, price: undefined });
                            }
                        }}
                        editable={!submitting}
                    />
                    {errors.price && <Text className="text-red-500 text-xs mt-1">{errors.price}</Text>}
                </View>

                {/* COMPARE PRICE */}
                <View className="mb-4">
                    <Text className="text-secondary text-xs font-bold mb-2 uppercase">
                        Compare At Price ($) <Text className="text-gray-400">(Optional)</Text>
                    </Text>
                    <TextInput
                        className={`bg-surface p-3 rounded-lg text-primary ${
                            errors.comparePrice ? "border-2 border-red-500" : ""
                        }`}
                        placeholder="Original price"
                        keyboardType="decimal-pad"
                        value={comparePrice}
                        onChangeText={(text) => {
                            setComparePrice(text);
                            if (!text || Number(text) > Number(price)) {
                                setErrors({ ...errors, comparePrice: undefined });
                            }
                        }}
                        editable={!submitting}
                    />
                    {errors.comparePrice && (
                        <Text className="text-red-500 text-xs mt-1">{errors.comparePrice}</Text>
                    )}
                </View>

                {/* STOCK */}
                <View className="mb-4">
                    <Text className="text-secondary text-xs font-bold mb-2 uppercase">Stock Quantity *</Text>
                    <TextInput
                        className={`bg-surface p-3 rounded-lg text-primary ${
                            errors.stock ? "border-2 border-red-500" : ""
                        }`}
                        placeholder="0"
                        keyboardType="number-pad"
                        value={stock}
                        onChangeText={(text) => {
                            setStock(text);
                            if (!isNaN(Number(text)) && Number(text) >= 0) {
                                setErrors({ ...errors, stock: undefined });
                            }
                        }}
                        editable={!submitting}
                    />
                    {errors.stock && <Text className="text-red-500 text-xs mt-1">{errors.stock}</Text>}
                </View>

                {/* CATEGORY */}
                <View className="mb-4">
                    <Text className="text-secondary text-xs font-bold mb-2 uppercase">Category *</Text>
                    <TouchableOpacity
                        onPress={() => setCategoryModalVisible(true)}
                        disabled={submitting}
                        className={`bg-surface p-3 rounded-lg flex-row justify-between items-center ${
                            errors.category ? "border-2 border-red-500" : ""
                        }`}
                    >
                        <Text className="text-primary">{category}</Text>
                        <Ionicons name="chevron-down" size={20} color={COLORS.secondary} />
                    </TouchableOpacity>
                    {errors.category && <Text className="text-red-500 text-xs mt-1">{errors.category}</Text>}
                </View>

                {/* CATEGORY MODAL */}
                <Modal visible={categoryModalVisible} animationType="slide" transparent>
                    <TouchableWithoutFeedback onPress={() => setCategoryModalVisible(false)}>
                        <View className="flex-1 justify-end bg-black/50">
                            <View className="bg-white rounded-t-2xl p-4 max-h-[60%]">
                                <Text className="text-lg font-bold text-center mb-4 text-primary">
                                    Select Category
                                </Text>

                                <FlatList
                                    data={CATEGORIES}
                                    keyExtractor={(item) => String(item.id)}
                                    scrollEnabled={false}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setCategory(item.name);
                                                setCategoryModalVisible(false);
                                                setErrors({ ...errors, category: undefined });
                                            }}
                                            className={`p-4 border-b border-gray-100 flex-row items-center ${
                                                category === item.name ? "bg-primary/10" : ""
                                            }`}
                                        >
                                            <Ionicons
                                                name={item.icon as any}
                                                size={24}
                                                color={COLORS.primary}
                                            />
                                            <Text
                                                className={`ml-4 text-base font-medium ${
                                                    category === item.name ? "text-primary font-bold" : "text-primary"
                                                }`}
                                            >
                                                {item.name}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>

                {/* SIZES */}
                <View className="mb-4">
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-secondary text-xs font-bold uppercase">Select Sizes *</Text>
                        <TouchableOpacity
                            onPress={() => setSizesModalVisible(!sizesModalVisible)}
                            className="bg-primary/10 px-3 py-1 rounded"
                        >
                            <Text className="text-primary text-xs font-semibold">
                                {selectedSizes.length > 0 ? `${selectedSizes.length} selected` : "Choose"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {sizesModalVisible && (
                        <View className={`bg-surface p-3 rounded-lg mb-2 ${errors.sizes ? "border-2 border-red-500" : ""}`}>
                            <View className="flex-row flex-wrap gap-2">
                                {SIZES_OPTIONS.map((size) => (
                                    <TouchableOpacity
                                        key={size}
                                        onPress={() => toggleSize(size)}
                                        className={`p-2 rounded ${
                                            selectedSizes.includes(size)
                                                ? "bg-primary"
                                                : "bg-white border border-gray-300"
                                        }`}
                                    >
                                        <Text
                                            className={`font-semibold ${
                                                selectedSizes.includes(size)
                                                    ? "text-white"
                                                    : "text-primary"
                                            }`}
                                        >
                                            {size}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {selectedSizes.length > 0 && (
                        <View className="flex-row flex-wrap gap-2">
                            {selectedSizes.map((size) => (
                                <View
                                    key={size}
                                    className="bg-primary px-3 py-1 rounded-full flex-row items-center gap-2"
                                >
                                    <Text className="text-white text-sm font-semibold">{size}</Text>
                                    <TouchableOpacity onPress={() => toggleSize(size)}>
                                        <Ionicons name="close" size={16} color="white" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

                    {errors.sizes && <Text className="text-red-500 text-xs mt-1">{errors.sizes}</Text>}
                </View>

                {/* FEATURED */}
                <View className="mb-6 flex-row justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <View>
                        <Text className="text-secondary text-xs font-bold uppercase">Featured Product</Text>
                        <Text className="text-secondary text-xs">Show on homepage</Text>
                    </View>
                    <Switch
                        value={isFeatured}
                        onValueChange={setIsFeatured}
                        disabled={submitting}
                        trackColor={{ false: "#ccc", true: COLORS.primary }}
                        thumbColor={isFeatured ? COLORS.accent : "#f4f3f4"}
                    />
                </View>

                {/* EXISTING IMAGES */}
                {existingImages.length > 0 && (
                    <View className="mb-4">
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-secondary text-xs font-bold uppercase">Current Images</Text>
                            <Text className="text-secondary text-xs">{existingImages.length}/5</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                            {existingImages.map((image, index) => (
                                <View key={index} className="relative mr-3">
                                    <Image
                                        source={{ uri: image }}
                                        className="w-24 h-24 rounded-lg bg-gray-100"
                                        resizeMode="cover"
                                    />
                                    <TouchableOpacity
                                        onPress={() => removeExistingImage(index)}
                                        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                                    >
                                        <Ionicons name="close" size={16} color="white" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* NEW IMAGES */}
                {newImages.length > 0 && (
                    <View className="mb-4">
                        <Text className="text-secondary text-xs font-bold mb-2 uppercase">New Images</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                            {newImages.map((image, index) => (
                                <View key={index} className="relative mr-3">
                                    <Image
                                        source={{ uri: image }}
                                        className="w-24 h-24 rounded-lg bg-gray-100"
                                        resizeMode="cover"
                                    />
                                    <TouchableOpacity
                                        onPress={() => removeNewImage(index)}
                                        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                                    >
                                        <Ionicons name="close" size={16} color="white" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* ADD MORE IMAGES */}
                {existingImages.length + newImages.length < 5 && (
                    <TouchableOpacity
                        onPress={pickImages}
                        disabled={submitting}
                        className={`border-2 border-dashed border-gray-300 rounded-lg p-6 items-center mb-4`}
                    >
                        <Ionicons name="cloud-upload-outline" size={32} color={COLORS.primary} />
                        <Text className="text-primary font-semibold mt-2">Tap to add more images</Text>
                        <Text className="text-secondary text-xs mt-1">
                            {existingImages.length + newImages.length} / 5 images
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Submit Button */}
            <View className="mb-6">
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={submitting}
                    className={`bg-primary p-4 rounded-lg flex-row justify-center items-center ${
                        submitting ? "opacity-70" : ""
                    }`}
                >
                    {submitting && <ActivityIndicator size="small" color="white" />}
                    <Text className={`text-white font-bold text-lg ${submitting ? "ml-2" : ""}`}>
                        {submitting ? "Updating..." : "Update Product"}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
