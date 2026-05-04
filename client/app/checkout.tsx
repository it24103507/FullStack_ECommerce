import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useCart } from '../context/CartContext'
import { useRouter } from 'expo-router'
import Toast from 'react-native-toast-message'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '../constants'
import Header from '../components/header'
import { Ionicons } from '@expo/vector-icons'
import { Address } from '@/constants/types'
import { useUser } from '@clerk/clerk-expo'
import { storeService } from '@/services/storeService'

export default function Checkout() {

    const { cartItems, cartTotal, clearCart } = useCart()
    const { user } = useUser()

    const router = useRouter()

    const [loading, setLoading] = useState(false)

    const [pageLoading, setPageLoading] = useState(true)

    const [selectdAddress, setSelectdAddress] = useState<Address | null>(null)

    const [paymentMethod, setPaymentMethod] = useState<"cash" | "stripe">('cash')

    const shippingAmount = 5.00;
    const tax = 0;
    const total = cartTotal + tax;

    const fetchAddress = async ()=> {
        const response = await storeService.getAddresses();
        const addrList = (response.data || []) as Address[];
        if (addrList.length > 0) {
            //default address for first
            const def = addrList.find((a: any)=> a.isDefault) || addrList[0];
            setSelectdAddress(def as Address)
        }
        setPageLoading(false)
    }


    const handlePlceOrder = async ()=> {
        if(!selectdAddress) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Please add a shipping address"
            })
            return;
        }

        setLoading(true);
        try {
            const payload = {
                items: cartItems.map((item) => ({
                    product: item.product._id,
                    name: item.product.name,
                    quantity: item.quantity,
                    price: item.price,
                    size: item.size,
                })),
                shippingAddress: {
                    street: selectdAddress.street,
                    city: selectdAddress.city,
                    state: selectdAddress.state,
                    zipCode: selectdAddress.zipCode,
                    country: selectdAddress.country,
                },
                paymentMethod,
                paymentStatus: paymentMethod === 'stripe' ? 'paid' : 'pending',
                orderStatus: 'placed',
                subtotal: cartTotal,
                shippingCost: shippingAmount,
                tax,
                totalAmount: total + shippingAmount,
                notes: 'Placed via app',
            };

            const response = await storeService.createOrder(payload);
            if (!response.success) {
                throw new Error(response.message || 'Failed to place order');
            }

            await clearCart();
            router.replace('/orders');
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Order failed',
                text2: error.message || 'Unable to place order',
            });
        } finally {
            setLoading(false);
        }
    }


    useEffect(()=> {
        fetchAddress()
    }, [])

    if (pageLoading) {
        return (
            <SafeAreaView className='flex-1 bg-surface justify-center items-center'>
                <ActivityIndicator size="large" color={COLORS.primary}/>
            </SafeAreaView>
        )
    }


  return (
    <SafeAreaView className='flex-1 bg-surface' edges={['top']}>
        <Header title='Checkout' showBack/>

        <ScrollView className='flex-1 px-1 mt-4'>
            {/*address section*/}
            <Text className='text-lg font-bold text-primary mb-4'>Shipping Address</Text>
            {selectdAddress ? (
                <View className='bg-white p-4 rounded-xl mb-6 shadow-sm'>
                    <View className='flex-row items-center justify-between mb-2'>
                        <Text className='text-base font-bold'>{selectdAddress.type}</Text>
                        <TouchableOpacity onPress={()=> router.push('/addresses')}>
                        <Text className='text-accent text-sm'>Change</Text>
                        </TouchableOpacity>
                    </View>
                    <Text className='text-secondry leading-5'>
                        {selectdAddress.street},{selectdAddress.city} {'\n'}
                        {selectdAddress.state},{selectdAddress.zipCode} {'\n'}
                        {selectdAddress.country}
                        </Text>
                        
                </View>
            ) : (
                <TouchableOpacity onPress={()=> router.push('/addresses')} className='bg-white p-6 rounded-xl mb-6 items-center
                justify-center border-dashed border-2 border-gray-100'>
                    <Text className='text-primary font-bold'>Add Address</Text>
                </TouchableOpacity>
            )}

            {/* payment method */}
            <Text className='text-lg font-bold text-primary mb-4'>Payment Method</Text>

            {/* COD */}
            <TouchableOpacity onPress={()=> setPaymentMethod('cash')}
             className={`bg-white p-4 rounded-xl mb-4 shadow-sm flex-row items-center border-2 ${paymentMethod === 'cash' ? 'border-primary' : 'border-transparent'}`}>
                <Ionicons name='cash-outline' size={24} color={COLORS.primary} className='mr-3'/>
                <View className='ml-3 flex-1'>
                    <Text className='text-base font-bold text-primary'>Cash On Delivery</Text>
                    <Text className='text-secondry text-xs mt-1'>Pay When You Receive the Order</Text>
                </View>
                {paymentMethod === 'cash' && 
                <Ionicons name='checkmark-circle' size={24} color={COLORS.primary}/>}
            </TouchableOpacity>

            {/* stripe version*/}
            <TouchableOpacity onPress={()=> setPaymentMethod('stripe')}
             className={`bg-white p-4 rounded-xl mb-4 shadow-sm flex-row items-center border-2 ${paymentMethod === 'stripe' ? 'border-primary' : 'border-transparent'}`}>
                <Ionicons name='card-outline' size={24} color={COLORS.primary} className='mr-3'/>
                <View className='ml-3 flex-1'>
                    <Text className='text-base font-bold text-primary'>Pay With Card  </Text>
                    <Text className='text-secondry text-xs mt-1'>Use Your Credit/Debit Card</Text>
                </View>
                {paymentMethod === 'stripe' && 
                <Ionicons name='checkmark-circle' size={24} color={COLORS.primary}/>}
            </TouchableOpacity>


        </ScrollView>

        {/* order summary*/}
        <View className='p-4 bg-white shadow-lg border-t border-gray-100'>
            <Text className='text-lg font-bold text-primary mb-9'>Order Summary</Text>

            {/* sub total*/}
            <View className='flex-row justify-between mb-2'>
                <Text className='text-secondry'>Sub total</Text>
                <Text className='font-bold'>&{cartTotal.toFixed(2)}</Text>
            </View>

            {/*shipping*/}
            <View className='flex-row justify-between mb-2'>
                <Text className='text-secondry'>Shipping</Text>
                <Text className='font-bold'>&{shippingAmount.toFixed(2)}</Text>
            </View>

            {/*tax*/}
            <View className='flex-row justify-between mb-4'>
                <Text className='text-secondry'>Tax</Text>
                <Text className='font-bold'>&{tax.toFixed(2)}</Text>
            </View>

            {/*total*/}
            <View className='flex-row justify-between mb-6'>
                <Text className='text-primary text-xl font-bold'>Total</Text>
                <Text className='text-primary text-xl font-bold'>&{total.toFixed(2)}</Text>
            </View>

            {/* place the order button*/}
            <TouchableOpacity className={`p-4 mb-8 rounded-xl items-center ${loading ? 'bg-gray-400' : 'bg-primary'}`}
            onPress={handlePlceOrder} disabled={loading }>
                {loading ? <ActivityIndicator color='white'/> : <Text className='text-white font-bold text-lg'> Place Order</Text> }
            </TouchableOpacity>

        </View>
    </SafeAreaView>
  )
}