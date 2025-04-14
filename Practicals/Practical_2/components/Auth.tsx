import React, { useState } from "react";
import { Alert, StyleSheet, View, AppState } from "react-native";
import { supabase } from "../lib/supabase";
import { Button, Input } from "@rneui/themed";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as Linking from "expo-linking";

const redirectTo = makeRedirectUri();

// Automatically refresh session when app is in the foreground
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function Auth() {
  const [phone, setPhone] = useState(""); // State for phone number
  const [otp, setOtp] = useState(""); // State for OTP
  const [loading, setLoading] = useState(false);

  const createSessionFromUrl = async (url: string) => {
    const { params, errorCode } = QueryParams.getQueryParams(url);
    if (errorCode) throw new Error(errorCode);
    const { access_token, refresh_token } = params;
    if (!access_token) return;
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (error) throw error;
    return data.session;
  };

  // Function to initiate phone OTP login
  async function signInWithPhoneOtp() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone, // Phone number in E.164 format, e.g., +12345678901
    });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "OTP sent to your phone number!");
    }
    setLoading(false);
  }

  // Function to verify the OTP
  async function verifyPhoneOtp() {
    setLoading(true);
    const { data: { session }, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: otp,
      type: "sms",
    });

    if (error) {
      Alert.alert("Error", error.message);
    } else if (session) {
      Alert.alert("Success", "Logged in successfully!");
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input
          label="Phone Number"
          leftIcon={{ type: "font-awesome", name: "phone" }}
          onChangeText={(text) => setPhone(text)}
          value={phone}
          placeholder="+12345678901"
          autoCapitalize={"none"}
          keyboardType="phone-pad"
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Input
          label="OTP"
          leftIcon={{ type: "font-awesome", name: "lock" }}
          onChangeText={(text) => setOtp(text)}
          value={otp}
          placeholder="Enter 6-digit OTP"
          autoCapitalize={"none"}
          keyboardType="numeric"
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button
          title="Send OTP"
          disabled={loading || !phone}
          onPress={() => signInWithPhoneOtp()}
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Button
          title="Verify OTP"
          disabled={loading || !otp}
          onPress={() => verifyPhoneOtp()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: "stretch",
  },
  mt20: {
    marginTop: 20,
  },
});