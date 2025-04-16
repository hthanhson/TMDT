package com.example.tmdt.model;

public enum OrderStatus {
    PENDING("Chờ xác nhận"),             
    CONFIRMED("Đã xác nhận"),            
    PROCESSING("Đang xử lý"),            
    READY_TO_SHIP("Sẵn sàng giao hàng"), 
    PICKED_UP("Đã lấy hàng"),            
    IN_TRANSIT("Đang vận chuyển"),       
    ARRIVED_AT_STATION("Đến trạm trung chuyển"), 
    OUT_FOR_DELIVERY("Đang giao hàng"),  
    DELIVERED("Đã giao hàng"),           
    COMPLETED("Hoàn tất"),               
    CANCELLED("Đã hủy"),                 
    RETURNED("Hoàn trả");                

    private final String displayName;

    OrderStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
} 