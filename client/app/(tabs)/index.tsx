import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from '@/components/header'
import { useRouter } from 'expo-router'
import { CATEGORIES } from '@/constants'
import CategoryItem from '@/components/categoryItem'
import { Product } from '@/constants/types'
import ProductCard from '@/components/productCard'
import { productService } from '@/services/productService'
import Toast from 'react-native-toast-message'

export default function Home() {

  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  
  const [loading, setLoading] = useState(true);

  const categories = [{ id: 'all', name: 'All', icon: "grid" }, ...CATEGORIES];
  const heroProduct = products[0];

  const fetchProducts = async ()=> {
    try {
      const response = await productService.getProducts(
        { isFeatured: true },
        { page: 1, limit: 8 }
      );
      if (response.success && response.data) {
        setProducts(response.data);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Failed to fetch featured products'
        });
      }
    } catch (error) {
      console.error('Fetch products error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch featured products'
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, [])


  return (
    <SafeAreaView className='flex-1' edges= {['top']}>
      <Header title='Forever' showMenu showCart showLogo showProfile />

      <ScrollView className='flex-1 px-4' showsVerticalScrollIndicator={false}>

      {/* Hero Section */}
      <View className='mb-6'>
        <TouchableOpacity onPress={() => router.push('/shop')} className='relative h-56 rounded-3xl overflow-hidden bg-primary'>
          {heroProduct?.images?.[0] ? (
            <Image source={{ uri: heroProduct.images[0] }} className='w-full h-full opacity-70' resizeMode='cover' />
          ) : (
            <View className='absolute inset-0 bg-primary' />
          )}

          <View className='absolute inset-0 bg-black/35' />

          <View className='absolute bottom-5 left-5 right-5'>
            <Text className='text-white text-xs font-semibold uppercase tracking-[2px] mb-2'>Live Inventory</Text>
            <Text className='text-white text-2xl font-bold leading-tight mb-1'>
              {heroProduct ? heroProduct.name : 'Shop the latest collection'}
            </Text>
            <Text className='text-white/90 text-sm mb-4'>
              {heroProduct ? heroProduct.description.slice(0, 90) + '...' : 'Featured products and new arrivals from the backend.'}
            </Text>
            <Text className='text-primary font-bold text-xs text-center bg-white px-4 py-2 rounded-full self-start'>
              {heroProduct ? `From $${heroProduct.price.toFixed(2)}` : 'Browse products'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Categories Section */}
      <View className='mb-6'>
        <View className='flex-row justify-between items-center mb-4'>
          <Text className='text-xl font-bold text-primary'>Categories</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat: any) => (
            <CategoryItem key={cat.id} item={cat} isSelected={false} onPress={() => router.push({ pathname: "/shop",
              params: { category: cat.id === 'all' ? '' : cat.name }})} />
          ))}
        </ScrollView>
      </View>

      {/* Featured Products Section */}
      <View className='mb-8'>
        <View className='flex-row justify-between items-center mb-4'>
          <Text className='text-xl font-bold text-primary'>Featured Products</Text>
          <TouchableOpacity onPress={()=> router.push('/shop')}>
            <Text className='text-secondry text-sm'>See All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size='large' />
        ) : (
          <View className='flex-row flex-wrap justify-between'> 
            {products.slice(0, 4).map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
          </View>
        )}
      </View>

      {/* Newsletter section? */}
      <View className='bg-gray-100 p-6 rounded-2xl mb-20 items-center'>
        <Text className='text-2xl font-bold text-primary mb-2 text-center'>Join the Newsletter</Text>
        <Text className='text-secondry text-center mb-4'>Subscribe to our newsletter and get 10% off on
          your 1st purchase.</Text>
        <TouchableOpacity className='bg-primary w-4/5 py-3 rounded-full items-center'>
          <Text className='text-white font-medium text-base'>Subscribe Now</Text>
        </TouchableOpacity>
      </View>

      </ScrollView>
    </SafeAreaView>
  )
}