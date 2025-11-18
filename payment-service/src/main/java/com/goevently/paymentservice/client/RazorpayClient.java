//package com.goevently.paymentservice.client;
//
//import com.fasterxml.jackson.databind.ObjectMapper;
//import com.goevently.paymentservice.dto.RazorpayOrderRequest;
//import com.goevently.paymentservice.dto.RazorpayOrderResponse;
//import lombok.extern.slf4j.Slf4j;
//import okhttp3.*;
//import okhttp3.Credentials;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.stereotype.Component;
//
//import java.io.IOException;
//import java.util.Base64;
//
//@Component
//@Slf4j
//public class RazorpayClient {
//
//    @Value("${razorpay.api.baseUrl}")
//    private String baseUrl;
//
//    @Value("${razorpay.api.keyId}")
//    private String keyId;
//
//    @Value("${razorpay.api.keySecret}")
//    private String keySecret;
//
//    @Value("${razorpay.api.mode:test}")
//    private String mode;
//
//    @Autowired
//    private MockRazorpayClient mockClient;
//
//    private final OkHttpClient httpClient;
//    private final ObjectMapper objectMapper;
//
//    public RazorpayClient(ObjectMapper objectMapper) {
//        this.objectMapper = objectMapper;
//        this.httpClient = new OkHttpClient.Builder()
//                .connectTimeout(java.time.Duration.ofSeconds(10))
//                .readTimeout(java.time.Duration.ofSeconds(30))
//                .writeTimeout(java.time.Duration.ofSeconds(30))
//                .build();
//    }
//
//    /**
//     * Create an order on Razorpay
//     * This returns an order ID that can be used to initiate payment
//     */
////    public RazorpayOrderResponse createOrder(RazorpayOrderRequest request) throws IOException {
////        log.info("Creating Razorpay order for amount: {} {}", request.getAmount(), request.getCurrency());
////
////        String requestBody = objectMapper.writeValueAsString(request);
////        log.debug("Razorpay order request: {}", requestBody);
////
////        String url = baseUrl + "/orders";
////
////        RequestBody body = RequestBody.create(
////                requestBody,
////                MediaType.get("application/json; charset=utf-8")
////        );
////
////        Request razorpayRequest = new Request.Builder()
////                .url(url)
////                .post(body)
////                .addHeader("Authorization", getBasicAuthHeader())
////                .addHeader("Content-Type", "application/json")
////                .build();
////
////        try (Response response = httpClient.newCall(razorpayRequest).execute()) {
////            if (!response.isSuccessful()) {
////                String errorBody = response.body() != null ? response.body().string() : "Unknown error";
////                log.error("Razorpay order creation failed. Status: {}, Body: {}", response.code(), errorBody);
////                throw new IOException("Failed to create Razorpay order: " + response.code() + " " + errorBody);
////            }
////
////            String responseBody = response.body().string();
////            log.debug("Razorpay order response: {}", responseBody);
////
////            RazorpayOrderResponse orderResponse = objectMapper.readValue(
////                    responseBody,
////                    RazorpayOrderResponse.class
////            );
////
////            log.info("Razorpay order created successfully. Order ID: {}", orderResponse.getId());
////            return orderResponse;
////        }
////    }
////
////    /**
////     * Fetch order details from Razorpay
////     */
////    public RazorpayOrderResponse fetchOrder(String orderId) throws IOException {
////        log.info("Fetching Razorpay order: {}", orderId);
////
////        String url = baseUrl + "/orders/" + orderId;
////
////        Request request = new Request.Builder()
////                .url(url)
////                .get()
////                .addHeader("Authorization", getBasicAuthHeader())
////                .build();
////
////        try (Response response = httpClient.newCall(request).execute()) {
////            if (!response.isSuccessful()) {
////                log.error("Failed to fetch order. Status: {}", response.code());
////                throw new IOException("Failed to fetch Razorpay order: " + response.code());
////            }
////
////            String responseBody = response.body().string();
////            return objectMapper.readValue(responseBody, RazorpayOrderResponse.class);
////        }
////    }
////
////    /**
////     * Verify payment signature (CRITICAL FOR SECURITY)
////     * This ensures the webhook is genuinely from Razorpay
////     */
////    public boolean verifyPaymentSignature(String orderId, String paymentId, String signature) {
////        log.info("Verifying payment signature for order: {}, payment: {}", orderId, paymentId);
////
////        try {
////            String data = orderId + "|" + paymentId;
////            String expectedSignature = generateHmacSha256(data, keySecret);
////
////            boolean isValid = expectedSignature.equals(signature);
////
////            if (isValid) {
////                log.info("Payment signature verified successfully");
////            } else {
////                log.warn("Payment signature verification failed! Expected: {}, Got: {}", expectedSignature, signature);
////            }
////
////            return isValid;
////        } catch (Exception e) {
////            log.error("Error verifying payment signature", e);
////            return false;
////        }
////    }
//
//
//    /**
//     * Verify payment signature
//     */
//    public boolean verifyPaymentSignature(String orderId, String paymentId, String signature) {
//        // USE MOCK IF IN TEST MODE
//        if (isTestMode()) {
//            return mockClient.verifyPaymentSignature(orderId, paymentId, signature);
//        }
//
//        // Real verification code...
//        log.info("Verifying payment signature for order: {}, payment: {}", orderId, paymentId);
//
//        try {
//            String data = orderId + "|" + paymentId;
//            String expectedSignature = generateHmacSha256(data, keySecret);
//
//            boolean isValid = expectedSignature.equals(signature);
//
//            if (isValid) {
//                log.info("Payment signature verified successfully");
//            } else {
//                log.warn("Payment signature verification failed!");
//            }
//
//            return isValid;
//        } catch (Exception e) {
//            log.error("Error verifying payment signature", e);
//            return false;
//        }
//    }
//
//    /**
//     * Check if using test mode
//     */
//    private boolean isTestMode() {
//        return keyId.contains("test") || keySecret.contains("test") ||
//                "test".equalsIgnoreCase(mode);
//    }
//
//    /**
//     * Generate HMAC SHA256 signature
//     */
//    private String generateHmacSha256(String data, String secret) throws Exception {
//        javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
//        javax.crypto.spec.SecretKeySpec secretKey = new javax.crypto.spec.SecretKeySpec(
//                secret.getBytes(),
//                0,
//                secret.getBytes().length,
//                "HmacSHA256"
//        );
//        mac.init(secretKey);
//        byte[] hash = mac.doFinal(data.getBytes());
//        return bytesToHex(hash);
//    }
//
//    /**
//     * Convert bytes to hex string
//     */
//    private String bytesToHex(byte[] bytes) {
//        StringBuilder hexString = new StringBuilder();
//        for (byte b : bytes) {
//            String hex = Integer.toHexString(0xff & b);
//            if (hex.length() == 1) {
//                hexString.append('0');
//            }
//            hexString.append(hex);
//        }
//        return hexString.toString();
//    }
//
//    /**
//     * Generate Basic Auth header for Razorpay API
//     * Format: Base64(keyId:keySecret)
//     */
//    private String getBasicAuthHeader() {
//        String credentials = keyId + ":" + keySecret;
//        String encoded = Base64.getEncoder().encodeToString(credentials.getBytes());
//        return "Basic " + encoded;
//    }
//}

