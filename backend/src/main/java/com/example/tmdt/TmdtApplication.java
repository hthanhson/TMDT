package com.example.tmdt;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

@SpringBootApplication
@EnableAspectJAutoProxy
public class TmdtApplication {

	public static void main(String[] args) {
		SpringApplication.run(TmdtApplication.class, args);
	}

} 