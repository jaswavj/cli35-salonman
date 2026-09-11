package com.billing.repository;

import com.billing.domain.User;

public interface CustomUserRepository {

    User login(String shopId, String userName, String password);
}
