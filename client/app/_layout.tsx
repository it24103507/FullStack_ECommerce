import { Stack } from "expo-router";
import '@/global.css';
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from "react-native-toast-message";
import { ClerkProvider, useAuth } from '@clerk/clerk-expo'
import { useEffect } from "react";
import { productService } from "@/services/productService";
import { storeService } from "@/services/storeService";
import { useClerk, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''

function AuthBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    productService.setAuthTokenProvider(() => getToken());
    storeService.setAuthTokenProvider(() => getToken());
    return () => {
      productService.setAuthTokenProvider(null);
      storeService.setAuthTokenProvider(null);
    };
  }, [getToken]);

  return null;
}

function AccessBridge() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user && user.publicMetadata?.isActive === false) {
      console.warn("[auth] disabled user detected", {
        clerkId: user.id,
        email: user.emailAddresses?.[0]?.emailAddress,
      });
      signOut().finally(() => router.replace('/(auth)/sign-in'));
    }
  }, [isLoaded, user, router, signOut]);

  return null;
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <AuthBridge />
      <AccessBridge />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <CartProvider>
          <WishlistProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="shop" />
              <Stack.Screen name="checkout" />
              <Stack.Screen name="product/[id]" />
              <Stack.Screen name="addresses/index" />
              <Stack.Screen name="admin" />
              <Stack.Screen name="orders/[id]" />
              <Stack.Screen name="orders/index" />
            </Stack>
            <Toast />
          </WishlistProvider>
        </CartProvider>
      </GestureHandlerRootView>
    </ClerkProvider>
  )
}
