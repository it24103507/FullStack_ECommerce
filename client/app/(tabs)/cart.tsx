import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import React from 'react'
import { useCart } from '@/context/CartContext'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from '@/components/header'
import CartItem from '@/components/cartItem'

export default function Cart() {
  const { cartItems, cartTotal, removeFromCart, updateQuantity } = useCart()
  const router = useRouter()

  const shippingAmount = 5.00
  const total = cartTotal + shippingAmount

  return (
    // ✅ 1. Add flex-1 to SafeAreaView
    <SafeAreaView className='flex-1 bg-white'>
      <Header title='My Cart' showBack />

      {cartItems.length > 0 ? (
        // ✅ 2. Wrap content in a flex-1 View
        <View className='flex-1'>
          <ScrollView 
            className='flex-1 px-4 mt-4' 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {cartItems.map((item, index) => (
              <CartItem 
                key={index} 
                item={item} 
                onRemove={() => removeFromCart(item.id)} 
                onUpdateQuantity={(q: number) => updateQuantity(item.id, q)} 
              />
            ))}
          </ScrollView>

          {/* Summary Footer */}
          <View className='p-2 bg-white rounded-t-3xl shadow-sm'>
            <View className='flex-row justify-between mb-2'>
              <Text className='text-secondry'>Sub total</Text>
              <Text className='text-primary font-bold'>${cartTotal.toFixed(2)}</Text>
            </View>

            <View className='flex-row justify-between mb-4'>
              <Text className='text-secondry'>Shipping</Text>
              <Text className='text-primary font-bold'>${shippingAmount.toFixed(2)}</Text>
            </View>

            <View className='h-[1px] bg-border mb-4' />

            <View className='flex-row justify-between mb-6'>
              <Text className='text-primary font-bold text-lg'>Total</Text>
              <Text className='text-primary font-bold text-lg'>${total.toFixed(2)}</Text>
            </View>

            <TouchableOpacity 
              className='bg-primary py-4 mb-2 rounded-full items-center' 
              onPress={() => router.push('/checkout')}
            >
              <Text className='text-white font-bold text-base'>Checkout</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View className='flex-1 items-center justify-center'>
          <Text className='text-secondry text-lg'>Your Cart is Empty.</Text>
          <TouchableOpacity onPress={() => router.push('/shop')} className='mt-4'>
            <Text className='text-primary font-bold'>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}