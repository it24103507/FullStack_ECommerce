import React, { useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants";
import { storeService } from "@/services/storeService";
import Header from "@/components/header";

export default function AdminUsers() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchUsers = async () => {
        const response = await storeService.getUsers();
        setUsers((response.data || []) as any[]);
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchUsers();
    };

    const toggleRole = async (user: any) => {
        setUpdatingId(user._id);
        const nextRole = user.role === "admin" ? "user" : "admin";
        await storeService.updateUserRole(user._id, nextRole);
        await fetchUsers();
        setUpdatingId(null);
    };

    const toggleStatus = async (user: any) => {
        setUpdatingId(user._id);
        await storeService.updateUserStatus(user._id, !user.isActive);
        await fetchUsers();
        setUpdatingId(null);
    };

    const deleteUser = async (user: any) => {
        setUpdatingId(user._id);
        await storeService.deleteUser(user._id);
        await fetchUsers();
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
            <Header title="Users" showBack />
            <ScrollView
                className="flex-1 p-4"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {users.length === 0 ? (
                    <View className="bg-white p-6 rounded-2xl border border-gray-100 items-center">
                        <Text className="text-secondary">No users found</Text>
                    </View>
                ) : (
                    users.map((user) => (
                        <View key={user._id} className="bg-white p-4 rounded-2xl border border-gray-100 mb-4">
                            <View className="flex-row justify-between items-start mb-3">
                                <View className="flex-1 pr-3">
                                    <Text className="text-primary font-bold text-base">{user.name || "Unnamed User"}</Text>
                                    <Text className="text-secondary text-xs mt-1">{user.email}</Text>
                                    <Text className="text-secondary text-xs mt-1">Clerk ID: {user.clerkId}</Text>
                                </View>
                                <View className={`px-3 py-1 rounded-full ${user.role === 'admin' ? 'bg-primary/10' : 'bg-gray-100'}`}>
                                    <Text className={`text-xs font-bold uppercase ${user.role === 'admin' ? 'text-primary' : 'text-secondary'}`}>
                                        {user.role}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row justify-between items-center mb-3">
                                <View className={`px-3 py-1 rounded-full ${user.isActive === false ? 'bg-red-100' : 'bg-green-100'}`}>
                                    <Text className={`text-xs font-bold uppercase ${user.isActive === false ? 'text-red-600' : 'text-green-700'}`}>
                                        {user.isActive === false ? 'Disabled' : 'Active'}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row justify-between items-center">
                                <Text className="text-secondary text-xs">Joined {new Date(user.createdAt).toLocaleDateString()}</Text>
                                <View className="flex-row gap-2">
                                    <TouchableOpacity
                                        onPress={() => toggleStatus(user)}
                                        disabled={updatingId === user._id}
                                        className="bg-gray-200 px-4 py-2 rounded-full"
                                    >
                                        <Text className="text-primary font-bold text-xs">
                                            {updatingId === user._id ? '...' : user.isActive === false ? 'Enable' : 'Disable'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => toggleRole(user)}
                                        disabled={updatingId === user._id}
                                        className="bg-primary px-4 py-2 rounded-full"
                                    >
                                        <Text className="text-white font-bold text-xs">
                                            {updatingId === user._id ? 'Updating...' : user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => deleteUser(user)}
                                        disabled={updatingId === user._id}
                                        className="bg-red-500 px-4 py-2 rounded-full"
                                    >
                                        <Text className="text-white font-bold text-xs">
                                            {updatingId === user._id ? '...' : 'Delete'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
