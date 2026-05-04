import React, { useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, getStatusColor } from "@/constants";
import { storeService } from "@/services/storeService";
import Header from "@/components/header";

const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;

export default function AdminPayments() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchOrders = async () => {
        const response = await storeService.getOrders();
        setOrders((response.data || []) as any[]);
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const updatePaymentStatus = async (order: any, paymentStatus: string) => {
        setUpdatingId(order._id);
        await storeService.updateOrderPaymentStatus(order._id, paymentStatus);
        await fetchOrders();
        setUpdatingId(null);
    };

    const capturePayment = async (order: any) => {
        setUpdatingId(order._id);
        await storeService.captureOrderPayment(order._id);
        await fetchOrders();
        setUpdatingId(null);
    };

    const refundPayment = async (order: any) => {
        setUpdatingId(order._id);
        await storeService.refundOrderPayment(order._id);
        await fetchOrders();
        setUpdatingId(null);
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView className="flex-1 bg-surface justify-center items-center">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
            <Header title="Payments" showBack />
            <ScrollView
                className="flex-1 p-4"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {orders.length === 0 ? (
                    <View className="bg-white p-6 rounded-2xl border border-gray-100 items-center">
                        <Text className="text-secondary">No payments found</Text>
                    </View>
                ) : (
                    orders.map((order) => (
                        <View key={order._id} className="bg-white p-4 rounded-2xl border border-gray-100 mb-4">
                            <View className="flex-row justify-between items-start mb-3">
                                <View className="flex-1 pr-3">
                                    <Text className="text-primary font-bold text-base">Order #{order.orderNumber}</Text>
                                    <Text className="text-secondary text-xs mt-1">{new Date(order.createdAt).toLocaleDateString()}</Text>
                                </View>
                                <View className={`px-3 py-1 rounded-full ${getStatusColor(order.orderStatus)}`}>
                                    <Text className="text-xs font-bold uppercase">{order.orderStatus}</Text>
                                </View>
                            </View>

                            <View className="flex-row justify-between items-center mb-3">
                                <Text className="text-secondary text-sm">Payment: <Text className="text-primary font-medium capitalize">{order.paymentStatus}</Text></Text>
                                <Text className="text-primary font-bold">${order.totalAmount.toFixed(2)}</Text>
                            </View>

                            <View className="flex-row flex-wrap gap-2">
                                {PAYMENT_STATUSES.map((status) => (
                                    <TouchableOpacity
                                        key={status}
                                        onPress={() => updatePaymentStatus(order, status)}
                                        disabled={updatingId === order._id}
                                        className={`px-3 py-2 rounded-full ${order.paymentStatus === status ? 'bg-primary' : 'bg-gray-100'}`}
                                    >
                                        <Text className={`${order.paymentStatus === status ? 'text-white' : 'text-primary'} text-xs font-bold uppercase`}>
                                            {updatingId === order._id && order.paymentStatus !== status ? '...' : status}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View className="flex-row gap-2 mt-3">
                                <TouchableOpacity
                                    onPress={() => capturePayment(order)}
                                    disabled={updatingId === order._id}
                                    className="bg-green-600 px-3 py-2 rounded-full"
                                >
                                    <Text className="text-white text-xs font-bold">Capture</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => refundPayment(order)}
                                    disabled={updatingId === order._id}
                                    className="bg-red-500 px-3 py-2 rounded-full"
                                >
                                    <Text className="text-white text-xs font-bold">Refund</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
