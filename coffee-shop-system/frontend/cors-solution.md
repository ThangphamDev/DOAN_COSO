# Giải quyết vấn đề CORS trong hệ thống T2K Coffee

Hiện tại, trang web frontend đang có lỗi CORS khi gọi API từ backend. Lỗi trong console:

```
Access to fetch at 'http://localhost:8081/api/categories' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'.
```

## Giải pháp trên backend (Spring Boot)

Để giải quyết vấn đề này, bạn cần thêm cấu hình CORS vào backend Spring Boot:

1. Tạo một lớp cấu hình CORS:

```java
package com.t2kcoffee.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        // Cho phép tất cả origins - bạn có thể giới hạn chỉ các origins cụ thể
        config.addAllowedOrigin("http://localhost:8080");
        config.addAllowedOrigin("http://localhost:8081");
        
        // Cho phép tất cả các phương thức HTTP
        config.addAllowedMethod("*");
        
        // Cho phép tất cả các headers
        config.addAllowedHeader("*");
        
        // Cho phép credentials
        config.setAllowCredentials(true);
        
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
```

2. Hoặc bạn có thể sửa lỗi trên frontend bằng cách đảm bảo rằng fetchApi không sử dụng `credentials: 'include'` (đã được sửa trong file api-client.js).

## Giải pháp tạm thời

Nếu chưa thể sửa backend ngay:

1. Sử dụng một extension trình duyệt để vô hiệu hóa CORS:
   - Đối với Chrome: [CORS Unblock](https://chrome.google.com/webstore/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino)
   - Đối với Firefox: [CORS Everywhere](https://addons.mozilla.org/en-US/firefox/addon/cors-everywhere/)

2. Sử dụng proxy trên máy local:
   - Cài đặt và cấu hình một proxy như Nginx để xử lý và thêm headers CORS.

3. Khởi chạy Chrome với tùy chọn vô hiệu hóa bảo mật web:
   - Windows: `chrome.exe --disable-web-security --user-data-dir="C:/Chrome dev session"`
   - MacOS: `open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security`

> **Lưu ý**: Tùy chọn 3 chỉ nên được sử dụng trong môi trường phát triển, không bao giờ sử dụng trong môi trường sản xuất hoặc khi truy cập trang web bên ngoài. 