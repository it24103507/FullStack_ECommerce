import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, TextInput } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Product } from '@/constants/types'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from '@/components/header'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants'
import ProductCard from '@/components/productCard'
import { useLocalSearchParams } from 'expo-router'
import { productService } from '@/services/productService'
import Toast from 'react-native-toast-message'

export default function Shop() {
    const { category: paramCategory } = useLocalSearchParams();

    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState(paramCategory ? String(paramCategory) : '')

    const fetchProducts = async (pageNumber = 1, isNewSearch = false) => {
        if (pageNumber === 1) {
            setLoading(true)
        } else {
            setLoadingMore(true)
        }
        try {
            const filters: any = {};
            if (searchQuery) filters.search = searchQuery;
            if (selectedCategory) filters.category = selectedCategory;

            const response = await productService.getProducts(
                filters,
                { page: pageNumber, limit: 10 }
            );

            if (response.success && response.data) {
                if (isNewSearch || pageNumber === 1) {
                    setProducts(response.data);
                } else {
                    setProducts(prev => [...prev, ...response.data]);
                }

                if (response.pagination) {
                    setTotalPages(response.pagination.pages);
                    setPage(pageNumber);
                }
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: response.message || 'Failed to fetch products'
                });
            }
        } catch (error: any) {
            console.error('Fetch products error:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to fetch products'
            });
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    const loadMore = () => {
        if (!loading && !loadingMore && page < totalPages) {
            fetchProducts(page + 1);
        }
    }

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        fetchProducts(1, true);
    }

    useEffect(() => {
        fetchProducts(1, true);
    }, [selectedCategory])

    useEffect(() => {
        fetchProducts(1, false);
    }, [])

    return (
        <SafeAreaView className='flex-1 bg-surface' edges={['top']}>
            <Header title='Shop' showBack showCart />

            <View className='flex-row gap-2 mb-3 mx-4 my-2'>

                {/* Search bar */}
                <View className='flex-1 flex-row items-center bg-white rounded-xl border border-gray-100'>
                    <Ionicons name='search' className='ml-4' size={20} color={COLORS.secondary} />
                    <TextInput
                        className='flex-1 ml-2 text-primary px-4 py-3'
                        placeholder='Search Products...'
                        returnKeyType='search'
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                </View>

                {/* Filter icon */}
                <TouchableOpacity className='bg-primary w-12 h-12 items-center justify-center rounded-xl'>
                    <Ionicons name='options-outline' size={24} color='white' />
                </TouchableOpacity>
            </View>

            {loading && page === 1 ? (
                <View className='flex-1 justify-center items-center'>
                    <ActivityIndicator size='large' color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={(item) => item._id}
                    numColumns={2}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    columnWrapperStyle={{ justifyContent: 'space-between' }}
                    renderItem={({ item }) => (
                        <ProductCard product={item} />
                    )}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        loadingMore ? (
                            <View className='py-4 flex-1'>
                                <ActivityIndicator size='small' color={COLORS.primary} />
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        !loading && (
                            <View className='flex-1 items-center justify-center py-20'>
                        <Text className='text-secondry'>No Products Found</Text>
                    </View>
                )
            }
            />
        )}

    </SafeAreaView>
  )
}