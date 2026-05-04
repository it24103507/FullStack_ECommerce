import { View, Text, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { ProductCardProps } from '@/constants/types'
import { Link } from 'expo-router'
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { useWishlist } from '@/context/WishlistContext';

export default function ProductCard({ product }: ProductCardProps) {

    const { toggleWishlist, isInWishlist } = useWishlist();

    const isLiked = isInWishlist(product._id); //managed with state or props to reflect the liked status of the product.

  return (
    <Link href={`/product/${product._id}`} asChild>
         <TouchableOpacity className='w-[48%] mb-4 bg-white rounded-lg overflow-hidden'>
            <View className='relative h-56 w-full bg-gray-100'>
            <Image source={{ uri: product.images[0] }} className='w-full h-full' resizeMode='cover' />

            {/* Favourite icon can be added here */}
            <TouchableOpacity className='absolute top-2 right-2 z-10 p-2 bg-white rounded-full shadow-sm'
             onPress={(e) => {
                e.stopPropagation(); // Prevents the touch event from propagating to the parent TouchableOpacity which navigates to the product details.

                // Handle like/unlike action here, possibly updating state or making an API call.
                toggleWishlist(product);
             }}>
                <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={20} color={isLiked ? COLORS.accent : COLORS.primary} />
            </TouchableOpacity>


        {/* is featured option */}
        {product.isFeatured && (
            <View className='absolute top-2 left-2 bg-black px-2 py-1 rounded'>
                <Text className='text-white text-xs font-bold'>Featured</Text>
            </View>
        )}
            </View>

        {/* Product details */}
        <View className='p-3'>
            <View>
                <Ionicons name='star' size={14} color='#FFD700' />
                <Text className='text-secondry text-xs ml-1'>4.6</Text>
            </View>

            <Text className='text-primary font-medium text-sm mb-1' numberOfLines={2}>{product.name}</Text>
            
            <View className='flex-row items-center'>
                <Text className='text-primary font-bold text-base'>${product.price.toFixed(2)}</Text>
            </View>
        </View>
         </TouchableOpacity>
    </Link>
  )
}