package com.goevently.paymentservice.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.goevently.paymentservice.dto.RazorpayOrderRequest;
import com.goevently.paymentservice.dto.RazorpayOrderResponse;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Base64;

@Component
@Slf4j
public class RazorpayClient {

    @Value("${razorpay.api.baseUrl}")
    private String baseUrl;

    @Value("${razorpay.api.keyId}")
    private String keyId;

    @Value("${razorpay.api.keySecret}")
    private String keySecret;

    @Value("${razorpay.api.mode:test}")
    private String mode;

    @Autowired
    private MockRazorpayClient mockClient;

    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;

    public RazorpayClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(java.time.Duration.ofSeconds(10))
                .readTimeout(java.time.Duration.ofSeconds(30))
                .writeTimeout(java.time.Duration.ofSeconds(30))
                .build();
    }

    @jakarta.annotation.PostConstruct
    public void init() {
        log.info("🔍 RazorpayClient initialized");
        log.info("🔍 Mode: {}", mode);
        log.info("🔍 KeyId: {}", keyId);
        log.info("🔍 Test mode detected: {}", isTestMode());
    }

    /**
     * Create an order on Razorpay
     */
    public RazorpayOrderResponse createOrder(RazorpayOrderRequest request) throws IOException {
        log.info("Creating Razorpay order for amount: {} {}", request.getAmount(), request.getCurrency());

        // USE MOCK CLIENT IF CREDENTIALS ARE TEST/DUMMY
        if (isTestMode()) {
            log.warn("⚠️ Using MOCK Razorpay client (test credentials detected)");
            return mockClient.createOrder(request);
        }

        // Otherwise use real API
        String requestBody = objectMapper.writeValueAsString(request);
        log.debug("Razorpay order request: {}", requestBody);

        String url = baseUrl + "/orders";

        RequestBody body = RequestBody.create(
                requestBody,
                MediaType.get("application/json; charset=utf-8")
        );

        Request razorpayRequest = new Request.Builder()
                .url(url)
                .post(body)
                .addHeader("Authorization", getBasicAuthHeader())
                .addHeader("Content-Type", "application/json")
                .build();

        try (Response response = httpClient.newCall(razorpayRequest).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "Unknown error";
                log.error("Razorpay order creation failed. Status: {}, Body: {}", response.code(), errorBody);
                throw new IOException("Failed to create Razorpay order: " + response.code() + " " + errorBody);
            }

            String responseBody = response.body().string();
            log.debug("Razorpay order response: {}", responseBody);

            RazorpayOrderResponse orderResponse = objectMapper.readValue(
                    responseBody,
                    RazorpayOrderResponse.class
            );

            log.info("Razorpay order created successfully. Order ID: {}", orderResponse.getId());
            return orderResponse;
        }
    }

    /**
     * Fetch order details from Razorpay
     */
    public RazorpayOrderResponse fetchOrder(String orderId) throws IOException {
        log.info("Fetching Razorpay order: {}", orderId);

        // USE MOCK IF IN TEST MODE
        if (isTestMode()) {
            return mockClient.fetchOrder(orderId);
        }

        String url = baseUrl + "/orders/" + orderId;

        Request request = new Request.Builder()
                .url(url)
                .get()
                .addHeader("Authorization", getBasicAuthHeader())
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                log.error("Failed to fetch order. Status: {}", response.code());
                throw new IOException("Failed to fetch Razorpay order: " + response.code());
            }

            String responseBody = response.body().string();
            return objectMapper.readValue(responseBody, RazorpayOrderResponse.class);
        }
    }

    /**
     * Verify payment signature
     */
    public boolean verifyPaymentSignature(String orderId, String paymentId, String signature) {
        // USE MOCK IF IN TEST MODE
        if (isTestMode()) {
            return mockClient.verifyPaymentSignature(orderId, paymentId, signature);
        }

        // Real verification code...
        log.info("Verifying payment signature for order: {}, payment: {}", orderId, paymentId);

        try {
            String data = orderId + "|" + paymentId;
            String expectedSignature = generateHmacSha256(data, keySecret);

            boolean isValid = expectedSignature.equals(signature);

            if (isValid) {
                log.info("Payment signature verified successfully");
            } else {
                log.warn("Payment signature verification failed!");
            }

            return isValid;
        } catch (Exception e) {
            log.error("Error verifying payment signature", e);
            return false;
        }
    }

    /**
     * Check if using test mode
     */
    private boolean isTestMode() {
        return keyId != null && (keyId.contains("test") || keySecret.contains("test")) ||
                "test".equalsIgnoreCase(mode);
    }

    /**
     * Generate HMAC SHA256 signature
     */
    private String generateHmacSha256(String data, String secret) throws Exception {
        javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
        javax.crypto.spec.SecretKeySpec secretKey = new javax.crypto.spec.SecretKeySpec(
                secret.getBytes(),
                0,
                secret.getBytes().length,
                "HmacSHA256"
        );
        mac.init(secretKey);
        byte[] hash = mac.doFinal(data.getBytes());
        return bytesToHex(hash);
    }

    /**
     * Convert bytes to hex string
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }

    /**
     * Generate Basic Auth header for Razorpay API
     */
    private String getBasicAuthHeader() {
        String credentials = keyId + ":" + keySecret;
        String encoded = Base64.getEncoder().encodeToString(credentials.getBytes());
        return "Basic " + encoded;
    }
}

